import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import AuthPage from './pages/AuthPage';
import Feed from './pages/Feed';
import AdminDashboard from './pages/AdminDashboard';
import QAPage from './pages/QAPage';
import ProfilePage from './pages/ProfilePage';
import PublicProfilePage from './pages/PublicProfilePage';
import SavedPage from './pages/SavedPage';
import SearchPage from './pages/SearchPage';
import LeaderboardPage from './pages/LeaderboardPage';
import DashboardPage from './pages/DashboardPage';
import HubPage from './pages/HubPage';
import InboxPage from './pages/InboxPage';
import CompleteProfilePage from './pages/CompleteProfilePage';
import Navbar from './components/Navbar';
import ProjectDetailPage from './pages/ProjectDetailPage';


const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (user && user.university === 'Not set') return <Navigate to="/complete-profile" />;
  return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-center">Loading...</div>;
  return user && user.role === 'admin' ? children : <Navigate to="/" />;
};

const AppContent = () => (
  <ThemeProvider>
    <AuthProvider>
      <Router>
        <NotificationProvider>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <Routes>
              <Route path="/login" element={<AuthPage mode="login" />} />
              <Route path="/register" element={<AuthPage mode="register" />} />
              <Route path="/" element={<PrivateRoute><Feed /></PrivateRoute>} />
              <Route path="/qa" element={<PrivateRoute><QAPage /></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
              <Route path="/user/:id" element={<PrivateRoute><PublicProfilePage /></PrivateRoute>} />
              <Route path="/saved" element={<PrivateRoute><SavedPage /></PrivateRoute>} />
              <Route path="/search" element={<PrivateRoute><SearchPage /></PrivateRoute>} />
              <Route path="/leaderboard" element={<PrivateRoute><LeaderboardPage /></PrivateRoute>} />
              <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
              <Route path="/hub/:university" element={<PrivateRoute><HubPage /></PrivateRoute>} />
              <Route path="/inbox" element={<PrivateRoute><InboxPage /></PrivateRoute>} />
                              <Route path="/complete-profile" element={<CompleteProfilePage />} />
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
  <Route path="/project/:id" element={<PrivateRoute><ProjectDetailPage /></PrivateRoute>} />
            </Routes>
          </div>
        </NotificationProvider>
      </Router>
    </AuthProvider>
  </ThemeProvider>
);

function App() {
  return GOOGLE_CLIENT_ID ? (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AppContent />
    </GoogleOAuthProvider>
  ) : (
    <AppContent />
  );
}

export default App;