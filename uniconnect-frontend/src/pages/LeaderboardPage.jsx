import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { leaderboardAPI, SERVER_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Reveal } from '../components/fx';

/* ---------- Inline SVG icon set (Lucide-style) ---------- */
const Icon = {
  Trophy: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
  Crown: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.52l4.276 3.664a1 1 0 0 0 1.516-.294z"/><path d="M5 21h14"/></svg>,
  Medal: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15"/><path d="M11 12 5.12 2.2"/><path d="m13 12 5.88-9.8"/><path d="M8 7h8"/><circle cx="12" cy="17" r="5"/><path d="M12 18v-2h-.5"/></svg>,
  Coins: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/></svg>,
  Award: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>,
  Users: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
};

/* ---------- Rank & avatar styling helpers ---------- */
const getRankStyles = (i) => {
  if (i === 0) return 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-md ring-2 ring-amber-300/60';
  if (i === 1) return 'bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-md ring-2 ring-slate-300/60';
  if (i === 2) return 'bg-gradient-to-br from-orange-400 to-amber-600 text-white shadow-md ring-2 ring-orange-300/60';
  return 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400';
};

const getAvatarRing = (i) => {
  if (i === 0) return 'ring-2 ring-amber-400';
  if (i === 1) return 'ring-2 ring-slate-300 dark:ring-slate-500';
  if (i === 2) return 'ring-2 ring-orange-400';
  return 'ring-2 ring-gray-100 dark:ring-slate-700';
};

const LeaderboardPage = () => {
  const { user } = useAuth();
  const [top, setTop] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    leaderboardAPI.getTop()
      .then(({ data }) => { setTop(data); setLoading(false); })
      .catch(() => setLoading(false));
    if (user) leaderboardAPI.getMyRank().then(({ data }) => setMyRank(data)).catch(() => {});
  }, [user]);

  const avatar = (u) => u.avatarUrl ? (u.avatarUrl.startsWith('http') ? u.avatarUrl : `${SERVER_URL}${u.avatarUrl}`) : null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 page-fade">
      {/* Header */}
      <Reveal>
        <div className="flex items-center gap-4 mb-8">
          <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shrink-0">
            <Icon.Trophy className="w-7 h-7" />
          </span>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Global Leaderboard</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Top students ranked by reputation points.</p>
          </div>
        </div>
      </Reveal>

      {/* Your Rank hero card */}
      {myRank && (
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-violet-600 p-6 sm:p-8 text-white shadow-lg mb-8">
            <div className="absolute inset-0 dot-pattern opacity-30" />
            <div className="relative flex items-center justify-between gap-6 flex-wrap">
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 backdrop-blur shrink-0">
                  <Icon.Medal className="w-7 h-7" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-blue-100">Your Rank</p>
                  <p className="text-4xl font-extrabold tracking-tight">#{myRank.rank}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 backdrop-blur shrink-0">
                  <Icon.Coins className="w-7 h-7" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-blue-100">Your Points</p>
                  <p className="text-4xl font-extrabold tracking-tight">{myRank.points}</p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      )}

      {/* Leaderboard list */}
      <Reveal>
        <div className="rounded-3xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          {/* Card header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800">
            <h2 className="flex items-center gap-2 font-bold tracking-tight text-gray-900 dark:text-white">
              <Icon.Award className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Top Students
            </h2>
            {!loading && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 px-2.5 py-1 rounded-full">
                <Icon.Users className="w-3.5 h-3.5" /> {top.length} ranked
              </span>
            )}
          </div>

          {/* Loading skeleton */}
          {loading ? (
            <div className="divide-y divide-gray-100 dark:divide-slate-800">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 sm:p-5 animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-slate-800 shrink-0" />
                  <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-slate-800 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-1/3" />
                    <div className="h-2 bg-gray-200 dark:bg-slate-800 rounded w-1/4" />
                  </div>
                  <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-16" />
                </div>
              ))}
            </div>
          ) : top.length === 0 ? (
            /* Empty state */
            <div className="text-center py-16">
              <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Icon.Trophy className="w-7 h-7" />
              </span>
              <p className="text-gray-500 dark:text-slate-400 font-medium mt-3">No rankings yet. Start earning points!</p>
            </div>
          ) : (
            /* Rows */
            <div className="divide-y divide-gray-100 dark:divide-slate-800">
              {top.map((u, i) => (
                <Link
                  key={u._id}
                  to={`/user/${u._id}`}
                  className={`group flex items-center gap-4 p-4 sm:p-5 transition-all duration-200 hover:bg-blue-50/60 dark:hover:bg-slate-800/60 active:bg-blue-100 dark:active:bg-slate-800 ${
                    i === 0 ? 'bg-gradient-to-r from-amber-50/70 to-transparent dark:from-amber-500/5' : ''
                  }`}
                >
                  {/* Rank badge */}
                  <span className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-sm shrink-0 transition-transform group-hover:scale-105 ${getRankStyles(i)}`}>
                    {i + 1}
                  </span>

                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {avatar(u) ? (
                      <img src={avatar(u)} alt={u.firstName} className={`w-11 h-11 rounded-full object-cover ${getAvatarRing(i)}`} />
                    ) : (
                      <div className={`w-11 h-11 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-white flex items-center justify-center font-bold ${getAvatarRing(i)}`}>
                        {u.firstName[0]}
                      </div>
                    )}
                    {i === 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 text-white flex items-center justify-center shadow ring-2 ring-white dark:ring-slate-900">
                        <Icon.Crown className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  {/* Name + university */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                      {u.firstName} {u.lastName}
                      {user && u._id === user._id && (
                        <span className="text-xs font-semibold bg-gradient-to-r from-blue-600 to-violet-600 text-white px-2.5 py-0.5 rounded-full ml-2 align-middle">You</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{u.university}</p>
                  </div>

                  {/* Points */}
                  <span className="inline-flex items-center gap-1.5 font-bold text-gray-800 dark:text-white shrink-0">
                    <Icon.Coins className="w-4 h-4 text-amber-500" />
                    {u.points}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </Reveal>
    </div>
  );
};

export default LeaderboardPage;