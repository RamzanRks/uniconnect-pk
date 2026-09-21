import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { userAPI, ratingAPI, endorsementAPI, messagesAPI, SERVER_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ReportModal from '../components/ReportModal';
import FollowListModal from '../components/FollowListModal';
import RatingModal from '../components/RatingModal';
import PresenceDot from '../components/PresenceDot';
import { Skeleton, Reveal } from '../components/fx';



/* ---------- Inline SVG icon set (Lucide-style) ---------- */
const Icon = {
  GraduationCap: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
  Coins: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/></svg>,
  MapPin: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>,
  Eye: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>,
  UserPlus: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>,
  UserMinus: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="22" x2="16" y1="11" y2="11"/></svg>,
  Flag: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>,
  MessageSquare: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Palette: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>,
  Github: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>,
  Linkedin: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>,
  Globe: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  Pin: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="17" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>,
  Activity: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  Lightbulb: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>,
  Award: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>,
  Briefcase: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
    Star: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,

};

/* Filled / empty 5-star renderer */
const Stars = ({ n, className = 'w-3.5 h-3.5' }) => (
  <span className="inline-flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <svg
        key={s}
        className={`${className} ${s <= n ? 'text-amber-400' : 'text-gray-200 dark:text-slate-700'}`}
        viewBox="0 0 24 24"
        fill={s <= n ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ))}
  </span>
);

