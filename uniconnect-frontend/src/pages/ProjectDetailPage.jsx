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
import { Reveal, Skeleton } from '../components/fx'; // <-- FIXED PATH

/* ---------- Inline SVG Icons ---------- */
const Icon = {
  Calendar: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>),
  Users: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>),
  Image: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>),
  Check: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 6 9 17l-5-5" /></svg>),
  Plus: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 5v14M5 12h14" /></svg>),
  X: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M18 6 6 18M6 6l12 12" /></svg>),
  Handshake: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m11 17 2 2a1 1 0 1 0 3-3M14 15.5 18 12l-4-4-6 6 3 3 3-1.5Z" /><path d="M7.5 10.5 10 8l4 4-2.5 2.5-4-4Z" /><path d="m5 11-2-2 4-4 4 4M18 8l2 2-4 4-2-2" /></svg>),
  Eye: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>),
  Clock: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>),
  Folder: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" /></svg>),
  Message: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>),
  Chart: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 3v18h18M7 16l4-4 4 4 5-5" /></svg>),
  Sparkles: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" /></svg>),
  ArrowLeft: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m12 19-7-7 7-7M19 12H5" /></svg>),
  Share: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" /></svg>),
};
/* ---------- Progress stages (matches backend enum) ---------- */
const STAGES = [
  { key: 'planning',  label: 'Planning',  icon: Icon.Sparkles },
  { key: 'building',  label: 'Building',  icon: Icon.Chart },
  { key: 'completed', label: 'Completed', icon: Icon.Check },
];

 /* ---------- Badge component (safe label fallback) ---------- */
