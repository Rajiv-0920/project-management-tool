import express from 'express'
import protect from '../middleware/auth.js'
import { getAllUsers, getUserProfile } from '../controllers/userController.js'

const router = express.Router()

router.get('/', protect, getAllUsers)
router.get('/:id', protect, getUserProfile)

export default router
