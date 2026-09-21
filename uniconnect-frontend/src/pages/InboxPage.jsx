// uniconnect-frontend/src/pages/InboxPage.jsx
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { messagesAPI, userAPI, presenceAPI, searchAPI, SERVER_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ReportModal from '../components/ReportModal';
import { Skeleton } from '../components/fx';

/* ═══════════════ ICONS ═══════════════ */
const Icon = {
  Search: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>,
  Users: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Plus: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 5v14M5 12h14"/></svg>,
  X: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M18 6 6 18M6 6l12 12"/></svg>,
  Check: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 6 9 17l-5-5"/></svg>,
  ChevronLeft: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m15 18-6-6 6-6"/></svg>,
  ChevronDown: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m6 9 6 6 6-6"/></svg>,
  Paperclip: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>,
  Smile: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/></svg>,
  Mic: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>,
  Stop: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="3" width="18" height="18" rx="2"/></svg>,
  Send: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>,
  MoreVertical: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>,
  Info: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>,
  Image: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>,
  FileText: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Pin: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="12" x2="12" y1="17" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>,
  Bell: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
  BellOff: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 0 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/><path d="m2 2 20 20"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
  Archive: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>,
  Shield: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Flag: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>,
  LogOut: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/></svg>,
  Crown: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>,
  User: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Reply: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>,
  Forward: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="15 17 20 12 15 7"/><path d="M4 18v-2a4 4 0 0 1 4-4h12"/></svg>,
  Trash: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
  Play: (p) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  Pause: (p) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>,
};

/* ═══════════════ EMOJIS WITH CATEGORIES ═══════════════ */
const EMOJI_CATEGORIES = [
  { id: 'smileys', label: '😊', emojis: ['😀','😂','😍','🥰','😘','🤩','😊','😎','🤗','🥳','😢','😡','🤔','👀','😴','🤯','😱','🥺','😤','🤫'] },
  { id: 'gestures', label: '👍', emojis: ['👍','👎','👋','🤝','👏','🙌','💪','🤞','✌️','🤙','👆','👇','👈','👉','🫶','🙏','✊','🤜','🤛','💅'] },
  { id: 'hearts', label: '❤️', emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','♥️','🫀'] },
  { id: 'objects', label: '🎯', emojis: ['🔥','✨','🎉','🎊','🎯','💡','📌','📎','📷','🎤','🎧','💻','📱','⚡','🌟','⭐','🏆','🎁','📚','🔑'] },
  { id: 'nature', label: '🌸', emojis: ['🌸','🌺','🌻','🌹','🌷','🌼','🍀','🌿','🌳','🌊','☀️','🌙','⭐','🌈','❄️','🔥','💧','🌍','🦋','🐝'] },
];

/* ═══════════════ TIME HELPERS ═══════════════ */
const timeAgo = (date) => {
  const now = new Date();
  const d = new Date(date);
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  if (hrs < 24) return `${hrs}h`;
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const formatTime = (date) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const getDateLabel = (date) => {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};

/* ═══════════════ CUSTOM VOICE NOTE PLAYER ═══════════════ */
const VoiceNotePlayer = ({ src, mine }) => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setProgress(audio.currentTime / (audio.duration || 1));
    const onEnd = () => { setPlaying(false); setProgress(0); };
    const onMeta = () => setDuration(audio.duration);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnd);
    audio.addEventListener('loadedmetadata', onMeta);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnd);
      audio.removeEventListener('loadedmetadata', onMeta);
    };
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else {
      const p = audio.play();
      if (p?.catch) p.catch(() => setPlaying(false));
      setPlaying(true);
    }
  };

  const fmt = (s) => {
    if (!s || !isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex items-center gap-2 py-1.5 px-2 rounded-xl mb-2 min-w-[180px] ${mine ? 'bg-white/15' : 'bg-gray-100 dark:bg-slate-700'}`}>
      <audio ref={audioRef} src={src} preload="metadata" />
      <button onClick={toggle} className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition active:scale-90 ${mine ? 'bg-white/20 text-white' : 'bg-blue-600 text-white'}`}>
        {playing ? <Icon.Pause className="w-4 h-4" /> : <Icon.Play className="w-4 h-4 ml-0.5" />}
      </button>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-black/10 dark:bg-white/10">
        <div className={`h-full rounded-full transition-all duration-200 ${mine ? 'bg-white' : 'bg-blue-600'}`} style={{ width: `${progress * 100}%` }} />
      </div>
      <span className={`text-[10px] font-mono shrink-0 ${mine ? 'text-blue-100' : 'text-gray-500 dark:text-slate-400'}`}>{fmt(duration)}</span>
    </div>
  );
};

/* ═══════════════ WAVEFORM BARS (Recording) ═══════════════ */
const WaveformBars = () => (
  <div className="flex items-center gap-[3px] h-6 px-1">
    {Array.from({ length: 12 }).map((_, i) => (
      <div
        key={i}
        className="w-[3px] rounded-full bg-red-500 animate-pulse"
        style={{
          height: `${8 + Math.random() * 16}px`,
          animationDelay: `${i * 80}ms`,
          animationDuration: `${400 + Math.random() * 400}ms`,
        }}
      />
    ))}
  </div>
);

