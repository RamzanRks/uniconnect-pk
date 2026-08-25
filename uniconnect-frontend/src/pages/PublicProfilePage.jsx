import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { userAPI, ratingAPI, SERVER_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ReportModal from '../components/ReportModal';
import FollowListModal from '../components/FollowListModal';
import RatingModal from '../components/RatingModal';
import PresenceDot from '../components/PresenceDot';

const PublicProfilePage = () => {
  const { id } = useParams();
  const { user, refreshUser } = useAuth();
  const [data, setData] = useState(null);
  const [activity, setActivity] = useState([]);
  const [ratingsData, setRatingsData] = useState(null);
  const [followList, setFollowList] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [rating, setRating] = useState(null);

  useEffect(() => {
    userAPI.getProfile(id)
      .then(({ data }) => setData(data))
      .catch(() => setData(null));
    userAPI.getActivity(id).then(({ data }) => setActivity(data)).catch(() => {});
    ratingAPI.getUser(id).then(({ data }) => setRatingsData(data)).catch(() => {});
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

  const typeIcon = { project: '📌', question: '💡', answer: '💬', rating: '⭐' };

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
              <PresenceDot userId={u._id} />
            </h1>
            {u.username && <p className="text-sm text-blue-600 font-medium">@{u.username}</p>}
            <p className="text-sm text-gray-600 mt-1">🎓 {u.university} • {u.major}</p>
            {u.location && <p className="text-sm text-gray-600">📍 {u.location}</p>}

            <div className="flex flex-wrap gap-2 mt-2">
              {(data.badges || []).map((b, i) => (
                <span key={i} className="text-xs bg-yellow-50 text-yellow-800 border border-yellow-200 px-2 py-1 rounded-full">{b}</span>
              ))}
            </div>

            <div className="flex gap-4 mt-3">
              <button onClick={() => setFollowList('followers')} className="text-sm text-gray-700 hover:text-blue-600">
                <span className="font-bold">{(u.followers || []).length}</span> Followers
              </button>
              <button onClick={() => setFollowList('following')} className="text-sm text-gray-700 hover:text-blue-600">
                <span className="font-bold">{(u.following || []).length}</span> Following
              </button>
              <span className="text-sm text-gray-500">👁️ {data.viewCount || 0} views</span>
              {data.avgRating > 0 && (
                <span className="text-sm text-gray-700">⭐ {data.avgRating} ({data.ratingCount})</span>
              )}
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
            {u.links.github && <a href={u.links.github} target="_blank" rel="noreferrer" className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded hover:bg-black">🐙 GitHub</a>}
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

      {/* Pinned projects */}
      {(data.pinnedProjects || []).length > 0 && (
        <div className="bg-white rounded-xl shadow p-6 mt-6">
          <h3 className="font-semibold text-gray-800 mb-3">📍 Pinned Projects</h3>
          {data.pinnedProjects.map((p) => (
            <div key={p._id} className="border-b border-gray-100 py-2 last:border-0">
              <p className="text-sm font-medium text-gray-900">{p.title}</p>
              <p className="text-xs text-gray-500 capitalize">{p.progress}</p>
            </div>
          ))}
        </div>
      )}

      {/* Activity feed */}
      {activity.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6 mt-6">
          <h3 className="font-semibold text-gray-800 mb-3">📊 Activity</h3>
          {activity.map((a, i) => (
            <div key={i} className="border-b border-gray-100 py-2 last:border-0">
              <p className="text-sm text-gray-800">{typeIcon[a.type] || '•'} {a.text}</p>
              <p className="text-xs text-gray-400">{new Date(a.date).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}

      {/* Ratings received */}
      {ratingsData && ratingsData.count > 0 && (
        <div className="bg-white rounded-xl shadow p-6 mt-6">
          <h3 className="font-semibold text-gray-800 mb-3">⭐ Ratings ({ratingsData.count}) — {ratingsData.avg}/5</h3>
          {ratingsData.ratings.map((r) => (
            <div key={r._id} className="border-b border-gray-100 py-2 last:border-0">
              <p className="text-sm text-gray-800">{'⭐'.repeat(r.stars)} — {r.comment || 'No comment'}</p>
              <p className="text-xs text-gray-400">by {r.rater?.firstName} {r.rater?.lastName}</p>
            </div>
          ))}
        </div>
      )}

      {/* Their public projects */}
      {data.projects.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6 mt-6">
          <h3 className="font-semibold text-gray-800 mb-3">📌 Projects</h3>
          {data.projects.map((p) => (
            <div key={p._id} className="border-b border-gray-100 py-2 last:border-0">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-900">{p.title}</p>
                  <p className="text-xs text-gray-500">{p.requiredSkills.join(', ')} • <span className="capitalize">{p.progress}</span></p>
                </div>
                {!isMe && (
                  <button onClick={() => setRating({ ratee: u._id, project: p._id })} className="text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600">
                    ⭐ Rate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Their questions */}
      {data.questions.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6 mt-6">
          <h3 className="font-semibold text-gray-800 mb-3">💡 Questions</h3>
          {data.questions.map((q) => (
            <div key={q._id} className="border-b border-gray-100 py-2 last:border-0">
              <p className="text-sm font-medium text-gray-900">{q.title}</p>
            </div>
          ))}
        </div>
      )}

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
      {rating && (
        <RatingModal ratee={rating.ratee} project={rating.project} onClose={() => setRating(null)} />
      )}
    </div>
  );
};

export default PublicProfilePage;