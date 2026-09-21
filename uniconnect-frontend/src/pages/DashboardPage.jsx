import { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import { Reveal } from '../components/fx';

/* ---------- Inline SVG icon set (Lucide-style) ---------- */
const Icon = {
  BarChart3: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>,
  Coins: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/></svg>,
  Trophy: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
  Briefcase: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  Lightbulb: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>,
  MessageSquare: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Handshake: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/></svg>,
  Users: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
};

const StatCard = ({ label, value, icon, accent }) => (
  <div className="group h-full bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${accent}`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white mt-0.5 truncate">{value}</p>
    </div>
  </div>
);

const DashboardPage = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => { dashboardAPI.get().then(({ data }) => setStats(data)).catch(() => {}); }, []);

  if (!stats) return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 page-fade">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gray-200 dark:bg-slate-800 animate-pulse shrink-0" />
        <div className="space-y-2">
          <div className="h-5 bg-gray-200 dark:bg-slate-800 rounded w-44 animate-pulse" />
          <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-64 animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 flex items-center gap-4 animate-pulse">
            <div className="w-12 h-12 rounded-2xl bg-gray-200 dark:bg-slate-800 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-2.5 bg-gray-200 dark:bg-slate-800 rounded w-2/3" />
              <div className="h-5 bg-gray-200 dark:bg-slate-800 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 page-fade">
      {/* Header */}
      <Reveal>
        <div className="flex items-center gap-4 mb-8">
          <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shrink-0">
            <Icon.BarChart3 className="w-7 h-7" />
          </span>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">My Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Track your progress and campus activity.</p>
          </div>
        </div>
      </Reveal>

      {/* Stats grid */}
      <Reveal>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <StatCard label="Points" value={stats.points} icon={<Icon.Coins className="w-6 h-6" />} accent="bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" />
          <StatCard label="Global Rank" value={`#${stats.rank}`} icon={<Icon.Trophy className="w-6 h-6" />} accent="bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" />
          <StatCard label="Projects" value={stats.projects} icon={<Icon.Briefcase className="w-6 h-6" />} accent="bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400" />
          <StatCard label="Questions" value={stats.questions} icon={<Icon.Lightbulb className="w-6 h-6" />} accent="bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400" />
          <StatCard label="Answers" value={stats.answers} icon={<Icon.MessageSquare className="w-6 h-6" />} accent="bg-pink-100 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400" />
          <StatCard label="Applications" value={stats.applications} icon={<Icon.Handshake className="w-6 h-6" />} accent="bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400" />
          <StatCard label="Followers" value={stats.followersCount} icon={<Icon.Users className="w-6 h-6" />} accent="bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" />
        </div>
      </Reveal>
    </div>
  );
};

export default DashboardPage;