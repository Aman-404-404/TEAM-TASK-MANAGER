const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    minlength: [2, 'Project name must be at least 2 characters'],
    maxlength: [100, 'Project name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  color: {
    type: String,
    default: '#6366f1'
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isArchived: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

projectSchema.methods.isMember = function(userId) {
  return this.members.some(m => m.user.toString() === userId.toString()) ||
    this.admin.toString() === userId.toString();
};

projectSchema.methods.isAdmin = function(userId) {
  return this.admin.toString() === userId.toString() ||
    this.members.some(m => m.user.toString() === userId.toString() && m.role === 'admin');
};

module.exports = mongoose.model('Project', projectSchema);
