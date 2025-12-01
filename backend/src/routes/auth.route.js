import express from 'express'
import {
  getMyProfile,
  login,
  logout,
  register,
  verifyEmail,
} from '../controllers/authController.js'
import protect from '../middleware/auth.js'

const router = express.Router()

router.post('/login', login)
router.post('/register', register)
router.post('/logout', logout)
router.get('/me', protect, getMyProfile)
router.get('/verify-email', verifyEmail)

export default router
