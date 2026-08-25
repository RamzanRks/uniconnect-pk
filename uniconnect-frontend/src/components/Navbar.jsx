import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import { SERVER_URL } from '../services/api';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { notifications, unread, markAllRead } = useNotifications();
  const { dark, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md border-b border-gray-200 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="text-xl font-bold text-blue-600">UniConnect PK</Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link to="/" className="text-sm text-gray-600 hover:text-blue-600 transition font-medium">Projects</Link>
                <Link to="/qa" className="text-sm text-gray-600 hover:text-blue-600 transition font-medium">Q&A</Link>
                <Link to="/saved" className="text-sm text-gray-600 hover:text-blue-600 transition font-medium">★ Saved</Link>
                <Link to="/profile" className="text-sm text-gray-600 hover:text-blue-600 transition font-medium">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl.startsWith('http') ? user.avatarUrl : `${SERVER_URL}${user.avatarUrl}`}
                      alt="avatar"
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    '👤'
                  )}
                </Link>

                {/* 🌙 Dark mode toggle */}
                <button onClick={toggle} title="Toggle theme" className="text-xl hover:scale-110 transition">
                  {dark ? '☀️' : '🌙'}
                </button>

                {/* Notification Bell */}
                <div className="relative">
                  <button onClick={() => setOpen(!open)} className="relative text-xl text-gray-600 hover:text-blue-600 transition">
                    🔔
                    {unread > 0 && (
                      <span className="absolute -top-1 -right-2 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                        {unread}
                      </span>
                    )}
                  </button>

                  {open && (
                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-lg shadow-xl border border-gray-100 z-50 max-h-96 overflow-y-auto">
                      <div className="flex justify-between items-center p-3 border-b border-gray-100">
                        <p className="font-semibold text-gray-800 text-sm">Notifications</p>
                        <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">Mark all read</button>
                      </div>
                      {notifications.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center p-6">No notifications yet.</p>
                      ) : (
                        notifications.slice(0, 10).map((n) => (
                          <div key={n._id} className={`p-3 border-b border-gray-50 text-sm ${n.read ? 'bg-white text-gray-600' : 'bg-blue-50 text-gray-900 font-medium'}`}>
                            <p>{n.text}</p>
                            <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {user.verificationStatus === 'verified' && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full hidden sm:block">✅ Verified</span>
                )}
                {user.role === 'admin' && (
                  <Link to="/admin" className="text-sm bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 transition font-medium">
                    🛡️ Admin Panel
                  </Link>
                )}
                <button onClick={handleLogout} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md transition">
                  Logout
                </button>
              </>
            ) : (
              <div className="flex gap-3 items-center">
                <button onClick={toggle} title="Toggle theme" className="text-xl hover:scale-110 transition">
                  {dark ? '☀️' : '🌙'}
                </button>
                <Link to="/login" className="text-sm text-gray-600 hover:text-blue-600 transition">Login</Link>
                <Link to="/register" className="text-sm bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition font-medium">Join Network</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;