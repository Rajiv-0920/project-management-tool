import express from 'express'
import protect from '../middleware/auth.js'
import {
  createBoard,
  deleteBoard,
  getAllBoards,
  getBoard,
  inviteBoardMember,
  listBoardMembers,
  removeBoardMember,
  updateBoard,
  updateBoardMemberRole,
} from '../controllers/boardController.js'

const router = express.Router()

// ----------------------------------
// --------- Boards Routes ----------
// ----------------------------------

router.get('/', protect, getAllBoards)
router.post('/', protect, createBoard)

router.get('/:id', protect, getBoard)
router.put('/:id', protect, updateBoard)
router.delete('/:id', protect, deleteBoard)

// ----------------------------------
// ------- Member Management --------
// ----------------------------------
router.get('/:id/members', protect, listBoardMembers)
router.post('/:id/members', protect, inviteBoardMember)
router.put('/:id/members/:userId', protect, updateBoardMemberRole)
router.delete('/:id/members/:userId', protect, removeBoardMember)

// GET /api/boards/:id/members – List board members
// POST /api/boards/:id/members – Invite a member to the board
// PUT /api/boards/:id/members/:userId – Update member role
// DELETE /api/boards/:id/members/:userId – Remove a member

export default router
