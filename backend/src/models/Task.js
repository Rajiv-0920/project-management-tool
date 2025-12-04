import mongoose from 'mongoose'

const checklistItemSchema = new mongoose.Schema({
  text: { type: String, required: true },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
})

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      default: '',
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
      index: true,
    },
    columnId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Column',
      required: true,
      index: true,
    },
    assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },

    status: { type: String, default: 'active' },
    dueDate: { type: Date, default: null },
    startDate: { type: Date, default: null },

    labels: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Label' }],

    attachments: [
      {
        url: String,
        filename: String,
        fileType: String,
        fileSize: Number,
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    checklist: [checklistItemSchema],

    position: { type: Number, required: true, default: 0 },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    subtasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],

    parentTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

// Virtual for external Comment model
taskSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'taskId',
})

// Indexes
taskSchema.index({ boardId: 1, columnId: 1, position: 1 })
taskSchema.index({ assignees: 1 })
taskSchema.index({ dueDate: 1 })
taskSchema.index({ createdAt: -1 })

// Methods
taskSchema.methods.addAssignee = function (userId) {
  if (!this.assignees.includes(userId)) {
    this.assignees.push(userId)
  }
  return this.save()
}

taskSchema.methods.removeAssignee = function (userId) {
  this.assignees = this.assignees.filter((a) => !a.equals(userId))
  return this.save()
}

taskSchema.statics.getNextPosition = async function (boardId, columnId) {
  const last = await this.findOne({ boardId, columnId })
    .sort({ position: -1 })
    .select('position')
  return last ? last.position + 1 : 0
}

const Task = mongoose.model('Task', taskSchema)
export default Task
