import User from '../models/User.js'
import mongoose from 'mongoose'

// Get all users (with pagination and projection)
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const users = await User.find({}, 'name email avatar bio createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit))

    res.status(200).json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Get user profile (with input validation)
export const getUserProfile = async (req, res) => {
  const { id } = req.params

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid user ID' })
  }

  try {
    const user = await User.findById(id, 'name email avatar bio createdAt')
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.status(200).json(user)
  } catch (error) {
    console.error('Error fetching user profile:', error)
    res.status(500).json({ message: 'Server error' })
  }
}