const Badge = ({ children, variant = 'default', icon: IconComp }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300 border-gray-200 dark:border-slate-700',
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
    info: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
    purple: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400 border-violet-200 dark:border-violet-500/20',
    gradient: 'bg-gradient-to-r from-blue-600 to-violet-600 text-white border-transparent',
  };
  const label = String(children ?? '').trim();
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${variants[variant] || variants.default} capitalize`}>
      {IconComp && <IconComp className="w-3 h-3 shrink-0" />}
      {label || '—'}
    </span>
  );
};

/* ---------- Section wrapper ---------- */
const Section = ({ icon: IconComp, title, children, className = '', delay = 0 }) => (
  <Reveal delay={delay}>
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/10 to-violet-500/10 dark:from-blue-500/20 dark:to-violet-500/20 flex items-center justify-center">
          {IconComp && <IconComp className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
        </div>
        <h3 className="font-bold text-gray-900 dark:text-slate-100 text-sm tracking-tight">{title}</h3>
      </div>
      {children}
    </div>
  </Reveal>
);

/* ---------- Main Component ---------- */
const ProjectDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [showApply, setShowApply] = useState(false);
  const [showApplicants, setShowApplicants] = useState(false);

  const [savingProgress, setSavingProgress] = useState(false);

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

  


  const changeProgress = async (stage) => {
  if (!post || post.progress === stage || savingProgress) return;
  const prev = post.progress;
  setPost({ ...post, progress: stage });       // optimistic
  setSavingProgress(true);
  try {
    const { data } = await projectAPI.updateProgress(post._id, stage);
    setPost(data);
  } catch (err) {
    setPost({ ...post, progress: prev });      // rollback
    alert(err.response?.data?.message || 'Failed to update progress');
  } finally {
    setSavingProgress(false);
  }
};

  useEffect(() => {
    projectAPI.getProject(id).then(({ data }) => setPost(data)).catch(() => setPost(null));
  }, [id]);

  /* ---------- Loading skeleton ---------- */
  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 page-fade">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  const isOwner = user && post.creator && user._id === post.creator._id;
  const isTeam = user && (isOwner || (post.team || []).some((m) => m._id === user._id));

  const avatarSrc = post.creator?.avatarUrl
    ? (post.creator.avatarUrl.startsWith('http') ? post.creator.avatarUrl : `${SERVER_URL}${post.creator.avatarUrl}`)
    : null;

const progressVariant = {
  planning: 'info',
  building: 'warning',
  completed: 'success',
}[post.progress] || 'default';

  const statusVariant = {
    open: 'success',
    closed: 'default',
    archived: 'purple',
  }[post.status] || 'default';

const deadlineDate = new Date(post.deadline || Date.now());
const isOverdue = deadlineDate.getTime() < Date.now() && post.status !== 'closed';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 page-fade">

      {/* ---------- Hero Card ---------- */}
      <Reveal>
        <div className="relative bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Top gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-violet-600 to-pink-600" />

          <div className="p-6 sm:p-8">
            {/* Top row: back link + bookmark */}
            <div className="flex items-start justify-between gap-3 mb-5">
              <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition group">
                <Icon.ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                Back to Projects
              </Link>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigator.share?.({ title: post.title, url: window.location.href }).catch(() => {})}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition"
                  title="Share"
                >
                  <Icon.Share className="w-4 h-4" />
                </button>
                <BookmarkButton type="ProjectPost" id={post._id} />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight leading-tight">
              {post.title}
            </h1>

            {/* Creator info */}
            <div className="flex items-center gap-3 mt-4">
              <Link to={`/user/${post.creator?._id}`} className="flex items-center gap-3 group">
                {avatarSrc ? (
                  <img src={avatarSrc} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-slate-800 group-hover:ring-blue-200 dark:group-hover:ring-blue-500/30 transition" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm">
                    {(post.creator?.firstName || '?')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition flex items-center gap-1">
                    {post.creator?.firstName} {post.creator?.lastName}
                    {post.creator?.verificationStatus === 'verified' && (
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-500 text-white" title="Verified">
                        <Icon.Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{post.creator?.university}</p>
                </div>
              </Link>
            </div>

           {/* Badges row */}
<div className="flex flex-wrap items-center gap-2 mt-5">
  <Badge variant={progressVariant} icon={Icon.Sparkles}>
    {String(post.progress || 'planning').replace(/_/g, ' ')}
  </Badge>
  <Badge variant={statusVariant}>
    {String(post.status || 'open')}
  </Badge>
  <Badge variant={isOverdue ? 'warning' : 'default'} icon={Icon.Clock}>
    {isOverdue ? 'Overdue' : 'Due'} {deadlineDate.toLocaleDateString()}
  </Badge>
</div>
          </div>
        </div>
      </Reveal>

      {/* ---------- Description ---------- */}
      <Reveal delay={80}>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 shadow-sm">
          <p className="text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-line text-[15px]">
            {post.description}
          </p>
        </div>
      </Reveal>

{/* ---------- Progress editor (owner only) ---------- */}
{isOwner && (
  <Reveal delay={100}>
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/10 to-violet-500/10 dark:from-blue-500/20 dark:to-violet-500/20 flex items-center justify-center">
            <Icon.Chart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-slate-100 text-sm tracking-tight">Project Progress</h3>
        </div>
        {savingProgress && <span className="text-xs text-gray-400 dark:text-slate-500 animate-pulse">Saving…</span>}
      </div>

      <div className="flex items-center gap-2">
        {STAGES.map((s, i) => {
          const activeIdx = STAGES.findIndex((x) => x.key === post.progress);
          const active = activeIdx === i;
          const passed = activeIdx > i;
          return (
            <div key={s.key} className="flex items-center gap-2 flex-1">
              <button
                onClick={() => changeProgress(s.key)}
                disabled={savingProgress}
                className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border transition active:scale-95 disabled:opacity-60 ${
                  active
                    ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white border-transparent shadow-lg shadow-blue-500/20'
                    : passed
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500/40'
                }`}
              >
                <s.icon className="w-3.5 h-3.5" />
                {s.label}
                {active && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
              </button>
              {i < STAGES.length - 1 && (
                <span className={`h-px w-3 sm:w-6 shrink-0 ${passed ? 'bg-emerald-400' : 'bg-gray-200 dark:bg-slate-700'}`} />
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 dark:text-slate-500 mt-3">
        Click a stage to update what everyone sees on your project card.
      </p>
    </div>
  </Reveal>
)}

      {/* ---------- Skills ---------- */}
      {post.requiredSkills?.length > 0 && (
        <Section icon={Icon.Sparkles} title="Required Skills" delay={120}>
          <div className="flex flex-wrap gap-2">
            {post.requiredSkills.map((s, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-50 to-violet-50 dark:from-blue-500/10 dark:to-violet-500/10 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-500/20 hover:shadow-sm hover:-translate-y-0.5 transition-all cursor-default"
              >
                <span className="w-1 h-1 rounded-full bg-blue-500" />
                {s}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* ---------- Screenshots ---------- */}
      {(post.screenshots || []).length > 0 && (
        <Section icon={Icon.Image} title={`Screenshots (${post.screenshots.length}/3)`} delay={160}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {post.screenshots.map((s, i) => (
              <div key={i} className="relative group rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-800 aspect-[4/3]">
                <img
                  src={s.startsWith('http') ? s : `${SERVER_URL}${s}`}
                  alt={`Screenshot ${i + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {isOwner && (
                  <button
                    onClick={() => removeShot(s)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 shadow-lg"
                    title="Remove"
                  >
                    <Icon.X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Add screenshot */}
      {isOwner && (post.screenshots || []).length < 3 && (
        <Reveal delay={200}>
          <label className="group cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-500/10 border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500/30 text-sm font-semibold text-gray-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-all">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white group-hover:rotate-90 transition-transform">
              <Icon.Plus className="w-3.5 h-3.5" />
            </div>
            Add Screenshot
            <span className="text-xs font-normal text-gray-500">({(post.screenshots || []).length}/3)</span>
            <input type="file" accept="image/*" className="hidden" onChange={addShot} />
          </label>
        </Reveal>
      )}

      {/* ---------- Team ---------- */}
      {post.team && post.team.length > 0 && (
        <Section icon={Icon.Users} title={`Team (${post.team.length})`} delay={240}>
          <div className="flex flex-wrap gap-2">
            {post.team.map((m) => {
              const mAvatar = m.avatarUrl
                ? (m.avatarUrl.startsWith('http') ? m.avatarUrl : `${SERVER_URL}${m.avatarUrl}`)
                : null;
              return (
                <Link
                  key={m._id}
                  to={`/user/${m._id}`}
                  className="group inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 hover:-translate-y-0.5 transition-all"
                >
                  {mAvatar ? (
                    <img src={mAvatar} alt="" className="w-6 h-6 rounded-full object-cover ring-2 ring-white dark:ring-slate-900" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-[10px] font-bold">
                      {(m.firstName || '?')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    {m.firstName} {m.lastName}
                  </span>
                </Link>
              );
            })}
          </div>
        </Section>
      )}

      {/* ---------- Action buttons ---------- */}
      <Reveal delay={280}>
        <div className="flex flex-col sm:flex-row gap-3">
          {isOwner ? (
            <button
              onClick={() => setShowApplicants(true)}
              className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md transition-all"
            >
              <Icon.Users className="w-4 h-4" />
              View Applicants
            </button>
          ) : (
            <button
              onClick={() => setShowApply(true)}
              disabled={isTeam}
              className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
            >
              <Icon.Handshake className="w-4 h-4" />
              {isTeam ? 'You are on the team' : 'Apply to Join'}
            </button>
          )}
        </div>
      </Reveal>

      {/* ---------- Polls ---------- */}
      <Section icon={Icon.Chart} title="Polls" delay={320}>
        <PollsSection projectId={id} isOwner={isOwner} />
      </Section>

      {/* ---------- Reaction bar ---------- */}
      <Section icon={Icon.Sparkles} title="Reactions" delay={360}>
        <ReactionBar type="ProjectPost" id={post._id} />
      </Section>

      {/* ---------- File vault ---------- */}
      <Section icon={Icon.Folder} title="File Vault" delay={400}>
        <FileVault projectId={post._id} canUpload={isTeam || user?.role === 'admin'} />
      </Section>

      {/* ---------- Comments ---------- */}
      <Section icon={Icon.Message} title="Discussion" delay={440}>
        <CommentsSection projectId={post._id} />
      </Section>

      {/* ---------- Modals ---------- */}
      {showApply && <ApplyModal projectId={post._id} onClose={() => setShowApply(false)} />}
      {showApplicants && <ApplicantsModal projectId={post._id} onClose={() => setShowApplicants(false)} />}
    </div>
  );
};

export default ProjectDetailPage;