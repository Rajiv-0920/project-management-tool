import mongoose from 'mongoose'

export const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
)

const Organization = mongoose.model('Organization', organizationSchema)

export default Organization
