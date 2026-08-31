import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { alumniAPI, SERVER_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';

const AlumniPage = () => {
  const { user } = useAuth();
  const [uni, setUni] = useState(user?.university || '');
  const [year, setYear] = useState('');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (uni) params.uni = uni;
      if (year) params.year = year;
      const { data } = await alumniAPI.list(params);
      setList(data);
    } catch (e) { setList([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [uni, year]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900">🎓 Alumni Directory</h1>
        <p className="text-sm text-gray-500 mt-1">Connect with graduated students, mentors & referral opportunities.</p>
        <div className="flex gap-3 mt-4 flex-wrap">
          <input className="input-field max-w-[240px]" placeholder="University (e.g., NUST)" value={uni} onChange={(e) => setUni(e.target.value)} />
          <input className="input-field max-w-[120px]" type="number" placeholder="Year" value={year} onChange={(e) => setYear(e.target.value)} />
          <button onClick={load} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Search</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {loading ? (
          <p className="text-gray-500 text-center col-span-2">Loading alumni...</p>
        ) : list.length === 0 ? (
          <p className="text-gray-500 text-center col-span-2">No graduated alumni found yet.</p>
        ) : (
          list.map((a) => (
            <div key={a._id} className="bg-white rounded-xl shadow p-5 flex gap-4 items-center hover:shadow-md transition">
              {a.avatarUrl ? (
                <img src={a.avatarUrl.startsWith('http') ? a.avatarUrl : `${SERVER_URL}${a.avatarUrl}`} className="w-14 h-14 rounded-full object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold">{a.firstName?.[0]}</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{a.firstName} {a.lastName} {a.mentor && '🧑🏫'}</p>
                <p className="text-xs text-gray-500 truncate">{a.university} • Class of {a.graduationYear || '—'}</p>
                {a.company && <p className="text-xs text-gray-600 truncate">💼 {a.company}</p>}
                <div className="flex gap-2 mt-1">
                  {a.openToRefer && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">🤝 Open to refer</span>}
                  {a.mentor && <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Mentor</span>}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">🪙 {a.points}</p>
                <Link to={`/user/${a._id}`} className="text-xs text-blue-600 hover:underline">View →</Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AlumniPage;