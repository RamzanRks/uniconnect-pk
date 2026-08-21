import { useState, useEffect, useCallback } from 'react';
import { adminAPI, SERVER_URL } from '../services/api';

const BarChart = ({ data, color }) => {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="space-y-3">
      {data.length === 0 ? (
        <p className="text-sm text-gray-400">No data yet.</p>
      ) : (
        data.map((d) => (
          <div key={d._id}>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span className="truncate pr-2">{d._id}</span>
              <span className="font-semibold">{d.count}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full">
              <div className={`h-2 rounded-full ${color}`} style={{ width: `${(d.count / max) * 100}%` }} />
            </div>
          </div>
        ))
      )}
    </div>
  );
};

const StatCard = ({ label, value, accent, onClick }) => (
  <button
    onClick={onClick}
    className="bg-white rounded-lg shadow p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition"
  >
    <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
    <p className={`text-3xl font-bold mt-1 ${accent || 'text-gray-900'}`}>{value}</p>
    <p className="text-[10px] text-gray-400 mt-1">Click to view full list →</p>
  </button>
);

const AdminDashboard = () => {
  const [tab, setTab] = useState('reports');
  const [reports, setReports] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [nameChanges, setNameChanges] = useState([]);
  const [stats, setStats] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchData = useCallback(async () => {
    try {
            const [rep, ver, st, nc] = await Promise.all([
        adminAPI.getPendingReports(),
        adminAPI.getPendingVerifications(),
        adminAPI.getStats(),
        adminAPI.getNameChanges(),
      ]);
      setReports(rep.data);
      setVerifications(ver.data);
      setStats(st.data);
      setNameChanges(nc.data);
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = async () => {
    await fetchData();
    if (detail) {
      try {
        const { data } = await adminAPI.getList(detail.type);
        setDetail((d) => ({ ...d, data }));
      } catch (e) { /* ignore */ }
    }
  };

  const openDetail = async (type, title, headers) => {
    setDetail({ type, title, headers, data: [] });
    try {
      const { data } = await adminAPI.getList(type);
      setDetail({ type, title, headers, data });
    } catch (e) {
      setDetail(null);
      setMessage('❌ Failed to load list');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post permanently?')) return;
    try {
      await adminAPI.deletePost(postId);
      setMessage('✅ Post deleted.');
      refresh();
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || 'Failed to delete'));
    }
  };

  const handleBanUser = async (userId) => {
    if (!window.confirm('Ban this user permanently?')) return;
    try {
      await adminAPI.banUser(userId);
      setMessage('✅ User banned.');
      refresh();
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || 'Failed to ban'));
    }
  };

  const handleApprove = async (id) => {
    try {
      await adminAPI.approveVerification(id);
      setMessage('✅ User verified.');
      refresh();
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || 'Failed'));
    }
  };

  const handleReject = async (id) => {
    try {
      await adminAPI.rejectVerification(id);
      setMessage('❌ Verification rejected.');
      refresh();
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || 'Failed'));
    }
  };

    const handleApproveName = async (id) => {
    try {
      await adminAPI.approveNameChange(id);
      setMessage('✅ Name change approved.');
      refresh();
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || 'Failed'));
    }
  };

  const handleRejectName = async (id) => {
    try {
      await adminAPI.rejectNameChange(id);
      setMessage('❌ Name change rejected.');
      refresh();
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || 'Failed'));
    }
  };

  const t = stats?.totals;
  const USER_HEADERS = ['Name', 'Email', 'University', 'Verification', 'Status', 'Actions'];

  const renderRows = () => {
    if (!detail) return null;
    switch (detail.type) {
      case 'users':
      case 'verified':
        return detail.data.map((u) => (
          <tr key={u._id} className="hover:bg-gray-50">
            <td className="px-4 py-3 font-medium text-gray-900">{u.firstName} {u.lastName} {u.role === 'admin' && '🛡️'}</td>
            <td className="px-4 py-3 text-gray-500">{u.email}</td>
            <td className="px-4 py-3 text-gray-500">{u.university}</td>
            <td className="px-4 py-3">{u.verificationStatus}</td>
            <td className="px-4 py-3">{u.isBanned ? '⛔ Banned' : '✅ Active'}</td>
            <td className="px-4 py-3">
              {!u.isBanned && (
                <button onClick={() => handleBanUser(u._id)} className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700">Ban</button>
              )}
            </td>
          </tr>
        ));
      case 'projects':
        return detail.data.map((p) => (
          <tr key={p._id} className="hover:bg-gray-50">
            <td className="px-4 py-3 font-medium text-gray-900">{p.title}</td>
            <td className="px-4 py-3 text-gray-500">{p.creator?.firstName} {p.creator?.lastName}</td>
            <td className="px-4 py-3">{p.status}</td>
            <td className="px-4 py-3">{p.reportCount}</td>
            <td className="px-4 py-3">
              <button onClick={() => handleDeletePost(p._id)} className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700">Delete</button>
            </td>
          </tr>
        ));
      case 'questions':
        return detail.data.map((q) => (
          <tr key={q._id} className="hover:bg-gray-50">
            <td className="px-4 py-3 font-medium text-gray-900">{q.title}</td>
            <td className="px-4 py-3 text-gray-500">{q.author?.firstName} {q.author?.lastName}</td>
            <td className="px-4 py-3">{q.status}</td>
            <td className="px-4 py-3">{q.isResolved ? '✅ Solved' : '⏳ Open'}</td>
            <td className="px-4 py-3">
              <button onClick={() => handleDeletePost(q._id)} className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700">Delete</button>
            </td>
          </tr>
        ));
      case 'applications':
      case 'accepted':
        return detail.data.map((a) => (
          <tr key={a._id} className="hover:bg-gray-50">
            <td className="px-4 py-3 font-medium text-gray-900">{a.applicant?.firstName} {a.applicant?.lastName}</td>
            <td className="px-4 py-3 text-gray-500">{a.project?.title}</td>
            <td className="px-4 py-3">{a.status}</td>
          </tr>
        ));
      case 'reports':
        return detail.data.map((r) => (
          <tr key={r._id} className="hover:bg-gray-50">
            <td className="px-4 py-3 font-medium text-gray-900">{r.reason}</td>
            <td className="px-4 py-3 text-gray-500">{r.targetType}</td>
            <td className="px-4 py-3 text-gray-500">{r.reporter?.firstName} {r.reporter?.lastName}</td>
            <td className="px-4 py-3">{r.status}</td>
          </tr>
        ));
      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">🛡️ Admin Moderation Panel</h1>
      <p className="text-sm text-gray-500 mb-6">Moderate content, verify students, and monitor platform health.</p>

      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => { setTab('reports'); setDetail(null); }} className={`px-4 py-2 rounded text-sm font-medium transition ${tab === 'reports' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          🚩 Reports ({reports.length})
        </button>
        <button onClick={() => { setTab('verifications'); setDetail(null); }} className={`px-4 py-2 rounded text-sm font-medium transition ${tab === 'verifications' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          🪪 Verifications ({verifications.length})
        </button>
        <button onClick={() => { setTab('analytics'); setDetail(null); }} className={`px-4 py-2 rounded text-sm font-medium transition ${tab === 'analytics' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          📊 Analytics
        </button>
      </div>

      {message && <div className="bg-blue-50 text-blue-800 p-3 rounded text-sm mb-4">{message}</div>}

      {loading ? (
        <p className="text-gray-500 text-center">Loading...</p>
      ) : tab === 'reports' ? (
        reports.length === 0 ? (
          <p className="text-gray-500 text-center">No pending reports. The community is clean! 🎉</p>
        ) : (
          <div className="grid gap-6">
            {reports.map((r) => (
              <div key={r._id} className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded">{r.reason}</span>
                    <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                      {r.targetInfo?.type === 'Question' ? '💡 Q&A Post' : '📌 Project Post'}
                    </span>
                    <p className="text-xs text-gray-400 mt-2">Reported by {r.reporter?.firstName} {r.reporter?.lastName}</p>
                  </div>
                  <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()}</p>
                </div>
                <div className="mt-4 bg-gray-50 p-4 rounded">
                  <p className="text-sm font-semibold text-gray-800">{r.targetInfo?.title || 'Post already removed'}</p>
                  {r.targetInfo?.creator && (
                    <p className="text-xs text-gray-500 mt-1">Author: {r.targetInfo.creator.firstName} {r.targetInfo.creator.lastName} • {r.targetInfo.creator.university}</p>
                  )}
                </div>
                               <div className="mt-4 flex gap-3">
                  {r.targetInfo && r.targetInfo.type !== 'User' && (
                    <button onClick={() => handleDeletePost(r.targetInfo._id)} className="bg-red-600 text-white text-sm px-4 py-2 rounded hover:bg-red-700 transition">🗑️ Delete Post</button>
                  )}
                  {r.targetInfo?.type === 'User' && (
                    <button onClick={() => handleBanUser(r.targetInfo._id)} className="bg-gray-800 text-white text-sm px-4 py-2 rounded hover:bg-black transition">⛔ Ban User</button>
                  )}
                  {r.targetInfo?.creator && (
                    <button onClick={() => handleBanUser(r.targetInfo.creator._id)} className="bg-gray-800 text-white text-sm px-4 py-2 rounded hover:bg-black transition">⛔ Ban User</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
          ) : tab === 'verifications' ? (
        <div className="space-y-6">
        {nameChanges.length > 0 && (
          <div className="grid gap-4">
            <h3 className="font-semibold text-gray-800">📝 Name Change Requests</h3>
            {nameChanges.map((u) => (
              <div key={u._id} className="bg-white p-5 rounded-lg shadow border-l-4 border-purple-500 flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Current: <span className="font-semibold">{u.firstName} {u.lastName}</span></p>
                  <p className="text-sm text-gray-800 mt-1">Requested: <span className="font-semibold text-purple-700">{u.nameChangeRequest?.firstName} {u.nameChangeRequest?.lastName}</span></p>
                  <p className="text-xs text-gray-400 mt-1">{u.email}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApproveName(u._id)} className="bg-green-600 text-white text-xs px-3 py-2 rounded hover:bg-green-700">✅ Approve</button>
                  <button onClick={() => handleRejectName(u._id)} className="bg-red-600 text-white text-xs px-3 py-2 rounded hover:bg-red-700">❌ Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {verifications.length === 0 ? (
          <p className="text-gray-500 text-center">No pending verifications.</p>
        ) : (
          <div className="grid gap-6">
            {verifications.map((u) => (
              <div key={u._id} className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900">{u.firstName} {u.lastName}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                    <p className="text-xs text-gray-500 mt-1">🎓 {u.university} • {u.major}</p>
                  </div>
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">⏳ Pending</span>
                </div>
                {u.idCardUrl && (
                  <div className="mt-4">
                    <a href={u.idCardUrl?.startsWith('http') ? u.idCardUrl : `${SERVER_URL}${u.idCardUrl}`} target="_blank" rel="noreferrer">
                      <img src={u.idCardUrl?.startsWith('http') ? u.idCardUrl : `${SERVER_URL}${u.idCardUrl}`} alt="Student ID" className="h-40 rounded border border-gray-200 hover:opacity-80 transition" />
                    </a>
                  </div>
                )}
                <div className="mt-4 flex gap-3">
                  <button onClick={() => handleApprove(u._id)} className="bg-green-600 text-white text-sm px-4 py-2 rounded hover:bg-green-700 transition">✅ Approve</button>
                  <button onClick={() => handleReject(u._id)} className="bg-red-600 text-white text-sm px-4 py-2 rounded hover:bg-red-700 transition">❌ Reject</button>
                </div>
              </div>
                      ))}
          </div>
        )}
        </div>
      ) : !t ? (
        <p className="text-gray-500 text-center">No analytics data.</p>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Users" value={t.totalUsers} accent="text-blue-600" onClick={() => openDetail('users', 'All Users', USER_HEADERS)} />
            <StatCard label="Verified Students" value={t.verifiedUsers} accent="text-green-600" onClick={() => openDetail('verified', 'Verified Students', USER_HEADERS)} />
            <StatCard label="Pending Verifications" value={t.pendingVerifications} accent="text-yellow-600" onClick={() => setTab('verifications')} />
            <StatCard label="Project Posts" value={t.totalProjects} accent="text-blue-600" onClick={() => openDetail('projects', 'All Project Posts', ['Title', 'Creator', 'Status', 'Reports', 'Actions'])} />
            <StatCard label="Questions" value={t.totalQuestions} accent="text-purple-600" onClick={() => openDetail('questions', 'All Questions', ['Title', 'Author', 'Status', 'Solved', 'Actions'])} />
            <StatCard label="Applications" value={t.totalApplications} accent="text-blue-600" onClick={() => openDetail('applications', 'All Applications', ['Applicant', 'Project', 'Status'])} />
            <StatCard label="Accepted Teams" value={t.acceptedApplications} accent="text-green-600" onClick={() => openDetail('accepted', 'Accepted Teams', ['Applicant', 'Project', 'Status'])} />
            <StatCard label="Pending Reports" value={t.pendingReports} accent="text-red-600" onClick={() => setTab('reports')} />
          </div>

          {detail && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-800">{detail.title} ({detail.data.length})</h3>
                <button onClick={() => setDetail(null)} className="text-gray-500 hover:text-gray-800 text-xl">&times;</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                    <tr>{detail.headers.map((h) => <th key={h} className="px-4 py-2">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {detail.data.length === 0 ? (
                      <tr><td colSpan={detail.headers.length} className="px-4 py-6 text-center text-gray-400">Empty list.</td></tr>
                    ) : (
                      renderRows()
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-800 mb-4">🎓 Users by University</h3>
              <BarChart data={stats.usersByUniversity} color="bg-blue-600" />
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-800 mb-4">🚩 Reports by Reason</h3>
              <BarChart data={stats.reportsByReason} color="bg-red-600" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;