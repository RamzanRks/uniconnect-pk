import { useState, useEffect } from 'react';
import { aiAPI } from '../services/api';

const Ring = ({ score }) => {
  const r = 42, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 100 100" className="w-24 h-24">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
      <circle cx="50" cy="50" r={r} fill="none" stroke="url(#cg)" strokeWidth="8" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c - (c * score) / 100} transform="rotate(-90 50 50)" style={{ transition: 'stroke-dashoffset 1s ease' }} />
      <defs><linearGradient id="cg"><stop offset="0%" stopColor="#2563eb" /><stop offset="100%" stopColor="#7c3aed" /></linearGradient></defs>
      <text x="50" y="55" textAnchor="middle" fontSize="20" fontWeight="bold" fill="#1f2937">{score}%</text>
    </svg>
  );
};

const CoachCard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ask, setAsk] = useState('');
  const [answer, setAnswer] = useState('');
  const [headlines, setHeadlines] = useState([]);
  const [bio, setBio] = useState('');
  const [rewritten, setRewritten] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    aiAPI.coach().then(({ data }) => { setData(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const doAsk = async () => {
    if (!ask.trim()) return;
    setBusy(true);
    try { const { data } = await aiAPI.ask(ask); setAnswer(data.answer); }
    catch (e) { setAnswer(e.response?.data?.message || 'AI unavailable.'); }
    setBusy(false);
  };

  const doHeadlines = async () => {
    setBusy(true);
    try { const { data } = await aiAPI.headlines(); setHeadlines(data.headlines || []); } catch (e) {}
    setBusy(false);
  };

  const doRewrite = async () => {
    if (!bio.trim()) return;
    setBusy(true);
    try { const { data } = await aiAPI.rewriteBio(bio); setRewritten(data.rewritten); } catch (e) {}
    setBusy(false);
  };

  if (loading) return <div className="bg-white rounded-xl shadow p-8 mt-6 text-gray-500">Loading AI Coach...</div>;
  if (!data) return null;

  return (
    <div className="bg-white rounded-xl shadow p-8 mt-6">
      <div className="flex items-center gap-6">
        <Ring score={data.score} />
        <div>
          <h2 className="text-lg font-bold text-gray-800">🤖 AI Profile Coach</h2>
          <p className="text-sm text-gray-500">Profile completeness. {data.ai ? 'Powered by Gemini.' : 'Rule-based tips (add GEMINI_API_KEY for AI).'}</p>
        </div>
      </div>

      {data.tips.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">💡 Recommendations</p>
          <ul className="space-y-1">
            {data.tips.map((t, i) => <li key={i} className="text-sm text-gray-600 flex gap-2"><span className="text-blue-600">▸</span>{t}</li>)}
          </ul>
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-lg p-3">
          <p className="text-sm font-medium text-gray-700 mb-2">✍️ Headline ideas</p>
          <button onClick={doHeadlines} disabled={busy} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50">Generate</button>
          {headlines.map((h, i) => (
            <div key={i} className="flex justify-between items-center mt-2 text-xs text-gray-600 bg-gray-50 rounded p-2">
              <span>{h}</span>
              <button onClick={() => navigator.clipboard?.writeText(h)} className="text-blue-600 hover:underline">Copy</button>
            </div>
          ))}
        </div>
        <div className="border border-gray-200 rounded-lg p-3">
          <p className="text-sm font-medium text-gray-700 mb-2">📝 Bio rewriter</p>
          <textarea className="input-field" rows={2} placeholder="Paste your bio..." value={bio} onChange={(e) => setBio(e.target.value)} />
          <button onClick={doRewrite} disabled={busy} className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded hover:bg-purple-700 disabled:opacity-50 mt-2">Rewrite</button>
          {rewritten && <p className="text-xs text-gray-600 bg-gray-50 rounded p-2 mt-2">{rewritten}</p>}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm font-medium text-gray-700 mb-2">❓ Ask the Coach (1/day)</p>
        <div className="flex gap-2">
          <input className="input-field" placeholder="e.g., How do I attract recruiters?" value={ask} onChange={(e) => setAsk(e.target.value)} />
          <button onClick={doAsk} disabled={busy} className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">Ask</button>
        </div>
        {answer && <p className="text-sm text-gray-700 bg-blue-50 rounded p-3 mt-2">{answer}</p>}
      </div>
    </div>
  );
};

export default CoachCard;