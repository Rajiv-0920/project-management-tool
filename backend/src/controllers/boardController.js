import Board from '../models/Board.js'
import Organization from '../models/Organization.js'
import Task from '../models/Task.js'
import User from '../models/User.js'
import Label from '../models/Label.js'
import { Types } from 'mongoose'

/**
 * @function getAllBoards
 * @description Retrieve all boards that the user is a member of or owns.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise} Promise that resolves to a JSON response containing the boards.
 */
export const getAllBoards = async (req, res) => {
  try {
    const { organizationId } = req.query
    const query = {
      $or: [{ owner: req.user._id }, { 'members.userId': req.user._id }],
    }
    if (organizationId) {
      query.organizationId = organizationId
    }
    const boards = await Board.find(query).populate('owner', 'name email')
    res.status(200).json(boards)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

/**
 * Create a new board
 * @param {Object} req.body - Request body containing the board data
 * @param {Object} req.user - User object containing the user's ID
 * @returns {Promise} Promise that resolves to a JSON response containing the created board
 */
export const createBoard = async (req, res) => {
  try {
    const { title, description, organizationId, background, columns } = req.body

    let orgId = organizationId

    // If organizationId is not provided, create a new organization
    if (!orgId) {
      const newOrganization = new Organization({
        name: title, // Use the board title as the organization name
        owner: req.user._id,
        description: `Organization for ${title}`,
      })
      await newOrganization.save()
      orgId = newOrganization._id
    }

    // Create the board with the organizationId
    const board = new Board({
      title,
      description,
      owner: req.user._id,
      organizationId: orgId,
      background,
      columns,
    })

    board.members.push({ userId: req.user._id, role: 'admin' })

    await board.save()
    res.status(201).json(board)
  } catch (error) {
    console.error('Error creating board:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

/**
 * Retrieves a specific board by its ID
 * @param {Object} req.params - Must contain the boardId
 * @param {Object} req.user - User object containing the user's ID
 * @returns {Promise} Promise that resolves to a JSON response containing the board
 * @throws {Error} - If the board is not found or the user does not have access
 */
export const getBoard = async (req, res) => {
  const { id } = req.params
  const userId = req.user._id
  try {
    const board = await Board.findById(id)
    if (!board) {
      return res.status(404).json({ message: 'Board not found' })
    }
    const isMember = board.members.some((member) =>
      member.userId.equals(userId)
    )
    if (!board.owner.equals(userId) && !isMember) {
      return res.status(403).json({ message: 'Access denied' })
    }
    res.status(200).json(board)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

/**
 * Updates a specific board by its ID
 * @param {Object} req.params - Must contain the boardId
 * @param {Object} req.user - User object containing the user's ID
 * @param {Object} req.body - Must contain the title, description, and background of the board
 * @returns {Promise} Promise that resolves to a JSON response containing the updated board
 * @throws {Error} - If the board is not found or the user does not have access
 */
export const updateBoard = async (req, res) => {
  try {
    const { title, description, background } = req.body
    const board = await Board.findById(req.params.id)

    if (!board) {
      return res.status(404).json({ message: 'Board not found' })
    }

    // Update basic fields
    board.title = title || board.title
    board.description = description || board.description
    board.background = background || board.background

    await board.save()
    res.status(200).json(board)
  } catch (error) {
    console.error('Error updating board:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

/**
 * Deletes a specific board by its ID
 * @param {Object} req.params - Must contain the boardId
 * @param {Object} req.user - User object containing the user's ID
 * @returns {Promise} Promise that resolves to a JSON response containing a success message
 * @throws {Error} - If the board is not found or the user does not have access
 */
export const deleteBoard = async (req, res) => {
  const { id } = req.params
  const userId = req.user._id
  try {
    const board = await Board.findById(id)
    if (!board) {
      return res.status(404).json({ message: 'Board not found' })
    }

    // Hard delete: mark the board as archived
    await board.deleteOne()

    res.status(200).json({ message: 'Board deleted successfully' })
  } catch (error) {
    console.error('Error deleting board:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

/**
 * Archives or unarchives a specific board by its ID
 * @param {Object} req.params - Must contain the boardId
 * @param {Object} req.user - User object containing the user's ID
 * @returns {Promise} Promise that resolves to a JSON response containing the updated board
 * @throws {Error} - If the board is not found or the user does not have access
 */
export const archiveBoard = async (req, res) => {
  const { id } = req.params
  const userId = req.user._id
  try {
    const board = await Board.findById(id)
    if (!board) {
      return res.status(404).json({ message: 'Board not found' })
    }

    board.isArchived = !board.isArchived

    await board.save()

    res.status(200).json({ message: 'Board archived successfully', board })
  } catch (error) {
    console.error('Error deleting board:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

/**
 * Lists all members of a specific board by its ID
 * @param {Object} req.params - Must contain the boardId
 * @param {Object} req.user - User object containing the user's ID
 * @returns {Promise} Promise that resolves to a JSON response containing the list of board members
 * @throws {Error} - If the board is not found or the user does not have access
 */
export const listBoardMembers = async (req, res) => {
  const { id } = req.params
  try {
    const board = await Board.findById(id).populate({
      path: 'members.userId',
      select: 'name email avatar',
    })

    if (!board) {
      return res.status(404).json({ message: 'Board not found' })
    }

    const formattedMembers = board.members.map((member) => {
      if (!member.userId) return member

      return {
        _id: member.userId._id, // The User's ID
        membershipId: member._id, // The Membership subdocument ID (optional)
        name: member.userId.name,
        email: member.userId.email,
        avatar: member.userId.avatar,
        role: member.role, // Kept at the top level
      }
    })

    res.status(200).json(formattedMembers)
  } catch (error) {
    console.error('Error listing board members:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

/**
 * Invites a new member to a specific board by its ID
 * @param {Object} req.params - Must contain the boardId
 * @param {Object} req.body - Must contain the email and role of the new member
 * @returns {Promise} Promise that resolves to a JSON response containing a success message
 * @throws {Error} - If the board is not found, the user is not found, the user is already a member, or the user does not have access
 */
export const inviteBoardMember = async (req, res) => {
  const { id } = req.params
  const { email, role } = req.body
  try {
    const board = await Board.findById(id)
    if (!board) {
      return res.status(404).json({ message: 'Board not found' })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Check if the user is already a member
    const isAlreadyMember = board.members.some((member) =>
      member.userId.equals(user._id)
    )
    if (isAlreadyMember) {
      return res.status(400).json({ message: 'User is already a member' })
    }

    // Add the user as a member
    board.members.push({ userId: user._id, role: role || 'member' })
    await board.save()

    res.status(200).json({ message: 'Member invited successfully' })
  } catch (error) {
    console.error('Error inviting board member:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

/**
 * Updates a specific board member's role
 * @param {Object} req.params - Must contain the boardId and userId
 * @param {Object} req.body - Must contain the new role of the member
 * @returns {Promise} Promise that resolves to a JSON response containing a success message
 * @throws {Error} - If the board is not found, the user is not found, the role is invalid, the user is the last admin, or the user does not have access
 */
export const updateBoardMemberRole = async (req, res) => {
  const { id, userId } = req.params
  const { role } = req.body
  try {
    const board = await Board.findById(id)
    if (!board) {
      return res.status(404).json({ message: 'Board not found' })
    }

    // Find the member to update
    const member = board.members.find((m) => m.userId.equals(userId))
    if (!member) {
      return res.status(404).json({ message: 'Member not found' })
    }

    // Prevent removing the last admin
    if (member.role === 'admin' && role !== 'admin') {
      const adminCount = board.members.filter((m) => m.role === 'admin').length
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot remove the last admin' })
      }
    }

    // Update the member's role
    member.role = role || member.role
    await board.save()

    res.status(200).json({ message: 'Member role updated successfully' })
  } catch (error) {
    console.error('Error updating member role:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

/**
 * Removes a member from a specific board
 * @param {Object} req.params - Must contain the boardId and userId
 * @returns {Promise} Promise that resolves to a JSON response containing a success message
 * @throws {Error} - If the board is not found, the user is not found, the user is the last admin, or the user does not have access
 */
export const removeBoardMember = async (req, res) => {
  const { id, userId } = req.params
  try {
    const board = await Board.findById(id)
    if (!board) {
      return res.status(404).json({ message: 'Board not found' })
    }

    // Find the member to remove
    const memberToRemove = board.members.find((m) => m.userId.equals(userId))
    if (!memberToRemove) {
      return res.status(404).json({ message: 'Member not found' })
    }

    // Prevent removing the last admin
    if (memberToRemove.role === 'admin') {
      const adminCount = board.members.filter((m) => m.role === 'admin').length
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot remove the last admin' })
      }
    }

    // Remove the member
    board.members = board.members.filter(
      (member) => !member.userId.equals(userId)
    )
    await board.save()

    res.status(200).json({ message: 'Member removed successfully' })
  } catch (error) {
    console.error('Error removing board member:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

/**
 * @route   POST /boards/:id/columns
 * @desc    Add a new column to a specific board (requires authentication)
 * @access  Private
 */
export const addColumn = async (req, res) => {
  const { id } = req.params
  const { title, position } = req.body

  try {
    const board = await Board.findById(id)
    if (!board) return res.status(404).json({ message: 'Board not found' })

    const pos = position ?? 0

    if (board.columns.some((col) => col.position === pos)) {
      return res.status(400).json({ message: 'Column position already taken' })
    }

    board.columns.push({ title, position: pos })

    await board.save()
    res.status(201).json(board)
  } catch (error) {
    console.error('Error adding column:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

/**
 * @route   PUT /boards/:id/columns/:columnId
 * @desc    Update a specific column in a board (requires authentication)
 * @access  Private
 */
export const updateColumn = async (req, res) => {
  const { id, columnId } = req.params
  const userId = req.user._id
  const { title, position } = req.body

  try {
    const board = await Board.findById(id)
    if (!board) {
      return res.status(404).json({ message: 'Board not found' })
    }

    // Find the column to update
    const column = board.columns.id(columnId)
    if (!column) {
      return res.status(404).json({ message: 'Column not found' })
    }

    // Check for position conflicts
    const pos = position ?? 0

    if (board.columns.some((col) => col.position === pos)) {
      return res.status(400).json({ message: 'Column position already taken' })
    }

    // Update the column
    column.title = title || column.title
    if (position !== undefined) {
      column.position = position
    }

    await board.save()
    res.status(200).json(board)
  } catch (error) {
    console.error('Error updating column:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

/**
 * @route   DELETE /boards/:id/columns/:columnId
 * @desc    Delete a specific column from a board (requires authentication)
 * @access  Private
 */
export const deleteColumn = async (req, res) => {
  const { id, columnId } = req.params
  const userId = req.user._id

  try {
    const board = await Board.findById(id)
    if (!board) {
      return res.status(404).json({ message: 'Board not found' })
    }

    // Find the column to delete
    const columnIndex = board.columns.findIndex((column) =>
      column._id.equals(columnId)
    )
    if (columnIndex === -1) {
      return res.status(404).json({ message: 'Column not found' })
    }

    // Remove the column
    board.columns.splice(columnIndex, 1)
    await board.save()

    res.status(200).json({ message: 'Column deleted successfully', board })
  } catch (error) {
    console.error('Error deleting column:', error)
    return res.status(500).json({ message: 'Server error' })
  }
}

// @desc    Create new task
// @route   POST /api/boards/:boardId/tasks
// @access  Private
export const createTask = async (req, res) => {
  try {
    const { id: boardId } = req.params
    const userId = req.user._id
    const {
      title,
      description,
      columnId,
      assignees,
      priority,
      dueDate,
      labels,
    } = req.body

    // Validate required fields
    if (!title || !columnId) {
      return res.status(400).json({
        message: 'Title and columnId are required',
      })
    }

    // Check board access
    const board = await Board.findById(boardId)
    if (!board) {
      return res.status(404).json({ message: 'Board not found' })
    }

    const member = board.members.find(
      (m) => m.userId.toString() === userId.toString()
    )
    if (!member || member.role === 'viewer') {
      return res.status(403).json({ message: 'Access denied' })
    }

    // Get next position
    const position = await Task.getNextPosition(boardId, columnId)

    // Create task
    const colId = new Types.ObjectId(columnId)
    const task = await Task.create({
      title,
      description,
      boardId,
      columnId: colId,
      assignees: assignees || [],
      priority: priority || 'medium',
      dueDate: dueDate || null,
      labels: labels || [],
      position,
      createdBy: userId,
    })

    // Populate task
    await task.populate([
      { path: 'assignees', select: 'name email avatar' },
      { path: 'createdBy', select: 'name email avatar' },
      { path: 'labels' },
    ])

    // Create notifications for assignees
    // if (assignees && assignees.length > 0) {
    //   for (const assigneeId of assignees) {
    //     if (assigneeId !== req.user.id) {
    //       await createNotification({
    //         userId: assigneeId,
    //         type: 'task_assigned',
    //         message: `${req.user.name} assigned you to task: ${title}`,
    //         relatedTask: task._id,
    //         relatedBoard: boardId,
    //       })
    //     }
    //   }
    // }

    // Emit socket event
    // emitSocketEvent(boardId, 'task:created', task)

    res.status(201).json({
      success: true,
      data: task,
    })
  } catch (error) {
    console.error('Create task error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

/**
 * Retrieves all tasks in a specific board
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise} Promise that resolves to a JSON response containing the tasks
 * @throws {Error} - If the board is not found or the user does not have access
 */
export const getAllTasks = async (req, res) => {
  try {
    const { id: boardId } = req.params
    const userId = req.user._id

    // Check board access
    const board = await Board.findById(boardId)
    if (!board) {
      return res.status(404).json({ message: 'Board not found' })
    }

    const member = board.members.find(
      (m) => m.userId.toString() === userId.toString()
    )
    if (!member) {
      return res.status(403).json({ message: 'Access denied' })
    }

    // Fetch tasks
    const tasks = await Task.find({ boardId })
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('labels')

    res.status(200).json({ success: true, data: tasks })
  } catch (error) {
    console.error('Get all tasks error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

/**
 * @route   GET /boards/:boardId/labels
 * @desc    Retrieve all labels for a specific board (requires authentication)
 * @access  Private
 * @param   {string} boardId - The ID of the board to retrieve labels from
 * @returns {object} - Response object containing an array of labels
 */

export const getAllLabels = async (req, res) => {
  try {
    const { boardId } = req.params

    const labels = await Label.find({ boardId })

    res.status(200).json({ success: true, data: labels })
  } catch (error) {
    console.error('Get all labels error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}
