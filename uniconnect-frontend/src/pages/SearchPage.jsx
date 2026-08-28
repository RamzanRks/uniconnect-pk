import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchAPI, SERVER_URL } from '../services/api';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [tab, setTab] = useState('users');
  const [data, setData] = useState({ counts: { users: 0, projects: 0, questions: 0 }, users: [], projects: [], questions: [] });
  const [input, setInput] = useState(q);

  useEffect(() => {
    if (q) {
      searchAPI.global(q).then(({ data }) => setData(data)).catch(() => {});
      setInput(q);
    }
  }, [q]);

  const submit = (e) => {
    e.preventDefault();
    if (input.trim()) setSearchParams({ q: input.trim() });
  };

  const avatar = (u) => u.avatarUrl ? (u.avatarUrl.startsWith('http') ? u.avatarUrl : `${SERVER_URL}${u.avatarUrl}`) : null;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <form onSubmit={submit} className="flex gap-2 mb-6">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Search users, projects, questions..." className="input-field" />
        <button type="submit" className="bg-blue-600 text-white px-6 rounded hover:bg-blue-700">🔍 Search</button>
      </form>

      {q && (
        <>
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            {['users', 'projects', 'questions'].map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {t.charAt(0).toUpperCase() + t.slice(1)} ({data.counts[t]})
              </button>
            ))}
          </div>

          <div className="grid gap-4">
            {tab === 'users' && data.users.map((u) => (
              <Link key={u._id} to={`/user/${u._id}`} className="bg-white p-4 rounded-lg shadow flex items-center gap-4 hover:shadow-md transition">
                {avatar(u) ? <img src={avatar(u)} className="w-12 h-12 rounded-full object-cover" /> : <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">{u.firstName[0]}</div>}
                <div>
                  <p className="font-semibold text-gray-900">{u.firstName} {u.lastName} <span className="text-gray-400 font-normal">@{u.username}</span></p>
                  <p className="text-xs text-gray-500">{u.university} • 🪙 {u.points} pts</p>
                </div>
              </Link>
            ))}
            {tab === 'projects' && data.projects.map((p) => (
              <Link key={p._id} to={`/project/${p._id}`} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
                <p className="font-semibold text-gray-900">{p.title}</p>
                <p className="text-xs text-gray-500 mt-1">By {p.creator?.firstName} {p.creator?.lastName} • <span className="capitalize">{p.progress}</span></p>
              </Link>
            ))}
            {tab === 'questions' && data.questions.map((q) => (
              <Link key={q._id} to="/qa" className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
                <p className="font-semibold text-gray-900">{q.title}</p>
                <p className="text-xs text-gray-500 mt-1">By {q.author?.firstName} {q.author?.lastName}</p>
              </Link>
            ))}
            {data.counts[tab] === 0 && <p className="text-gray-500 text-center py-10">No {tab} found for "{q}".</p>}
          </div>
        </>
      )}
    </div>
  );
};

export default SearchPage;