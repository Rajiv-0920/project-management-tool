import { Server } from 'socket.io'
import http from 'http'
import express from 'express'

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
})

io.on('connection', (socket) => {
  console.log('🟢 A user connected:', socket.id)

  socket.on('send_message', (data) => {
    console.log('Message from client:', data)

    // Send message to all clients
    io.emit('receive_message', data)
  })

  socket.on('disconnect', () => {
    console.log('🔴 User disconnected:', socket.id)
  })
})

export { io, app, server }
