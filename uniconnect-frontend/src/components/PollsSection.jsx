import { useState, useEffect } from 'react';
import { pollAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const PollsSection = ({ projectId, isOwner }) => {
  const { user } = useAuth();
  const [polls, setPolls] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [question, setQuestion] = useState('');
  const [opts, setOpts] = useState(['', '']);
  const [multiple, setMultiple] = useState(false);
  const [expiry, setExpiry] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const load = () => pollAPI.get(projectId).then(({ data }) => setPolls(data)).catch(() => {});
  useEffect(() => { load(); }, [projectId]);

  const create = async () => {
    const options = opts.map((o) => o.trim()).filter(Boolean);
    if (!question.trim() || options.length < 2) { setErr('Need a question and at least 2 options.'); return; }
    setBusy(true); setErr('');
    try {
      await pollAPI.create(projectId, { question, options, multiple, closesAt: expiry || undefined });
      setQuestion(''); setOpts(['', '']); setMultiple(false); setExpiry(''); setShowCreate(false);
      load();
    } catch (e) { setErr(e.response?.data?.message || 'Failed'); }
    setBusy(false);
  };

  const vote = async (id, idx) => { try { await pollAPI.vote(id, idx); load(); } catch (e) { alert(e.response?.data?.message || 'Vote failed'); } };
  const close = async (id) => { await pollAPI.close(id); load(); };
  const del = async (id) => { if (window.confirm('Delete this poll?')) { await pollAPI.delete(id); load(); } };

  const isExpired = (p) => p.closed || (p.closesAt && new Date(p.closesAt) < new Date());

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-800">🗳️ Team Polls</h3>
        {isOwner && (
          <button onClick={() => setShowCreate(!showCreate)} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700">
            {showCreate ? 'Cancel' : '+ New Poll'}
          </button>
        )}
      </div>

      {showCreate && (
        <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50 space-y-3">
          <input className="input-field" placeholder="Poll question..." value={question} onChange={(e) => setQuestion(e.target.value)} />
          {opts.map((o, i) => (
            <div key={i} className="flex gap-2">
              <input className="input-field" placeholder={`Option ${i + 1}`} value={o} onChange={(e) => { const c = [...opts]; c[i] = e.target.value; setOpts(c); }} />
              {opts.length > 2 && <button onClick={() => setOpts(opts.filter((_, x) => x !== i))} className="text-red-600 text-sm">✕</button>}
            </div>
          ))}
          {opts.length < 5 && <button onClick={() => setOpts([...opts, ''])} className="text-xs text-blue-600 hover:underline">+ Add option</button>}
          <div className="flex gap-4 items-center">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={multiple} onChange={(e) => setMultiple(e.target.checked)} /> Multiple choice</label>
            <select className="input-field max-w-[160px]" value={expiry} onChange={(e) => setExpiry(e.target.value)}>
              <option value="">No expiry</option>
              <option value={new Date(Date.now() + 86400000).toISOString()}>24 hours</option>
              <option value={new Date(Date.now() + 7 * 86400000).toISOString()}>7 days</option>
            </select>
          </div>
          {err && <p className="text-xs text-red-600">{err}</p>}
          <button onClick={create} disabled={busy} className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">Create Poll</button>
        </div>
      )}

      <div className="space-y-4">
        {polls.length === 0 && !showCreate && <p className="text-sm text-gray-400">No polls yet.</p>}
        {polls.map((p) => {
          const total = p.options.reduce((s, o) => s + o.votes.length, 0);
          const expired = isExpired(p);
          const myVote = p.options.findIndex((o) => o.votes.some((v) => (v._id || v) === user._id));
          return (
            <div key={p._id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <p className="font-medium text-gray-900">{p.question}</p>
                {isOwner && (
                  <div className="flex gap-2">
                    {!expired && <button onClick={() => close(p._id)} className="text-xs text-yellow-700 hover:underline">Close</button>}
                    <button onClick={() => del(p._id)} className="text-xs text-red-600 hover:underline">Delete</button>
                  </div>
                )}
              </div>
              <div className="mt-3 space-y-2">
                {p.options.map((o, i) => {
                  const pct = total ? Math.round((o.votes.length / total) * 100) : 0;
                  return (
                    <button key={i} disabled={expired} onClick={() => vote(p._id, i)} className={`w-full text-left rounded-lg border p-2 transition ${myVote === i ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'} ${expired ? 'opacity-80 cursor-default' : ''}`}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-800">{o.text} {myVote === i && '✓'}</span>
                        <span className="text-gray-500">{pct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 mt-2">{total} vote{total === 1 ? '' : 's'} {expired && '• Closed'} {p.closesAt && !expired && `• Ends ${new Date(p.closesAt).toLocaleDateString()}`}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PollsSection;