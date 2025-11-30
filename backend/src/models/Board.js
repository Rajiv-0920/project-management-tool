import mongoose from 'mongoose'

const columnSchema = new mongoose.Schema({
  title: { type: String, required: true },
  position: { type: Number, default: 0 },
})

const memberSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  role: {
    type: String,
    enum: ['admin', 'member', 'viewer'],
    default: 'member',
  },
})

const boardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: '',
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
    },

    members: [memberSchema],

    columns: [columnSchema],

    background: {
      type: String,
      default: '',
    },

    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
)

const Board = mongoose.model('Board', boardSchema)

export default Board