/* ═══════════════ MAIN COMPONENT ═══════════════ */
const InboxPage = () => {
  const { user } = useAuth();
  const me = user._id.toString();
  const currentUserId = user._id;
  const [searchParams, setSearchParams] = useSearchParams();

  // ─── Core State ───
  const [tab, setTab] = useState('primary');
  const [conversations, setConversations] = useState([]);
  const [convLoading, setConvLoading] = useState(true);
  const [activeId, setActiveId] = useState(searchParams.get('c') || null);
  const [meta, setMeta] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [chatSearch, setChatSearch] = useState('');
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [explore, setExplore] = useState([]);
  const [userResults, setUserResults] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);

  // ─── UI State ───
  const [menuOpen, setMenuOpen] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [emojiTab, setEmojiTab] = useState('smileys');
  const [emojiSearch, setEmojiSearch] = useState('');
  const [recentEmojis, setRecentEmojis] = useState([]);
  const [showMedia, setShowMedia] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [forwardMsg, setForwardMsg] = useState(null);
  const [forwardList, setForwardList] = useState([]);
  const [onlineMap, setOnlineMap] = useState({});
  const [recording, setRecording] = useState(false);
  const [recTime, setRecTime] = useState(0);
  const [gName, setGName] = useState('');
  const [gDesc, setGDesc] = useState('');
  const [gPhoto, setGPhoto] = useState(null);
  const [groupName, setGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState([]);
  const [highlightId, setHighlightId] = useState(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [scrollUnread, setScrollUnread] = useState(0);
  const [toast, setToast] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  // ─── Refs ───
  const socketRef = useRef(null);
  const activeIdRef = useRef(activeId);
  const fetchConvosRef = useRef(null);
  const fetchMessagesRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const lastTypingRef = useRef(0);
  const scrollBoxRef = useRef(null);
  const scrollModeRef = useRef('idle'); // idle | open | bottom | new
  const autoScrollRef = useRef(true);
  const fileInputRef = useRef(null);
  const mrRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const recIntervalRef = useRef(null);
  const toastTimerRef = useRef(null);
  const msgSeqRef = useRef(0);
  const metaSeqRef = useRef(0);
  const convoSeqRef = useRef(0);
  const convoKeyRef = useRef('');

  const token = localStorage.getItem('token');

  // Keep activeIdRef always current — prevents stale socket closures
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  // Debounce sidebar/search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // ─── Derived / Memoized ───
  const isGroup = !!meta?.isGroup;
  const other = useMemo(
    () => (!isGroup && meta ? meta.participants?.find((p) => p._id !== currentUserId) : null),
    [isGroup, meta, currentUserId]
  );

  const isStarter = meta && String(meta.starter) === me;
  const isPending = meta?.status === 'pending';
  const iAmAdmin = meta?.admins?.some((a) => (a._id || a).toString() === me);
  const iAmCreator = meta && String(meta.starter) === me;
  const hasMe = (arr) => (arr || []).some((id) => (id._id || id).toString() === me);
  const metaPinned = hasMe(meta?.pinnedBy);
  const metaMuted = hasMe(meta?.mutedBy);
  const metaArchived = hasMe(meta?.archivedBy);

  const mySentCount = useMemo(
    () => messages.filter((m) => m.sender?._id === currentUserId).length,
    [messages, currentUserId]
  );

  const limitReached = isPending && isStarter && mySentCount >= 5;

  const visibleMessages = useMemo(() => {
    if (!chatSearch.trim()) return messages;
    return messages.filter((m) => (m.text || '').toLowerCase().includes(chatSearch.toLowerCase()));
  }, [messages, chatSearch]);

  // Unread divider: first message from other that is not read
  const unreadDividerId = useMemo(() => {
    const firstUnread = messages.find((m) => m.sender?._id !== currentUserId && !m.read);
    return firstUnread?._id || null;
  }, [messages, currentUserId]);

  // Group messages by date for separators (+ unread divider)
  const groupedMessages = useMemo(() => {
    const groups = [];
    let lastDate = '';
    const searching = !!chatSearch.trim();
    for (const msg of visibleMessages) {
      const dateLabel = getDateLabel(msg.createdAt);
      if (dateLabel !== lastDate) {
        groups.push({ type: 'separator', label: dateLabel, key: `sep-${dateLabel}-${msg._id}` });
        lastDate = dateLabel;
      }
      // Insert unread divider before first unread message
      if (!searching && msg._id === unreadDividerId) {
        groups.push({ type: 'unread', key: 'unread-divider' });
      }
      groups.push(msg);
    }
    return groups;
  }, [visibleMessages, unreadDividerId, chatSearch]);

  const mediaItems = useMemo(
    () => messages.filter((m) => m.imageUrl || m.audioUrl || m.fileUrl),
    [messages]
  );

  const exploreCards = useMemo(
    () => (tab === 'explore' && debouncedSearch.trim() ? userResults : explore),
    [tab, debouncedSearch, userResults, explore]
  );

  // Typing user names for group display
  const typingNames = useMemo(() => {
    if (!isGroup || !meta) return [];
    return typingUsers.map((id) => {
      const p = meta.participants?.find((pp) => pp._id === id);
      return p ? p.firstName : 'Someone';
    });
  }, [typingUsers, isGroup, meta]);

  // ─── Toast helper ───
  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2500);
  }, []);

  const clearBadge = useCallback((id) => {
    setConversations((prev) => prev.map((c) => (c._id === id ? { ...c, unread: 0 } : c)));
  }, []);

  // ─── Recent emojis ───
  const addRecentEmoji = (e) => {
    setRecentEmojis((prev) => [e, ...prev.filter((x) => x !== e)].slice(0, 20));
  };

  // ─── Recording discard (used when switching chats / unmounting) ───
  const discardRec = useCallback(() => {
    const mr = mrRef.current;
    if (mr && mr.state !== 'inactive') {
      mr.onstop = null;
      try { mr.stop(); } catch { /* ignore */ }
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    mrRef.current = null;
    chunksRef.current = [];
    clearInterval(recIntervalRef.current);
    setRecording(false);
  }, []);

  /* ═══════════════ FETCHERS WITH RACE GUARDS ═══════════════ */

  const fetchConvos = useCallback(async () => {
    if (tab === 'explore') return;
    const seq = ++convoSeqRef.current;
    // Show skeleton only when the tab/search actually changes — silent on background refreshes
    const key = `${tab}|${debouncedSearch}`;
    if (convoKeyRef.current !== key) {
      convoKeyRef.current = key;
      setConvLoading(true);
    }
    try {
      const { data } = await messagesAPI.getConversations({ tab, search: debouncedSearch || undefined });
      if (seq === convoSeqRef.current) setConversations(Array.isArray(data) ? data : []);
    } catch {
      if (seq === convoSeqRef.current) setConversations([]);
    } finally {
      if (seq === convoSeqRef.current) setConvLoading(false);
    }
  }, [tab, debouncedSearch]);

  useEffect(() => {
    fetchConvosRef.current = fetchConvos;
  }, [fetchConvos]);

  useEffect(() => {
    fetchConvos();
  }, [fetchConvos]);

  const fetchMeta = useCallback(async (id) => {
    if (!id) return;
    const seq = ++metaSeqRef.current;
    try {
      const { data } = await messagesAPI.getMeta(id);
      if (seq === metaSeqRef.current && activeIdRef.current === id) setMeta(data);
    } catch (err) {
      if (seq === metaSeqRef.current && activeIdRef.current === id) {
        setMeta(null);
        if ([403, 404].includes(err?.response?.status)) {
          showToast('Conversation unavailable', 'error');
          setActiveId(null);
          setSearchParams({});
        }
      }
    }
  }, [showToast, setSearchParams]);

  const fetchMessages = useCallback(async (id, { silent = false } = {}) => {
    if (!id) return;
    const seq = ++msgSeqRef.current;
    if (!silent) setMsgLoading(true);
    try {
      const { data } = await messagesAPI.getMessages(id);
      if (seq === msgSeqRef.current && activeIdRef.current === id) {
        setMessages(Array.isArray(data) ? data : []);
      }
    } catch {
      // keep current state
    } finally {
      if (seq === msgSeqRef.current) setMsgLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessagesRef.current = fetchMessages;
  }, [fetchMessages]);

  /* ═══════════════ ACTIVE CHAT LOADER ═══════════════ */
  useEffect(() => {
    if (!activeId) {
      setMeta(null);
      setMessages([]);
      setTypingUsers([]);
      setReplyTo(null);
      setChatSearch('');
      setShowChatSearch(false);
      setShowMedia(false);
      setShowGroupInfo(false);
      setMenuOpen(false);
      setShowEmoji(false);
      setFile(null);
      setScrollUnread(0);
      discardRec();
      return;
    }

    clearBadge(activeId);

    // reset stale chat state immediately
    setMeta(null);
    setMessages([]);
    setTypingUsers([]);
    setReplyTo(null);
    setChatSearch('');
    setShowChatSearch(false);
    setShowMedia(false);
    setShowGroupInfo(false);
    setMenuOpen(false);
    setShowEmoji(false);
    setFile(null);
    setScrollUnread(0);
    discardRec();

    scrollModeRef.current = 'open';
    autoScrollRef.current = true;

    fetchMeta(activeId);
    fetchMessages(activeId);
    fetchConvosRef.current?.();
  }, [activeId, clearBadge, fetchMeta, fetchMessages, discardRec]);

  /* ═══════════════ SOCKET ROOM JOIN/LEAVE ═══════════════ */
  useEffect(() => {
    const socket = socketRef.current;
    if (!activeId) return;
    if (socket?.connected) socket.emit('join_conversation', activeId);
    return () => {
      if (socket?.connected) socket.emit('leave_conversation', activeId);
    };
  }, [activeId]);

  /* ═══════════════ SOCKET — CONNECT ONCE ONLY ═══════════════ */
  useEffect(() => {
    if (!currentUserId || !token) return;

    const socket = io(SERVER_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on('connect', () => {
      if (activeIdRef.current) socket.emit('join_conversation', activeIdRef.current);
    });

    socket.on('new_message', (msg) => {
      const msgConvo = String(msg.conversation?._id || msg.conversation);
      const currentActive = activeIdRef.current;

      if (currentActive && msgConvo === String(currentActive)) {
        scrollModeRef.current = 'new';

        // count unseen incoming messages while scrolled up
        if (msg.sender?._id !== currentUserId && !autoScrollRef.current) {
          setScrollUnread((n) => n + 1);
        }

        // instant optimistic append
        setMessages((prev) => (prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]));

        setMeta((prev) => (prev ? { ...prev, lastMessageAt: msg.createdAt || new Date() } : prev));
        clearBadge(currentActive);

        // silent refetch marks read + guarantees consistency
        const p = fetchMessagesRef.current?.(currentActive, { silent: true });
        if (p?.finally) p.finally(() => fetchConvosRef.current?.());
        else fetchConvosRef.current?.();
      } else {
        fetchConvosRef.current?.();
      }
    });

    socket.on('messages_read', ({ conversation }) => {
      if (String(conversation) === String(activeIdRef.current)) {
        setMessages((prev) => prev.map((m) => (m.sender?._id === currentUserId ? { ...m, read: true } : m)));
      }
    });

    socket.on('user_typing', ({ userId: typerId, convoId, isTyping }) => {
      if (String(convoId) === String(activeIdRef.current) && typerId !== currentUserId) {
        setTypingUsers((prev) => {
          if (isTyping && !prev.includes(typerId)) return [...prev, typerId];
          if (!isTyping) return prev.filter((id) => id !== typerId);
          return prev;
        });
      }
    });

    socket.on('presence', (p) => setOnlineMap((prev) => ({ ...prev, [p.userId]: p.online })));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUserId, token, clearBadge]);

  /* ═══════════════ EXPLORE ═══════════════ */
  useEffect(() => {
    userAPI.explore()
      .then(({ data }) => setExplore(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === 'explore' && debouncedSearch.trim()) {
      const t = setTimeout(() => {
        searchAPI.global(debouncedSearch.trim())
          .then(({ data }) => setUserResults(data.users || []))
          .catch(() => setUserResults([]));
      }, 350);
      return () => clearTimeout(t);
    }
    setUserResults([]);
  }, [tab, debouncedSearch]);

  /* ═══════════════ PRESENCE FOR DM PARTNER ═══════════════ */
  useEffect(() => {
    if (other?._id) {
      presenceAPI.get([other._id])
        .then(({ data }) => setOnlineMap((prev) => ({ ...prev, ...data })))
        .catch(() => {});
    }
  }, [other?._id]);

  /* ═══════════════ SCROLL SYSTEM ═══════════════ */
  const scrollToBottom = useCallback(() => {
    const box = scrollBoxRef.current;
    if (!box) return;
    autoScrollRef.current = true;
    box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' });
    setShowScrollBtn(false);
    setScrollUnread(0);
  }, []);

  useEffect(() => {
    const box = scrollBoxRef.current;
    if (!box) return;

    const onScroll = () => {
      const nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 150;
      if (scrollModeRef.current === 'idle') autoScrollRef.current = nearBottom;
      setShowScrollBtn(!nearBottom && messages.length > 5);
      if (nearBottom) setScrollUnread(0);
    };

    box.addEventListener('scroll', onScroll);
    onScroll();
    return () => box.removeEventListener('scroll', onScroll);
  }, [messages.length, activeId, meta]);

  useEffect(() => {
    const box = scrollBoxRef.current;
    if (!box || messages.length === 0) return;

    const mode = scrollModeRef.current;
    const doScroll = (smooth) => box.scrollTo({ top: box.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });

    if (mode === 'open') {
      requestAnimationFrame(() => doScroll(false));
      scrollModeRef.current = 'idle';
    } else if (mode === 'bottom') {
      requestAnimationFrame(() => doScroll(true));
      scrollModeRef.current = 'idle';
    } else if (mode === 'new') {
      if (autoScrollRef.current) requestAnimationFrame(() => doScroll(true));
      scrollModeRef.current = 'idle';
    }
  }, [messages, activeId]);

  /* ═══════════════ CLEANUP ═══════════════ */
  useEffect(() => {
    return () => {
      clearTimeout(typingTimeoutRef.current);
      clearInterval(recIntervalRef.current);
      clearTimeout(toastTimerRef.current);
      const mr = mrRef.current;
      if (mr && mr.state !== 'inactive') {
        mr.onstop = null;
        try { mr.stop(); } catch { /* ignore */ }
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  /* ═══════════════ TYPING — THROTTLED ═══════════════ */
  const handleTyping = useCallback(() => {
    const socket = socketRef.current;
    const convoId = activeIdRef.current;
    if (!socket || !convoId) return;

    const now = Date.now();
    if (now - lastTypingRef.current > 800) {
      socket.emit('typing', { convoId, isTyping: true });
      lastTypingRef.current = now;
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { convoId, isTyping: false });
    }, 2000);
  }, []);

  /* ═══════════════ DRAG & DROP ═══════════════ */
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (!meta || limitReached) return;
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) setFile(droppedFile);
  };

  /* ═══════════════ ACTIONS ═══════════════ */

  const openChat = useCallback((id) => {
    if (!id) return;
    clearBadge(id);
    setSearchParams({ c: id });
    setActiveId(id);
    setMenuOpen(false);
    setShowEmoji(false);
  }, [clearBadge, setSearchParams]);

  const closeChat = () => {
    setActiveId(null);
    setSearchParams({});
  };

  const send = async (e) => {
    e.preventDefault();
    if ((!text.trim() && !file) || !activeId || limitReached) return;

    const formData = new FormData();
    if (text.trim()) formData.append('text', text.trim());
    if (file) {
      formData.append('image', file);
      formData.append('fileName', file.name);
    }
    if (replyTo) formData.append('replyTo', replyTo._id);

    try {
      const { data } = await messagesAPI.send(activeId, formData);
      scrollModeRef.current = 'bottom';
      autoScrollRef.current = true;
      setMessages((prev) => [...prev, data]);
      setText('');
      setFile(null);
      setReplyTo(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchMeta(activeId);
      fetchConvosRef.current?.();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send', 'error');
    }
  };

  const startChat = async (uid) => {
    try {
      const { data } = await messagesAPI.open({ recipientId: uid });
      setTab('requests');
      openChat(data._id);
    } catch (e) {
      showToast(e.response?.data?.message || 'Cannot start chat', 'error');
    }
  };

  const acceptRequest = async () => {
    try {
      await messagesAPI.acceptRequest(activeId);
      setTab('primary');
      fetchMeta(activeId);
      fetchConvosRef.current?.();
      showToast('Request accepted');
    } catch {
      showToast('Failed', 'error');
    }
  };

  const doSettings = async (action) => {
    try {
      await messagesAPI.settings(activeId, action);
      fetchMeta(activeId);
      fetchConvosRef.current?.();
      showToast('Saved');
    } catch {
      showToast('Failed', 'error');
    }
    setMenuOpen(false);
  };

  const deleteMsg = async (id) => {
    if (!window.confirm('Delete for everyone?')) return;
    try {
      await messagesAPI.deleteMessage(id);
      setMessages((prev) => prev.map((m) => (m._id === id ? { ...m, deleted: true, text: '' } : m)));
      showToast('Message deleted');
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed', 'error');
    }
  };

  const openForward = async (msg) => {
    setForwardMsg(msg);
    try {
      const { data } = await messagesAPI.getConversations({});
      setForwardList(Array.isArray(data) ? data : []);
    } catch {
      setForwardList([]);
    }
  };

  const doForward = async (convoId) => {
    try {
      await messagesAPI.forward(forwardMsg._id, convoId);
      setForwardMsg(null);
      showToast('Forwarded');
      if (String(convoId) === String(activeIdRef.current)) {
        fetchMessagesRef.current?.(convoId, { silent: true });
      }
      fetchConvosRef.current?.();
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed', 'error');
    }
  };

  const blockUser = async () => {
    if (!other) return;
    if (!window.confirm(`Block ${other.firstName}?`)) return;
    try {
      await userAPI.block(other._id);
      showToast(`${other.firstName} blocked`);
      setMenuOpen(false);
    } catch {
      showToast('Failed', 'error');
    }
  };

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];

      mr.ondataavailable = (ev) => chunksRef.current.push(ev.data);
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setFile(new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' }));
      };

      mr.start();
      mrRef.current = mr;
      setRecording(true);
      setRecTime(0);
      recIntervalRef.current = setInterval(() => setRecTime((t) => t + 1), 1000);
    } catch {
      showToast('Microphone access denied', 'error');
    }
  };

  const stopRec = () => {
    mrRef.current?.stop();
    setRecording(false);
    clearInterval(recIntervalRef.current);
  };

  const saveGroupInfo = async () => {
    const fd = new FormData();
    if (gName) fd.append('name', gName);
    fd.append('description', gDesc);
    if (gPhoto) fd.append('photo', gPhoto);

    try {
      await messagesAPI.groupInfo(activeId, fd);
      fetchMeta(activeId);
      fetchConvosRef.current?.();
      setGPhoto(null);
      showToast('Group info updated');
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed', 'error');
    }
  };

  const leaveGroup = async () => {
    if (!window.confirm('Leave this group?')) return;
    try {
      await messagesAPI.leave(activeId);
      setActiveId(null);
      setSearchParams({});
      fetchConvosRef.current?.();
      showToast('Left group');
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed', 'error');
    }
  };

  const addMember = async (uid) => {
    try {
      await messagesAPI.addMembers(activeId, [uid]);
      fetchMeta(activeId);
      showToast('Member added');
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed', 'error');
    }
  };

  const removeMember = async (uid) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await messagesAPI.removeMember(activeId, uid);
      fetchMeta(activeId);
      showToast('Member removed');
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed', 'error');
    }
  };

  const makeAdmin = async (uid) => {
    try {
      await messagesAPI.makeAdmin(activeId, uid);
      fetchMeta(activeId);
      showToast('Admin assigned');
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed', 'error');
    }
  };

  const createGroup = async (e) => {
    e.preventDefault();
    try {
      const { data } = await messagesAPI.createGroup({ name: groupName, memberIds: groupMembers });
      setShowGroupModal(false);
      setGroupName('');
      setGroupMembers([]);
      setTab('primary');
      openChat(data._id);
      showToast('Group created');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed', 'error');
    }
  };

  /* ═══════════════ HELPERS ═══════════════ */
  const mediaSrc = (url) => (url?.startsWith('http') ? url : `${SERVER_URL}${url}`);
  const avatar = (u) => (u?.avatarUrl ? mediaSrc(u.avatarUrl) : null);

  const convoName = useCallback((c) => {
    if (c.isGroup) return c.name || 'Group';
    const o = c.participants?.find((p) => p._id !== currentUserId);
    return o ? `${o.firstName || ''} ${o.lastName || ''}`.trim() : 'Conversation';
  }, [currentUserId]);

  const convoAvatar = (c) => {
    if (c.isGroup) return c.groupPhoto ? mediaSrc(c.groupPhoto) : null;
    const o = c.participants?.find((p) => p._id !== currentUserId);
    return avatar(o);
  };

  const tabs = [
    { id: 'primary', label: 'Primary', color: 'blue' },
    { id: 'requests', label: 'Requests', color: 'violet' },
    { id: 'archived', label: 'Archived', color: 'gray' },
    { id: 'explore', label: 'Explore', color: 'emerald' },
  ];

  const TAB_GRADIENTS = {
    blue: 'bg-gradient-to-r from-blue-600 to-violet-600',
    violet: 'bg-gradient-to-r from-violet-600 to-violet-600',
    gray: 'bg-gradient-to-r from-gray-600 to-slate-600',
    emerald: 'bg-gradient-to-r from-emerald-600 to-violet-600',
  };

  // Filtered emojis for current tab
  const filteredEmojis = useMemo(() => {
    if (emojiSearch.trim()) {
      return EMOJI_CATEGORIES.flatMap((c) => c.emojis);
    }
    if (emojiTab === 'recent') return recentEmojis;
    const cat = EMOJI_CATEGORIES.find((c) => c.id === emojiTab);
    return cat ? cat.emojis : [];
  }, [emojiTab, emojiSearch, recentEmojis]);

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-4.5rem)] flex flex-col md:flex-row gap-4 p-4 page-fade relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-xl shadow-lg text-sm font-semibold text-white animate-[pageFade_.2s_ease] ${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>
          {toast.msg}
        </div>
      )}

      {/* ═══════ SIDEBAR ═══════ */}
      <div className={`w-full md:w-80 lg:w-96 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 flex flex-col overflow-hidden shadow-sm transition-all duration-300 ${activeId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 space-y-3">
          <div className="relative">
            <Icon.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:text-slate-100 transition"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 ${tab === t.id ? `${TAB_GRADIENTS[t.color]} text-white shadow-md` : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowGroupModal(true)}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-500/10 border border-gray-200 dark:border-slate-700 text-sm font-semibold text-gray-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
          >
            <Icon.Plus className="w-4 h-4" /> Create Group
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {tab !== 'explore' ? (
            convLoading ? (
              <div className="space-y-1 p-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex gap-3 p-3">
                    <Skeleton className="w-12 h-12 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-2/3" />
                      <Skeleton className="h-2.5 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                  {tab === 'requests' ? <Icon.Shield className="w-8 h-8 text-gray-400" /> : tab === 'archived' ? <Icon.Archive className="w-8 h-8 text-gray-400" /> : <Icon.Users className="w-8 h-8 text-gray-400" />}
                </div>
                <p className="font-semibold text-gray-900 dark:text-slate-100">
                  {tab === 'requests' ? 'No pending requests' : tab === 'archived' ? 'No archived chats' : 'No conversations yet'}
                </p>
                <p className="text-sm text-gray-500 mt-1">Explore people to start chatting.</p>
              </div>
            ) : (
              conversations.map((c) => {
                const last = c.lastMessage;
                let preview = 'No messages yet';
                if (last?.deleted) preview = 'Message deleted';
                else if (last?.text) preview = last.text;
                else if (last?.imageUrl) preview = 'Photo';
                else if (last?.audioUrl) preview = 'Voice note';
                else if (last?.fileUrl) preview = `File: ${last.fileName || ''}`;

                return (
                  <button
                    key={c._id}
                    onClick={() => openChat(c._id)}
                    className={`w-full text-left p-4 border-b border-gray-50 dark:border-slate-800/50 hover:bg-gray-50 dark:hover:bg-slate-800/50 flex gap-3 transition-all duration-200 ${activeId === c._id ? 'bg-blue-50/50 dark:bg-blue-500/10 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}`}
                  >
                    <div className="relative flex-shrink-0">
                      {convoAvatar(c) ? (
                        <img src={convoAvatar(c)} className="w-12 h-12 rounded-full object-cover ring-2 ring-white dark:ring-slate-900" alt="" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-white flex items-center justify-center font-bold text-lg ring-2 ring-white dark:ring-slate-900">
                          {c.isGroup ? <Icon.Users className="w-6 h-6" /> : convoName(c)?.[0]}
                        </div>
                      )}
                      {c.unread > 0 && !c.muted && c._id !== activeId && (
                        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900 animate-pulse">
                          {c.unread}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <p className="font-semibold text-sm text-gray-900 dark:text-slate-100 truncate flex items-center gap-1">
                          {c.pinned && <Icon.Pin className="w-3 h-3 text-gray-400" />}
                          {c.muted && <Icon.BellOff className="w-3 h-3 text-gray-400" />}
                          {convoName(c)}
                        </p>
                        <span className="text-[10px] text-gray-400 flex-shrink-0">{c.lastMessageAt && timeAgo(c.lastMessageAt)}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{preview}</p>
                    </div>
                  </button>
                );
              })
            )
          ) : (
            <div className="p-3 space-y-3">
              {exploreCards.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No people found.</p>
              ) : (
                exploreCards.map((u) => (
                  <div key={u._id} className="border border-gray-100 dark:border-slate-800 rounded-xl p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition">
                    {avatar(u) ? <img src={avatar(u)} className="w-10 h-10 rounded-full object-cover" alt="" /> : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-white flex items-center justify-center font-bold">{u.firstName?.[0]}</div>}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 dark:text-slate-100 truncate">{u.firstName} {u.lastName}</p>
                      <p className="text-xs text-gray-500 truncate">{u.university}</p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Link to={`/user/${u._id}`} className="text-xs bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition text-center font-medium">Profile</Link>
                      <button onClick={() => startChat(u._id)} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition font-medium shadow-sm shadow-blue-500/20">Chat</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══════ CHAT AREA ═══════ */}
      <div
        className={`flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 flex flex-col overflow-hidden shadow-sm relative transition-all ${dragOver ? 'ring-2 ring-blue-500 ring-dashed' : ''}`}
        onDragOver={(e) => { e.preventDefault(); if (meta) setDragOver(true); }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(false); }}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {dragOver && (
          <div className="absolute inset-0 z-50 bg-blue-50/90 dark:bg-blue-500/10 backdrop-blur-sm flex items-center justify-center rounded-2xl border-2 border-dashed border-blue-400 pointer-events-none">
            <div className="text-center">
              <Icon.Paperclip className="w-12 h-12 text-blue-500 mx-auto mb-2" />
              <p className="font-semibold text-blue-600 dark:text-blue-400">Drop file to attach</p>
            </div>
          </div>
        )}

        {!meta ? (
          activeId ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4">
              <div className="w-full max-w-md space-y-3">
                <Skeleton className="h-12 w-2/3 rounded-2xl" />
                <Skeleton className="h-12 w-1/2 ml-auto rounded-2xl" />
                <Skeleton className="h-12 w-3/4 rounded-2xl" />
              </div>
              <p className="text-sm text-gray-400">Opening conversation...</p>
              <button onClick={closeChat} className="inline-flex items-center gap-1.5 text-xs font-medium bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition">
                <Icon.ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-slate-500 p-8">
              <div className="w-24 h-24 mb-6 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center">
                <Icon.Users className="w-12 h-12 opacity-50" />
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-slate-100">Select a conversation</p>
              <p className="text-sm mt-1">Choose from your existing chats or start a new one.</p>
            </div>
          )
        ) : (
          <>
            {/* Header */}
            <div className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-slate-800 p-3 sm:p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                {/* Back button — visible on ALL screen sizes */}
                <button onClick={closeChat} className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-300 transition active:scale-95" title="Back">
                  <Icon.ChevronLeft className="w-5 h-5" />
                </button>

                {/* Avatar or Avatar Stack for groups */}
                {isGroup ? (
                  <div className="flex items-center">
                    {meta.groupPhoto ? (
                      <img src={mediaSrc(meta.groupPhoto)} className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-slate-800 mr-2" alt="" />
                    ) : (
                      <div className="flex -space-x-2 mr-2">
                        {(meta.participants || []).slice(0, 3).map((p) => (
                          avatar(p) ? (
                            <img key={p._id} src={avatar(p)} className="w-8 h-8 rounded-full object-cover ring-2 ring-white dark:ring-slate-900" alt="" />
                          ) : (
                            <div key={p._id} className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-white flex items-center justify-center text-xs font-bold ring-2 ring-white dark:ring-slate-900">{p.firstName?.[0]}</div>
                          )
                        ))}
                        {(meta.participants || []).length > 3 && (
                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-slate-300 ring-2 ring-white dark:ring-slate-900">
                            +{(meta.participants || []).length - 3}
                          </div>
                        )}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-gray-900 dark:text-slate-100 text-sm sm:text-base">{meta.name || 'Group'}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{(meta.participants || []).length} members{meta.description ? ` • ${meta.description}` : ''}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {avatar(other) ? (
                      <img src={avatar(other)} className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-slate-800" alt="" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center font-bold text-gray-500 dark:text-slate-300 ring-2 ring-white dark:ring-slate-800">{other?.firstName?.[0] || '?'}</div>
                    )}
                    <div>
                      <p className="font-bold text-gray-900 dark:text-slate-100 text-sm sm:text-base">
                        {`${other?.firstName || ''} ${other?.lastName || ''}`.trim() || 'Conversation'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
                        {other && (onlineMap[other._id] ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Online</> : <><span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Offline</>)}
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1 sm:gap-2">
                {isPending && !isStarter && (
                  <button onClick={acceptRequest} className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 font-semibold transition">Accept</button>
                )}

                {!isGroup && other && <Link to={`/user/${other._id}`} className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition"><Icon.User className="w-3.5 h-3.5" /> Profile</Link>}
                {isGroup && <button onClick={() => { setShowGroupInfo(!showGroupInfo); setGName(meta.name || ''); setGDesc(meta.description || ''); }} className="inline-flex items-center gap-1.5 text-xs font-medium bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition"><Icon.Info className="w-3.5 h-3.5" /> Info</button>}

                <button onClick={() => setShowChatSearch(!showChatSearch)} className={`p-2 rounded-lg transition ${showChatSearch ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800'}`} title="Search in chat"><Icon.Search className="w-5 h-5" /></button>
                <button onClick={() => setShowMedia(!showMedia)} className={`p-2 rounded-lg transition ${showMedia ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800'}`} title="Media"><Icon.Image className="w-5 h-5" /></button>

                <div className="relative">
                  <button onClick={() => setMenuOpen(!menuOpen)} className={`p-2 rounded-lg transition ${menuOpen ? 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-slate-100' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800'}`}><Icon.MoreVertical className="w-5 h-5" /></button>
                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                      {!isGroup && other && <Link to={`/user/${other._id}`} onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition"><Icon.User className="w-4 h-4" /> View Profile</Link>}
                      <button onClick={() => doSettings(metaPinned ? 'unpin' : 'pin')} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">{metaPinned ? <><Icon.X className="w-4 h-4" /> Unpin Chat</> : <><Icon.Pin className="w-4 h-4" /> Pin Chat</>}</button>
                      <button onClick={() => doSettings(metaMuted ? 'unmute' : 'mute')} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">{metaMuted ? <><Icon.Bell className="w-4 h-4" /> Unmute</> : <><Icon.BellOff className="w-4 h-4" /> Mute</>}</button>
                      <button onClick={() => doSettings(metaArchived ? 'unarchive' : 'archive')} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">{metaArchived ? <><Icon.Archive className="w-4 h-4" /> Unarchive</> : <><Icon.Archive className="w-4 h-4" /> Archive</>}</button>
                      <div className="border-t border-gray-100 dark:border-slate-700 my-1" />
                      {!isGroup && other && (
                        <>
                          <button onClick={blockUser} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition"><Icon.Shield className="w-4 h-4" /> Block User</button>
                          <button onClick={() => { setShowReport(true); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition"><Icon.Flag className="w-4 h-4" /> Report User</button>
                        </>
                      )}
                      {isGroup && !iAmCreator && <button onClick={leaveGroup} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition"><Icon.LogOut className="w-4 h-4" /> Leave Group</button>}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Chat Search */}
            {showChatSearch && (
              <div className="p-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 flex items-center gap-2">
                <div className="relative flex-1">
                  <Icon.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input value={chatSearch} onChange={(e) => setChatSearch(e.target.value)} placeholder="Search in this conversation..." className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:text-slate-100 transition" autoFocus />
                </div>
                <button onClick={() => { setShowChatSearch(false); setChatSearch(''); }} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition" title="Close search"><Icon.X className="w-4 h-4" /></button>
              </div>
            )}

            {/* Group Info Panel */}
            {showGroupInfo && isGroup && (
              <div className="border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 p-4 max-h-80 overflow-y-auto custom-scrollbar animate-[pageFade_.3s_ease]">
                {/* Back header for group info */}
                <div className="sticky top-0 z-10 -mt-4 -mx-4 mb-3 px-4 py-2.5 flex items-center justify-between bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
                  <button onClick={() => setShowGroupInfo(false)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition">
                    <Icon.ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <p className="text-sm font-bold text-gray-900 dark:text-slate-100">Group Info</p>
                  <button onClick={() => setShowGroupInfo(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition" title="Close"><Icon.X className="w-4 h-4" /></button>
                </div>

                {iAmAdmin ? (
                  <div className="space-y-3 mb-4">
                    <input value={gName} onChange={(e) => setGName(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:text-slate-100" placeholder="Group name" />
                    <input value={gDesc} onChange={(e) => setGDesc(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:text-slate-100" placeholder="Group description" />
                    <input type="file" accept="image/*" onChange={(e) => setGPhoto(e.target.files[0])} className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    <button onClick={saveGroupInfo} className="w-full bg-blue-600 text-white text-sm font-semibold px-3 py-2 rounded-xl hover:bg-blue-700 transition shadow-sm shadow-blue-500/20">Save Group Info</button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-slate-300 mb-4 bg-white dark:bg-slate-900 p-3 rounded-xl border border-gray-100 dark:border-slate-800">{meta.description || 'No description provided.'}</p>
                )}

                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Members ({(meta.participants || []).length})</p>
                <div className="space-y-1">
                  {(meta.participants || []).map((p) => {
                    const pid = (p._id || p).toString();
                    const isCreator = String(meta.starter) === pid;
                    const isAdmin = meta.admins?.some((a) => (a._id || a).toString() === pid);
                    return (
                      <div key={pid} className="flex justify-between items-center py-2 px-2 rounded-lg hover:bg-white dark:hover:bg-slate-900 transition">
                        <p className="text-sm text-gray-800 dark:text-slate-200 flex items-center gap-2">
                          {p.firstName ? `${p.firstName} ${p.lastName || ''}` : 'User'}
                          {isCreator && <Icon.Crown className="w-3.5 h-3.5 text-amber-500" />}
                          {isAdmin && !isCreator && <Icon.Shield className="w-3.5 h-3.5 text-blue-500" />}
                          {pid === me && <span className="text-xs text-gray-400">(You)</span>}
                        </p>
                        <div className="flex gap-1.5">
                          {iAmCreator && !isCreator && !isAdmin && <button onClick={() => makeAdmin(pid)} className="text-[10px] font-semibold bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-500/30 transition">Make Admin</button>}
                          {iAmAdmin && !isCreator && pid !== me && <button onClick={() => removeMember(pid)} className="text-[10px] font-semibold bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 px-2 py-1 rounded-lg hover:bg-red-200 dark:hover:bg-red-500/30 transition">Remove</button>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {iAmAdmin && (
                  <div className="mt-4 border-t border-gray-200 dark:border-slate-700 pt-3">
                    <p className="text-xs font-semibold text-gray-500 mb-2">Add members:</p>
                    <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                      {explore.filter((u) => !(meta.participants || []).some((p) => (p._id || p).toString() === u._id.toString())).slice(0, 20).map((u) => (
                        <div key={u._id} className="flex justify-between items-center py-1.5 px-2 rounded-lg hover:bg-white dark:hover:bg-slate-900 transition">
                          <p className="text-xs text-gray-700 dark:text-slate-300">{u.firstName} {u.lastName}</p>
                          <button onClick={() => addMember(u._id)} className="text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition">+ Add</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Media Gallery */}
            {showMedia && (
              <div className="border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 p-4 max-h-64 overflow-y-auto custom-scrollbar animate-[pageFade_.3s_ease]">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-sm font-bold text-gray-900 dark:text-slate-100">Shared Media ({mediaItems.length})</p>
                  <button onClick={() => setShowMedia(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"><Icon.X className="w-4 h-4" /></button>
                </div>
                {mediaItems.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">No media shared yet.</p>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {mediaItems.map((m) => (
                      <div key={m._id} className="aspect-square rounded-lg overflow-hidden bg-gray-200 dark:bg-slate-700 relative group">
                        {m.imageUrl && <button onClick={() => setLightbox(mediaSrc(m.imageUrl))} className="w-full h-full"><img src={mediaSrc(m.imageUrl)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" alt="" /></button>}
                        {m.audioUrl && <div className="w-full h-full flex items-center justify-center bg-blue-50 dark:bg-blue-900/20"><Icon.Mic className="w-6 h-6 text-blue-500" /></div>}
                        {m.fileUrl && <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-slate-800"><Icon.FileText className="w-6 h-6 text-gray-500" /></div>}
                        {m.fileUrl && <a href={mediaSrc(m.fileUrl)} download={m.fileName} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-semibold transition">Download</a>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Messages */}
            <div ref={scrollBoxRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30 dark:bg-slate-900/30 custom-scrollbar relative">
              {msgLoading && messages.length === 0 ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className={`h-12 ${i % 2 ? 'ml-auto w-2/3' : 'w-2/3'} rounded-2xl`} />)}
                </div>
              ) : (
                <>
                  {isPending && isStarter && (
                    <div className="flex justify-center mb-4">
                      <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-medium px-4 py-2 rounded-full flex items-center gap-2">
                        <Icon.Shield className="w-3.5 h-3.5" />
                        Message Request: up to 5 messages before acceptance. ({mySentCount}/5)
                      </div>
                    </div>
                  )}

                  {visibleMessages.length === 0 && chatSearch.trim() ? (
                    <div className="text-center py-10 text-gray-500 text-sm">No messages found.</div>
                  ) : visibleMessages.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 text-sm">No messages yet. Say hello.</div>
                  ) : (
                    groupedMessages.map((item) => {
                      if (item.type === 'separator') {
                        return (
                          <div key={item.key} className="flex justify-center my-4">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-800 px-3 py-1 rounded-full">{item.label}</span>
                          </div>
                        );
                      }

                      if (item.type === 'unread') {
                        return (
                          <div key={item.key} className="flex items-center gap-3 my-4">
                            <div className="flex-1 h-px bg-red-400" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 bg-red-50 dark:bg-red-500/10 px-3 py-1 rounded-full">Unread messages</span>
                            <div className="flex-1 h-px bg-red-400" />
                          </div>
                        );
                      }

                      const m = item;
                      const mine = m.sender?._id === currentUserId;
                      const senderAvatar = avatar(m.sender);

                      return (
                        <div key={m._id} id={`msg-${m._id}`} className={`flex ${mine ? 'justify-end' : 'justify-start'} group`}>
                          {/* Sender avatar in groups */}
                          {isGroup && !mine && (
                            <div className="mr-2 mt-auto mb-1 shrink-0">
                              {senderAvatar ? (
                                <img src={senderAvatar} className="w-7 h-7 rounded-full object-cover" alt="" />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-white flex items-center justify-center text-[10px] font-bold">{m.sender?.firstName?.[0]}</div>
                              )}
                            </div>
                          )}

                          <div className={`max-w-[85%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl text-sm relative transition-all duration-200 ${highlightId === m._id ? 'ring-2 ring-amber-400 ring-offset-2 dark:ring-offset-slate-900' : ''} ${mine ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-br-sm shadow-md shadow-blue-500/10' : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-bl-sm shadow-sm border border-gray-100 dark:border-slate-700'}`}>
                            {isGroup && !mine && (
                              <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mb-1">{m.sender?.firstName} {m.sender?.lastName}</p>
                            )}

                            {m.replyTo && (
                              <div
                                onClick={() => {
                                  const el = document.getElementById(`msg-${m.replyTo._id}`);
                                  if (el) {
                                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    setHighlightId(m.replyTo._id);
                                    setTimeout(() => setHighlightId(null), 1200);
                                  }
                                }}
                                className={`border-l-2 rounded px-2 py-1.5 mb-2 text-xs cursor-pointer transition ${mine ? 'border-white/50 bg-white/10 hover:bg-white/20' : 'border-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20'}`}
                              >
                                <p className="font-semibold truncate">{m.replyTo.sender ? `${m.replyTo.sender.firstName || ''} ${m.replyTo.sender.lastName || ''}` : 'User'}</p>
                                <p className="truncate opacity-80">{m.replyTo.deleted ? 'Message deleted' : m.replyTo.text || 'Media attachment'}</p>
                              </div>
                            )}

                            {m.forwarded && <p className="text-[10px] opacity-70 italic mb-1 flex items-center gap-1"><Icon.Forward className="w-3 h-3" /> Forwarded</p>}

                            {m.deleted ? (
                              <p className="italic opacity-60 flex items-center gap-1.5"><Icon.Trash className="w-3.5 h-3.5" /> This message was deleted</p>
                            ) : (
                              <>
                                {m.imageUrl && (
                                  <img
                                    src={mediaSrc(m.imageUrl)}
                                    onClick={() => setLightbox(mediaSrc(m.imageUrl))}
                                    className="rounded-lg mb-2 max-w-full cursor-pointer hover:opacity-90 transition"
                                    alt="attachment"
                                  />
                                )}
                                {m.audioUrl && <VoiceNotePlayer src={mediaSrc(m.audioUrl)} mine={mine} />}
                                {m.fileUrl && <a href={mediaSrc(m.fileUrl)} download={m.fileName} className="flex items-center gap-2 bg-black/10 dark:bg-white/10 rounded-lg p-2 mb-2 hover:bg-black/20 dark:hover:bg-white/20 transition"><Icon.FileText className="w-4 h-4 flex-shrink-0" /><span className="truncate text-xs font-medium">{m.fileName}</span></a>}
                                {m.text && <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>}
                              </>
                            )}

                            <p className={`text-[10px] mt-1.5 text-right flex items-center justify-end gap-1 ${mine ? 'text-blue-100' : 'text-gray-400 dark:text-slate-500'}`}>
                              {formatTime(m.createdAt)}
                              {mine && <span className={m.read ? 'text-cyan-300 font-bold' : 'opacity-60'}>✓✓</span>}
                            </p>

                            {/* Hover Actions */}
                            <div className={`absolute -top-3 ${mine ? 'left-0' : 'right-0'} flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-100 dark:border-slate-700 p-0.5`}>
                              <button onClick={() => setReplyTo(m)} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 hover:text-blue-600 transition" title="Reply"><Icon.Reply className="w-3.5 h-3.5" /></button>
                              <button onClick={() => openForward(m)} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 hover:text-violet-600 transition" title="Forward"><Icon.Forward className="w-3.5 h-3.5" /></button>
                              {mine && !m.deleted && (
                                <button onClick={() => deleteMsg(m._id)} className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-500 hover:text-red-600 transition" title="Delete"><Icon.Trash className="w-3.5 h-3.5" /></button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Typing indicator with names */}
                  {typingUsers.length > 0 && (
                    <div className="flex justify-start items-end gap-2">
                      {isGroup && typingNames.length > 0 && (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                          {typingNames[0]?.[0]}
                        </div>
                      )}
                      <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 px-4 py-2.5 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-2">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-xs text-gray-500 font-medium">
                          {isGroup && typingNames.length > 0 ? `${typingNames.join(', ')} typing...` : 'Typing...'}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Scroll to bottom with unread count */}
            {showScrollBtn && (
              <button onClick={scrollToBottom} className="absolute bottom-20 right-6 w-10 h-10 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center hover:bg-blue-700 transition animate-[pageFade_.2s_ease]">
                <Icon.ChevronDown className="w-5 h-5" />
                {scrollUnread > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{scrollUnread}</span>
                )}
              </button>
            )}

            {/* Reply Preview */}
            {replyTo && (
              <div className="px-4 py-3 bg-blue-50/80 dark:bg-blue-500/10 border-t border-blue-100 dark:border-blue-500/20 flex justify-between items-center backdrop-blur-sm">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-0.5">Replying to {replyTo.sender?.firstName}</p>
                  <p className="text-xs text-gray-700 dark:text-slate-300 truncate">{replyTo.text || 'Media attachment'}</p>
                </div>
                <button onClick={() => setReplyTo(null)} className="ml-3 p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition"><Icon.X className="w-4 h-4" /></button>
              </div>
            )}

            {/* Attachment Preview */}
            {file && (
              <div className="px-4 py-3 bg-emerald-50/80 dark:bg-emerald-500/10 border-t border-emerald-100 dark:border-emerald-500/20 flex justify-between items-center backdrop-blur-sm">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    {file.type.startsWith('audio/') ? <Icon.Mic className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : file.type.startsWith('image/') ? <Icon.Image className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Icon.FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                  </div>
                  <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300 truncate">{file.name}</p>
                </div>
                <button type="button" onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="ml-3 p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition"><Icon.X className="w-4 h-4" /></button>
              </div>
            )}

            {/* Emoji Picker with Categories */}
            {showEmoji && (
              <div className="px-4 py-3 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800">
                {/* Category tabs */}
                <div className="flex gap-1 mb-2 overflow-x-auto custom-scrollbar">
                  <button onClick={() => setEmojiTab('recent')} className={`px-2.5 py-1.5 rounded-lg text-sm transition ${emojiTab === 'recent' ? 'bg-blue-100 dark:bg-blue-500/20' : 'hover:bg-gray-100 dark:hover:bg-slate-800'}`}>🕐</button>
                  {EMOJI_CATEGORIES.map((c) => (
                    <button key={c.id} onClick={() => setEmojiTab(c.id)} className={`px-2.5 py-1.5 rounded-lg text-sm transition ${emojiTab === c.id ? 'bg-blue-100 dark:bg-blue-500/20' : 'hover:bg-gray-100 dark:hover:bg-slate-800'}`}>{c.label}</button>
                  ))}
                </div>
                {/* Emoji grid */}
                <div className="grid grid-cols-8 gap-1.5 max-h-28 overflow-y-auto custom-scrollbar">
                  {filteredEmojis.map((e, i) => (
                    <button key={`${e}-${i}`} onClick={() => { setText((t) => t + e); addRecentEmoji(e); setShowEmoji(false); }} className="text-xl hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg p-1 transition transform hover:scale-110 active:scale-95">
                      {e}
                    </button>
                  ))}
                  {filteredEmojis.length === 0 && <p className="col-span-8 text-center text-xs text-gray-400 py-3">No recent emojis yet</p>}
                </div>
              </div>
            )}

            {/* Input Area */}
            {limitReached ? (
              <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-red-50/50 dark:bg-red-500/10 text-center text-sm font-medium text-red-700 dark:text-red-400 flex items-center justify-center gap-2">
                <Icon.Shield className="w-4 h-4" /> Limit reached. Wait for them to accept or reply.
              </div>
            ) : (
              <form onSubmit={send} className="p-3 sm:p-4 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2 items-end">
                <input type="file" accept="*/*" ref={fileInputRef} onChange={(e) => setFile(e.target.files[0])} className="hidden" />

                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 rounded-xl text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition active:scale-95" title="Attach file"><Icon.Paperclip className="w-5 h-5" /></button>
                <button type="button" onClick={() => setShowEmoji(!showEmoji)} className={`p-2.5 rounded-xl transition active:scale-95 ${showEmoji ? 'text-blue-600 bg-blue-50 dark:bg-blue-500/10' : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10'}`} title="Emoji"><Icon.Smile className="w-5 h-5" /></button>

                {recording ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                    <button type="button" onClick={stopRec} className="p-1.5 rounded-lg bg-red-100 dark:bg-red-500/20 text-red-600 transition active:scale-95" title="Stop recording">
                      <Icon.Stop className="w-5 h-5" />
                    </button>
                    <WaveformBars />
                    <span className="text-xs font-mono text-red-600 dark:text-red-400">{Math.floor(recTime / 60)}:{(recTime % 60).toString().padStart(2, '0')}</span>
                  </div>
                ) : (
                  <button type="button" onClick={startRec} className="p-2.5 rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition active:scale-95" title="Voice note"><Icon.Mic className="w-5 h-5" /></button>
                )}

                <div className="flex-1 relative">
                  <input
                    value={text}
                    onChange={(e) => { setText(e.target.value); handleTyping(); }}
                    placeholder="Type a message..."
                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:text-slate-100 transition resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!text.trim() && !file}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
                >
                  <Icon.Send className="w-5 h-5" />
                </button>
              </form>
            )}
          </>
        )}
      </div>

      {/* ═══════ LIGHTBOX ═══════ */}
      {lightbox && (
        <div className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white transition" onClick={() => setLightbox(null)}>
            <Icon.X className="w-8 h-8" />
          </button>
          <img src={lightbox} className="max-h-[85vh] max-w-full rounded-xl shadow-2xl" alt="Preview" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* ═══════ MODALS ═══════ */}

      {/* Create Group */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[pageFade_.2s_ease]">
          <form onSubmit={createGroup} className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 w-full max-w-md p-6 animate-[pageFade_.3s_ease]">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2"><Icon.Users className="w-5 h-5 text-blue-600" /> Create Group</h2>
              <button type="button" onClick={() => setShowGroupModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 transition"><Icon.X className="w-5 h-5" /></button>
            </div>
            <input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Group name (e.g., FYP Team)" className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:text-slate-100 mb-4" required />
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Select members (you are the creator)</p>
            <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1 mb-5 border border-gray-100 dark:border-slate-800 rounded-xl p-2">
              {explore.map((u) => (
                <label key={u._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition">
                  <input type="checkbox" checked={groupMembers.includes(u._id)} onChange={(e) => setGroupMembers(e.target.checked ? [...groupMembers, u._id] : groupMembers.filter((id) => id !== u._id))} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-gray-800 dark:text-slate-200 font-medium">{u.firstName} {u.lastName} <span className="text-xs text-gray-400 font-normal">• {u.university}</span></span>
                </label>
              ))}
            </div>
            <button type="submit" disabled={!groupName.trim() || groupMembers.length === 0} className="w-full bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold py-2.5 rounded-xl hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed">Create Group</button>
          </form>
        </div>
      )}

      {/* Forward */}
      {forwardMsg && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[pageFade_.2s_ease]">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 w-full max-w-md p-6 animate-[pageFade_.3s_ease]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2"><Icon.Forward className="w-5 h-5 text-violet-600" /> Forward to...</h2>
              <button onClick={() => setForwardMsg(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 transition"><Icon.X className="w-5 h-5" /></button>
            </div>
            <div className="max-h-72 overflow-y-auto custom-scrollbar space-y-1.5">
              {forwardList.map((c) => (
                <button key={c._id} onClick={() => doForward(c._id)} className="w-full text-left p-3 rounded-xl border border-gray-100 dark:border-slate-800 hover:bg-blue-50 dark:hover:bg-blue-500/10 flex items-center gap-3 transition">
                  {convoAvatar(c) ? <img src={convoAvatar(c)} className="w-9 h-9 rounded-full object-cover" alt="" /> : <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-white flex items-center justify-center"><Icon.Users className="w-4 h-4" /></div>}
                  <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">{convoName(c)}</p>
                </button>
              ))}
              {forwardList.length === 0 && <p className="text-sm text-gray-500 text-center py-6">No chats available.</p>}
            </div>
          </div>
        </div>
      )}

      {/* Report */}
      {showReport && other && (
        <ReportModal onSubmit={(payload) => userAPI.report(other._id, payload)} onClose={() => setShowReport(false)} />
      )}
    </div>
  );
};

export default InboxPage;