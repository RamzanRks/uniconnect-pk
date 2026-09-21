import { useState, useEffect, useCallback, useMemo } from 'react';
import { qaAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ReportModal from '../components/ReportModal';

/* ---------- Visual-only helpers (no API logic touched) ---------- */

const timeAgo = (date) => {
  const d = new Date(date);
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60); if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60); if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24); if (day < 7) return `${day}d ago`;
  return d.toLocaleDateString();
};

const previewText = (text) => {
  if (!text) return '';
  const cleaned = String(text)
    .replace(/```[\s\S]*?```/g, ' [code] ')
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.length > 160 ? cleaned.slice(0, 160) + '…' : cleaned;
};

const CodeBlock = ({ code, lang }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(code); } catch (e) { /* noop */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <div className="my-3 rounded-xl overflow-hidden border border-slate-700/60 bg-slate-900 shadow-sm">
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-800/80 border-b border-slate-700/60">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{lang || 'code'}</span>
        <button
          onClick={handleCopy}
          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition active:scale-95 ${
            copied ? 'bg-green-500/15 text-green-400' : 'bg-slate-700/60 text-slate-300 hover:bg-slate-600/60 hover:text-white'
          }`}
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto custom-scrollbar text-sm leading-relaxed text-slate-200"><code>{code}</code></pre>
    </div>
  );
};

const RichContent = ({ text, className = '' }) => {
  if (!text) return null;
  const parts = String(text).split('```');
  return (
    <div className={className}>
      {parts.map((part, i) => {
        if (i % 2 === 1) {
          const nl = part.indexOf('\n');
          let lang = '';
          let code = part;
          if (nl !== -1) {
            const first = part.slice(0, nl).trim();
            if (first && first.length <= 12 && !first.includes(' ')) {
              lang = first;
              code = part.slice(nl + 1);
            }
          }
          return <CodeBlock key={i} code={code.replace(/\n$/, '')} lang={lang} />;
        }
        const t = part.replace(/\n+$/, '');
        if (!t.trim()) return null;
        return <p key={i} className="whitespace-pre-line leading-relaxed">{t}</p>;
      })}
    </div>
  );
};

/* ---------- Inline SVG icon set ---------- */
const Icon = {
  Lightbulb: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>,
  Search: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  Plus: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>,
  X: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>,
  ArrowBigUp: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18v-6H5l7-7 7 7h-4v6H9z"/></svg>,
  ArrowBigDown: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6v6h4l-7 7-7-7h4V6h6z"/></svg>,
  CheckCheck: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/></svg>,
  CheckCircle: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  Check: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>,
  Flag: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>,
  MessageSquare: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  ArrowLeft: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>,
  HelpCircle: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>,
};

