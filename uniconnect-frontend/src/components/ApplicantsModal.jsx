import { useState, useEffect, useCallback } from 'react';
import { applicationAPI } from '../services/api';

const ApplicantsModal = ({ projectId, onClose }) => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchApps = useCallback(async () => {
    try {
      const { data } = await applicationAPI.getForProject(projectId);
      setApps(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load applicants');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  const updateStatus = async (id, status) => {
    try {
      await applicationAPI.updateStatus(id, status);
      fetchApps();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">👥 Project Applicants</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl leading-none">&times;</button>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded text-sm mb-4">{error}</div>}

        {loading ? (
          <p className="text-gray-500 text-center">Loading applicants...</p>
        ) : apps.length === 0 ? (
          <p className="text-gray-500 text-center">No applications yet.</p>
        ) : (
          <div className="space-y-4">
            {apps.map((a) => (
              <div key={a._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {a.applicant?.firstName} {a.applicant?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {a.applicant?.university} • {a.applicant?.major}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    a.status === 'accepted' ? 'bg-green-100 text-green-800' :
                    a.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {a.status}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1 mt-2">
                  {a.applicant?.skills?.map((s, i) => (
                    <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded">{s}</span>
                  ))}
                </div>

                <p className="text-sm text-gray-700 mt-2 italic">"{a.message}"</p>
                <p className="text-xs text-gray-400 mt-1">{a.applicant?.email}</p>

                {a.status === 'pending' && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => updateStatus(a._id, 'accepted')} className="bg-green-600 text-white text-xs px-3 py-1.5 rounded hover:bg-green-700 transition">
                      ✅ Accept
                    </button>
                    <button onClick={() => updateStatus(a._id, 'rejected')} className="bg-red-600 text-white text-xs px-3 py-1.5 rounded hover:bg-red-700 transition">
                      ❌ Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicantsModal;