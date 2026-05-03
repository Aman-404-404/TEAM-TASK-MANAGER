import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { format, isPast, parseISO } from 'date-fns';

const getInitials = name => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
const avatarColors = ['#7c6dfa','#22c97c','#f5a623','#4fa3f7','#f5455c','#c97cfa'];
const avatarColor = name => { let h = 0; for (let c of (name||'')) h = c.charCodeAt(0)+((h<<5)-h); return avatarColors[Math.abs(h)%avatarColors.length]; };

const StatCard = ({ label, value, icon, accent }) => (
  <div style={{
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '20px 24px',
    display: 'flex', alignItems: 'center', gap: '16px',
    transition: 'var(--transition)',
  }}>
    <div style={{
      width: '48px', height: '48px', borderRadius: '12px',
      background: `${accent}22`, display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: '22px', flexShrink: 0
    }}>{icon}</div>
    <div>
      <div style={{ fontSize: '28px', fontFamily: 'var(--font-display)', fontWeight: '800', color: accent, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{label}</div>
    </div>
  </div>
);

const ProgressBar = ({ done, total }) => {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ flex: 1, height: '6px', background: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--success)', borderRadius: '3px', transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ fontSize: '12px', color: 'var(--text-muted)', minWidth: '32px' }}>{pct}%</span>
    </div>
  );
};

const DashboardPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/dashboard');
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
      <div className="spinner" />
    </div>
  );

  const { stats, overdueTasks, myTasks, tasksPerUser, projects } = data || {};

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '6px' }}>
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
          <span style={{ color: 'var(--accent)' }}>{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          Here's what's happening across your projects today.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid-4" style={{ marginBottom: '32px' }}>
        <StatCard label="Total Projects" value={stats?.totalProjects || 0} icon="◫" accent="var(--accent)" />
        <StatCard label="Total Tasks" value={stats?.totalTasks || 0} icon="☑" accent="var(--info)" />
        <StatCard label="Completion Rate" value={`${stats?.completionRate || 0}%`} icon="◉" accent="var(--success)" />
        <StatCard label="Overdue Tasks" value={stats?.overdueTasks || 0} icon="⏰" accent="var(--danger)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Status breakdown */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '20px', color: 'var(--text-primary)' }}>Tasks by Status</h3>
          {[
            { key: 'todo', label: 'To Do', color: 'var(--todo-color)' },
            { key: 'in_progress', label: 'In Progress', color: 'var(--progress-color)' },
            { key: 'done', label: 'Done', color: 'var(--done-color)' }
          ].map(({ key, label, color }) => {
            const count = stats?.tasksByStatus?.[key] || 0;
            const total = stats?.totalTasks || 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={key} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{label}</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color }}>{count}</span>
                </div>
                <div style={{ height: '6px', background: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '3px', transition: 'width 0.5s ease' }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Team workload */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>Team Workload</h3>
          {tasksPerUser && tasksPerUser.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {tasksPerUser.slice(0, 5).map(({ user: u, total, done }) => (
                <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="avatar" style={{ background: avatarColor(u.name), color: '#fff', width: '32px', height: '32px', fontSize: '11px' }}>
                    {getInitials(u.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', flexShrink: 0, marginLeft: '8px' }}>{done}/{total}</span>
                    </div>
                    <ProgressBar done={done} total={total} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>No assigned tasks yet</p>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* My tasks */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px' }}>My Tasks</h3>
            <Link to="/projects" style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none' }}>View all →</Link>
          </div>
          {myTasks && myTasks.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {myTasks.map(task => (
                <div key={task._id} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px', borderRadius: '8px', background: 'var(--bg-elevated)'
                }}>
                  <div className={`priority-dot dot-${task.priority}`} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                    {task.dueDate && (
                      <div style={{ fontSize: '11px', color: isPast(parseISO(task.dueDate)) && task.status !== 'done' ? 'var(--danger)' : 'var(--text-muted)', marginTop: '2px' }}>
                        Due {format(parseISO(task.dueDate), 'MMM d')}
                      </div>
                    )}
                  </div>
                  <span className={`badge badge-${task.status === 'in_progress' ? 'progress' : task.status}`} style={{ fontSize: '10px' }}>
                    {task.status === 'in_progress' ? 'In Progress' : task.status === 'todo' ? 'To Do' : 'Done'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>No tasks assigned to you</p>
          )}
        </div>

        {/* Overdue */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px' }}>Overdue Tasks</h3>
            <span style={{ fontSize: '12px', background: 'rgba(245,69,92,0.15)', color: 'var(--danger)', padding: '2px 8px', borderRadius: '999px', fontWeight: '600' }}>
              {stats?.overdueTasks || 0}
            </span>
          </div>
          {overdueTasks && overdueTasks.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {overdueTasks.map(task => (
                <div key={task._id} style={{
                  padding: '10px', borderRadius: '8px',
                  background: 'rgba(245,69,92,0.05)',
                  border: '1px solid rgba(245,69,92,0.15)'
                }}>
                  <div style={{ fontSize: '13px', marginBottom: '4px' }}>{task.title}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--danger)' }}>
                      Due {format(parseISO(task.dueDate), 'MMM d, yyyy')}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{task.project?.name}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>✓</div>
              <p style={{ color: 'var(--success)', fontSize: '14px' }}>No overdue tasks!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
