import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { projectAPI, presenceAPI, announcementAPI, SERVER_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CreateProjectModal from '../components/CreateProjectModal';
import ReportModal from '../components/ReportModal';
import ApplyModal from '../components/ApplyModal';
import ApplicantsModal from '../components/ApplicantsModal';
import ReactionBar from '../components/ReactionBar';
import BookmarkButton from '../components/BookmarkButton';
import { Reveal, EmptyState } from '../components/fx';

/* ---------- Inline SVG icons (Lucide-style, matches rest of app) ---------- */
const Icon = {
  Grid: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>),
  Sparkles: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" /></svg>),
  Search: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>),
  X: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>),
  Plus: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14" /><path d="M12 5v14" /></svg>),
  Clock: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>),
  Users: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>),
  Handshake: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m11 17 2 2a1 1 0 1 0 3-3" /><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" /><path d="m21 3 1 11h-2" /><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" /><path d="M3 4h8" /></svg>),
  Flag: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" x2="4" y1="22" y2="15" /></svg>),
  Eye: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>),
  Megaphone: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m3 11 18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></svg>),
  BadgeCheck: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.76 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" /><path d="m9 12 2 2 4-4" /></svg>),
};

/* Kept for future use (the old pills were replaced by the flat meta-strip below) */
const PROGRESS_STYLES = {
  planning: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30',
  building: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30',
};

const inputCls = 'w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition';
const tabCls = (active) => `inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full transition active:scale-95 ${active ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow' : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'}`;

