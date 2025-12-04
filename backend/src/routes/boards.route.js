import express from 'express'
import protect from '../middleware/auth.js'
import {
  addColumn,
  archiveBoard,
  createBoard,
  createTask,
  deleteBoard,
  deleteColumn,
  getAllBoards,
  getAllLabels,
  getAllTasks,
  getBoard,
  inviteBoardMember,
  listBoardMembers,
  removeBoardMember,
  updateBoard,
  updateBoardMemberRole,
  updateColumn,
} from '../controllers/boardController.js'
import { checkBoardAccess } from '../middleware/checkBoardAccess.js'

const router = express.Router()

// ----------------------------------
// --------- Boards Routes ----------
// ----------------------------------

router.get('/', protect, getAllBoards)

router.post(
  '/',
  protect,
  createBoard // Creating a board usually requires no board-level access
)

router.get(
  '/:id',
  protect,
  checkBoardAccess(['admin', 'member', 'viewer']),
  getBoard
)

router.put('/:id', protect, checkBoardAccess(['admin']), updateBoard)

router.delete('/:id', protect, checkBoardAccess(['admin']), deleteBoard)

router.patch('/:id/archive', protect, checkBoardAccess(['admin']), archiveBoard)

// ----------------------------------
// ------- Member Management --------
// ----------------------------------

router.get(
  '/:id/members',
  protect,
  checkBoardAccess(['admin', 'member', 'viewer']),
  listBoardMembers
)

router.post(
  '/:id/members',
  protect,
  checkBoardAccess(['admin']),
  inviteBoardMember
)

router.put(
  '/:id/members/:userId',
  protect,
  checkBoardAccess(['admin']),
  updateBoardMemberRole
)

router.delete(
  '/:id/members/:userId',
  protect,
  checkBoardAccess(['admin']),
  removeBoardMember
)

// ----------------------------------
// ------- Column Management --------
// ----------------------------------

router.post(
  '/:id/columns',
  protect,
  checkBoardAccess(['admin', 'member']),
  addColumn
)

router.put(
  '/:id/columns/:columnId',
  protect,
  checkBoardAccess(['admin', 'member']),
  updateColumn
)

router.delete(
  '/:id/columns/:columnId',
  protect,
  checkBoardAccess(['admin', 'member']),
  deleteColumn
)

// ----------------------------------
// -------- Task Management ---------
// ----------------------------------

router.post(
  '/:id/tasks',
  protect,
  checkBoardAccess(['admin', 'member']),
  createTask
)

router.get(
  '/:id/tasks',
  protect,
  checkBoardAccess(['admin', 'member', 'viewer']),
  getAllTasks
)

// ----------------------------------
// --------- Label Routes ----------
// ----------------------------------

router.get(
  '/:boardId/labels',
  protect,
  checkBoardAccess(['admin', 'member', 'viewer']),
  getAllLabels
)

export default router
