import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HomeIcon, UserGroupIcon, BuildingOfficeIcon, CurrencyDollarIcon,
  ClipboardDocumentListIcon, ChatBubbleLeftRightIcon, ChartBarIcon,
  UserCircleIcon, MagnifyingGlassIcon, Bars3Icon, XMarkIcon,
  ArrowRightStartOnRectangleIcon, ChevronUpDownIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';
import NotificationBell from './notifications/NotificationBell';

/* ── Navigation config ── */
const NAV = {
  admin: [
    {
      label: null,
      items: [
        { label: 'Dashboard',  to: '/dashboard',  Icon: HomeIcon },
      ],
    },
    {
      label: 'Workspace',
      items: [
        { label: 'Leads',      to: '/leads',      Icon: UserGroupIcon },
        { label: 'Properties', to: '/properties', Icon: BuildingOfficeIcon },
        { label: 'Deals',      to: '/deals',      Icon: CurrencyDollarIcon },
        { label: 'Agents',     to: '/agents',     Icon: UserGroupIcon },
      ],
    },
    {
      label: 'System',
      items: [
        { label: 'Activities', to: '/activities', Icon: ClipboardDocumentListIcon },
        { label: 'Reviews',    to: '/reviews',    Icon: ChatBubbleLeftRightIcon },
      ],
    },
  ],
  agent: [
    {
      label: null,
      items: [
        { label: 'Dashboard',   to: '/dashboard',   Icon: HomeIcon },
        { label: 'My Leads',    to: '/leads',        Icon: UserGroupIcon },
        { label: 'Performance', to: '/performance',  Icon: ChartBarIcon },
        { label: 'Profile',     to: '/profile',      Icon: UserCircleIcon },
      ],
    },
  ],
};

/* ── Initials helper ── */
const initials = (name = '') =>
  name.split(' ').map(w => w[0] || '').join('').substring(0, 2).toUpperCase() || 'U';

/* ── Single nav link ── */
const NavLink = ({ item, isActive, onClick }) => (
  <Link
    to={item.to}
    onClick={onClick}
    className={`nav-item ${isActive ? 'active' : ''}`}
  >
    <item.Icon className="nav-icon" />
    {item.label}
  </Link>
);

/* ══════════════════════════════════════
   SIDEBAR
══════════════════════════════════════ */
const Sidebar = ({ open, onClose, user, isAdmin, location, onLogout }) => {
  const groups = isAdmin ? NAV.admin : NAV.agent;
  const ini = initials(user?.name);

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside
        className={`sidebar lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ width: 'var(--sidebar-w)' }}
      >
        {/* Logo row */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-surface-border flex-shrink-0">
          <Link to="/dashboard" onClick={onClose} className="flex items-center gap-2.5 min-w-0">
            <img src="/logo.png" alt="Builders Brick" className="h-7 w-auto object-contain" />
          </Link>
          <button onClick={onClose} className="btn-icon lg:hidden">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto no-scrollbar py-2">
          {groups.map((g, gi) => (
            <div key={gi}>
              {g.label && <div className="nav-label">{g.label}</div>}
              {g.items.map(item => (
                <NavLink
                  key={item.to}
                  item={item}
                  isActive={location.pathname === item.to}
                  onClick={onClose}
                />
              ))}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="flex-shrink-0 border-t border-surface-border p-3">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/[0.03] transition-colors group">
            <div className="avatar avatar-md flex-shrink-0">{ini}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-ink-primary truncate leading-tight">{user?.name || 'User'}</div>
              <div className="text-xs text-ink-tertiary mt-0.5 truncate">{user?.email || ''}</div>
            </div>
            <button
              onClick={onLogout}
              className="btn-icon opacity-0 group-hover:opacity-100 transition-opacity"
              title="Sign out"
            >
              <ArrowRightStartOnRectangleIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

/* ══════════════════════════════════════
   TOPBAR
══════════════════════════════════════ */
const Topbar = ({ onMenuClick, user, isAdmin }) => {
  const ini = initials(user?.name);

  return (
    <div className="topbar px-4 lg:px-6 gap-3" style={{ marginLeft: 'var(--sidebar-w)' }}>
      {/* Mobile menu */}
      <button className="btn-icon lg:hidden" onClick={onMenuClick}>
        <Bars3Icon className="w-4 h-4" />
      </button>

      {/* Search */}
      <div className="relative hidden sm:flex items-center max-w-xs w-full">
        <MagnifyingGlassIcon className="absolute left-3 w-3.5 h-3.5 text-ink-tertiary pointer-events-none" />
        <input
          type="text"
          placeholder="Search…"
          className="input pl-9 py-1.5 h-8 text-sm bg-surface-raised/60"
        />
        <kbd className="absolute right-3 text-[10px] text-ink-tertiary bg-surface-border px-1.5 py-0.5 rounded font-mono hidden md:block">
          ⌘K
        </kbd>
      </div>

      <div className="flex-1" />

      {/* Notification Bell */}
      <NotificationBell />

      {/* Divider */}
      <div className="w-px h-5 bg-surface-border" />

      {/* Profile chip */}
      <Link to="/profile" className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/[0.04] transition-colors">
        <div className="avatar avatar-sm">{ini}</div>
        <div className="hidden md:block text-right">
          <div className="text-xs font-semibold text-ink-primary leading-tight">{user?.name?.split(' ')[0]}</div>
          <div className="text-[10px] text-ink-tertiary">{isAdmin ? 'Admin' : 'Agent'}</div>
        </div>
        <ChevronUpDownIcon className="w-3 h-3 text-ink-tertiary hidden md:block" />
      </Link>
    </div>
  );
};

/* ══════════════════════════════════════
   LAYOUT WRAPPER
══════════════════════════════════════ */
const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-surface-bg font-sans">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        isAdmin={isAdmin}
        location={location}
        onLogout={handleLogout}
      />

      {/* Right-side content */}
      <div className="lg:ml-[220px] flex flex-col min-h-screen">
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
          user={user}
          isAdmin={isAdmin}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
