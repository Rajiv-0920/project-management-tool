import express from 'express'
import {
  addChecklistItemToTask,
  addCommentToTask,
  addLabelToTask,
  assignUserToTask,
  deleteChecklistItem,
  deleteTask,
  getAllCommentsForTask,
  getTaskById,
  moveTask,
  removeLabelFromTask,
  removeUserFromTask,
  toggleChecklistItemCompletion,
  updateChecklistItem,
  updateTask,
} from '../controllers/taskController.js'
import protect from '../middleware/auth.js'
import { checkBoardAccess } from '../middleware/checkBoardAccess.js'

const router = express.Router()

// Task Routes
router.get('/:taskId', protect, getTaskById)
router.put('/:taskId', protect, updateTask)
router.delete('/:taskId', protect, deleteTask)
router.patch('/:taskId/move', protect, moveTask)
router.post('/:taskId/assignees', protect, assignUserToTask)
router.delete('/:taskId/assignees', protect, removeUserFromTask)

// Checklist Routes
router.post('/:taskId/checklist', protect, addChecklistItemToTask)
router.put('/:taskId/checklist/:itemId', protect, updateChecklistItem)
router.delete('/:taskId/checklist/:itemId', protect, deleteChecklistItem)
router.patch(
  '/:taskId/checklist/:itemId/toggle',
  protect,
  toggleChecklistItemCompletion
)

// Label Routes
router.post('/:taskId/labels', protect, addLabelToTask)
router.delete('/:taskId/labels/:labelId', protect, removeLabelFromTask)

// Comment Routes
router.get('/:taskId/comments', protect, getAllCommentsForTask)
router.post('/:taskId/comments', protect, addCommentToTask)

export default router
