import { useState, useEffect } from 'react';
import { auditAPI } from '../services/api';

const ACTIONS = ['', 'BAN_USER', 'UNBAN_USER', 'ADD_STRIKE', 'REMOVE_STRIKE', 'WARN_USER', 'DELETE_POST', 'DELETE_COMMENT', 'APPROVE_VERIFY', 'REJECT_VERIFY', 'APPROVE_NAME', 'REJECT_NAME', 'DISMISS_REPORT', 'DELETE_POLL'];
const CRITICAL = ['BAN_USER', 'DELETE_POST', 'DELETE_COMMENT', 'ADD_STRIKE'];

const AuditLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [action, setAction] = useState('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const { data } = await auditAPI.get({ action, q }); setLogs(data); } catch (e) { setLogs([]); }
    setLoading(false);
  };
  useEffect(() => { load(); }, [action]);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'audit-log.json'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-gray-900">📜 Admin Audit Log</h1>
          <button onClick={exportJson} className="text-xs bg-gray-800 text-white px-3 py-1.5 rounded hover:bg-black">⬇ Export JSON</button>
        </div>
        <div className="flex gap-3 mt-4 flex-wrap">
          <select className="input-field max-w-[200px]" value={action} onChange={(e) => setAction(e.target.value)}>
            <option value="">All actions</option>
            {ACTIONS.filter(Boolean).map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <input className="input-field max-w-[240px]" placeholder="Search target / details..." value={q} onChange={(e) => setQ(e.target.value)} />
          <button onClick={load} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Search</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="p-3">When</th><th className="p-3">Admin</th><th className="p-3">Action</th><th className="p-3">Target</th><th className="p-3">Details</th><th className="p-3">IP</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="p-6 text-center text-gray-400">Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan="6" className="p-6 text-center text-gray-400">No audit entries.</td></tr>
            ) : (
              logs.map((l) => (
                <tr key={l._id} className={`border-t border-gray-100 ${CRITICAL.includes(l.action) ? 'bg-red-50' : ''}`}>
                  <td className="p-3 text-gray-500 whitespace-nowrap">{new Date(l.createdAt).toLocaleString()}</td>
                  <td className="p-3 text-gray-800">{l.admin?.firstName} {l.admin?.lastName}</td>
                  <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CRITICAL.includes(l.action) ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{l.action}</span></td>
                  <td className="p-3 text-gray-700">{l.targetLabel}</td>
                  <td className="p-3 text-gray-500">{l.details}</td>
                  <td className="p-3 text-gray-400 text-xs">{l.ip}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogPage;