const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const auth = require('../middleware/auth');

// GET /api/tasks?projectId=xxx - Get tasks for a project
router.get('/', auth, async (req, res) => {
  try {
    const { projectId, status, priority, assignee } = req.query;

    if (!projectId) {
      // Get all tasks assigned to the user across all projects
      const tasks = await Task.find({ assignee: req.userId })
        .populate('project', 'name color')
        .populate('assignee', 'name email')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });
      return res.json({ tasks });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found.' });
    if (!project.isMember(req.userId)) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const filter = { project: projectId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee) filter.assignee = assignee;

    const tasks = await Task.find(filter)
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/tasks - Create a task
router.post('/', auth, [
  body('title').trim().isLength({ min: 2, max: 200 }).withMessage('Title must be 2-200 characters'),
  body('projectId').notEmpty().withMessage('Project ID is required'),
  body('status').optional().isIn(['todo', 'in_progress', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('dueDate').optional().isISO8601().withMessage('Invalid date format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { title, description, projectId, assignee, status, priority, dueDate, tags } = req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found.' });
    if (!project.isAdmin(req.userId)) {
      return res.status(403).json({ message: 'Only project admins can create tasks.' });
    }

    if (assignee && !project.isMember(assignee)) {
      return res.status(400).json({ message: 'Assignee must be a project member.' });
    }

    const task = new Task({
      title,
      description,
      project: projectId,
      assignee: assignee || null,
      createdBy: req.userId,
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate: dueDate || null,
      tags: tags || []
    });

    await task.save();
    await task.populate('assignee', 'name email');
    await task.populate('createdBy', 'name email');

    res.status(201).json({ message: 'Task created!', task });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/tasks/:id - Get a specific task
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name color');

    if (!task) return res.status(404).json({ message: 'Task not found.' });

    const project = await Project.findById(task.project._id || task.project);
    if (!project.isMember(req.userId)) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    res.json({ task });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/tasks/:id - Update a task
router.put('/:id', auth, [
  body('title').optional().trim().isLength({ min: 2, max: 200 }),
  body('status').optional().isIn(['todo', 'in_progress', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('dueDate').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    const project = await Project.findById(task.project);
    if (!project.isMember(req.userId)) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const isAdmin = project.isAdmin(req.userId);
    const isAssignee = task.assignee && task.assignee.toString() === req.userId.toString();

    if (!isAdmin && !isAssignee) {
      return res.status(403).json({ message: 'You can only update tasks assigned to you.' });
    }

    // Members can only update status; admins can update everything
    if (!isAdmin && isAssignee) {
      const { status } = req.body;
      if (status) task.status = status;
    } else {
      const { title, description, assignee, status, priority, dueDate, tags } = req.body;
      if (title) task.title = title;
      if (description !== undefined) task.description = description;
      if (assignee !== undefined) task.assignee = assignee || null;
      if (status) task.status = status;
      if (priority) task.priority = priority;
      if (dueDate !== undefined) task.dueDate = dueDate || null;
      if (tags) task.tags = tags;
    }

    await task.save();
    await task.populate('assignee', 'name email');
    await task.populate('createdBy', 'name email');

    res.json({ message: 'Task updated!', task });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE /api/tasks/:id - Delete a task (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    const project = await Project.findById(task.project);
    if (!project.isAdmin(req.userId)) {
      return res.status(403).json({ message: 'Only admins can delete tasks.' });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
