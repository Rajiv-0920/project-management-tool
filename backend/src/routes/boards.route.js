import express from 'express'
import protect from '../middleware/auth.js'
import {
  addColumn,
  archiveBoard,
  createBoard,
  deleteBoard,
  deleteColumn,
  getAllBoards,
  getBoard,
  inviteBoardMember,
  listBoardMembers,
  removeBoardMember,
  updateBoard,
  updateBoardMemberRole,
  updateColumn,
} from '../controllers/boardController.js'

const router = express.Router()

// ----------------------------------
// --------- Boards Routes ----------
// ----------------------------------
/**
 * @route   GET /boards
 * @desc    Retrieve all boards (requires authentication)
 * @access  Private
 */
router.get('/', protect, getAllBoards)

/**
 * @route   POST /boards
 * @desc    Create a new board (requires authentication)
 * @access  Private
 */
router.post('/', protect, createBoard)

/**
 * @route   GET /boards/:id
 * @desc    Retrieve a specific board by ID (requires authentication)
 * @access  Private
 */
router.get('/:id', protect, getBoard)

/**
 * @route   PUT /boards/:id
 * @desc    Update a specific board by ID (requires authentication)
 * @access  Private
 */
router.put('/:id', protect, updateBoard)

/**
 * @route   DELETE /boards/:id
 * @desc    Delete a specific board by ID (requires authentication)
 * @access  Private
 */
router.delete('/:id', protect, deleteBoard)

/**
 * @route   PATCH /boards/:id/archive
 * @desc    Archive a specific board by ID (requires authentication)
 * @access  Private
 */
router.patch('/:id/archive', protect, archiveBoard)

// ----------------------------------
// ------- Member Management --------
// ----------------------------------
/**
 * @route   GET /boards/:id/members
 * @desc    List all members of a specific board (requires authentication)
 * @access  Private
 */
router.get('/:id/members', protect, listBoardMembers)

/**
 * @route   POST /boards/:id/members
 * @desc    Invite a new member to a specific board (requires authentication)
 * @access  Private
 */
router.post('/:id/members', protect, inviteBoardMember)

/**
 * @route   PUT /boards/:id/members/:userId
 * @desc    Update a member's role in a specific board (requires authentication)
 * @access  Private
 */
router.put('/:id/members/:userId', protect, updateBoardMemberRole)

/**
 * @route   DELETE /boards/:id/members/:userId
 * @desc    Remove a member from a specific board (requires authentication)
 * @access  Private
 */
router.delete('/:id/members/:userId', protect, removeBoardMember)

// ----------------------------------
// ------- Column Management --------
// ----------------------------------

/**
 * @route   POST /boards/:id/columns
 * @desc    Add a new column to a specific board (requires authentication)
 * @access  Private
 */
router.post('/:id/columns', protect, addColumn)

/**
 * @route   PUT /boards/:id/columns/:columnId
 * @desc    Update a specific column in a board (requires authentication)
 * @access  Private
 */
router.put('/:id/columns/:columnId', protect, updateColumn)

/**
 * @route   DELETE /boards/:id/columns/:columnId
 * @desc    Delete a specific column from a board (requires authentication)
 * @access  Private
 */
router.delete('/:id/columns/:columnId', protect, deleteColumn)

export default router
