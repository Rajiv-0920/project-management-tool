import express from 'express'
import {
  getMyProfile,
  login,
  logout,
  register,
  updateMyProfile,
  verifyEmail,
} from '../controllers/authController.js'
import protect from '../middleware/auth.js'
import multer from 'multer'

const router = express.Router()
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

router.post('/login', login)
router.post('/register', register)
router.post('/logout', logout)
router.get('/me', protect, getMyProfile)
router.post('/me', protect, upload.single('avatar'), updateMyProfile)
router.get('/verify-email', verifyEmail)

export default router
