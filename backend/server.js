import express from 'express'
import 'dotenv/config'
import path from 'path'
import cors from 'cors'
import helmet from 'helmet'
import mongoose from 'mongoose'

import connectDB from './src/config/db.js'
import { app, server } from './src/config/socket.js'
import authRoutes from './src/routes/auth.route.js'
import userRoutes from './src/routes/users.route.js'
import cookieParser from 'cookie-parser'

// Initialize Express app
const PORT = process.env.PORT || 3000

// Resolve __dirname for ES modules
const __dirname = path.resolve()

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(helmet())
app.use(cookieParser())
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
)

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')))
  app.get('/{*any}', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'dist', 'index.html'))
  })
}

// Start the server
const startServer = async () => {
  try {
    await connectDB()
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`)
    })
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`)
  }
}

startServer()
