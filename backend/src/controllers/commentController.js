import Comment from '../models/Comment.js'

export const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params
    const { message } = req.body

    if (!message || message.trim() === '') {
      return res.status(400).json({ message: 'Comment message is required' })
    }

    const comment = await Comment.findById(commentId)
    if (!comment) return res.status(404).json({ message: 'Comment not found' })

    comment.content = message

    await comment.save()

    res.status(200).json({ comment, message: 'Comment updated successfully' })
  } catch (error) {
    console.error('Update comment error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params

    const comment = await Comment.findById(commentId)
    if (!comment) return res.status(404).json({ message: 'Comment not found' })

    await comment.deleteOne()
    res.status(200).json({ message: 'Comment deleted successfully' })
  } catch (error) {
    console.error('Delete comment error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}
