import Board from '../models/Board.js'

export const checkBoardAccess = (requiredRoles = []) => {
  return async (req, res, next) => {
    try {
      const { id: boardId } = req.params
      const board = await Board.findById(boardId)

      if (!board) {
        return res.status(404).json({ message: 'Board not found' })
      }

      // Check if the user is the owner
      if (board.owner.equals(req.user.id)) {
        return next()
      }

      // Check if the user is a member of the board
      const member = board.members.find((m) => m.userId.equals(req.user.id))

      if (!member) {
        return res.status(403).json({
          message: 'Access denied: You are not a member of this board',
        })
      }

      // If specific roles are required, check if user's role is allowed
      if (Array.isArray(requiredRoles) && requiredRoles.length > 0) {
        if (!requiredRoles.includes(member.role)) {
          return res.status(403).json({
            message: `Access denied: You need one of these roles: ${requiredRoles.join(
              ', '
            )}`,
          })
        }
      }

      next()
    } catch (error) {
      console.error('Error in checkBoardAccess middleware:', error)
      res.status(500).json({ message: 'Server error' })
    }
  }
}
