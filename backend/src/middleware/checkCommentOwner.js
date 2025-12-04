import Comment from '../models/Comment.js'

/**
 * Middleware to check if the current user is the owner of the comment
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - next middleware
 */
const checkCommentOwner = async (req, res, next) => {
  try {
    const { commentId } = req.params
    const userId = req.user._id

    // Find the comment by ID
    const comment = await Comment.findById(commentId)
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' })
    }

    // Check if the logged-in user is the owner
    if (comment.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Access denied: not the owner' })
    }

    // Attach comment to request for later use
    req.comment = comment

    next()
  } catch (error) {
    console.error('CheckCommentOwner error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export default checkCommentOwner
