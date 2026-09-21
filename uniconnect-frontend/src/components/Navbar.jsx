import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import { SERVER_URL } from '../services/api';
import { Skeleton, EmptyState } from './fx';
import BrandLogo from './BrandLogo';


/* ---------- Time ago helper ---------- */
const timeAgo = (date) => {
  const now = new Date();
  const d = new Date(date);
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

/* ---------- Notification type icon ---------- */
const NotifTypeIcon = ({ type }) => {
  const base = 'w-4 h-4';
  switch (type) {
    case 'application':
    case 'application_accepted':
    case 'application_rejected':
      return <Icon.Briefcase className={`${base} text-blue-500`} />;
    case 'answer':
      return <Icon.Chat className={`${base} text-green-500`} />;
    case 'follow':
      return <Icon.User className={`${base} text-violet-500`} />;
    case 'rating':
      return <Icon.Trophy className={`${base} text-amber-500`} />;
    case 'reaction':
    case 'endorsement':
      return <Icon.Bell className={`${base} text-pink-500`} />;
    case 'message':
      return <Icon.Inbox className={`${base} text-emerald-500`} />;
    case 'warning':
    case 'strike':
      return <Icon.Shield className={`${base} text-red-500`} />;
    case 'verification_approved':
    case 'verification_rejected':
    case 'name_change_approved':
    case 'name_change_rejected':
      return <Icon.Settings className={`${base} text-gray-500`} />;
    default:
      return <Icon.Bell className={`${base} text-gray-400`} />;
  }
};
/* ---------- Icons ---------- */
const Icon = {
  Search: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>),
  Bell: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>),
  Inbox: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></svg>),
  Sun: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg>),
  Moon: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>),
  User: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>),
  Briefcase: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>),
  Settings: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>),
  Logout: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></svg>),
  Shield: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>),
  Grid: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>),
  Chat: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>),
  Trophy: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2z" /></svg>),
  Chart: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 3v18h18M7 16l4-4 4 4 5-5" /></svg>),
  Menu: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 6h18M3 12h18M3 18h18" /></svg>),
  Close: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M18 6 6 18M6 6l12 12" /></svg>),
  Chevron: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m6 9 6 6 6-6" /></svg>),
};

/* ---------- Icon button ---------- */
const IconButton = ({ onClick, title, active, children, badge }) => (
  <button
    onClick={onClick}
    title={title}
    className={`relative group inline-flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200
      text-gray-600 dark:text-slate-300
      hover:text-blue-600 dark:hover:text-blue-400
      hover:bg-blue-50/70 dark:hover:bg-blue-500/10
      active:scale-95 active:bg-blue-100 dark:active:bg-blue-500/20
      ${active ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10' : ''}`}
  >
    {children}
    {badge > 0 && (
      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900 animate-pulse">
        {badge > 99 ? '99+' : badge}
      </span>
    )}
  </button>
);

