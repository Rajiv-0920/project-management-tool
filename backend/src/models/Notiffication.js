import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    type: {
      type: String,
      enum: ['task', 'comment', 'mention', 'assignment', 'board'],
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    relatedTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
    },

    relatedBoard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
)

const Notification = mongoose.model('Notification', notificationSchema)

export default Notification
