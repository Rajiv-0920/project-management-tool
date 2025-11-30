import express from 'express'
import {
  login,
  logout,
  register,
  verifyEmail,
} from '../controllers/authController.js'

const router = express.Router()

router.post('/login', login)
router.post('/register', register)
router.post('/logout', logout)
router.get('/verify-email', verifyEmail)

export default router
