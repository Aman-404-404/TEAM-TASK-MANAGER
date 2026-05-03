import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { format } from 'date-fns';

const PROJECT_COLORS = ['#7c6dfa','#22c97c','#f5a623','#4fa3f7','#f5455c','#c97cfa','#fa6d7c','#6dcbfa'];

const CreateProjectModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({ name: '', description: '', color: '#7c6dfa' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/projects', form);
      onCreated(res.data.project);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>New Project</h2>
          <button onClick={onClose} className="btn btn-ghost btn-icon" style={{ fontSize: '20px', lineHeight: 1 }}>×</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Project Name *</label>
              <input type="text" className="form-input" placeholder="e.g. Website Redesign" required
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" placeholder="What's this project about?"
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Color</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {PROJECT_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                    style={{
                      width: '32px', height: '32px', borderRadius: '8px', background: c,
                      border: form.color === c ? '3px solid #fff' : '2px solid transparent',
                      cursor: 'pointer', outline: 'none',
                      boxShadow: form.color === c ? `0 0 0 2px ${c}` : 'none'
                    }} />
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const ProjectCard = ({ project, currentUserId }) => {
  const isAdmin = project.admin._id === currentUserId || project.admin === currentUserId;
  const memberCount = project.members.length;

  return (
    <Link to={`/projects/${project._id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '20px', cursor: 'pointer',
        transition: 'var(--transition)', height: '100%',
        borderTop: `3px solid ${project.color || '#7c6dfa'}`,
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = project.color; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.3)`; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderTopColor = project.color; }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: `${project.color}22`, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '18px'
          }}>◫</div>
          <span className={`badge ${isAdmin ? 'badge-admin' : 'badge-member'}`}>
            {isAdmin ? 'Admin' : 'Member'}
          </span>
        </div>

        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-primary)' }}>
          {project.name}
        </h3>
        {project.description && (
          <p style={{
            fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px',
            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}>{project.description}</p>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {format(new Date(project.createdAt), 'MMM d, yyyy')}
          </span>
        </div>
      </div>
    </Link>
  );
};

const ProjectsPage = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const loadProjects = useCallback(async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data.projects);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const handleCreated = project => {
    setProjects(p => [project, ...p]);
    setShowCreate(false);
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '6px' }}>Projects</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            {projects.length} project{projects.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + New Project
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
          <div className="spinner" />
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">◫</div>
          <h3>No projects yet</h3>
          <p>Create your first project to start collaborating</p>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + Create Project
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {projects.map(p => (
            <ProjectCard key={p._id} project={p} currentUserId={user?._id} />
          ))}
        </div>
      )}

      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
    </div>
  );
};

export default ProjectsPage;
