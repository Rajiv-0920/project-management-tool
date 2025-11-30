import express from 'express'
import 'dotenv/config'
import path from 'path'
import cors from 'cors'

// Initialize Express app
const app = express()
const PORT = process.env.PORT || 3000

// Resolve __dirname for ES modules
const __dirname = path.resolve()

// Middleware
app.use(express.json())
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
)

// Sample route
app.get('/', (req, res) => {
  res.send('Server is running')
})

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')))
  app.get('/{*any}', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'dist', 'index.html'))
  })
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
