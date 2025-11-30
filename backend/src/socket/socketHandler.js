import jwt from 'jsonwebtoken'
import User from '../models/User.js'

// Store active users and their socket connections
const activeUsers = new Map() // userId -> Set of socketIds
const socketToUser = new Map() // socketId -> userId
const boardRooms = new Map() // boardId -> Set of userIds

module.exports = (io) => {
  // Middleware for socket authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token

      if (!token) {
        return next(new Error('Authentication error: No token provided'))
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      // Get user
      const user = await User.findById(decoded.id).select('-password')

      if (!user) {
        return next(new Error('Authentication error: User not found'))
      }

      // Attach user to socket
      socket.user = user
      next()
    } catch (error) {
      console.error('Socket authentication error:', error)
      next(new Error('Authentication error: Invalid token'))
    }
  })

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString()

    console.log(`User connected: ${socket.user.name} (${socket.id})`)

    // Track active user
    if (!activeUsers.has(userId)) {
      activeUsers.set(userId, new Set())
    }
    activeUsers.get(userId).add(socket.id)
    socketToUser.set(socket.id, userId)

    // Emit user online status to all clients
    io.emit('user:online', {
      userId,
      userName: socket.user.name,
      userAvatar: socket.user.avatar,
    })

    // ==================== BOARD EVENTS ====================

    // Join a board room
    socket.on('board:join', async (boardId) => {
      try {
        socket.join(`board:${boardId}`)

        // Track users in board
        if (!boardRooms.has(boardId)) {
          boardRooms.set(boardId, new Set())
        }
        boardRooms.get(boardId).add(userId)

        // Notify others in the board
        socket.to(`board:${boardId}`).emit('board:user-joined', {
          userId,
          userName: socket.user.name,
          userAvatar: socket.user.avatar,
          boardId,
        })

        // Send list of active users in this board to the joining user
        const activeUsersInBoard = Array.from(boardRooms.get(boardId) || [])
        socket.emit('board:active-users', {
          boardId,
          users: activeUsersInBoard,
        })

        console.log(`User ${socket.user.name} joined board ${boardId}`)
      } catch (error) {
        console.error('Error joining board:', error)
        socket.emit('error', { message: 'Failed to join board' })
      }
    })

    // Leave a board room
    socket.on('board:leave', (boardId) => {
      socket.leave(`board:${boardId}`)

      if (boardRooms.has(boardId)) {
        boardRooms.get(boardId).delete(userId)
        if (boardRooms.get(boardId).size === 0) {
          boardRooms.delete(boardId)
        }
      }

      socket.to(`board:${boardId}`).emit('board:user-left', {
        userId,
        userName: socket.user.name,
        boardId,
      })

      console.log(`User ${socket.user.name} left board ${boardId}`)
    })

    // Board created
    socket.on('board:created', (data) => {
      // Notify all team members
      if (data.memberIds && data.memberIds.length > 0) {
        data.memberIds.forEach((memberId) => {
          if (activeUsers.has(memberId)) {
            activeUsers.get(memberId).forEach((socketId) => {
              io.to(socketId).emit('board:created', {
                board: data.board,
                createdBy: {
                  id: userId,
                  name: socket.user.name,
                },
              })
            })
          }
        })
      }
    })

    // Board updated
    socket.on('board:updated', (data) => {
      socket.to(`board:${data.boardId}`).emit('board:updated', {
        board: data.board,
        updatedBy: {
          id: userId,
          name: socket.user.name,
        },
      })
    })

    // Board deleted
    socket.on('board:deleted', (data) => {
      io.to(`board:${data.boardId}`).emit('board:deleted', {
        boardId: data.boardId,
        deletedBy: {
          id: userId,
          name: socket.user.name,
        },
      })
    })

    // ==================== TASK EVENTS ====================

    // Task created
    socket.on('task:created', (data) => {
      socket.to(`board:${data.boardId}`).emit('task:created', {
        task: data.task,
        createdBy: {
          id: userId,
          name: socket.user.name,
          avatar: socket.user.avatar,
        },
      })
    })

    // Task updated
    socket.on('task:updated', (data) => {
      socket.to(`board:${data.boardId}`).emit('task:updated', {
        task: data.task,
        updatedBy: {
          id: userId,
          name: socket.user.name,
        },
      })
    })

    // Task moved (drag and drop)
    socket.on('task:moved', (data) => {
      socket.to(`board:${data.boardId}`).emit('task:moved', {
        taskId: data.taskId,
        sourceColumnId: data.sourceColumnId,
        destinationColumnId: data.destinationColumnId,
        newPosition: data.newPosition,
        movedBy: {
          id: userId,
          name: socket.user.name,
        },
      })
    })

    // Task deleted
    socket.on('task:deleted', (data) => {
      socket.to(`board:${data.boardId}`).emit('task:deleted', {
        taskId: data.taskId,
        boardId: data.boardId,
        deletedBy: {
          id: userId,
          name: socket.user.name,
        },
      })
    })

    // Task assigned
    socket.on('task:assigned', (data) => {
      // Notify the assigned user
      if (activeUsers.has(data.assigneeId)) {
        activeUsers.get(data.assigneeId).forEach((socketId) => {
          io.to(socketId).emit('task:assigned', {
            task: data.task,
            assignedBy: {
              id: userId,
              name: socket.user.name,
            },
          })
        })
      }

      // Notify board members
      socket.to(`board:${data.boardId}`).emit('task:assignee-added', {
        taskId: data.taskId,
        assignee: data.assignee,
      })
    })

    // Task unassigned
    socket.on('task:unassigned', (data) => {
      // Notify the unassigned user
      if (activeUsers.has(data.assigneeId)) {
        activeUsers.get(data.assigneeId).forEach((socketId) => {
          io.to(socketId).emit('task:unassigned', {
            taskId: data.taskId,
            boardId: data.boardId,
          })
        })
      }

      // Notify board members
      socket.to(`board:${data.boardId}`).emit('task:assignee-removed', {
        taskId: data.taskId,
        assigneeId: data.assigneeId,
      })
    })

    // User is viewing a task (for presence)
    socket.on('task:viewing', (data) => {
      socket.to(`board:${data.boardId}`).emit('task:viewer-joined', {
        taskId: data.taskId,
        viewer: {
          id: userId,
          name: socket.user.name,
          avatar: socket.user.avatar,
        },
      })
    })

    // User stopped viewing a task
    socket.on('task:stop-viewing', (data) => {
      socket.to(`board:${data.boardId}`).emit('task:viewer-left', {
        taskId: data.taskId,
        viewerId: userId,
      })
    })

    // ==================== COMMENT EVENTS ====================

    // Comment added
    socket.on('comment:added', (data) => {
      socket.to(`board:${data.boardId}`).emit('comment:added', {
        taskId: data.taskId,
        comment: data.comment,
        author: {
          id: userId,
          name: socket.user.name,
          avatar: socket.user.avatar,
        },
      })

      // Notify mentioned users
      if (data.mentions && data.mentions.length > 0) {
        data.mentions.forEach((mentionedUserId) => {
          if (activeUsers.has(mentionedUserId)) {
            activeUsers.get(mentionedUserId).forEach((socketId) => {
              io.to(socketId).emit('comment:mentioned', {
                taskId: data.taskId,
                comment: data.comment,
                mentionedBy: {
                  id: userId,
                  name: socket.user.name,
                },
              })
            })
          }
        })
      }
    })

    // Comment updated
    socket.on('comment:updated', (data) => {
      socket.to(`board:${data.boardId}`).emit('comment:updated', {
        taskId: data.taskId,
        comment: data.comment,
      })
    })

    // Comment deleted
    socket.on('comment:deleted', (data) => {
      socket.to(`board:${data.boardId}`).emit('comment:deleted', {
        taskId: data.taskId,
        commentId: data.commentId,
      })
    })

    // ==================== TYPING INDICATORS ====================

    // User is typing in a task comment
    socket.on('typing:start', (data) => {
      socket.to(`board:${data.boardId}`).emit('typing:start', {
        taskId: data.taskId,
        user: {
          id: userId,
          name: socket.user.name,
        },
      })
    })

    // User stopped typing
    socket.on('typing:stop', (data) => {
      socket.to(`board:${data.boardId}`).emit('typing:stop', {
        taskId: data.taskId,
        userId,
      })
    })

    // ==================== NOTIFICATION EVENTS ====================

    // Send notification to specific user
    socket.on('notification:send', (data) => {
      if (activeUsers.has(data.recipientId)) {
        activeUsers.get(data.recipientId).forEach((socketId) => {
          io.to(socketId).emit('notification:received', {
            notification: data.notification,
          })
        })
      }
    })

    // ==================== MEMBER EVENTS ====================

    // Member added to board
    socket.on('board:member-added', (data) => {
      // Notify the new member
      if (activeUsers.has(data.memberId)) {
        activeUsers.get(data.memberId).forEach((socketId) => {
          io.to(socketId).emit('board:member-added', {
            board: data.board,
            addedBy: {
              id: userId,
              name: socket.user.name,
            },
          })
        })
      }

      // Notify existing board members
      socket.to(`board:${data.boardId}`).emit('board:member-joined', {
        member: data.member,
        boardId: data.boardId,
      })
    })

    // Member removed from board
    socket.on('board:member-removed', (data) => {
      // Notify the removed member
      if (activeUsers.has(data.memberId)) {
        activeUsers.get(data.memberId).forEach((socketId) => {
          io.to(socketId).emit('board:member-removed', {
            boardId: data.boardId,
            removedBy: {
              id: userId,
              name: socket.user.name,
            },
          })
        })
      }

      // Notify remaining board members
      socket.to(`board:${data.boardId}`).emit('board:member-left', {
        memberId: data.memberId,
        boardId: data.boardId,
      })
    })

    // ==================== ATTACHMENT EVENTS ====================

    // File uploaded to task
    socket.on('attachment:uploaded', (data) => {
      socket.to(`board:${data.boardId}`).emit('attachment:uploaded', {
        taskId: data.taskId,
        attachment: data.attachment,
        uploadedBy: {
          id: userId,
          name: socket.user.name,
        },
      })
    })

    // File deleted from task
    socket.on('attachment:deleted', (data) => {
      socket.to(`board:${data.boardId}`).emit('attachment:deleted', {
        taskId: data.taskId,
        attachmentId: data.attachmentId,
      })
    })

    // ==================== DISCONNECT ====================

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.name} (${socket.id})`)

      // Remove from active users
      if (activeUsers.has(userId)) {
        activeUsers.get(userId).delete(socket.id)
        if (activeUsers.get(userId).size === 0) {
          activeUsers.delete(userId)

          // User completely offline - notify all
          io.emit('user:offline', {
            userId,
            userName: socket.user.name,
          })
        }
      }

      // Remove from socket mapping
      socketToUser.delete(socket.id)

      // Remove from all board rooms
      boardRooms.forEach((users, boardId) => {
        if (users.has(userId)) {
          users.delete(userId)
          socket.to(`board:${boardId}`).emit('board:user-left', {
            userId,
            userName: socket.user.name,
            boardId,
          })
        }
      })
    })

    // ==================== ERROR HANDLING ====================

    socket.on('error', (error) => {
      console.error('Socket error:', error)
      socket.emit('error', { message: 'An error occurred' })
    })
  })

  // Helper function to emit to specific user across all their connections
  const emitToUser = (userId, event, data) => {
    if (activeUsers.has(userId)) {
      activeUsers.get(userId).forEach((socketId) => {
        io.to(socketId).emit(event, data)
      })
    }
  }

  // Helper function to get active users in a board
  const getActiveUsersInBoard = (boardId) => {
    return Array.from(boardRooms.get(boardId) || [])
  }

  // Return helper functions for use in routes/controllers
  return {
    emitToUser,
    getActiveUsersInBoard,
    io,
  }
}
