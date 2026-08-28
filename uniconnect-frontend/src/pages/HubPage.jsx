import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { hubAPI, SERVER_URL } from '../services/api';

const HubPage = () => {
  const { university } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => { hubAPI.get(university).then(({ data }) => setData(data)).catch(() => {}); }, [university]);

  if (!data) return <p className="text-center p-10 text-gray-500">Loading hub...</p>;
  const avatar = (u) => u.avatarUrl ? (u.avatarUrl.startsWith('http') ? u.avatarUrl : `${SERVER_URL}${u.avatarUrl}`) : null;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">🎓 {data.university} Hub</h1>
      <p className="text-sm text-gray-500 mb-6">Stats and top students from this university.</p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-5 rounded-lg shadow">
          <p className="text-xs text-gray-500 uppercase">Total Students</p>
          <p className="text-3xl font-bold text-blue-600">{data.totalStudents}</p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow">
          <p className="text-xs text-gray-500 uppercase">Verified Students</p>
          <p className="text-3xl font-bold text-green-600">{data.verifiedStudents}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold text-gray-800 mb-4">🔥 Top Skills</h3>
          <div className="flex flex-wrap gap-2">
            {data.topSkills.map((s) => (
              <span key={s._id} className="bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full font-medium">{s._id} ({s.count})</span>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold text-gray-800 mb-4">🏆 Top Students</h3>
          <div className="space-y-3">
            {data.topStudents.map((u) => (
              <Link key={u._id} to={`/user/${u._id}`} className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded transition">
                {avatar(u) ? <img src={avatar(u)} className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">{u.firstName[0]}</div>}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{u.firstName} {u.lastName}</p>
                </div>
                <span className="text-sm font-bold text-yellow-600">{u.points} 🪙</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HubPage;