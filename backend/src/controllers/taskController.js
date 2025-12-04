import Board from '../models/Board.js'
import Comment from '../models/Comment.js'
import Label from '../models/Label.js'
import Task from '../models/Task.js'

import { Types } from 'mongoose'

export const getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params
    const userId = req.user._id

    const task = await Task.findById(taskId)
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('labels')

    if (!task) {
      return res.status(404).json({ message: 'Task not found' })
    }

    // Check if the user has access to the board containing the task
    const board = await Board.findById(task.boardId)
    const member = board.members.find(
      (m) => m.userId.toString() === userId.toString()
    )
    if (!member) {
      return res.status(403).json({ message: 'Access denied' })
    }

    res.status(200).json({ task })
  } catch (error) {
    console.error('Error fetching task by ID:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// @desc    Update task
// @route   PUT /api/tasks/:taskId
// @access  Private
export const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params
    const updates = req.body

    const task = await Task.findById(taskId)
    if (!task) {
      return res.status(404).json({ message: 'Task not found' })
    }

    // Check board access
    const board = await Board.findById(task.boardId)
    const member = board.members.find(
      (m) => m.userId.toString() === req.user.id
    )
    if (!member || member.role === 'viewer') {
      return res.status(403).json({ message: 'Access denied' })
    }

    // Fields that can be updated
    const allowedFields = [
      'title',
      'description',
      'priority',
      'status',
      'dueDate',
      'startDate',
    ]

    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        task[field] = updates[field]
      }
    })

    await task.save()
    await task.populate([
      { path: 'assignees', select: 'name email avatar' },
      { path: 'createdBy', select: 'name email avatar' },
      { path: 'labels' },
    ])

    res.json({
      success: true,
      data: task,
    })
  } catch (error) {
    console.error('Update task error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

export const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params
    const userId = req.user._id

    const task = await Task.findById(taskId)
    if (!task) {
      return res.status(404).json({ message: 'Task not found' })
    }

    // Check board access
    const board = await Board.findById(task.boardId)
    const member = board.members.find(
      (m) => m.userId.toString() === userId.toString()
    )
    if (!member || member.role === 'viewer') {
      return res.status(403).json({ message: 'Access denied' })
    }

    await task.deleteOne()

    res.json({ success: true, message: 'Task deleted successfully' })
  } catch (error) {
    console.error('Delete task error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const moveTask = async (req, res) => {
  try {
    const { taskId } = req.params
    const { toColumnId, toPosition } = req.body
    const userId = req.user._id

    const task = await Task.findById(taskId)
    if (!task) {
      return res.status(404).json({ message: 'Task not found' })
    }

    // Check board access
    const board = await Board.findById(task.boardId)
    const member = board.members.find(
      (m) => m.userId.toString() === userId.toString()
    )
    if (!member || member.role === 'viewer') {
      return res.status(403).json({ message: 'Access denied' })
    }

    // Update task's column and position
    const toColumnObjectId = new Types.ObjectId(toColumnId)
    task.columnId = toColumnObjectId
    task.position = toPosition

    await task.save()

    res.json({ success: true, data: task })
  } catch (error) {
    console.error('Move task error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const assignUserToTask = async (req, res) => {
  try {
    const { taskId } = req.params
    const { userIdToAssign } = req.body
    const userId = req.user._id

    const task = await Task.findById(taskId)
    if (!task) {
      return res.status(404).json({ message: 'Task not found' })
    }

    // Check board access
    const board = await Board.findById(task.boardId)
    const member = board.members.find(
      (m) => m.userId.toString() === userId.toString()
    )
    if (!member || member.role === 'viewer') {
      return res.status(403).json({ message: 'Access denied' })
    }

    // Assign user
    const userObjectIdToAssign = new Types.ObjectId(userIdToAssign)
    await task.addAssignee(userObjectIdToAssign)

    res.json({ success: true, data: task })
  } catch (error) {
    console.error('Assign user to task error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const removeUserFromTask = async (req, res) => {
  try {
    const { taskId } = req.params
    const { userIdToRemove } = req.body
    const userId = req.user._id

    const task = await Task.findById(taskId)
    if (!task) {
      return res.status(404).json({ message: 'Task not found' })
    }

    // Check board access
    const board = await Board.findById(task.boardId)
    const member = board.members.find(
      (m) => m.userId.toString() === userId.toString()
    )
    if (!member || member.role === 'viewer') {
      return res.status(403).json({ message: 'Access denied' })
    }

    // Remove user
    const userObjectIdToRemove = new Types.ObjectId(userIdToRemove)
    await task.removeAssignee(userObjectIdToRemove)

    res.json({ success: true, data: task })
  } catch (error) {
    console.error('Remove user from task error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const addChecklistItemToTask = async (req, res) => {
  try {
    const { taskId } = req.params
    const { text, completed } = req.body
    const userId = req.user._id

    if (!text) {
      res.status(404).json({ message: 'Text is required' })
    }

    const task = await Task.findById(taskId)
    if (!task) {
      res.status(404).json({ message: 'Task not found' })
    }

    // Check board access
    const board = await Board.findById(task.boardId)
    const member = board.members.find(
      (m) => m.userId.toString() === userId.toString()
    )
    if (!member || member.role === 'viewer') {
      return res.status(403).json({ message: 'Access denied' })
    }

    task.checklist.push({ text, completed })

    await task.save()

    res.status(200).json({ task })
  } catch (error) {
    console.error('Add Checklist Item to Task error: ', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const updateChecklistItem = async (req, res) => {
  try {
    const { taskId, itemId } = req.params
    const { text, completed } = req.body
    const userId = req.user._id

    const task = await Task.findById(taskId)
    if (!task) {
      return res.status(404).json({ message: 'Task not found' })
    }

    // Check board access
    const board = await Board.findById(task.boardId)
    const member = board.members.find(
      (m) => m.userId.toString() === userId.toString()
    )
    if (!member || member.role === 'viewer') {
      return res.status(403).json({ message: 'Access denied' })
    }

    const item = task.checklist.find(
      (item) => item._id.toString() === itemId.toString()
    )
    if (!item) {
      return res.status(404).json({ message: 'Item not found' })
    }

    if (text !== undefined) {
      item.text = text
    }

    if (completed !== undefined) {
      item.completed = completed
    }

    await task.save()

    res.status(200).json({ task })
  } catch (error) {
    console.error('Add Checklist Item to Task error: ', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const deleteChecklistItem = async (req, res) => {
  try {
    const { taskId, itemId } = req.params
    const userId = req.user._id

    const task = await Task.findById(taskId)
    if (!task) {
      return res.status(404).json({ message: 'Task not found' })
    }

    // Check board access
    const board = await Board.findById(task.boardId)
    const member = board.members.find(
      (m) => m.userId.toString() === userId.toString()
    )
    if (!member || member.role === 'viewer') {
      return res.status(403).json({ message: 'Access denied' })
    }

    const item = task.checklist.find(
      (item) => item._id.toString() === itemId.toString()
    )
    if (!item) {
      return res.status(404).json({ message: 'Item not found' })
    }

    task.checklist = task.checklist.filter(
      (item) => item._id.toString() !== itemId.toString()
    )

    task.save()
    res.status(200).json({ task })
  } catch (error) {
    console.error('Delete Checklist Item error: ', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const toggleChecklistItemCompletion = async (req, res) => {
  try {
    const { taskId, itemId } = req.params
    const userId = req.user._id

    const task = await Task.findById(taskId)
    if (!task) {
      return res.status(404).json({ message: 'Task not found' })
    }

    // Check board access
    const board = await Board.findById(task.boardId)
    const member = board.members.find(
      (m) => m.userId.toString() === userId.toString()
    )
    if (!member || member.role === 'viewer') {
      return res.status(403).json({ message: 'Access denied' })
    }

    const item = task.checklist.find(
      (item) => item._id.toString() === itemId.toString()
    )
    if (!item) {
      return res.status(404).json({ message: 'Item not found' })
    }

    item.completed = !item.completed

    task.save()
    res.status(200).json({ task })
  } catch (error) {
    console.error('Toggle Checklist Item Completion error: ', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const addLabelToTask = async (req, res) => {
  try {
    const { taskId } = req.params
    const { labelId } = req.body
    const userId = req.user._id

    const task = await Task.findById(taskId)
    if (!task) {
      return res.status(404).json({ message: 'Task not found' })
    }

    // Check board access
    const board = await Board.findById(task.boardId)
    const member = board.members.find(
      (m) => m.userId.toString() === userId.toString()
    )
    if (!member || member.role === 'viewer') {
      return res.status(403).json({ message: 'Access denied' })
    }

    const labelIdObject = new Types.ObjectId(labelId)
    const label = await Label.findById(labelIdObject)
    if (!label) {
      return res.status(404).json({ message: 'Label not found' })
    }

    task.labels.push(label)
    await task.save()
    res.status(200).json({ task })
  } catch (error) {
    console.error('Add Label to Task error: ', error)
    res.status(500).json({ message: 'Sever error' })
  }
}
export const removeLabelFromTask = async (req, res) => {
  try {
    const { taskId, labelId } = req.params
    const userId = req.user._id

    const task = await Task.findById(taskId)
    if (!task) {
      return res.status(404).json({ message: 'Task not found' })
    }

    // Check board access
    const board = await Board.findById(task.boardId)
    const member = board.members.find(
      (m) => m.userId.toString() === userId.toString()
    )
    if (!member || member.role === 'viewer') {
      return res.status(403).json({ message: 'Access denied' })
    }

    const labelIdObject = new Types.ObjectId(labelId)
    const label = await Label.findById(labelIdObject)
    if (!label) {
      return res.status(404).json({ message: 'Label not found' })
    }

    task.labels = task.labels.filter(
      (label) => label._id.toString() !== labelIdObject.toString()
    )
    await task.save()
    res.status(200).json({ task })
  } catch (error) {
    console.error('Remove Label from Task error: ', error)
    res.status(500).json({ message: 'Sever error' })
  }
}

/**
 * Retrieves all comments for a specific task
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise} Promise that resolves to a JSON response containing the task with its comments
 * @throws {Error} - If the task is not found or the user does not have access
 */
export const getAllCommentsForTask = async (req, res) => {
  try {
    const { taskId } = req.params
    const task = await Task.findById(taskId).populate('comments')
    if (!task) {
      return res.status(404).json({ message: 'Task not found' })
    }
    res.status(200).json({ task })
  } catch (error) {
    console.error('Get all comments error: ', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const addCommentToTask = async (req, res) => {
  try {
    const { taskId } = req.params
    const { message, attachments = [] } = req.body
    const userId = req.user._id

    if (!message || message.trim() === '') {
      return res.status(400).json({ message: 'Comment message is required' })
    }

    const task = await Task.findById(taskId)
    if (!task) return res.status(404).json({ message: 'Task not found' })

    // Board access check
    const board = await Board.findById(task.boardId)
    const member = board.members.find(
      (m) => m.userId.toString() === userId.toString()
    )
    if (!member || member.role === 'viewer') {
      return res.status(403).json({ message: 'Access denied' })
    }

    // Create comment
    let newComment = await Comment.create({
      taskId,
      userId,
      content: message,
      attachments,
    })

    res.status(201).json({
      message: 'Comment added successfully',
      comment: newComment,
    })
  } catch (error) {
    console.error('Add Comment to Task error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}
