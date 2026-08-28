import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { leaderboardAPI, SERVER_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';

const LeaderboardPage = () => {
  const { user } = useAuth();
  const [top, setTop] = useState([]);
  const [myRank, setMyRank] = useState(null);

  useEffect(() => {
    leaderboardAPI.getTop().then(({ data }) => setTop(data)).catch(() => {});
    if (user) leaderboardAPI.getMyRank().then(({ data }) => setMyRank(data)).catch(() => {});
  }, [user]);

  const avatar = (u) => u.avatarUrl ? (u.avatarUrl.startsWith('http') ? u.avatarUrl : `${SERVER_URL}${u.avatarUrl}`) : null;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">🏆 Global Leaderboard</h1>
      <p className="text-sm text-gray-500 mb-6">Top students ranked by reputation points.</p>

      {myRank && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6 flex justify-between items-center">
          <div>
            <p className="text-sm text-blue-800 font-semibold">Your Rank</p>
            <p className="text-2xl font-bold text-blue-900">#{myRank.rank}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-800 font-semibold">Your Points</p>
            <p className="text-2xl font-bold text-blue-900">{myRank.points} 🪙</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {top.map((u, i) => (
          <Link key={u._id} to={`/user/${u._id}`} className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition ${i < top.length - 1 ? 'border-b border-gray-100' : ''}`}>
            <span className={`text-xl font-bold w-8 text-center ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-yellow-700' : 'text-gray-500'}`}>
              {i + 1}
            </span>
            {avatar(u) ? <img src={avatar(u)} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">{u.firstName[0]}</div>}
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{u.firstName} {u.lastName} {user && u._id === user._id && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full ml-2">You</span>}</p>
              <p className="text-xs text-gray-500">{u.university}</p>
            </div>
            <span className="font-bold text-gray-800">{u.points} 🪙</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default LeaderboardPage;