const Feed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [presence, setPresence] = useState({});
  const [tab, setTab] = useState('all');
  const [announcements, setAnnouncements] = useState([]);
  const [showAnnForm, setShowAnnForm] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [reportPostId, setReportPostId] = useState(null);
  const [applyPostId, setApplyPostId] = useState(null);
  const [applicantsPostId, setApplicantsPostId] = useState(null);
  const [options, setOptions] = useState({ skills: [], universities: [] });
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({ search: '', skill: 'all', university: 'all' });

  useEffect(() => {
    projectAPI.getFilterOptions().then(({ data }) => setOptions(data)).catch(() => {});
    announcementAPI.get().then(({ data }) => setAnnouncements(data)).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => ({ ...f, search: searchInput.trim() })), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (tab === 'foryou') params.feed = 'forYou';
      if (filters.search) params.search = filters.search;
      if (filters.skill !== 'all') params.skill = filters.skill;
      if (filters.university !== 'all') params.university = filters.university;
      const { data } = await projectAPI.getProjects(params);
      setPosts(data.posts);
      const ids = data.posts.map((p) => p.creator?._id).filter(Boolean);
      if (ids.length) presenceAPI.get(ids).then(({ data: pr }) => setPresence(pr)).catch(() => {});
    } catch (err) {
      console.error('Failed to load projects', err);
    } finally {
      setLoading(false);
    }
  }, [filters, tab]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const clearFilters = () => { setSearchInput(''); setFilters({ search: '', skill: 'all', university: 'all' }); };
  const isOwner = (post) => user && post.creator && user._id === post.creator._id;
  const isAdmin = user && user.role === 'admin';
  const isOverdue = (post) => new Date(post.deadline) < new Date() && post.status !== 'closed';
  const latestAnn = announcements[0];
  const avatarSrc = (u) => u?.avatarUrl ? (u.avatarUrl.startsWith('http') ? u.avatarUrl : `${SERVER_URL}${u.avatarUrl}`) : null;

  const createAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await announcementAPI.create({ title: annTitle, body: annBody });
      const { data } = await announcementAPI.get();
      setAnnouncements(data);
      setAnnTitle(''); setAnnBody(''); setShowAnnForm(false);
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };
  const deleteAnnouncement = (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    announcementAPI.delete(id).then(() => announcementAPI.get()).then(({ data }) => setAnnouncements(data));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 page-fade">
      {/* ── Announcement banner ── */}
      {latestAnn && (
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-violet-600 text-white p-6 shadow-lg shadow-blue-500/20">
            <div className="absolute inset-0 dot-pattern opacity-20" />
            <div className="relative flex justify-between items-start gap-4">
              <div className="flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-white/15 backdrop-blur shrink-0">
                  <Icon.Megaphone className="w-5 h-5" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-100">Platform Announcement</p>
                  <h3 className="font-bold text-lg mt-0.5">{latestAnn.title}</h3>
                  <p className="text-sm mt-1 text-blue-50/90">{latestAnn.body}</p>
                  <p className="text-xs mt-2 text-blue-100/70">By {latestAnn.author?.firstName} {latestAnn.author?.lastName} • {new Date(latestAnn.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              {isAdmin && (
                <button onClick={() => deleteAnnouncement(latestAnn._id)} title="Delete announcement" className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition shrink-0">
                  <Icon.X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </Reveal>
      )}

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/20 shrink-0">
            <Icon.Grid className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Project Board</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">Discover projects, find teammates, build together.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && (
            <button onClick={() => setShowAnnForm(!showAnnForm)} className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-full border border-violet-200 dark:border-violet-500/30 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition active:scale-95">
              <Icon.Megaphone className="w-3.5 h-3.5" /> {showAnnForm ? 'Close' : 'Announce'}
            </button>
          )}
          <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-violet-600 text-white px-5 py-2.5 rounded-full shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 transition active:scale-95">
            <Icon.Plus className="w-4 h-4" /> Post Project
          </button>
        </div>
      </div>

      {/* ── Admin announcement form ── */}
      {showAnnForm && isAdmin && (
        <form onSubmit={createAnnouncement} className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 space-y-3">
          <input value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} className={inputCls} placeholder="Announcement title" required />
          <textarea value={annBody} onChange={(e) => setAnnBody(e.target.value)} rows={2} className={inputCls} placeholder="Announcement body" required />
          <button type="submit" className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gradient-to-r from-blue-600 to-violet-600 text-white px-4 py-2 rounded-full hover:shadow-lg transition active:scale-95">Publish</button>
        </form>
      )}

      {/* ── Tabs + filters ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="inline-flex items-center gap-1 bg-gray-100 dark:bg-slate-800 rounded-full p-1 self-start">
            <button onClick={() => setTab('all')} className={tabCls(tab === 'all')}><Icon.Grid className="w-3.5 h-3.5" /> All Projects</button>
            <button onClick={() => setTab('foryou')} className={tabCls(tab === 'foryou')}><Icon.Sparkles className="w-3.5 h-3.5" /> For You</button>
          </div>
          {(filters.search || filters.skill !== 'all' || filters.university !== 'all') && (
            <button onClick={clearFilters} className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition active:scale-95">
              <Icon.X className="w-3.5 h-3.5" /> Clear filters
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Icon.Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
            <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search projects..." className={`${inputCls} pl-10`} />
          </div>
          <select value={filters.skill} onChange={(e) => setFilters({ ...filters, skill: e.target.value })} className={inputCls}>
            <option value="all">All Skills</option>
            {options.skills.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filters.university} onChange={(e) => setFilters({ ...filters, university: e.target.value })} className={inputCls}>
            <option value="all">All Universities</option>
            {options.universities.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>

      {/* ── Project cards ── */}
      {loading ? (
        <div className="grid gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-6 space-y-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-800" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-1/3" />
                  <div className="h-2.5 bg-gray-200 dark:bg-slate-800 rounded w-1/4" />
                </div>
              </div>
              <div className="h-5 bg-gray-200 dark:bg-slate-800 rounded w-2/3" />
              <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-full" />
              <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-5/6" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-gray-200 dark:border-slate-700">
          <EmptyState
            icon={<Icon.Grid className="w-8 h-8" />}
            title={tab === 'foryou' ? 'Your For You feed is empty' : 'No projects found'}
            sub={tab === 'foryou' ? 'Follow topics on your profile to personalize this feed.' : 'Try clearing filters — or post the first project!'}
          />
        </div>
      ) : (
        /* ✅ CHANGE 2: no per-card Reveal anymore — cards render instantly on scroll.
           The whole list gets ONE one-time page-fade on load only. */
        <div className="grid gap-5 page-fade">
          {posts.map((post) => (
            <article key={post._id} className="group relative flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:-translate-y-1 hover:border-blue-200 dark:hover:border-blue-500/40 transition-all duration-300 overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-violet-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="p-6 sm:p-7 flex-1 flex flex-col gap-4">
                {/* Header: owner + quick actions */}
                <div className="flex items-start justify-between gap-3">
                  <Link to={`/user/${post.creator?._id}`} className="flex items-center gap-3 min-w-0 group/author">
                    {avatarSrc(post.creator) ? (
                      <img src={avatarSrc(post.creator)} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-slate-800 group-hover/author:ring-blue-200 dark:group-hover/author:ring-blue-500/40 transition" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {(post.creator?.firstName || '?')[0].toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white group-hover/author:text-blue-600 dark:group-hover/author:text-blue-400 transition-colors truncate">
                        {post.creator?.firstName} {post.creator?.lastName}
                        {post.creator?.verificationStatus === 'verified' && <Icon.BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />}
                      </p>
                      <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400 truncate">
                        {post.creator?.university}
                        {presence[post.creator?._id] && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shrink-0" title="Online now" />}
                      </p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-1 shrink-0">
                    <BookmarkButton type="ProjectPost" id={post._id} />
                    <button onClick={() => setReportPostId(post._id)} title="Report this post" className="p-1.5 rounded-lg text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition">
                      <Icon.Flag className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* ✅ Title is a link → opens project details */}
                <div>
                  <Link to={`/project/${post._id}`} className="block text-lg font-extrabold tracking-tight text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    {post.title}
                  </Link>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-600 dark:text-slate-300 line-clamp-2">{post.description}</p>
                </div>

                {/* ✅ CHANGE 1: flat modern meta-strip (replaces the old pastel pills) */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400 dark:text-slate-500">
                  <span className="inline-flex items-center gap-1.5 text-gray-500 dark:text-slate-400">
                    <Icon.Sparkles className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                    {String(post.progress).replace('_', ' ')}
                  </span>
                  <span className="h-3 w-px bg-gray-200 dark:bg-slate-700" />
                  <span className="inline-flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${post.status === 'open' ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-600'}`} />
                    {post.status}
                  </span>
                  <span className="h-3 w-px bg-gray-200 dark:bg-slate-700" />
                  <span className={`inline-flex items-center gap-1.5 ${isOverdue(post) ? 'text-red-500 dark:text-red-400' : ''}`}>
                    <Icon.Clock className="w-3 h-3" />
                    {isOverdue(post) ? 'Overdue · ' : 'Due '}
                    {new Date(post.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-1.5">
                  {post.requiredSkills.map((skill, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-50 to-violet-50 dark:from-blue-500/10 dark:to-violet-500/10 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-500/20">
                      <span className="w-1 h-1 rounded-full bg-blue-500" /> {skill}
                    </span>
                  ))}
                </div>

                {/* Team → each member links to their profile */}
                {post.team && post.team.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-slate-400">
                      <Icon.Users className="w-3.5 h-3.5" /> Team
                    </span>
                    {post.team.map((m) => (
                      <Link key={m._id} to={`/user/${m._id}`} className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition">
                        {m.firstName} {m.lastName}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Footer: reactions + actions */}
                <div className="mt-auto pt-4 border-t border-gray-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <ReactionBar type="ProjectPost" id={post._id} />
                  <div className="flex items-center gap-2 flex-wrap">
                    {isOwner(post) ? (
                      <button onClick={() => setApplicantsPostId(post._id)} className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gray-800 dark:bg-slate-700 text-white px-4 py-2 rounded-full hover:bg-black dark:hover:bg-slate-600 transition active:scale-95">
                        <Icon.Users className="w-3.5 h-3.5" /> View Applicants
                      </button>
                    ) : (
                      <button onClick={() => setApplyPostId(post._id)} className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gradient-to-r from-blue-600 to-violet-600 text-white px-4 py-2 rounded-full hover:shadow-lg hover:shadow-blue-500/25 transition active:scale-95">
                        <Icon.Handshake className="w-3.5 h-3.5" /> Apply to Join
                      </button>
                    )}
                    {/* ✅ Dedicated button → opens project details */}
                    <Link to={`/project/${post._id}`} className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:border-blue-300 dark:hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition active:scale-95">
                      <Icon.Eye className="w-3.5 h-3.5" /> View Details
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ── Modals (logic unchanged) ── */}
      {showModal && <CreateProjectModal onClose={() => setShowModal(false)} onCreated={fetchPosts} />}
      {reportPostId && (
        <ReportModal onSubmit={(data) => projectAPI.reportProject(reportPostId, data)} onClose={() => setReportPostId(null)} onReported={fetchPosts} />
      )}
      {applyPostId && <ApplyModal projectId={applyPostId} onClose={() => setApplyPostId(null)} onApplied={fetchPosts} />}
      {applicantsPostId && <ApplicantsModal projectId={applicantsPostId} onClose={() => setApplicantsPostId(null)} />}
    </div>
  );
};
export default Feed;