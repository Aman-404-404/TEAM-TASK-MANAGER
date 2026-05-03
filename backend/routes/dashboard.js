const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const auth = require('../middleware/auth');

// GET /api/dashboard - Get dashboard stats
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ admin: req.userId }, { 'members.user': req.userId }],
      isArchived: false
    }).select('_id name');

    const projectIds = projects.map(p => p._id);
    const now = new Date();

    // All tasks across user's projects
    const allTasks = await Task.find({ project: { $in: projectIds } })
      .populate('assignee', 'name email')
      .populate('project', 'name color');

    // Tasks by status
    const tasksByStatus = {
      todo: allTasks.filter(t => t.status === 'todo').length,
      in_progress: allTasks.filter(t => t.status === 'in_progress').length,
      done: allTasks.filter(t => t.status === 'done').length
    };

    // Overdue tasks (not done, past due date)
    const overdueTasks = allTasks.filter(t =>
      t.dueDate && t.status !== 'done' && new Date(t.dueDate) < now
    );

    // Tasks per user
    const tasksPerUser = {};
    allTasks.forEach(task => {
      if (task.assignee) {
        const key = task.assignee._id.toString();
        if (!tasksPerUser[key]) {
          tasksPerUser[key] = { user: task.assignee, total: 0, done: 0, in_progress: 0, todo: 0 };
        }
        tasksPerUser[key].total++;
        tasksPerUser[key][task.status]++;
      }
    });

    // Tasks by priority
    const tasksByPriority = {
      low: allTasks.filter(t => t.priority === 'low').length,
      medium: allTasks.filter(t => t.priority === 'medium').length,
      high: allTasks.filter(t => t.priority === 'high').length,
      urgent: allTasks.filter(t => t.priority === 'urgent').length
    };

    // Recent tasks (last 10 created)
    const recentTasks = allTasks
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    // My tasks (assigned to me)
    const myTasks = allTasks.filter(t =>
      t.assignee && t.assignee._id.toString() === req.userId.toString()
    );

    res.json({
      stats: {
        totalProjects: projects.length,
        totalTasks: allTasks.length,
        tasksByStatus,
        tasksByPriority,
        overdueTasks: overdueTasks.length,
        completionRate: allTasks.length > 0
          ? Math.round((tasksByStatus.done / allTasks.length) * 100)
          : 0
      },
      tasksPerUser: Object.values(tasksPerUser),
      overdueTasks: overdueTasks.slice(0, 5),
      recentTasks,
      myTasks: myTasks.slice(0, 5),
      projects
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
