import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const FollowListModal = ({ ownerId, mode, onClose }) => {
  const { user, refreshUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchList = useCallback(async () => {
    try {
      const { data } = mode === 'followers'
        ? await userAPI.getFollowers(ownerId)
        : await userAPI.getFollowing(ownerId);
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [ownerId, mode]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const isMe = user._id === ownerId;

  const iFollow = (id) =>
    (user.following || []).some((f) => (f._id || f).toString() === id.toString());

  const act = async (targetId, type) => {
    try {
      if (type === 'remove') await userAPI.removeFollower(targetId);
      else if (type === 'unfollow') await userAPI.unfollow(targetId);
      else await userAPI.follow(targetId);
      await refreshUser();
      fetchList();
    } catch (e) {
      alert(e.response?.data?.message || 'Action failed');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 max-h-[70vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {mode === 'followers' ? ' Followers' : ' Following'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl leading-none">&times;</button>
        </div>

        {loading ? (
          <p className="text-gray-500 text-center">Loading...</p>
        ) : users.length === 0 ? (
          <p className="text-gray-500 text-center">Nothing here yet.</p>
        ) : (
          <div className="space-y-3">
            {users.map((u) => (
              <div key={u._id} className="flex items-center justify-between border border-gray-100 rounded-lg p-3">
                <button
                  onClick={() => { onClose(); navigate(`/user/${u._id}`); }}
                  className="flex items-center gap-3 text-left"
                >
                  {u.avatarUrl ? (
                    <img src={u.avatarUrl.startsWith('http') ? u.avatarUrl : `http://localhost:5000${u.avatarUrl}`} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                      {u.firstName?.[0]}{u.lastName?.[0]}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{u.firstName} {u.lastName}</p>
                    <p className="text-xs text-gray-500">{u.university}</p>
                  </div>
                </button>

                {isMe ? (
                  mode === 'followers' ? (
                    <button onClick={() => act(u._id, 'remove')} className="text-xs bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700">Remove</button>
                  ) : (
                    <button onClick={() => act(u._id, 'unfollow')} className="text-xs bg-gray-600 text-white px-3 py-1.5 rounded hover:bg-gray-700">Unfollow</button>
                  )
                ) : u._id !== user._id ? (
                  iFollow(u._id) ? (
                    <button onClick={() => act(u._id, 'unfollow')} className="text-xs bg-gray-600 text-white px-3 py-1.5 rounded hover:bg-gray-700">Unfollow</button>
                  ) : (
                    <button onClick={() => act(u._id, 'follow')} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700">Follow</button>
                  )
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowListModal;