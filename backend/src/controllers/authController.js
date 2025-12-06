import crypto from 'crypto'
import User from '../models/User.js'
import { generateToken } from '../utils/generateToken.js'
import sendEmail from '../utils/sendEmail.js'
import cloudinary from '../config/cloudinary.js'

export const register = async (req, res) => {
  const { name, email, password } = req.body

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: 'Password must be at least 6 characters' })
    }

    // 2. Check for existing user
    const userExists = await User.findOne({ email })
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' })
    }

    // We generate the verification token here
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationTokenHash = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex')

    const newUser = new User({
      name,
      email,
      password, // Mongoose middleware will hash this
      verificationToken: verificationTokenHash,
      verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    })

    // We save before sending email to ensure the account actually exists in DB
    await newUser.save()

    // 5. Send Email
    // We wrap this in a try/catch specifically for email failures
    try {
      // ! Change the URL to your frontend verification page
      const verifyUrl = `http://localhost:5000/api/auth/verify-email?token=${verificationToken}`

      await sendEmail({
        email: newUser.email,
        subject: 'Verify your email',
        message: `
          <h1>Welcome to the App!</h1>
          <p>Please click the link below to verify your email address:</p>
          <a href="${verifyUrl}" clicktracking=off>${verifyUrl}</a>
        `,
      })
    } catch (emailError) {
      // Optional: If email fails, you might want to delete the user or just log it
      console.error('Email could not be sent:', emailError)
      // We don't return an error to the user here, because the account IS created.
      // The user can request a new verification link later.
    }

    // Generate Token
    const token = generateToken(res, { id: newUser._id })

    res.status(201).json({
      message:
        'Registration successful. Please check your email to verify account.',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
      token,
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const login = async (req, res) => {
  const { email, password } = req.body
  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    // 2. Check for user
    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' })
    }

    // 3. Check if email is verified
    if (!user.isVerified) {
      return res
        .status(400)
        .json({ message: 'Please verify your email before logging in' })
    }

    // 4. Check password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' })
    }

    // 5. Generate Token
    const token = generateToken(res, { id: user._id })

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      token,
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const verifyEmail = async (req, res) => {
  const { token } = req.query
  const verificationTokenHash = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex')

  try {
    if (!token) {
      return res.status(400).json({ message: 'Invalid token' })
    }

    // Find user with this token AND ensure token hasn't expired
    const user = await User.findOne({
      verificationToken: verificationTokenHash,
      verificationTokenExpires: { $gt: Date.now() }, // $gt means "Greater Than" now
    })

    if (!user) {
      return res
        .status(400)
        .json({ message: 'Invalid or expired verification token' })
    }

    // Verify the user
    user.isVerified = true
    user.verificationToken = undefined // Clear the token
    user.verificationTokenExpires = undefined
    await user.save()

    // Option A: Return JSON (if using React/Frontend to handle redirect)
    res
      .status(200)
      .json({ message: 'Email verified successfully. You can now login.' })

    // Option B: Redirect directly (if you want to send them to your frontend login page)
    // res.redirect(`${process.env.CLIENT_URL}/login?verified=true`)
  } catch (error) {
    console.error('Verification error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const logout = (req, res) => {
  try {
    res.cookie('token', '', {
      httpOnly: true,
      expires: new Date(0),
    })
    res.status(200).json({ message: 'Logged out successfully' })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password')
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.status(200).json({ user })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const updateMyProfile = async (req, res) => {
  try {
    const { name, bio } = req.body
    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (bio.length >= 250) {
      return res
        .status(400)
        .json({ message: 'Bio must be less than 250 characters' })
    }

    if (name) user.name = name
    if (bio) user.bio = bio

    // 2. Handle Image Upload (The Cloudinary Part)
    if (req.file) {
      // Create a promise to handle the stream upload
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'user_avatars' }, // Optional: organize in a folder
          (error, result) => {
            if (error) return reject(error)
            resolve(result)
          }
        )
        // Write the buffer to the stream
        stream.end(req.file.buffer)
      })

      // Save the Cloudinary URL to the user document
      user.avatar = uploadResult.secure_url
    }

    await user.save()

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        avatar: user.avatar, // Return the new image URL
      },
    })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const resendVerificationEmail = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // If already verified
    if (user.isVerified) {
      return res.status(400).json({ message: 'Email already verified' })
    }

    // Generate a new token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationTokenHash = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex')

    // Update user with new token + 24h expiration
    user.verificationToken = verificationTokenHash
    user.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000

    await user.save()

    // Create the new URL
    const verifyUrl = `http://localhost:5000/api/auth/verify-email?token=${verificationToken}`

    // Send email again
    try {
      await sendEmail({
        email: user.email,
        subject: 'Verify your email (Resent)',
        message: `
          <h1>Verify Your Email</h1>
          <p>You requested a new verification link. Click below:</p>
          <a href="${verifyUrl}" clicktracking=off>${verifyUrl}</a>
        `,
      })
    } catch (emailError) {
      console.error('Resend email error:', emailError)
      return res.status(500).json({
        message: 'Failed to send verification email. Try again later.',
      })
    }

    res.json({
      message: 'Verification email resent successfully.',
    })
  } catch (error) {
    console.error('Resend verification error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}
