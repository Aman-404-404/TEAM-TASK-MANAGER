import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { format, isPast, parseISO } from 'date-fns';

const getInitials = name => name ? name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) : '?';
const avatarColors = ['#7c6dfa','#22c97c','#f5a623','#4fa3f7','#f5455c','#c97cfa'];
const avatarColor = name => { let h=0; for(let c of (name||'')) h=c.charCodeAt(0)+((h<<5)-h); return avatarColors[Math.abs(h)%avatarColors.length]; };

const STATUSES = [
  { key: 'todo', label: 'To Do', color: 'var(--todo-color)' },
  { key: 'in_progress', label: 'In Progress', color: 'var(--progress-color)' },
  { key: 'done', label: 'Done', color: 'var(--done-color)' }
];

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

// --- Task Card ---
const TaskCard = ({ task, isAdmin, members, onUpdate, onDelete }) => {
  const [updating, setUpdating] = useState(false);

  const updateStatus = async status => {
    setUpdating(true);
    try { await onUpdate(task._id, { status }); } finally { setUpdating(false); }
  };

  const isOverdue = task.dueDate && task.status !== 'done' && isPast(parseISO(task.dueDate));

  return (
    <div style={{
      background: 'var(--bg-elevated)', border: `1px solid ${isOverdue ? 'rgba(245,69,92,0.3)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-md)', padding: '14px',
      transition: 'var(--transition)', marginBottom: '8px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', flex: 1 }}>
          <div className={`priority-dot dot-${task.priority}`} style={{ marginTop: '5px', flexShrink: 0 }} />
          <span style={{ fontSize: '13px', fontWeight: '500', lineHeight: '1.4' }}>{task.title}</span>
        </div>
        {isAdmin && (
          <button onClick={() => onDelete(task._id)}
            className="btn btn-ghost btn-icon"
            style={{ padding: '4px 6px', fontSize: '14px', color: 'var(--danger)', opacity: 0.7, flexShrink: 0 }}>
            ×
          </button>
        )}
      </div>

      {task.description && (
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: '1.5', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {task.description}
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        {task.assignee ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div className="avatar" style={{ width: '22px', height: '22px', background: avatarColor(task.assignee.name), color: '#fff', fontSize: '9px' }}>
              {getInitials(task.assignee.name)}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{task.assignee.name.split(' ')[0]}</span>
          </div>
        ) : <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Unassigned</span>}

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {task.dueDate && (
            <span style={{ fontSize: '11px', color: isOverdue ? 'var(--danger)' : 'var(--text-muted)' }}>
              {isOverdue ? '⚠ ' : ''}{format(parseISO(task.dueDate), 'MMM d')}
            </span>
          )}
          <select
            value={task.status}
            onChange={e => updateStatus(e.target.value)}
            disabled={updating}
            className="form-select"
            style={{ fontSize: '11px', padding: '3px 6px', height: 'auto', width: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>
      </div>
    </div>
  );
};

// --- Create Task Modal ---
const CreateTaskModal = ({ projectId, members, onClose, onCreated }) => {
  const [form, setForm] = useState({ title: '', description: '', assignee: '', priority: 'medium', dueDate: '', status: 'todo' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true);
    try {
      const payload = { ...form, projectId };
      if (!payload.assignee) delete payload.assignee;
      if (!payload.dueDate) delete payload.dueDate;
      const res = await api.post('/tasks', payload);
      onCreated(res.data.task);
    } catch (err) { setError(err.response?.data?.message || 'Failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>New Task</h2>
          <button onClick={onClose} className="btn btn-ghost btn-icon" style={{ fontSize: '20px' }}>×</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input type="text" className="form-input" placeholder="Task title" required
                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" placeholder="Describe the task..."
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Assign to</label>
                <select className="form-select" value={form.assignee} onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))}>
                  <option value="">Unassigned</option>
                  {members.map(m => (
                    <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input type="date" className="form-input"
                  value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- Add Member Modal ---
const AddMemberModal = ({ projectId, onClose, onAdded }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true);
    try {
      const res = await api.post(`/projects/${projectId}/members`, { email, role });
      onAdded(res.data.project);
    } catch (err) { setError(err.response?.data?.message || 'Failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>Add Member</h2>
          <button onClick={onClose} className="btn btn-ghost btn-icon" style={{ fontSize: '20px' }}>×</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" placeholder="member@example.com" required
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- Main ---
const ProjectDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [activeTab, setActiveTab] = useState('board');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [projRes, taskRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks?projectId=${id}`)
      ]);
      setProject(projRes.data.project);
      setTasks(taskRes.data.tasks);
    } catch (e) {
      console.error(e);
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { loadData(); }, [loadData]);

  const isAdmin = project?.isAdmin ? project.isAdmin(user?._id) :
    (project?.admin?._id === user?._id || project?.admin === user?._id ||
      project?.members?.some(m => (m.user?._id || m.user) === user?._id && m.role === 'admin'));

  const handleUpdateTask = async (taskId, updates) => {
    try {
      const res = await api.put(`/tasks/${taskId}`, updates);
      setTasks(ts => ts.map(t => t._id === taskId ? res.data.task : t));
    } catch (e) { console.error(e); }
  };

  const handleDeleteTask = async taskId => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(ts => ts.filter(t => t._id !== taskId));
    } catch (e) { console.error(e); }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Delete this project and ALL its tasks? This cannot be undone.')) return;
    try {
      await api.delete(`/projects/${id}`);
      navigate('/projects');
    } catch (e) { console.error(e); }
  };

  const handleRemoveMember = async memberId => {
    if (!window.confirm('Remove this member?')) return;
    try {
      const res = await api.delete(`/projects/${id}/members/${memberId}`);
      setProject(res.data.project);
    } catch (e) { console.error(e); }
  };

  const filteredTasks = tasks.filter(t => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    return true;
  });

  const tasksByStatus = status => filteredTasks.filter(t => t.status === status);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}><div className="spinner" /></div>;
  if (!project) return null;

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: `${project.color || '#7c6dfa'}22`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', border: `1px solid ${project.color || '#7c6dfa'}44`
            }}>◫</div>
            <div>
              <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>{project.name}</h1>
              {project.description && (
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{project.description}</p>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            {isAdmin && (
              <>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowAddMember(true)}>+ Member</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowCreateTask(true)}>+ Task</button>
                <button className="btn btn-danger btn-sm" onClick={handleDeleteProject}>Delete</button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginTop: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
          {['board', 'list', 'members'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 20px', border: 'none', background: 'transparent',
                cursor: 'pointer', fontSize: '14px', fontFamily: 'var(--font-body)',
                color: activeTab === tab ? 'var(--accent)' : 'var(--text-secondary)',
                borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                marginBottom: '-1px', fontWeight: activeTab === tab ? '600' : '400',
                transition: 'var(--transition)'
              }}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      {activeTab !== 'members' && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Filter:</span>
          <select className="form-select" style={{ width: 'auto', padding: '6px 12px', fontSize: '13px' }}
            value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <select className="form-select" style={{ width: 'auto', padding: '6px 12px', fontSize: '13px' }}
            value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
            <option value="">All Priorities</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
            {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Board View */}
      {activeTab === 'board' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {STATUSES.map(({ key, label, color }) => {
            const statusTasks = tasksByStatus(key);
            return (
              <div key={key} style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', padding: '16px', minHeight: '200px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: '999px' }}>{statusTasks.length}</span>
                </div>
                {statusTasks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '13px' }}>No tasks</div>
                ) : (
                  statusTasks.map(task => (
                    <TaskCard key={task._id} task={task} isAdmin={isAdmin}
                      members={project.members} onUpdate={handleUpdateTask} onDelete={handleDeleteTask} />
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {activeTab === 'list' && (
        <div className="card">
          {filteredTasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">☑</div>
              <h3>No tasks yet</h3>
              {isAdmin && <button className="btn btn-primary" onClick={() => setShowCreateTask(true)}>+ Create Task</button>}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Task', 'Assignee', 'Priority', 'Status', 'Due Date'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                  {isAdmin && <th style={{ width: '40px' }} />}
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map(task => {
                  const overdue = task.dueDate && task.status !== 'done' && isPast(parseISO(task.dueDate));
                  return (
                    <tr key={task._id} style={{ borderBottom: '1px solid var(--border)', transition: 'var(--transition)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className={`priority-dot dot-${task.priority}`} />
                          <span style={{ fontSize: '14px' }}>{task.title}</span>
                        </div>
                        {task.description && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.description}</p>}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {task.assignee ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div className="avatar" style={{ width: '24px', height: '24px', background: avatarColor(task.assignee.name), color: '#fff', fontSize: '9px' }}>{getInitials(task.assignee.name)}</div>
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{task.assignee.name}</span>
                          </div>
                        ) : <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <select value={task.status} onChange={e => handleUpdateTask(task._id, { status: e.target.value })}
                          className="form-select" style={{ fontSize: '12px', padding: '4px 8px', height: 'auto', width: 'auto' }}>
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="done">Done</option>
                        </select>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: overdue ? 'var(--danger)' : 'var(--text-secondary)' }}>
                        {task.dueDate ? format(parseISO(task.dueDate), 'MMM d, yyyy') : '—'}
                      </td>
                      {isAdmin && (
                        <td style={{ padding: '12px 8px' }}>
                          <button onClick={() => handleDeleteTask(task._id)}
                            className="btn btn-ghost btn-icon" style={{ padding: '4px 8px', color: 'var(--danger)', fontSize: '16px' }}>×</button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px' }}>Team Members ({project.members.length})</h3>
            {isAdmin && <button className="btn btn-primary btn-sm" onClick={() => setShowAddMember(true)}>+ Add Member</button>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {project.members.map(m => {
              const u = m.user;
              const isProjectAdmin = project.admin._id === u._id || project.admin === u._id;
              return (
                <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)' }}>
                  <div className="avatar" style={{ width: '40px', height: '40px', background: avatarColor(u.name), color: '#fff', fontSize: '14px' }}>{getInitials(u.name)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>{u.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{u.email}</div>
                  </div>
                  <span className={`badge ${m.role === 'admin' || isProjectAdmin ? 'badge-admin' : 'badge-member'}`}>
                    {m.role === 'admin' || isProjectAdmin ? 'Admin' : 'Member'}
                  </span>
                  {isAdmin && !isProjectAdmin && (
                    <button onClick={() => handleRemoveMember(u._id)}
                      className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}>Remove</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showCreateTask && (
        <CreateTaskModal projectId={id} members={project.members}
          onClose={() => setShowCreateTask(false)}
          onCreated={task => { setTasks(ts => [task, ...ts]); setShowCreateTask(false); }} />
      )}
      {showAddMember && (
        <AddMemberModal projectId={id}
          onClose={() => setShowAddMember(false)}
          onAdded={updatedProject => { setProject(updatedProject); setShowAddMember(false); }} />
      )}
    </div>
  );
};

export default ProjectDetailPage;
