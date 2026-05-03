const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const User = require('../models/User');
const Task = require('../models/Task');
const auth = require('../middleware/auth');

// GET /api/projects - Get all projects for the current user
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { admin: req.userId },
        { 'members.user': req.userId }
      ],
      isArchived: false
    })
    .populate('admin', 'name email')
    .populate('members.user', 'name email')
    .sort({ createdAt: -1 });

    res.json({ projects });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/projects - Create a new project
router.post('/', auth, [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Project name must be 2-100 characters'),
  body('description').optional().trim().isLength({ max: 500 }),
  body('color').optional().isHexColor().withMessage('Color must be a valid hex color')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, description, color } = req.body;
    const project = new Project({
      name,
      description,
      color: color || '#6366f1',
      admin: req.userId,
      members: [{ user: req.userId, role: 'admin' }]
    });

    await project.save();
    await project.populate('admin', 'name email');
    await project.populate('members.user', 'name email');

    res.status(201).json({ message: 'Project created successfully!', project });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/projects/:id - Get a specific project
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('admin', 'name email')
      .populate('members.user', 'name email');

    if (!project) return res.status(404).json({ message: 'Project not found.' });
    if (!project.isMember(req.userId)) {
      return res.status(403).json({ message: 'Access denied. You are not a member of this project.' });
    }

    res.json({ project });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/projects/:id - Update a project (admin only)
router.put('/:id', auth, [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found.' });
    if (!project.isAdmin(req.userId)) {
      return res.status(403).json({ message: 'Only admins can update this project.' });
    }

    const { name, description, color } = req.body;
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (color) project.color = color;

    await project.save();
    await project.populate('admin', 'name email');
    await project.populate('members.user', 'name email');

    res.json({ message: 'Project updated!', project });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE /api/projects/:id - Delete a project (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found.' });
    if (project.admin.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Only the project creator can delete it.' });
    }

    await Task.deleteMany({ project: req.params.id });
    await Project.findByIdAndDelete(req.params.id);

    res.json({ message: 'Project and all its tasks deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/projects/:id/members - Add a member (admin only)
router.post('/:id/members', auth, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('role').optional().isIn(['member', 'admin']).withMessage('Role must be member or admin')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found.' });
    if (!project.isAdmin(req.userId)) {
      return res.status(403).json({ message: 'Only admins can add members.' });
    }

    const { email, role = 'member' } = req.body;
    const userToAdd = await User.findOne({ email });
    if (!userToAdd) {
      return res.status(404).json({ message: 'No user found with that email.' });
    }

    if (project.isMember(userToAdd._id)) {
      return res.status(409).json({ message: 'User is already a member of this project.' });
    }

    project.members.push({ user: userToAdd._id, role });
    await project.save();
    await project.populate('members.user', 'name email');
    await project.populate('admin', 'name email');

    res.json({ message: `${userToAdd.name} added to the project!`, project });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE /api/projects/:id/members/:userId - Remove a member (admin only)
router.delete('/:id/members/:userId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found.' });
    if (!project.isAdmin(req.userId)) {
      return res.status(403).json({ message: 'Only admins can remove members.' });
    }
    if (req.params.userId === project.admin.toString()) {
      return res.status(400).json({ message: 'Cannot remove the project admin.' });
    }

    project.members = project.members.filter(
      m => m.user.toString() !== req.params.userId
    );
    await project.save();
    await project.populate('members.user', 'name email');
    await project.populate('admin', 'name email');

    res.json({ message: 'Member removed.', project });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
