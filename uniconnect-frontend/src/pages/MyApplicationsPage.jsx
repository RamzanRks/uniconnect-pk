import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { applicationAPI, messagesAPI } from '../services/api';

const MyApplicationsPage = () => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    applicationAPI.getMine()
      .then(({ data }) => setApps(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const startChat = async (a) => {
    try {
      const { data } = await messagesAPI.open({ projectId: a.project._id });
      navigate(`/messages?c=${data._id}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Chat unavailable');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">📋 My Applications</h1>

      {loading ? (
        <p className="text-gray-500 text-center">Loading...</p>
      ) : apps.length === 0 ? (
        <p className="text-gray-500 text-center">You haven't applied to any projects yet.</p>
      ) : (
        <div className="grid gap-4">
          {apps.map((a) => (
            <div key={a._id} className="bg-white p-5 rounded-lg shadow border border-gray-100 flex justify-between items-center">
              <div>
                <p className="font-semibold text-gray-900">{a.project?.title}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Owner: {a.project?.creator?.firstName} {a.project?.creator?.lastName} • {a.project?.creator?.university}
                </p>
                <p className="text-xs text-gray-400 mt-1 italic">"{a.message}"</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  a.status === 'accepted' ? 'bg-green-100 text-green-800' :
                  a.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {a.status}
                </span>
                {a.status === 'accepted' && (
                  <button onClick={() => startChat(a)} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition">
                    💬 Open Team Chat
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyApplicationsPage;