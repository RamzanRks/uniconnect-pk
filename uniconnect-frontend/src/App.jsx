import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import PortfolioPage from './pages/PortfolioPage';
import SoundListener from './components/SoundListener';
import PWABanner from './components/PWABanner';
import AlumniPage from './pages/AlumniPage';
import OnboardingTour from './components/OnboardingTour';
import ParticlesBackground from './components/ParticlesBackground';
import AuditLogPage from './pages/AuditLogPage';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const FullScreenLoader = ({ label = 'Loading...' }) => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-10">
    <div className="relative w-14 h-14">
      <div className="absolute inset-0 rounded-full border-4 border-gray-100 dark:border-slate-800"></div>
      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 border-r-violet-600 animate-spin"></div>
    </div>
    <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">{label}</p>
  </div>
);

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (user && user.university === 'Not set') return <Navigate to="/complete-profile" />;
  return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  return user && user.role === 'admin' ? children : <Navigate to="/" />;
};

const PageFade = ({ children }) => {
  const location = useLocation();
  return <div key={location.pathname} className="page-fade">{children}</div>;
};

/* ✅ NEW: shell decides chrome (navbar/tour) per-route — no post-paint DOM hiding */
const AppShell = () => {
  const location = useLocation();
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="min-h-screen bg-gray-50 bg-gradient-to-b from-blue-100/30 via-transparent to-violet-100/20 dark:from-blue-500/10 dark:via-transparent dark:to-violet-500/10 antialiased transition-colors duration-300">
      {!isAuthRoute && <Navbar />}
      <ParticlesBackground color="#2563eb" count={35}>
        <SoundListener />
        <PWABanner />
        {!isAuthRoute && <OnboardingTour />}
        <PageFade>
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
            <Route path="/portfolio/:handle" element={<PrivateRoute><PortfolioPage /></PrivateRoute>} />
            <Route path="/alumni" element={<PrivateRoute><AlumniPage /></PrivateRoute>} />
            <Route path="/audit" element={<PrivateRoute><AuditLogPage /></PrivateRoute>} />
          </Routes>
        </PageFade>
      </ParticlesBackground>
    </div>
  );
};

const AppContent = () => (
  <ThemeProvider>
    <AuthProvider>
      <Router>
        <NotificationProvider>
          <AppShell />
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