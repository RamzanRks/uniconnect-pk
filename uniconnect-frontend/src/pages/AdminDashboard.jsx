import { useState, useEffect, useCallback } from 'react';
import { adminAPI, SERVER_URL } from '../services/api';

const AdminDashboard = () => {
  const [tab, setTab] = useState('reports');
  const [reports, setReports] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [rep, ver] = await Promise.all([
        adminAPI.getPendingReports(),
        adminAPI.getPendingVerifications(),
      ]);
      setReports(rep.data);
      setVerifications(ver.data);
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post permanently?')) return;
    try {
      await adminAPI.deletePost(postId);
      setMessage('✅ Post deleted and reports resolved.');
      fetchData();
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || 'Failed to delete'));
    }
  };

  const handleBanUser = async (userId) => {
    if (!window.confirm('Ban this user permanently?')) return;
    try {
      await adminAPI.banUser(userId);
      setMessage('✅ User banned and all their content hidden.');
      fetchData();
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || 'Failed to ban'));
    }
  };

  const handleApprove = async (id) => {
    try {
      await adminAPI.approveVerification(id);
      setMessage('✅ User verified successfully.');
      fetchData();
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || 'Failed to approve'));
    }
  };

  const handleReject = async (id) => {
    try {
      await adminAPI.rejectVerification(id);
      setMessage('❌ Verification rejected.');
      fetchData();
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || 'Failed to reject'));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">🛡️ Admin Moderation Panel</h1>
      <p className="text-sm text-gray-500 mb-6">Review reported content and verify student IDs.</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('reports')}
          className={`px-4 py-2 rounded text-sm font-medium transition ${tab === 'reports' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          🚩 Reports ({reports.length})
        </button>
        <button
          onClick={() => setTab('verifications')}
          className={`px-4 py-2 rounded text-sm font-medium transition ${tab === 'verifications' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          🪪 Verifications ({verifications.length})
        </button>
      </div>

      {message && (
        <div className="bg-blue-50 text-blue-800 p-3 rounded text-sm mb-4">{message}</div>
      )}

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
                    <p className="text-xs text-gray-400 mt-2">
                      Reported by {r.reporter?.firstName} {r.reporter?.lastName} ({r.reporter?.email})
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()}</p>
                </div>

                {r.details && <p className="mt-3 text-sm text-gray-600 italic">"{r.details}"</p>}

                <div className="mt-4 bg-gray-50 p-4 rounded">
                  <p className="text-sm font-semibold text-gray-800">{r.targetInfo?.title || 'Post already removed'}</p>
                  {r.targetInfo?.body && <p className="text-xs text-gray-500 mt-1">{r.targetInfo.body}</p>}
                  {r.targetInfo?.creator && (
                    <p className="text-xs text-gray-500 mt-1">
                      Author: {r.targetInfo.creator.firstName} {r.targetInfo.creator.lastName} • {r.targetInfo.creator.university}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex gap-3">
                  {r.targetInfo && (
                    <button onClick={() => handleDeletePost(r.targetInfo._id)} className="bg-red-600 text-white text-sm px-4 py-2 rounded hover:bg-red-700 transition">
                      🗑️ Delete Post
                    </button>
                  )}
                  {r.targetInfo?.creator && (
                    <button onClick={() => handleBanUser(r.targetInfo.creator._id)} className="bg-gray-800 text-white text-sm px-4 py-2 rounded hover:bg-black transition">
                      ⛔ Ban User
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : verifications.length === 0 ? (
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
                  <p className="text-xs text-gray-500 mb-1">Uploaded ID Card:</p>
                  <a href={`${SERVER_URL}${u.idCardUrl}`} target="_blank" rel="noreferrer">
                    <img
                      src={`${SERVER_URL}${u.idCardUrl}`}
                      alt="Student ID"
                      className="h-40 rounded border border-gray-200 hover:opacity-80 transition"
                    />
                  </a>
                </div>
              )}

              <div className="mt-4 flex gap-3">
                <button onClick={() => handleApprove(u._id)} className="bg-green-600 text-white text-sm px-4 py-2 rounded hover:bg-green-700 transition">
                  ✅ Approve Verification
                </button>
                <button onClick={() => handleReject(u._id)} className="bg-red-600 text-white text-sm px-4 py-2 rounded hover:bg-red-700 transition">
                  ❌ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;