const PublicProfilePage = () => {
  const { id } = useParams();
  const { user, refreshUser } = useAuth();
  const [data, setData] = useState(null);
  const [activity, setActivity] = useState([]);
  const [ratingsData, setRatingsData] = useState(null);
  const [endo, setEndo] = useState({ counts: [], mine: [] });
  const [followList, setFollowList] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [rating, setRating] = useState(null);
  const navigate = useNavigate();

  const load = () => {
    userAPI.getProfile(id).then(({ data }) => setData(data)).catch(() => setData(null));
    userAPI.getActivity(id).then(({ data }) => setActivity(data)).catch(() => {});
    ratingAPI.getUser(id).then(({ data }) => setRatingsData(data)).catch(() => {});
    endorsementAPI.get(id).then(({ data }) => setEndo(data)).catch(() => {});
  };

  useEffect(() => { load(); }, [id]);

  if (!data) return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );

  const u = data.user;
  const isMe = user && user._id === u._id;
  const iFollow = user && (user.following || []).some((f) => (f._id || f).toString() === u._id.toString());
  const endoCounts = Object.fromEntries((endo.counts || []).map((c) => [c._id, c.count]));

  const toggleFollow = async () => {
    try {
      if (iFollow) await userAPI.unfollow(u._id);
      else await userAPI.follow(u._id);
      await refreshUser();
      load();
    } catch (e) { alert(e.response?.data?.message || 'Action failed'); }
  };

  const toggleEndorse = async (skill) => {
    try {
      await endorsementAPI.toggle({ endorseeId: u._id, skill });
      const { data } = await endorsementAPI.get(u._id);
      setEndo(data);
    } catch (e) { alert(e.response?.data?.message || 'Failed'); }
  };

  const startChat = async () => {
    try {
      const { data } = await messagesAPI.open({ recipientId: u._id });
      navigate(`/inbox?c=${data._id}`);
    } catch (e) { alert(e.response?.data?.message || 'Cannot start chat'); }
  };

  const avatarSrc = u.avatarUrl
    ? (u.avatarUrl.startsWith('http') ? u.avatarUrl : `${SERVER_URL}${u.avatarUrl}`)
    : null;

  const typeIcon = {
    project: <Icon.Pin className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />,
    question: <Icon.Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />,
    answer: <Icon.MessageSquare className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />,
    rating: <Icon.Star className="w-4 h-4 text-amber-400 shrink-0" />,
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* ---------- Profile header card ---------- */}
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          {/* Gradient banner */}
          <div className="h-28 bg-gradient-to-r from-blue-600 to-violet-600 relative">
            <div className="absolute inset-0 dot-pattern opacity-30" />
          </div>

          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start gap-6 -mt-16 relative">
              {/* Avatar */}
              <div className="relative shrink-0">
             {avatarSrc ? (
  <img src={avatarSrc} alt="avatar" className="w-28 h-28 rounded-2xl object-cover ring-4 ring-white dark:ring-slate-900 shadow-lg" />
) : (
  <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white flex items-center justify-center text-4xl font-extrabold ring-4 ring-white dark:ring-slate-900 shadow-lg">
    {u.firstName?.[0]}{u.lastName?.[0]}
  </div>
)}
              </div>

              {/* Identity */}
              <div className="flex-1 sm:pt-12">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                    {u.firstName} {u.lastName}
                  </h1>
                  <PresenceDot userId={u._id} />
                </div>
                {u.username && <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-0.5">@{u.username}</p>}

                <div className="flex items-center gap-x-4 gap-y-1.5 flex-wrap mt-2.5 text-sm text-gray-600 dark:text-slate-300">
                  <span className="inline-flex items-center gap-1.5">
                    <Icon.GraduationCap className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                    <Link to={`/hub/${encodeURIComponent(u.university)}`} className="text-blue-600 dark:text-blue-400 hover:underline font-medium">{u.university}</Link>
                    <span className="text-gray-400 dark:text-slate-500">•</span> {u.major}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Icon.Coins className="w-4 h-4 text-amber-500" /> {u.points} pts
                  </span>
                  {u.location && (
                    <span className="inline-flex items-center gap-1.5">
                      <Icon.MapPin className="w-4 h-4 text-gray-400 dark:text-slate-500" /> {u.location}
                    </span>
                  )}
                </div>

                {/* Badges */}
                {(data.badges || []).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {(data.badges || []).map((b, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 px-2.5 py-1 rounded-full">
                        <Icon.Award className="w-3 h-3" /> {b}
                      </span>
                    ))}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-1 mt-4 flex-wrap">
                  <button onClick={() => setFollowList('followers')} className="group inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-1.5 rounded-full hover:bg-blue-50 dark:hover:bg-slate-800 transition active:scale-95">
                    <span className="font-extrabold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">{(u.followers || []).length}</span> Followers
                  </button>
                  <button onClick={() => setFollowList('following')} className="group inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-1.5 rounded-full hover:bg-blue-50 dark:hover:bg-slate-800 transition active:scale-95">
                    <span className="font-extrabold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">{(u.following || []).length}</span> Following
                  </button>
                  <span className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400 px-3 py-1.5">
                    <Icon.Eye className="w-4 h-4" /> {data.viewCount || 0} views
                  </span>
                  {data.avgRating > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-sm text-gray-700 dark:text-slate-300 px-3 py-1.5">
                      <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      {data.avgRating} ({data.ratingCount})
                    </span>
                  )}
                </div>

                             {/* Action buttons */}
                {!isMe && (
                  <div className="flex gap-2 mt-5 flex-wrap">
                    <button onClick={toggleFollow} className={`inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full transition active:scale-95 ${iFollow ? 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700' : 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-sm hover:shadow-md hover:opacity-90'}`}>
                      {iFollow ? (<><Icon.UserMinus className="w-4 h-4" /> Unfollow</>) : (<><Icon.UserPlus className="w-4 h-4" /> Follow</>)}
                    </button>
                    <button onClick={() => setShowReport(true)} className="inline-flex items-center gap-1.5 text-sm font-semibold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 px-4 py-2 rounded-full hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition active:scale-95">
                      <Icon.Flag className="w-4 h-4" /> Report
                    </button>
                    <button onClick={startChat} className="inline-flex items-center gap-1.5 text-sm font-semibold bg-green-600 text-white px-4 py-2 rounded-full shadow-sm hover:shadow-md hover:bg-green-700 transition active:scale-95">
                      <Icon.MessageSquare className="w-4 h-4" /> Message
                    </button>
                    <Link to={`/portfolio/${u.username || u._id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 px-4 py-2 rounded-full shadow-sm hover:shadow-md hover:border-violet-300 dark:hover:border-violet-500 transition active:scale-95">
                      <Icon.Palette className="w-4 h-4 text-violet-600 dark:text-violet-400" /> Portfolio
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Links */}
            
            {(u.links?.github || u.links?.linkedin || u.links?.website) && (
              <div className="flex gap-2 mt-6 flex-wrap">
                {u.links.github && (
                  <a href={u.links.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gray-900 dark:bg-black text-white px-3.5 py-2 rounded-full hover:bg-black hover:shadow-md transition active:scale-95">
                    <Icon.Github className="w-4 h-4" /> GitHub
                  </a>
                )}
                {u.links.linkedin && (
                  <a href={u.links.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-700 text-white px-3.5 py-2 rounded-full hover:bg-blue-800 hover:shadow-md transition active:scale-95">
                    <Icon.Linkedin className="w-4 h-4" /> LinkedIn
                  </a>
                )}
                {u.links.website && (
                  <a href={u.links.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold bg-green-600 text-white px-3.5 py-2 rounded-full hover:bg-green-700 hover:shadow-md transition active:scale-95">
                    <Icon.Globe className="w-4 h-4" /> Website
                  </a>
                )}
              </div>
            )}

            {/* Bio */}
            {u.bio && <p className="mt-6 text-gray-700 dark:text-slate-300 leading-relaxed">{u.bio}</p>}

            {/* Skills with endorsements */}
            {(u.skills || []).length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {(u.skills || []).map((s, i) => {
                  const c = endoCounts[s] || 0;
                  const mine = (endo.mine || []).includes(s);
                  return (
                    <button
                      key={i}
                      disabled={isMe}
                      onClick={() => toggleEndorse(s)}
                      title={isMe ? 'Your skill' : mine ? 'Endorsed by you — click to remove' : 'Click to endorse'}
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition active:scale-95 disabled:cursor-default ${
                        mine
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/20'
                      } ${isMe ? 'opacity-90' : ''}`}
                    >
                      {s}
                      {c > 0 && (
                        <span className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-[10px] font-bold ${mine ? 'bg-blue-500 text-white' : 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300'}`}>{c}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Education */}
            {(u.education || []).length > 0 && (
              <div className="mt-6 border-t border-gray-100 dark:border-slate-800 pt-5">
                <h3 className="flex items-center gap-2 font-bold tracking-tight text-gray-900 dark:text-white text-sm mb-3">
                  <Icon.GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Education
                </h3>
                <div className="space-y-2">
                  {u.education.map((e, i) => (
                    <p key={i} className="text-sm text-gray-600 dark:text-slate-300">
                      <span className="font-semibold text-gray-900 dark:text-white">{e.degree}</span>
                      {e.field && ` in ${e.field}`} — {e.institution}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Reveal>

      {/* ---------- Pinned Projects ---------- */}
      {(data.pinnedProjects || []).length > 0 && (
        <Reveal>
          <div className="rounded-3xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 p-6 sm:p-8">
            <h3 className="flex items-center gap-2 font-bold tracking-tight text-gray-900 dark:text-white mb-4">
              <Icon.Pin className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Pinned Projects
            </h3>
            {data.pinnedProjects.map((p) => (
              <div key={p._id} className="border-b border-gray-100 dark:border-slate-800 py-3 last:border-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{p.title}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 capitalize mt-0.5">{p.progress}</p>
              </div>
            ))}
          </div>
        </Reveal>
      )}

      {/* ---------- Activity ---------- */}
      {activity.length > 0 && (
        <Reveal>
          <div className="rounded-3xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 p-6 sm:p-8">
            <h3 className="flex items-center gap-2 font-bold tracking-tight text-gray-900 dark:text-white mb-4">
              <Icon.Activity className="w-4 h-4 text-violet-600 dark:text-violet-400" /> Activity
            </h3>
            {activity.map((a, i) => (
              <div key={i} className="border-b border-gray-100 dark:border-slate-800 py-3 last:border-0">
                <div className="flex items-start gap-2.5">
                  {typeIcon[a.type] || <span className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0">•</span>}
                  <div className="min-w-0">
                    <p className="text-sm text-gray-800 dark:text-slate-200">{a.text}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{new Date(a.date).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      )}

      {/* ---------- Ratings ---------- */}
      {ratingsData && ratingsData.count > 0 && (
        <Reveal>
          <div className="rounded-3xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <h3 className="font-bold tracking-tight text-gray-900 dark:text-white">Ratings ({ratingsData.count})</h3>
              <span className="text-xs font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-full">{ratingsData.avg}/5</span>
            </div>
            {ratingsData.ratings.map((r) => (
              <div key={r._id} className="border-b border-gray-100 dark:border-slate-800 py-3 last:border-0">
                <Stars n={r.stars} />
                <p className="text-sm text-gray-800 dark:text-slate-200 mt-1.5">{r.comment || 'No comment'}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">by {r.rater?.firstName} {r.rater?.lastName}</p>
              </div>
            ))}
          </div>
        </Reveal>
      )}

      {/* ---------- Projects ---------- */}
      {data.projects.length > 0 && (
        <Reveal>
          <div className="rounded-3xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 p-6 sm:p-8">
            <h3 className="flex items-center gap-2 font-bold tracking-tight text-gray-900 dark:text-white mb-4">
              <Icon.Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Projects
            </h3>
            {data.projects.map((p) => (
              <div key={p._id} className="border-b border-gray-100 dark:border-slate-800 py-3 last:border-0">
                <div className="flex justify-between items-center gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{p.title}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{p.requiredSkills.join(', ')} • <span className="capitalize">{p.progress}</span></p>
                  </div>
                  {!isMe && (
                    <button onClick={() => setRating({ ratee: u._id, project: p._id })} className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-500 text-white px-3 py-1.5 rounded-full hover:bg-amber-600 shadow-sm transition active:scale-95 shrink-0">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      Rate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      )}

      {/* ---------- Questions ---------- */}
      {data.questions.length > 0 && (
        <Reveal>
          <div className="rounded-3xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 p-6 sm:p-8">
            <h3 className="flex items-center gap-2 font-bold tracking-tight text-gray-900 dark:text-white mb-4">
              <Icon.Lightbulb className="w-4 h-4 text-amber-500" /> Questions
            </h3>
            {data.questions.map((q) => (
              <div key={q._id} className="border-b border-gray-100 dark:border-slate-800 py-2.5 last:border-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{q.title}</p>
              </div>
            ))}
          </div>
        </Reveal>
      )}

      {/* ---------- Modals (unchanged logic) ---------- */}
      {showReport && (
        <ReportModal showArea onSubmit={(payload) => userAPI.report(u._id, payload)} onClose={() => setShowReport(false)} />
      )}
      {followList && <FollowListModal ownerId={u._id} mode={followList} onClose={() => setFollowList(null)} />}
      {rating && <RatingModal ratee={rating.ratee} project={rating.project} onClose={() => setRating(null)} />}
    </div>
  );
};

export default PublicProfilePage;