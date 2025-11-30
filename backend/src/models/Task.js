import mongoose from 'mongoose'

const checklistItemSchema = new mongoose.Schema({
  text: String,
  completed: { type: Boolean, default: false },
})

const attachmentSchema = new mongoose.Schema({
  fileUrl: String,
  fileName: String,
  fileType: String,
  fileSize: Number,
})

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: '',
    },

    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
    },

    columnId: {
      type: mongoose.Schema.Types.ObjectId,
    },

    assignees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },

    status: {
      type: String,
      default: 'todo',
    },

    dueDate: {
      type: Date,
    },

    startDate: {
      type: Date,
    },

    labels: [
      {
        name: String,
        color: String,
      },
    ],

    attachments: [attachmentSchema],

    checklist: [checklistItemSchema],

    position: {
      type: Number,
      default: 0,
    },

    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
      },
    ],
  },
  { timestamps: true }
)

const Task = mongoose.model('Task', taskSchema)

export default Task