const QAPage = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [newAnswer, setNewAnswer] = useState('');
  const [reportQuestionId, setReportQuestionId] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');

  // --- New (visual-only) UI state ---
  const [search, setSearch] = useState('');
  const [sortTab, setSortTab] = useState('newest');
  const [voteDir, setVoteDir] = useState({}); // { [id]: 1 | -1 } — local optimistic votes only

  const fetchQuestions = useCallback(async () => {
    try {
      const { data } = await qaAPI.getQuestions();
      setQuestions(data.questions);
    } catch (err) {
      console.error('Failed to load questions', err);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    try {
      await qaAPI.createQuestion({ title, content, tags });
      setTitle(''); setContent(''); setTags('');
      setShowForm(false);
      fetchQuestions();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post');
    }
  };

  const handleSelectQuestion = async (q) => {
    setSelectedQuestion(q);
    try {
      const { data } = await qaAPI.getQuestionDetail(q._id);
      setSelectedQuestion(data.question);
      setAnswers(data.answers);
    } catch (err) {
      console.error(err);
    }
  };

  const refreshDetail = async (id) => {
    const { data } = await qaAPI.getQuestionDetail(id);
    setSelectedQuestion(data.question);
    setAnswers(data.answers);
  };

  const handlePostAnswer = async (e) => {
    e.preventDefault();
    if (!newAnswer.trim()) return;
    try {
      await qaAPI.postAnswer(selectedQuestion._id, { content: newAnswer });
      setNewAnswer('');
      await refreshDetail(selectedQuestion._id);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post answer');
    }
  };

  const handleAccept = async (answerId) => {
    try {
      await qaAPI.acceptAnswer(answerId);
      await refreshDetail(selectedQuestion._id);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept answer');
    }
  };

  const isAuthor = user && selectedQuestion?.author && user._id === selectedQuestion.author._id;

  /* --- Local voting: HONEST counts (start at 0, no fake seeds) --- */
  const getDir = (id) => voteDir[id] || 0;
  // Uses a real backend count if present (votes/score), otherwise 0.
  const baseVotes = (item) => Number(item?.votes ?? item?.score ?? 0);
  const voteCount = (item) => baseVotes(item) + getDir(item._id);
  const castVote = (id, dir) => {
    setVoteDir((prev) => ({ ...prev, [id]: prev[id] === dir ? 0 : dir }));
  };

  /* --- Derived list: search + sort --- */
  const visibleQuestions = useMemo(() => {
    let list = [...questions];
    const s = search.trim().toLowerCase();
    if (s) {
      list = list.filter((q) =>
        (q.title || '').toLowerCase().includes(s) ||
        (q.content || '').toLowerCase().includes(s) ||
        (q.tags || []).some((t) => t.toLowerCase().includes(s))
      );
    }
    if (sortTab === 'unanswered') list = list.filter((q) => !q.isResolved);
    if (sortTab === 'top') list.sort((a, b) => voteCount(b) - voteCount(a));
    else list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, search, sortTab, voteDir]);

  /* --- Modern Reddit-style vote control --- */
  const renderVoteControl = (item, stopPropagation = false) => {
    const id = item._id;
    const dir = getDir(id);
    const count = voteCount(item);
    return (
      <div
        className="flex flex-col items-center gap-0.5 shrink-0 select-none bg-gray-100 dark:bg-slate-800 rounded-full px-1 py-1.5 w-11"
        onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}
      >
        <button
          aria-label="Upvote"
          title="Upvote"
          onClick={(e) => { if (stopPropagation) e.stopPropagation(); castVote(id, 1); }}
          className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-150 active:scale-90 ${
            dir === 1
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-500 dark:text-slate-400 hover:bg-blue-100 dark:hover:bg-blue-500/15 hover:text-blue-600 dark:hover:text-blue-400'
          }`}
        >
          <Icon.ArrowBigUp className="w-5 h-5" />
        </button>
        <span
          key={count}
          className={`vote-pop text-sm font-extrabold tabular-nums ${
            dir === 1 ? 'text-blue-600 dark:text-blue-400' : dir === -1 ? 'text-red-500' : 'text-gray-700 dark:text-slate-200'
          }`}
        >
          {count}
        </span>
        <button
          aria-label="Downvote"
          title="Downvote"
          onClick={(e) => { if (stopPropagation) e.stopPropagation(); castVote(id, -1); }}
          className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-150 active:scale-90 ${
            dir === -1
              ? 'bg-red-500 text-white shadow-sm'
              : 'text-gray-500 dark:text-slate-400 hover:bg-red-100 dark:hover:bg-red-500/15 hover:text-red-500 dark:hover:text-red-400'
          }`}
        >
          <Icon.ArrowBigDown className="w-5 h-5" />
        </button>
      </div>
    );
  };

  const TagPill = ({ tag }) => (
    <span className="inline-flex items-center text-xs font-semibold bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-500/20 transition">
      #{tag}
    </span>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 page-fade">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-md shrink-0">
            <Icon.Lightbulb className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Student Q&A</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">Ask for help, share knowledge, solve problems.</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-sm hover:shadow-lg hover:opacity-90 transition active:scale-95"
        >
          {showForm ? (<><Icon.X className="w-4 h-4" /> Cancel</>) : (<><Icon.Plus className="w-4 h-4" /> Ask Question</>)}
        </button>
      </div>

      {/* Ask form */}
      {showForm && (
        <form onSubmit={handleAskQuestion} className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-blue-100 dark:border-blue-500/20 mb-6 space-y-4">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Question Title" required className="input-field rounded-xl" />
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Describe your problem in detail (min 20 chars)... use ``` for code" required minLength={20} rows={4} className="input-field rounded-xl" />
          <input value={tags} onChange={e => setTags(e.target.value)} placeholder="Tags (e.g. React, Node, comma separated)" className="input-field rounded-xl" />
          <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold py-2.5 rounded-full shadow-sm hover:shadow-md hover:opacity-90 transition active:scale-95">
            Post Question
          </button>
        </form>
      )}

      {!selectedQuestion ? (
        <>
          {/* Toolbar: search + sort tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
            <div className="relative flex-1">
              <Icon.Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search questions, topics, or tags..."
                className="input-field rounded-full pl-10"
              />
            </div>
            <div className="flex items-center bg-gray-100 dark:bg-slate-800 rounded-full p-1 shrink-0 self-start sm:self-auto">
              {[{ id: 'newest', label: 'Newest' }, { id: 'top', label: 'Top' }, { id: 'unanswered', label: 'Unanswered' }].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSortTab(tab.id)}
                  className={`px-4 py-1.5 text-sm font-semibold rounded-full transition active:scale-95 ${
                    sortTab === tab.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Question list */}
          <div className="grid gap-4">
            {visibleQuestions.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-gray-200 dark:border-slate-700">
                <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Icon.HelpCircle className="w-7 h-7" />
                </span>
                <p className="text-gray-500 dark:text-slate-400 font-medium mt-3">
                  {search || sortTab !== 'newest' ? 'No questions match your filters.' : 'No questions yet. Be the first to ask!'}
                </p>
              </div>
            ) : (
              visibleQuestions.map((q) => (
                <div
                  key={q._id}
                  onClick={() => handleSelectQuestion(q)}
                  className="group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-blue-200 dark:hover:border-blue-500/40 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex gap-4">
                    {renderVoteControl(q, true)}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-3">
                        <h3 className="text-lg font-bold text-blue-700 dark:text-blue-400 leading-snug">{q.title}</h3>
                        <div className="flex items-center gap-2 shrink-0">
                          {q.answerCount != null && (
                            <span className="inline-flex items-center gap-1 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 text-xs font-semibold px-2.5 py-1 rounded-full">
                              <Icon.MessageSquare className="w-3.5 h-3.5" /> {q.answerCount}
                            </span>
                          )}
                          {q.isResolved && (
                            <span className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 text-xs font-semibold px-2.5 py-1 rounded-full">
                              <Icon.CheckCheck className="w-3.5 h-3.5" /> Solved
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-slate-300 mt-1.5">{previewText(q.content)}</p>
                      <div className="flex flex-wrap justify-between items-center gap-3 mt-3">
                        <div className="flex flex-wrap gap-1.5">
                          {(q.tags || []).map((tag, i) => <TagPill key={i} tag={tag} />)}
                        </div>
                        <span className="text-xs text-gray-400 dark:text-slate-500 shrink-0">
                          By {q.author?.firstName} • {timeAgo(q.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        /* ---------- DETAIL VIEW ---------- */
        <div className="page-fade">
          <button
            onClick={() => setSelectedQuestion(null)}
            className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-sm font-semibold mb-4 hover:text-blue-700 dark:hover:text-blue-300 transition active:scale-95"
          >
            <Icon.ArrowLeft className="w-4 h-4" /> Back to all questions
          </button>

          {/* Question */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm mb-6">
            <div className="flex gap-5">
              {renderVoteControl(selectedQuestion, false)}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-3">
                  <h2 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-snug">{selectedQuestion.title}</h2>
                  <button
                    onClick={() => setReportQuestionId(selectedQuestion._id)}
                    title="Report this question"
                    aria-label="Report this question"
                    className="text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-full transition active:scale-95 shrink-0"
                  >
                    <Icon.Flag className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 mb-3">
                  Asked by {selectedQuestion.author?.firstName} {selectedQuestion.author?.lastName} • {timeAgo(selectedQuestion.createdAt)}
                </p>
                {selectedQuestion.isResolved && (
                  <span className="inline-flex items-center gap-1.5 bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 text-xs font-semibold px-2.5 py-1 rounded-full mb-3">
                    <Icon.CheckCircle className="w-3.5 h-3.5" /> Solved
                  </span>
                )}
                <RichContent text={selectedQuestion.content} className="space-y-3 text-gray-800 dark:text-slate-200" />
                {(selectedQuestion.tags || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {(selectedQuestion.tags || []).map((tag, i) => <TagPill key={i} tag={tag} />)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Answers */}
          <h3 className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-gray-900 dark:text-white mb-3">
            <Icon.MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
          </h3>

          <div className="space-y-4 mb-6">
            {answers.length === 0 && (
              <div className="text-center py-8 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 text-sm">
                No answers yet. Share your knowledge below!
              </div>
            )}
            {answers.map((a) => (
              <div
                key={a._id}
                className={`p-5 rounded-2xl border transition-all duration-300 ${
                  a.isAccepted
                    ? 'bg-green-50 dark:bg-green-500/5 border-green-300 dark:border-green-500/40 shadow-sm ring-1 ring-green-200 dark:ring-green-500/20'
                    : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 shadow-sm'
                }`}
              >
                <div className="flex gap-4">
                  {renderVoteControl(a, false)}
                  <div className="flex-1 min-w-0">
                    {a.isAccepted && (
                      <span className="inline-flex items-center gap-1.5 bg-green-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full mb-3 shadow-sm">
                        <Icon.CheckCheck className="w-3.5 h-3.5" /> Accepted Solution
                      </span>
                    )}
                    <RichContent text={a.content} className="space-y-3 text-gray-800 dark:text-slate-200" />
                    <div className="flex justify-between items-center gap-3 mt-3 flex-wrap">
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        Answered by {a.author?.firstName} • {new Date(a.createdAt).toLocaleString()}
                      </p>
                      {isAuthor && !a.isAccepted && (
                        <button
                          onClick={() => handleAccept(a._id)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold bg-green-600 text-white px-3 py-1.5 rounded-full hover:bg-green-700 shadow-sm transition active:scale-95"
                        >
                          <Icon.Check className="w-3.5 h-3.5" /> Mark as Accepted
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Post answer */}
          <form onSubmit={handlePostAnswer} className="bg-gray-50 dark:bg-slate-800/50 p-5 rounded-3xl border border-gray-200 dark:border-slate-700">
            <h4 className="flex items-center gap-2 font-bold tracking-tight text-gray-700 dark:text-white mb-2">
              <Icon.MessageSquare className="w-4 h-4 text-green-600 dark:text-green-400" /> Your Answer
            </h4>
            <textarea
              value={newAnswer}
              onChange={e => setNewAnswer(e.target.value)}
              placeholder="Share your solution or advice... (use ``` for code blocks)"
              required
              minLength={10}
              rows={3}
              className="input-field rounded-xl mb-3"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-sm hover:shadow-md hover:opacity-90 transition active:scale-95"
            >
              <Icon.MessageSquare className="w-4 h-4" /> Post Answer
            </button>
          </form>
        </div>
      )}

      {/* Report modal (unchanged logic) */}
      {reportQuestionId && (
        <ReportModal
          onSubmit={(data) => qaAPI.reportQuestion(reportQuestionId, data)}
          onClose={() => setReportQuestionId(null)}
          onReported={fetchQuestions}
        />
      )}
    </div>
  );
};

export default QAPage;