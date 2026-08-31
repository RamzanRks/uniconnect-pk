import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectAPI, SERVER_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ApplyModal from '../components/ApplyModal';
import ApplicantsModal from '../components/ApplicantsModal';
import ReactionBar from '../components/ReactionBar';
import BookmarkButton from '../components/BookmarkButton';
import CommentsSection from '../components/CommentsSection';
import FileVault from '../components/FileVault';
import PollsSection from '../components/PollsSection';

const ProjectDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [showApply, setShowApply] = useState(false);
  const [showApplicants, setShowApplicants] = useState(false);
    const addShot = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    const fd = new FormData(); fd.append('shot', f);
    try { const { data } = await projectAPI.addScreenshot(id, fd); setPost(data); }
    catch (err) { alert(err.response?.data?.message || 'Upload failed'); }
    e.target.value = '';
  };
  const removeShot = async (url) => {
    if (!window.confirm('Remove this screenshot?')) return;
    try { const { data } = await projectAPI.removeScreenshot(id, url); setPost(data); } catch (err) { alert('Failed'); }
  };

  useEffect(() => {
    projectAPI.getProject(id).then(({ data }) => setPost(data)).catch(() => setPost(null));
  }, [id]);

  if (!post) return <p className="text-center p-10 text-gray-500">Loading project...</p>;
  const isOwner = user && post.creator && user._id === post.creator._id;
  const isTeam = user && (isOwner || (post.team || []).some((m) => m._id === user._id));

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white p-8 rounded-xl shadow">
        <div className="flex justify-between items-start">
          <h1 className="text-2xl font-bold text-gray-900">{post.title}</h1>
          <BookmarkButton type="ProjectPost" id={post._id} />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Posted by{' '}
          <Link to={`/user/${post.creator?._id}`} className="text-blue-600 font-medium hover:underline">
            {post.creator?.firstName} {post.creator?.lastName}
          </Link>{' '}
          • {post.creator?.university} {post.creator?.verificationStatus === 'verified' && '✅'}
        </p>
        <div className="flex gap-2 mt-3">
          <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full capitalize">{post.progress}</span>
          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">{post.status}</span>
        </div>
        <p className="mt-5 text-gray-700 whitespace-pre-line">{post.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {post.requiredSkills.map((s, i) => (
            <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded font-medium">{s}</span>
          ))}

                                       <PollsSection projectId={id} isOwner={isOwner} />

        </div>

                {(post.screenshots || []).length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">🖼️ Screenshots</p>
            <div className="grid grid-cols-3 gap-2">
              {post.screenshots.map((s, i) => (
                <div key={i} className="relative group">
                  <img src={s.startsWith('http') ? s : `${SERVER_URL}${s}`} className="rounded-lg h-24 w-full object-cover transition group-hover:scale-105" />
                  {isOwner && <button onClick={() => removeShot(s)} className="absolute top-1 right-1 bg-red-600 text-white text-xs w-5 h-5 rounded-full opacity-0 group-hover:opacity-100">✕</button>}
                </div>
              ))}
            </div>
          </div>
        )}
        {isOwner && (post.screenshots || []).length < 3 && (
          <label className="inline-block mt-3 text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-200 cursor-pointer">
            🖼️ + Add Screenshot ({(post.screenshots || []).length}/3)
            <input type="file" accept="image/*" className="hidden" onChange={addShot} />
          </label>
        )}

        {post.team && post.team.length > 0 && (
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500 font-medium">👥 Team:</span>
            {post.team.map((m) => (
              <Link key={m._id} to={`/user/${m._id}`} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full hover:bg-green-100 font-medium">
                {m.firstName} {m.lastName}
              </Link>
            ))}
          </div>
        )}
        <ReactionBar type="ProjectPost" id={post._id} />
        <p className="text-xs text-gray-400 mt-4">Deadline: {new Date(post.deadline).toLocaleDateString()}</p>
        <div className="mt-6">
          {isOwner ? (
            <button onClick={() => setShowApplicants(true)} className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-black">👥 View Applicants</button>
          ) : (
            <button onClick={() => setShowApply(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">🤝 Apply to Join</button>
          )}
        </div>
      </div>

      <FileVault projectId={post._id} canUpload={isTeam || user?.role === 'admin'} />
      <CommentsSection projectId={post._id} />

      {showApply && <ApplyModal projectId={post._id} onClose={() => setShowApply(false)} />}
      {showApplicants && <ApplicantsModal projectId={post._id} onClose={() => setShowApplicants(false)} />}
    </div>
  );
};

export default ProjectDetailPage;