/* ---------- Main Navbar ---------- */
const Navbar = () => {
  const { user, logout } = useAuth();
  const { notifications, unread, markAllRead } = useNotifications();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifOpen, setNotifOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState({ users: [], projects: [] });
  const [searchLoading, setSearchLoading] = useState(false);

  const notifRef = useRef(null);
  const avatarRef = useRef(null);
  const searchRef = useRef(null);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleLogout = () => {
    logout();
    setAvatarOpen(false);
    setMobileOpen(false);
    navigate('/login');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchFocused(false);
      setSearchQuery('');
    }
  };

  /* ---------- Live search ---------- */
  useEffect(() => {
    if (!searchFocused || searchQuery.trim().length < 2) {
      setSearchResults({ users: [], projects: [] });
      return;
    }
    const t = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`${SERVER_URL}/api/search?q=${encodeURIComponent(searchQuery.trim())}&limit=5`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setSearchResults({
            users: Array.isArray(data.users) ? data.users.slice(0, 5) : [],
            projects: Array.isArray(data.projects) ? data.projects.slice(0, 5) : [],
          });
        }
      } catch { /* silent */ } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery, searchFocused]);

  useEffect(() => {
    const onClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (avatarRef.current && !avatarRef.current.contains(e.target)) setAvatarOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchFocused(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const avatarSrc = user?.avatarUrl
    ? (user.avatarUrl.startsWith('http') ? user.avatarUrl : `${SERVER_URL}${user.avatarUrl}`)
    : null;
  const avatarHandle = user?.handle || user?.username || '';

  const navLinks = user ? [
    { to: '/', label: 'Projects', icon: Icon.Grid },
    { to: '/qa', label: 'Q&A', icon: Icon.Chat },
    { to: '/leaderboard', label: 'Leaderboard', icon: Icon.Trophy },
    { to: '/dashboard', label: 'Dashboard', icon: Icon.Chart },
  ] : [];

  return (
    <>
      <nav className="sticky top-0 z-40 bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl border-b border-gray-200/60 dark:border-slate-800/60 transition-colors">
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gray-300/40 dark:via-slate-700/40 to-transparent" />

        <div className="px-3 sm:px-4 lg:px-5">
          <div className="flex justify-between h-16 items-center gap-3">

            {/* ---------- Logo ---------- */}

<Link to="/" className="flex-shrink-0 flex items-center gap-2.5 group">
  <BrandLogo
    size={36}
    withText
    textClassName="hidden sm:flex"
    className="pointer-events-none"
  />
</Link>

            {/* ---------- Global Search ---------- */}
            {user && (
              <div ref={searchRef} className="flex-1 max-w-xl hidden md:block relative">
                <form onSubmit={handleSearchSubmit}>
                  <div className={`relative flex items-center transition-all duration-200 rounded-full
                    ${searchFocused
                      ? 'ring-2 ring-blue-500/40 shadow-sm bg-white dark:bg-slate-800'
                      : 'bg-gray-100/80 dark:bg-slate-800/60 hover:bg-gray-200/80 dark:hover:bg-slate-800'}`}>
                    <Icon.Search className="w-4 h-4 ml-4 text-gray-500 dark:text-slate-400" />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setSearchFocused(true)}
                      placeholder="Search users, projects..."
                      className="w-full bg-transparent border-none rounded-full px-3 py-2.5 text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-500 dark:placeholder:text-slate-400 focus:outline-none"
                    />
                    {searchQuery && (
                      <button type="button" onClick={() => setSearchQuery('')} className="mr-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition">
                        <Icon.Close className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                    )}
                  </div>
                </form>

                {searchFocused && (searchQuery.trim().length >= 2 || searchLoading) && (
                  <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
                    {searchLoading ? (
                      <div className="p-3 space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ) : searchResults.users.length === 0 && searchResults.projects.length === 0 ? (
                      <EmptyState title="No results" subtitle={`Nothing matches "${searchQuery}"`} />
                    ) : (
                      <div className="max-h-96 overflow-y-auto">
                        {searchResults.users.length > 0 && (
                          <div className="p-2">
                            <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">Users</p>
                            {searchResults.users.map((u) => (
                              <Link key={u._id} to={`/user/${u._id}`} onClick={() => setSearchFocused(false)} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">
                                {u.avatarUrl ? (
                                  <img src={u.avatarUrl.startsWith('http') ? u.avatarUrl : `${SERVER_URL}${u.avatarUrl}`} alt="" className="w-8 h-8 rounded-full object-cover" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                                    {(u.name || '?')[0].toUpperCase()}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">{u.name}</p>
                                  <p className="text-xs text-gray-500 truncate">@{u.handle || u.username || ''}</p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}
                        {searchResults.projects.length > 0 && (
                          <div className="p-2 border-t border-gray-100 dark:border-slate-700">
                            <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">Projects</p>
                            {searchResults.projects.map((p) => (
                              <Link key={p._id} to={`/project/${p._id}`} onClick={() => setSearchFocused(false)} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
                                  <Icon.Grid className="w-4 h-4 text-white" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">{p.title}</p>
                                  {p.description && <p className="text-xs text-gray-500 truncate">{p.description}</p>}
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}
                        <button type="button" onClick={handleSearchSubmit} className="w-full text-center text-xs font-semibold text-blue-600 dark:text-blue-400 py-2.5 border-t border-gray-100 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition">
                          See all results for "{searchQuery}" →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ---------- Right side ---------- */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              {user ? (
                <>
                  {/* Desktop nav links — single-color active indicator */}
                  <div className="hidden lg:flex items-center gap-0.5">
                    {navLinks.map((l) => {
                      const active = isActive(l.to);
                      return (
                        <Link
                          key={l.to}
                          to={l.to}
                          className={`relative inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group
                            ${active
                              ? 'text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-500/10'
                              : 'text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100/60 dark:hover:bg-slate-800/60'}`}
                        >
                          <l.icon className="w-4 h-4" />
                          <span>{l.label}</span>
                          {/* Single-color underline */}
                          <span className={`absolute left-3 right-3 -bottom-0.5 h-[2px] rounded-full transition-all duration-200 origin-left
                            ${active
                              ? 'bg-blue-600 dark:bg-blue-400 scale-x-100'
                              : 'bg-blue-400 dark:bg-blue-500 scale-x-0 group-hover:scale-x-100'}`} />
                        </Link>
                      );
                    })}
                  </div>

                  <div className="hidden lg:block w-px h-6 bg-gray-200 dark:bg-slate-700 mx-1" />

                  <Link to="/inbox" title="Inbox" className="hidden sm:block">
                    <IconButton title="Inbox" active={isActive('/inbox')}>
                      <Icon.Inbox className="w-5 h-5" />
                    </IconButton>
                  </Link>

               {/* Notifications */}
<div ref={notifRef} className="relative">
  <IconButton
    onClick={() => {
      const opening = !notifOpen;
      setNotifOpen(opening);
      // Auto-mark all as read when opening the panel
      if (opening) {
        markAllRead();
      }
    }}
    title="Notifications"
    active={notifOpen}
    badge={unread}
  >
    <Icon.Bell className="w-5 h-5" />
  </IconButton>

  {notifOpen && (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden z-50">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 dark:border-slate-700">
        <p className="font-bold text-gray-900 dark:text-slate-100 text-sm">Notifications</p>
        {notifications.length > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline transition"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Notification list */}
      <div className="max-h-96 overflow-y-auto custom-scrollbar">
        {notifications.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
              <Icon.Bell className="w-6 h-6 text-gray-400 dark:text-slate-500" />
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-slate-300">All caught up!</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">No notifications yet.</p>
          </div>
        ) : (
          notifications.slice(0, 20).map((n) => {
            const isUnread = !n.read;
            return (
              <button
                key={n._id}
                onClick={() => {
                  // Navigate to the notification link
                  if (n.link && n.link !== '/') {
                    window.location.href = n.link;
                  } else if (n.link === '/') {
                    window.location.href = '/';
                  }
                  setNotifOpen(false);
                }}
                className={`w-full text-left px-4 py-3.5 border-b border-gray-50 dark:border-slate-700/50 last:border-0 transition-all duration-150 hover:bg-gray-50 dark:hover:bg-slate-700/40 active:bg-gray-100 dark:active:bg-slate-700 ${
                  isUnread
                    ? 'bg-blue-50/60 dark:bg-blue-500/5'
                    : 'bg-white dark:bg-slate-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Unread dot */}
                  <div className="mt-1.5 flex-shrink-0">
                    {isUnread ? (
                      <span className="block w-2 h-2 rounded-full bg-blue-500" />
                    ) : (
                      <span className="block w-2 h-2 rounded-full bg-gray-200 dark:bg-slate-600" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${
                      isUnread
                        ? 'text-gray-900 dark:text-slate-100 font-semibold'
                        : 'text-gray-600 dark:text-slate-300'
                    }`}>
                      {n.text}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>

                  {/* Type icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    <NotifTypeIcon type={n.type} />
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-gray-100 dark:border-slate-700">
          <p className="text-center text-[11px] text-gray-400 dark:text-slate-500 py-2">
            Showing latest {Math.min(notifications.length, 20)} notifications
          </p>
        </div>
      )}
    </div>
  )}
</div>

                  <IconButton onClick={toggle} title="Toggle theme">
                    {dark ? <Icon.Sun className="w-5 h-5" /> : <Icon.Moon className="w-5 h-5" />}
                  </IconButton>

                  <div className="hidden sm:block w-px h-6 bg-gray-200 dark:bg-slate-700 mx-0.5" />

                  {/* Avatar dropdown */}
                  <div ref={avatarRef} className="relative">
                    <button
                      onClick={() => setAvatarOpen((v) => !v)}
                      className={`relative inline-flex items-center gap-2 pl-1 pr-2 py-1 rounded-full transition-all
                        ${avatarOpen ? 'bg-gray-100 dark:bg-slate-800 ring-2 ring-blue-500/30' : 'hover:bg-gray-100 dark:hover:bg-slate-800'}`}
                    >
                      {avatarSrc ? (
                        <img src={avatarSrc} alt="avatar" className="w-8 h-8 rounded-full object-cover ring-2 ring-white dark:ring-slate-900" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white">
                          <Icon.User className="w-4 h-4" />
                        </div>
                      )}
                      <Icon.Chevron className={`w-3.5 h-3.5 text-gray-500 transition-transform ${avatarOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {avatarOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                          <p className="font-bold text-gray-900 dark:text-slate-100 text-sm truncate">{user.name}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        <div className="p-1.5">
                          <Link to="/profile" onClick={() => setAvatarOpen(false)} className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition ${isActive('/profile') ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700/50'}`}>
                            <Icon.User className="w-4 h-4" /> Profile
                          </Link>
                          {avatarHandle && (
                            <Link to={`/portfolio/${avatarHandle}`} onClick={() => setAvatarOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">
                              <Icon.Briefcase className="w-4 h-4" /> Portfolio
                            </Link>
                          )}
                          <Link to="/profile" onClick={() => setAvatarOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">
                            <Icon.Settings className="w-4 h-4" /> Settings
                          </Link>
                          {user.role === 'admin' && (
                            <Link to="/admin" onClick={() => setAvatarOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition">
                              <Icon.Shield className="w-4 h-4" /> Admin Panel
                            </Link>
                          )}
                        </div>
                        <div className="p-1.5 border-t border-gray-100 dark:border-slate-700">
                          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-700 dark:text-slate-200 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition">
                            <Icon.Logout className="w-4 h-4" /> Logout
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <button onClick={() => setMobileOpen(true)} className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition">
                    <Icon.Menu className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <IconButton onClick={toggle} title="Toggle theme">
                    {dark ? <Icon.Sun className="w-5 h-5" /> : <Icon.Moon className="w-5 h-5" />}
                  </IconButton>
                  <Link to="/login" className="hidden sm:inline-flex text-sm font-semibold text-gray-700 dark:text-slate-200 px-4 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition">
                    Login
                  </Link>
                  <Link to="/register" className="inline-flex items-center gap-2 text-sm font-semibold text-white px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all">
                    Join Network
                  </Link>
                  <button onClick={() => setMobileOpen(true)} className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition">
                    <Icon.Menu className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ---------- Mobile drawer ---------- */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-[fadeIn_.2s_ease]" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-slate-900 shadow-2xl flex flex-col animate-[slideIn_.25s_ease]">
            <div className="flex items-center justify-between px-4 h-16 border-b border-gray-100 dark:border-slate-800">
<span className="flex items-center gap-2 font-extrabold tracking-tight text-[#0A2E5C] dark:text-slate-100">
  <img src={BRAND.logo} alt="UniConnect" className="w-6 h-6 object-contain" /> Menu
</span>
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition">
                <Icon.Close className="w-5 h-5 text-gray-600 dark:text-slate-300" />
              </button>
            </div>

            {user && (
              <>
                <div className="p-4 border-b border-gray-100 dark:border-slate-800">
                  <form onSubmit={handleSearchSubmit}>
                    <div className="relative flex items-center bg-gray-100 dark:bg-slate-800 rounded-full">
                      <Icon.Search className="w-4 h-4 ml-4 text-gray-500" />
                      <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search..."
                        className="w-full bg-transparent border-none rounded-full px-3 py-2.5 text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-500 focus:outline-none"
                      />
                    </div>
                  </form>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                  {navLinks.map((l) => {
                    const active = isActive(l.to);
                    return (
                      <Link
                        key={l.to}
                        to={l.to}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition
                          ${active
                            ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold'
                            : 'text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                      >
                        <l.icon className={`w-5 h-5 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'}`} />
                        <span>{l.label}</span>
                        {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />}
                      </Link>
                    );
                  })}
                  <Link to="/inbox" onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${isActive('/inbox') ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800'}`}>
                    <Icon.Inbox className={`w-5 h-5 ${isActive('/inbox') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'}`} /> Inbox
                  </Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition">
                      <Icon.Shield className="w-5 h-5" /> Admin Panel
                    </Link>
                  )}
                </div>

                <div className="p-3 border-t border-gray-100 dark:border-slate-800">
                  <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-700 transition font-medium text-sm">
                    <Icon.Logout className="w-4 h-4" /> Logout
                  </button>
                </div>
              </>
            )}

            {!user && (
              <div className="flex-1 p-4 flex flex-col gap-3">
                <Link to="/login" onClick={() => setMobileOpen(false)} className="text-center px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition">
                  Login
                </Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="text-center px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold hover:shadow-lg transition">
                  Join Network
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
      `}</style>
    </>
  );
};

export default Navbar;