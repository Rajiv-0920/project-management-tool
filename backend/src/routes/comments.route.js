import express from 'express'
import {
  deleteComment,
  updateComment,
} from '../controllers/commentController.js'
import protect from '../middleware/auth.js'
import checkCommentOwner from '../middleware/checkCommentOwner.js'

const router = express.Router()

router.put('/:commentId', protect, checkCommentOwner, updateComment)
router.delete('/:commentId', protect, checkCommentOwner, deleteComment)

export default router
