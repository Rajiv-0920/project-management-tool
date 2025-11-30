import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // prevent password from being returned in queries
    },

    avatar: {
      publicId: { type: String }, // for cloudinary or S3
      url: { type: String }, // actual image URL
    },

    bio: {
      type: String,
      maxlength: 250,
      default: '',
    },

    // All organizations the user belongs to
    organizations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
      },
    ],

    // Boards user is part of
    boards: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Board',
      },
    ],

    // Store user preferences
    preferences: {
      theme: { type: String, default: 'light' }, // light / dark
      notifications: {
        email: { type: Boolean, default: true },
        inApp: { type: Boolean, default: true },
        sound: { type: Boolean, default: true },
      },
    },

    // For notifications relation
    notifications: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Notification',
      },
    ],

    // Real-time presence
    isOnline: {
      type: Boolean,
      default: false,
    },

    lastActiveAt: {
      type: Date,
      default: Date.now,
    },

    // For verification system
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    verificationTokenExpires: Date,

    // For resetting password
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  { timestamps: true }
)

// -------------------------------------------
// Password Hashing Middleware
// -------------------------------------------
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, 12)
})

// -------------------------------------------
// Password Compare Method
// -------------------------------------------
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

// -------------------------------------------
// Clean JSON output (remove sensitive fields)
// -------------------------------------------
UserSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password
  delete obj.resetPasswordToken
  delete obj.resetPasswordExpires
  delete obj.verificationToken
  delete obj.verificationTokenExpires
  return obj
}

const User = mongoose.model('User', UserSchema)
export default User
