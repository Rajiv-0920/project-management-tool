import Board from '../models/Board.js'
import Organization from '../models/Organization.js'
import User from '../models/User.js'

export const getAllBoards = async (req, res) => {
  try {
    const { organizationId } = req.query
    const query = {
      $or: [{ owner: req.user._id }, { 'members.userId': req.user._id }],
    }
    if (organizationId) {
      query.organizationId = organizationId
    }
    const boards = await Board.find(query).populate('owner', 'name email')
    res.status(200).json(boards)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

export const createBoard = async (req, res) => {
  try {
    const { title, description, organizationId, background, columns } = req.body

    let orgId = organizationId

    // If organizationId is not provided, create a new organization
    if (!orgId) {
      const newOrganization = new Organization({
        name: title, // Use the board title as the organization name
        owner: req.user._id,
        description: `Organization for ${title}`,
      })
      await newOrganization.save()
      orgId = newOrganization._id
    }

    // Create the board with the organizationId
    const board = new Board({
      title,
      description,
      owner: req.user._id,
      organizationId: orgId,
      background,
      columns,
    })

    board.members.push({ userId: req.user._id, role: 'admin' })

    await board.save()
    res.status(201).json(board)
  } catch (error) {
    console.error('Error creating board:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const getBoard = async (req, res) => {
  const { id } = req.params
  const userId = req.user._id
  try {
    const board = await Board.findById(id)
    if (!board) {
      return res.status(404).json({ message: 'Board not found' })
    }
    const isMember = board.members.some((member) =>
      member.userId.equals(userId)
    )
    if (!board.owner.equals(userId) && !isMember) {
      return res.status(403).json({ message: 'Access denied' })
    }
    res.status(200).json(board)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

export const updateBoard = async (req, res) => {
  try {
    const { title, description, background } = req.body
    const board = await Board.findById(req.params.id)

    if (!board) {
      return res.status(404).json({ message: 'Board not found' })
    }

    // Check if the user is the owner
    if (!board.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' })
    }

    // Update basic fields
    board.title = title || board.title
    board.description = description || board.description
    board.background = background || board.background

    await board.save()
    res.status(200).json(board)
  } catch (error) {
    console.error('Error updating board:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const deleteBoard = async (req, res) => {
  const { id } = req.params
  try {
    const board = await Board.findById(id)
    if (!board) {
      return res.status(404).json({ message: 'Board not found' })
    }

    // Check if the user is the owner
    if (!board.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' })
    }

    // Soft delete: mark the board as archived
    board.isArchived = true
    await board.save()

    res.status(200).json({ message: 'Board archived successfully' })
  } catch (error) {
    console.error('Error deleting board:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const listBoardMembers = async (req, res) => {
  const { id } = req.params
  try {
    const board = await Board.findById(id).populate(
      'members.userId',
      'name email avatar'
    )
    if (!board) {
      return res.status(404).json({ message: 'Board not found' })
    }

    // Check if the user is a member or owner
    const isMember = board.members.some((member) =>
      member.userId._id.equals(req.user._id)
    )
    if (!board.owner.equals(req.user._id) && !isMember) {
      return res.status(403).json({ message: 'Access denied' })
    }

    res.status(200).json(board.members)
  } catch (error) {
    console.error('Error listing board members:', error)
    res.status(500).json({ message: 'Server error' })
  }
}
export const inviteBoardMember = async (req, res) => {
  const { id } = req.params
  const { email, role } = req.body
  try {
    const board = await Board.findById(id)
    if (!board) {
      return res.status(404).json({ message: 'Board not found' })
    }

    // Check if the user is the owner or an admin
    const isAdmin = board.members.some(
      (member) => member.userId.equals(req.user._id) && member.role === 'admin'
    )
    if (!board.owner.equals(req.user._id) && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Check if the user is already a member
    const isAlreadyMember = board.members.some((member) =>
      member.userId.equals(user._id)
    )
    if (isAlreadyMember) {
      return res.status(400).json({ message: 'User is already a member' })
    }

    // Add the user as a member
    board.members.push({ userId: user._id, role: role || 'member' })
    await board.save()

    res.status(200).json({ message: 'Member invited successfully' })
  } catch (error) {
    console.error('Error inviting board member:', error)
    res.status(500).json({ message: 'Server error' })
  }
}
export const updateBoardMemberRole = async (req, res) => {
  const { id, userId } = req.params
  const { role } = req.body
  try {
    // Validate role
    const validRoles = ['admin', 'member']
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' })
    }
    const board = await Board.findById(id)
    if (!board) {
      return res.status(404).json({ message: 'Board not found' })
    }

    // Check if the user is the owner or an admin
    const isAdmin = board.members.some(
      (member) => member.userId.equals(req.user._id) && member.role === 'admin'
    )
    if (!board.owner.equals(req.user._id) && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' })
    }

    // Find the member to update
    const member = board.members.find((m) => m.userId.equals(userId))
    if (!member) {
      return res.status(404).json({ message: 'Member not found' })
    }

    // Prevent removing the last admin
    if (member.role === 'admin' && role !== 'admin') {
      const adminCount = board.members.filter((m) => m.role === 'admin').length
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot remove the last admin' })
      }
    }

    // Update the member's role
    member.role = role || member.role
    await board.save()

    res.status(200).json({ message: 'Member role updated successfully' })
  } catch (error) {
    console.error('Error updating member role:', error)
    res.status(500).json({ message: 'Server error' })
  }
}
export const removeBoardMember = async (req, res) => {
  const { id, userId } = req.params
  try {
    const board = await Board.findById(id)
    if (!board) {
      return res.status(404).json({ message: 'Board not found' })
    }

    // Check if the user is the owner or an admin
    const isAdmin = board.members.some(
      (member) => member.userId.equals(req.user._id) && member.role === 'admin'
    )
    if (!board.owner.equals(req.user._id) && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' })
    }

    // Find the member to remove
    const memberToRemove = board.members.find((m) => m.userId.equals(userId))
    if (!memberToRemove) {
      return res.status(404).json({ message: 'Member not found' })
    }

    // Prevent removing the last admin
    if (memberToRemove.role === 'admin') {
      const adminCount = board.members.filter((m) => m.role === 'admin').length
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot remove the last admin' })
      }
    }

    // Remove the member
    board.members = board.members.filter(
      (member) => !member.userId.equals(userId)
    )
    await board.save()

    res.status(200).json({ message: 'Member removed successfully' })
  } catch (error) {
    console.error('Error removing board member:', error)
    res.status(500).json({ message: 'Server error' })
  }
}
