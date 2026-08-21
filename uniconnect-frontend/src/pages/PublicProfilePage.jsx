import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { userAPI, SERVER_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ReportModal from '../components/ReportModal';
import FollowListModal from '../components/FollowListModal';

const PublicProfilePage = () => {
  const { id } = useParams();
  const { user, refreshUser } = useAuth();
  const [data, setData] = useState(null);
  const [followList, setFollowList] = useState(null);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    userAPI.getProfile(id)
      .then(({ data }) => setData(data))
      .catch(() => setData(null));
  }, [id]);

  if (!data) return <p className="text-center p-10 text-gray-500">Loading profile...</p>;

  const u = data.user;
  const isMe = user && user._id === u._id;
  const iFollow = user && (user.following || []).some((f) => (f._id || f).toString() === u._id.toString());

  const toggleFollow = async () => {
    try {
      if (iFollow) await userAPI.unfollow(u._id);
      else await userAPI.follow(u._id);
      await refreshUser();
      const { data: fresh } = await userAPI.getProfile(id);
      setData(fresh);
    } catch (e) {
      alert(e.response?.data?.message || 'Action failed');
    }
  };

  const avatarSrc = u.avatarUrl
    ? (u.avatarUrl.startsWith('http') ? u.avatarUrl : `${SERVER_URL}${u.avatarUrl}`)
    : null;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow p-8">
        <div className="flex items-start gap-6">
          {avatarSrc ? (
            <img src={avatarSrc} alt="avatar" className="w-24 h-24 rounded-full object-cover border-4 border-blue-100" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-blue-600 text-white flex items-center justify-center text-4xl font-bold">
              {u.firstName?.[0]}{u.lastName?.[0]}
            </div>
          )}

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3 flex-wrap">
              {u.firstName} {u.lastName}
              {u.verificationStatus === 'verified' && <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">✅ Verified</span>}
              {u.role === 'admin' && <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">🛡️ Admin</span>}
            </h1>
            {u.username && <p className="text-sm text-blue-600 font-medium">@{u.username}</p>}
            <p className="text-sm text-gray-600 mt-1">🎓 {u.university} • {u.major}</p>
            {u.location && <p className="text-sm text-gray-600">📍 {u.location}</p>}

            <div className="flex gap-4 mt-3">
              <button onClick={() => setFollowList('followers')} className="text-sm text-gray-700 hover:text-blue-600">
                <span className="font-bold">{(u.followers || []).length}</span> Followers
              </button>
              <button onClick={() => setFollowList('following')} className="text-sm text-gray-700 hover:text-blue-600">
                <span className="font-bold">{(u.following || []).length}</span> Following
              </button>
            </div>

            {!isMe && (
              <div className="flex gap-2 mt-4">
                <button
                  onClick={toggleFollow}
                  className={`text-sm px-4 py-2 rounded transition ${iFollow ? 'bg-gray-600 text-white hover:bg-gray-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                  {iFollow ? 'Unfollow' : '➕ Follow'}
                </button>
                <button onClick={() => setShowReport(true)} className="text-sm bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200">
                  🚩 Report
                </button>
              </div>
            )}
          </div>
        </div>

        {(u.links?.github || u.links?.linkedin || u.links?.website) && (
          <div className="flex gap-3 mt-5 flex-wrap">
            {u.links.github && <a href={u.links.github} target="_blank" rel="noreferrer" className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded hover:bg-black"> GitHub</a>}
            {u.links.linkedin && <a href={u.links.linkedin} target="_blank" rel="noreferrer" className="text-xs bg-blue-700 text-white px-3 py-1.5 rounded hover:bg-blue-800">💼 LinkedIn</a>}
            {u.links.website && <a href={u.links.website} target="_blank" rel="noreferrer" className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700">🌐 Website</a>}
          </div>
        )}

        {u.bio && <p className="mt-5 text-gray-700">{u.bio}</p>}

        <div className="mt-4 flex flex-wrap gap-2">
          {(u.skills || []).map((s, i) => (
            <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded font-medium">{s}</span>
          ))}
        </div>

        {(u.education || []).length > 0 && (
          <div className="mt-6 border-t pt-4">
            <h3 className="font-semibold text-gray-800 text-sm mb-2">🎓 Education</h3>
            {u.education.map((e, i) => (
              <p key={i} className="text-sm text-gray-600">
                <span className="font-medium">{e.degree}</span>{e.field && ` in ${e.field}`} — {e.institution}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Their public activity */}
      <div className="grid gap-6 mt-6">
        {data.projects.length > 0 && (
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-semibold text-gray-800 mb-3">📌 Projects</h3>
            {data.projects.map((p) => (
              <div key={p._id} className="border-b border-gray-100 py-2 last:border-0">
                <p className="text-sm font-medium text-gray-900">{p.title}</p>
                <p className="text-xs text-gray-500">{p.requiredSkills.join(', ')}</p>
              </div>
            ))}
          </div>
        )}
        {data.questions.length > 0 && (
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-semibold text-gray-800 mb-3">💡 Questions</h3>
            {data.questions.map((q) => (
              <div key={q._id} className="border-b border-gray-100 py-2 last:border-0">
                <p className="text-sm font-medium text-gray-900">{q.title}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showReport && (
        <ReportModal
          showArea
          onSubmit={(payload) => userAPI.report(u._id, payload)}
          onClose={() => setShowReport(false)}
        />
      )}
      {followList && (
        <FollowListModal ownerId={u._id} mode={followList} onClose={() => setFollowList(null)} />
      )}
    </div>
  );
};

export default PublicProfilePage;