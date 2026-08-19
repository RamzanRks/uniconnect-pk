import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="text-xl font-bold text-blue-600">
            UniConnect PK
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link to="/" className="text-sm text-gray-600 hover:text-blue-600 transition font-medium">Projects</Link>
                <Link to="/qa" className="text-sm text-gray-600 hover:text-blue-600 transition font-medium">Q&A</Link>
                <Link to="/profile" className="text-sm text-gray-600 hover:text-blue-600 transition font-medium">👤 Profile</Link>

                {user.verificationStatus === 'verified' && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full hidden sm:block">✅ Verified</span>
                )}
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="text-sm bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 transition font-medium"
                  >
                    🛡️ Admin Panel
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex gap-3">
                <Link to="/login" className="text-sm text-gray-600 hover:text-blue-600 transition">
                  Login
                </Link>
                <Link to="/register" className="text-sm bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition font-medium">
                  Join Network
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;