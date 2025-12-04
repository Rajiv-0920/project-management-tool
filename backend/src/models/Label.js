import mongoose from 'mongoose'

const labelSchema = new mongoose.Schema(
  {
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Label name is required'],
      trim: true,
      maxlength: [50, 'Label name cannot exceed 50 characters'],
    },
    color: {
      type: String,
      required: [true, 'Label color is required'],
      match: /^#([0-9A-F]{3}){1,2}$/i, // hex color
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

// Indexes for faster board-level queries
labelSchema.index({ boardId: 1, name: 1 })
labelSchema.index({ createdBy: 1 })

const Label = mongoose.model('Label', labelSchema)

export default Label
