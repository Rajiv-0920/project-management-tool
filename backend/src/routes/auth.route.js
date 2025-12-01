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
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'), false)
    }
  },
})

router.post('/login', login)
router.post('/register', register)
router.post('/logout', logout)
router.get('/me', protect, getMyProfile)
router.post('/me', protect, upload.single('avatar'), updateMyProfile)
router.get('/verify-email', verifyEmail)

export default router
