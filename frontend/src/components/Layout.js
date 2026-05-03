import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const getInitials = name => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??';
const avatarColor = name => {
  const colors = ['#7c6dfa','#22c97c','#f5a623','#4fa3f7','#f5455c','#c97cfa'];
  let hash = 0;
  for (let c of (name || '')) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const NavItem = ({ to, icon, label }) => (
  <NavLink to={to} style={({ isActive }) => ({
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '10px 16px', borderRadius: '10px',
    textDecoration: 'none', fontSize: '14px', fontWeight: '500',
    transition: '0.2s',
    background: isActive ? 'rgba(124,109,250,0.15)' : 'transparent',
    color: isActive ? '#a598ff' : '#8888aa',
    borderLeft: isActive ? '2px solid #7c6dfa' : '2px solid transparent',
  })}>
    <span style={{ fontSize: '18px' }}>{icon}</span>
    {label}
  </NavLink>
);

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? '240px' : '0',
        minWidth: sidebarOpen ? '240px' : '0',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        transition: '0.3s', overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px'
            }}>⚡</div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '800', letterSpacing: '-0.03em' }}>
              Task<span style={{ color: 'var(--accent)' }}>Flow</span>
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
          <p style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 16px', marginBottom: '4px' }}>
            Menu
          </p>
          <NavItem to="/dashboard" icon="▦" label="Dashboard" />
          <NavItem to="/projects" icon="◫" label="Projects" />
        </nav>

        {/* User */}
        <div style={{
          padding: '16px', borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: '12px'
        }}>
          <div className="avatar" style={{ background: avatarColor(user?.name), color: '#fff', fontSize: '13px' }}>
            {getInitials(user?.name)}
          </div>
          <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
          </div>
          <button onClick={handleLogout} className="btn btn-ghost btn-sm btn-icon" title="Logout" style={{ padding: '6px', fontSize: '16px', flexShrink: 0 }}>↪</button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <header style={{
          height: '56px', background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', padding: '0 24px', gap: '16px',
          flexShrink: 0
        }}>
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="btn btn-ghost btn-icon"
            style={{ fontSize: '18px' }}
          >☰</button>
          <div style={{ flex: 1 }} />
        </header>

        {/* Page content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '32px' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
