import { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';

const StatCard = ({ label, value, icon, accent }) => (
  <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${accent}`}>{icon}</div>
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  useEffect(() => { dashboardAPI.get().then(({ data }) => setStats(data)).catch(() => {}); }, []);

  if (!stats) return <p className="text-center p-10 text-gray-500">Loading dashboard...</p>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">📊 My Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Points" value={stats.points} icon="🪙" accent="bg-yellow-100 text-yellow-600" />
        <StatCard label="Global Rank" value={`#${stats.rank}`} icon="🏆" accent="bg-blue-100 text-blue-600" />
        <StatCard label="Projects" value={stats.projects} icon="📌" accent="bg-green-100 text-green-600" />
        <StatCard label="Questions" value={stats.questions} icon="💡" accent="bg-purple-100 text-purple-600" />
        <StatCard label="Answers" value={stats.answers} icon="💬" accent="bg-pink-100 text-pink-600" />
        <StatCard label="Applications" value={stats.applications} icon="🤝" accent="bg-orange-100 text-orange-600" />
        <StatCard label="Followers" value={stats.followersCount} icon="👥" accent="bg-indigo-100 text-indigo-600" />
      </div>
    </div>
  );
};

export default DashboardPage;