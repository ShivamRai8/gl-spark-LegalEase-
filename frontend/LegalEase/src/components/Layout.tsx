import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  FileSearch,
  LayoutDashboard,
  LogOut,
  Scale,
  ScrollText,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../utils/helpers';
import { ProfileModal } from './ProfileModal';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
}

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  if (!user) return null;

  const navItems: NavItem[] = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/cases', label: 'Cases', icon: FileSearch },
  ];

  if (user.role === 'ADMIN') navItems.push({ to: '/users', label: 'Users', icon: Users });
  if (user.role === 'ADMIN' || user.role === 'JUDGE')
    navItems.push({ to: '/audit', label: 'Audit Trail', icon: ScrollText });

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Scale size={22} />
          </div>
          <div className="brand-text">
            <span className="brand-name">LegalEase</span>
            <span className="brand-sub">Case Management</span>
          </div>
        </div>

        <nav className="nav">
          <span className="nav-caption">Workspace</span>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-card">
            <ShieldCheck size={16} />
            <span>RBAC secured console</span>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-title">
            <ClipboardList size={18} />
            <span>Legal Operations Console</span>
          </div>
          <div className="topbar-right">
            <button className="user-chip user-chip-btn" onClick={() => setProfileOpen(true)} title="Manage your account">
              <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
              <div className="user-meta">
                <span className="user-name">{user.name}</span>
                <span className="user-role">
                  <UserRound size={11} /> {ROLE_LABELS[user.role]}
                </span>
              </div>
            </button>
            <button className="icon-btn icon-btn-danger" onClick={handleLogout} title="Sign out">
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}
