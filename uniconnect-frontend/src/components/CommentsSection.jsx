import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { commentAPI, SERVER_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ReportModal from './ReportModal';

const CommentsSection = ({ projectId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');
    const [reportId, setReportId] = useState(null);
      const [searchParams] = useSearchParams();

  const load = () => commentAPI.get(projectId).then(({ data }) => setComments(data)).catch(() => {});
  useEffect(() => { load(); }, [projectId]);

    useEffect(() => {
    const target = searchParams.get('comment');
    if (!target || comments.length === 0) return;
    const t = setTimeout(() => {
      const el = document.getElementById(`comment-${target}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-4', 'ring-yellow-400');
        setTimeout(() => el.classList.remove('ring-4', 'ring-yellow-400'), 2500);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [comments, searchParams]);

  const post = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try { await commentAPI.create(projectId, { text: text.trim() }); setText(''); load(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to comment'); }
  };

  const postReply = async (parentId) => {
    if (!replyText.trim()) return;
    try { await commentAPI.create(projectId, { text: replyText.trim(), parent: parentId }); setReplyText(''); setReplyTo(null); load(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to reply'); }
  };

  const vote = async (id, value) => { try { await commentAPI.vote(id, value); load(); } catch (e) { alert('Vote failed'); } };

  const report = (id) => setReportId(id);

  const del = async (id) => {
    if (!window.confirm('Delete this comment?')) return;
    try { await commentAPI.delete(id); load(); } catch (e) { alert(e.response?.data?.message || 'Failed'); }
  };

  const avatar = (u) => u?.avatarUrl ? (u.avatarUrl.startsWith('http') ? u.avatarUrl : `${SERVER_URL}${u.avatarUrl}`) : null;

  const renderComment = (c, isReply) => (
        <div key={c._id} id={`comment-${c._id}`} className={`${isReply ? 'ml-10 mt-2' : 'mt-4'} rounded-lg transition`}>
      <div className="flex gap-3">
        {avatar(c.author) ? <img src={avatar(c.author)} className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">{c.author?.firstName?.[0]}</div>}
        <div className="flex-1 bg-gray-50 rounded-lg p-3">
          <div className="flex justify-between items-center">
            <p className="text-sm font-semibold text-gray-900">{c.author?.firstName} {c.author?.lastName}</p>
            <p className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString()}</p>
          </div>
          <p className="text-sm text-gray-700 mt-1">{c.text}</p>
          <div className="flex items-center gap-3 mt-2">
            <button onClick={() => vote(c._id, 1)} className={`text-xs font-medium ${c.myVote === 1 ? 'text-green-600' : 'text-gray-500'} hover:text-green-600`}>▲</button>
            <span className="text-xs font-bold text-gray-700">{c.score}</span>
            <button onClick={() => vote(c._id, -1)} className={`text-xs font-medium ${c.myVote === -1 ? 'text-red-600' : 'text-gray-500'} hover:text-red-600`}>▼</button>
            {!isReply && <button onClick={() => { setReplyTo(replyTo === c._id ? null : c._id); setReplyText(''); }} className="text-xs text-blue-600 hover:underline">Reply</button>}
            <button onClick={() => report(c._id)} className="text-xs text-gray-400 hover:text-red-600">🚩 Report</button>
            {user && (user._id === c.author?._id) && <button onClick={() => del(c._id)} className="text-xs text-gray-400 hover:text-red-600">🗑️</button>}
          </div>
        </div>
      </div>

      {!isReply && replyTo === c._id && (
        <form onSubmit={(e) => { e.preventDefault(); postReply(c._id); }} className="ml-10 mt-2 flex gap-2">
          <input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write a reply..." className="input-field flex-1" />
          <button type="submit" className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Reply</button>
        </form>
      )}

      {!isReply && (c.replies || []).map((r) => renderComment(r, true))}
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow p-6 mt-6">
      <h3 className="font-semibold text-gray-800 mb-2">💬 Discussion ({comments.length})</h3>
      <form onSubmit={post} className="flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a professional comment..." className="input-field flex-1" />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Post</button>
      </form>
      <div className="mt-2">{comments.map((c) => renderComment(c, false))}</div>

      {reportId && (
        <ReportModal
          onSubmit={(payload) => commentAPI.report(reportId, payload)}
          onClose={() => setReportId(null)}
          onReported={() => setReportId(null)}
        />
      )}
    </div>
  );
};

export default CommentsSection;