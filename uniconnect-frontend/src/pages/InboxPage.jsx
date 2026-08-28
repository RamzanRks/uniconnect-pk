import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { messagesAPI, userAPI, presenceAPI, SERVER_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ReportModal from '../components/ReportModal';

const EMOJIS = ['😀','😂','😍','👍','🙏','🔥','🎉','❤️','😢','😡','🤔','👀','','🥳','','🤝'];

const InboxPage = () => {
  const { user } = useAuth();
  const me = user._id.toString();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState('primary');
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(searchParams.get('c') || null);
  const [meta, setMeta] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [search, setSearch] = useState('');
  const [chatSearch, setChatSearch] = useState('');
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [explore, setExplore] = useState([]);
  const [userResults, setUserResults] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showMedia, setShowMedia] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState([]);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [forwardMsg, setForwardMsg] = useState(null);
  const [forwardList, setForwardList] = useState([]);
  const [onlineMap, setOnlineMap] = useState({});
  const [recording, setRecording] = useState(false);
  const [gName, setGName] = useState('');
  const [gDesc, setGDesc] = useState('');
  const [gPhoto, setGPhoto] = useState(null);
    const [highlightId, setHighlightId] = useState(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const bottomRef = useRef(null);
    const scrollBoxRef = useRef(null);
  const scrollModeRef = useRef('idle');
  const fileInputRef = useRef(null);
  const mrRef = useRef(null);
  const chunksRef = useRef([]);

  const token = localStorage.getItem('token');
  const isGroup = !!meta?.isGroup;
  const other = !isGroup && meta ? meta.participants.find((p) => p._id !== user._id) : null;
  const isStarter = meta && String(meta.starter) === me;
  const isPending = meta?.status === 'pending';
  const iAmAdmin = meta?.admins?.some((a) => (a._id || a).toString() === me);
  const iAmCreator = meta && String(meta.starter) === me;
  const hasMe = (arr) => (arr || []).some((id) => (id._id || id).toString() === me);
  const metaPinned = hasMe(meta?.pinnedBy);
  const metaMuted = hasMe(meta?.mutedBy);
  const metaArchived = hasMe(meta?.archivedBy);
  const mySentCount = messages.filter((m) => m.sender._id === user._id).length;
  const limitReached = isPending && isStarter && mySentCount >= 5;
  const visibleMessages = chatSearch.trim()
    ? messages.filter((m) => (m.text || '').toLowerCase().includes(chatSearch.toLowerCase()))
    : messages;

  const fetchConvos = useCallback(async () => {
    try {
      const { data } = await messagesAPI.getConversations({ tab, search });
      setConversations(data);
    } catch (e) { /* ignore */ }
  }, [tab, search]);
  
    const clearBadge = (id) => {
    setConversations((prev) => prev.map((c) => (c._id === id ? { ...c, unread: 0 } : c)));
  };

  useEffect(() => { fetchConvos(); }, [fetchConvos]);
  useEffect(() => { userAPI.explore().then(({ data }) => setExplore(data)).catch(() => {}); }, []);
  useEffect(() => {
    if (tab === 'explore' && search.trim()) {
      import('../services/api').then(({ searchAPI }) => {
        searchAPI.global(search).then(({ data }) => setUserResults(data.users || [])).catch(() => {});
      });
    } else setUserResults([]);
  }, [search, tab]);

  const fetchMeta = useCallback(async (id) => {
    try { const { data } = await messagesAPI.getMeta(id); setMeta(data); } catch (e) { setMeta(null); }
  }, []);

  const fetchMessages = useCallback(async (id) => {
    try { const { data } = await messagesAPI.getMessages(id); setMessages(data); } catch (e) { /* ignore */ }
  }, []);

  useEffect(() => {
    if (activeId) {
      clearBadge(activeId);
      fetchMeta(activeId);
      scrollModeRef.current = 'open';
      (async () => { await fetchMessages(activeId); fetchConvos(); })();
    } else setMeta(null);
    setReplyTo(null); setChatSearch(''); setShowChatSearch(false);
  }, [activeId, fetchMeta, fetchMessages, fetchConvos]);

  useEffect(() => {
    const box = scrollBoxRef.current;
    if (!box) return;
    const mode = scrollModeRef.current;
    if (mode === 'open') {
      const firstUnseen = messages.find((m) => m.sender._id !== user._id && !m.read);
      if (firstUnseen) {
        const el = document.getElementById(`msg-${firstUnseen._id}`);
        if (el) { el.scrollIntoView({ block: 'start' }); scrollModeRef.current = 'idle'; return; }
      }
      box.scrollTop = box.scrollHeight;
      scrollModeRef.current = 'idle';
    } else if (mode === 'bottom') {
      box.scrollTop = box.scrollHeight;
      scrollModeRef.current = 'idle';
    } else if (mode === 'new') {
      const nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 150;
      if (nearBottom) box.scrollTop = box.scrollHeight;
      scrollModeRef.current = 'idle';
    }
  }, [messages]);

  useEffect(() => {
    if (other) {
      presenceAPI.get([other._id]).then(({ data }) => setOnlineMap(data)).catch(() => {});
    }
  }, [other?._id]);

  useEffect(() => {
    if (!user) return;
    const socket = io(SERVER_URL, { auth: { token } });
    socketRef.current = socket;

       socket.on('new_message', (msg) => {
      const msgConvo = String(msg.conversation?._id || msg.conversation);
      if (activeId && msgConvo === String(activeId)) {
        scrollModeRef.current = 'new';
        (async () => { await fetchMessages(activeId); fetchConvos(); })();
      } else {
        fetchConvos();
      }
      if (activeId) fetchMeta(activeId);
    });

    socket.on('messages_read', ({ conversation }) => {
      if (conversation === activeId) {
        setMessages((prev) => prev.map((m) => (m.sender._id === user._id ? { ...m, read: true } : m)));
      }
    });

    socket.on('user_typing', ({ userId, convoId, isTyping }) => {
      if (convoId === activeId && userId !== user._id) {
        setTypingUsers((prev) => {
          if (isTyping && !prev.includes(userId)) return [...prev, userId];
          if (!isTyping) return prev.filter((id) => id !== userId);
          return prev;
        });
      }
    });

    socket.on('presence', (p) => setOnlineMap((prev) => ({ ...prev, [p.userId]: p.online })));

    return () => socket.disconnect();
  }, [user, activeId, fetchConvos, fetchMeta]);

  useEffect(() => {
    if (activeId && socketRef.current) {
      socketRef.current.emit('join_conversation', activeId);
      return () => socketRef.current.emit('leave_conversation', activeId);
    }
  }, [activeId]);

  const handleTyping = () => {
    if (!socketRef.current || !activeId) return;
    socketRef.current.emit('typing', { convoId: activeId, isTyping: true });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit('typing', { convoId: activeId, isTyping: false });
    }, 2000);
  };

  const send = async (e) => {
    e.preventDefault();
    if ((!text.trim() && !file) || !activeId || limitReached) return;
    const formData = new FormData();
    if (text.trim()) formData.append('text', text.trim());
    if (file) formData.append('image', file);
    if (replyTo) formData.append('replyTo', replyTo._id);
    try {
      const { data } = await messagesAPI.send(activeId, formData);
      scrollModeRef.current = 'bottom';
      setMessages((prev) => [...prev, data]);
      setText(''); setFile(null); setReplyTo(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchMeta(activeId); fetchConvos();
    } catch (err) { alert(err.response?.data?.message || 'Failed to send'); }
  };

  const openChat = (id) => { clearBadge(id); setActiveId(id); setSearchParams({ c: id }); setMenuOpen(false); };

  const startChat = async (uid) => {
    try {
      const { data } = await messagesAPI.open({ recipientId: uid });
      setTab('requests');
      openChat(data._id);
      fetchConvos();
    } catch (e) { alert(e.response?.data?.message || 'Cannot start chat'); }
  };

  const acceptRequest = async () => {
    try { await messagesAPI.acceptRequest(activeId); fetchMeta(activeId); fetchConvos(); } catch (e) { alert('Failed'); }
  };

  const doSettings = async (action) => {
    try { await messagesAPI.settings(activeId, action); fetchMeta(activeId); fetchConvos(); } catch (e) { alert('Failed'); }
    setMenuOpen(false);
  };

  const deleteMsg = async (id) => {
    if (!window.confirm('Delete for everyone?')) return;
    try {
      await messagesAPI.deleteMessage(id);
      setMessages((prev) => prev.map((m) => (m._id === id ? { ...m, deleted: true, text: '' } : m)));
    } catch (e) { alert(e.response?.data?.message || 'Failed'); }
  };

  const openForward = async (msg) => {
    setForwardMsg(msg);
    const { data } = await messagesAPI.getConversations({});
    setForwardList(data);
  };

  const doForward = async (convoId) => {
    try {
      await messagesAPI.forward(forwardMsg._id, convoId);
      setForwardMsg(null);
      alert('↪️ Forwarded!');
    } catch (e) { alert(e.response?.data?.message || 'Failed'); }
  };

  const blockUser = async () => {
    if (!other) return;
    if (!window.confirm(`Block ${other.firstName}?`)) return;
    try { await userAPI.block(other._id); alert('🚫 User blocked.'); } catch (e) { alert('Failed'); }
    setMenuOpen(false);
  };

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
    } catch (e) { alert('Microphone access denied'); }
  };

  const stopRec = () => { mrRef.current?.stop(); setRecording(false); };

  const saveGroupInfo = async () => {
    const fd = new FormData();
    if (gName) fd.append('name', gName);
    fd.append('description', gDesc);
    if (gPhoto) fd.append('photo', gPhoto);
    try { await messagesAPI.groupInfo(activeId, fd); fetchMeta(activeId); fetchConvos(); alert('✅ Group info updated'); }
    catch (e) { alert(e.response?.data?.message || 'Failed'); }
  };

  const leaveGroup = async () => {
    if (!window.confirm('Leave this group?')) return;
    try { await messagesAPI.leave(activeId); setActiveId(null); fetchConvos(); } catch (e) { alert(e.response?.data?.message || 'Failed'); }
  };

  const addMember = async (uid) => { try { await messagesAPI.addMembers(activeId, [uid]); fetchMeta(activeId); } catch (e) { alert(e.response?.data?.message || 'Failed'); } };
  const removeMember = async (uid) => { if (!window.confirm('Remove this member?')) return; try { await messagesAPI.removeMember(activeId, uid); fetchMeta(activeId); } catch (e) { alert(e.response?.data?.message || 'Failed'); } };
  const makeAdmin = async (uid) => { try { await messagesAPI.makeAdmin(activeId, uid); fetchMeta(activeId); } catch (e) { alert(e.response?.data?.message || 'Failed'); } };

  const createGroup = async (e) => {
    e.preventDefault();
    try {
      const { data } = await messagesAPI.createGroup({ name: groupName, memberIds: groupMembers });
      setShowGroupModal(false); setGroupName(''); setGroupMembers([]);
      setTab('primary'); openChat(data._id); fetchConvos();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const avatar = (u) => u?.avatarUrl ? (u.avatarUrl.startsWith('http') ? u.avatarUrl : `${SERVER_URL}${u.avatarUrl}`) : null;
  const convoName = (c) => c.isGroup ? c.name : (() => { const o = c.participants.find((p) => p._id !== user._id); return `${o?.firstName} ${o?.lastName}`; })();
  const convoAvatar = (c) => { if (c.isGroup) return c.groupPhoto ? `${SERVER_URL}${c.groupPhoto}` : null; const o = c.participants.find((p) => p._id !== user._id); return avatar(o); };
  const exploreCards = search.trim() && tab === 'explore' ? userResults : explore;
  const mediaItems = messages.filter((m) => m.imageUrl || m.audioUrl || m.fileUrl);

  return (
    <div className="max-w-6xl mx-auto p-6 h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6">
      {/* ===== SIDEBAR ===== */}
      <div className="w-full md:w-1/3 bg-white rounded-xl shadow flex flex-col h-full">
        <div className="p-4 border-b border-gray-100">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Search..." className="input-field mb-3" />
          <div className="flex gap-1">
            {['primary', 'requests', 'archived', 'explore'].map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 text-xs font-medium rounded capitalize ${tab === t ? (t === 'requests' ? 'bg-purple-600 text-white' : t === 'explore' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white') : 'bg-gray-100 text-gray-600'}`}>{t}</button>
            ))}
          </div>
          <button onClick={() => setShowGroupModal(true)} className="mt-2 w-full text-xs bg-gray-800 text-white py-2 rounded hover:bg-black transition">👥 Create Group</button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {tab !== 'explore' ? (
            conversations.length === 0 ? (
              <p className="text-sm text-gray-500 text-center p-6">{tab === 'requests' ? 'No pending requests.' : tab === 'archived' ? 'No archived chats.' : 'No conversations yet. Explore people to start chatting!'}</p>
            ) : (
              conversations.map((c) => (
                <button key={c._id} onClick={() => openChat(c._id)} className={`w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 flex gap-3 ${activeId === c._id ? 'bg-blue-50' : ''}`}>
                  {convoAvatar(c) ? (
                    <img src={convoAvatar(c)} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">{c.isGroup ? '👥' : convoName(c)?.[0]}</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="font-semibold text-sm text-gray-900 truncate">{c.pinned && '📌 '}{c.muted && '🔕 '}{c.isGroup && '👥 '}{convoName(c)}</p>
                      {c.unread > 0 && !c.muted && c._id !== activeId && <span className="bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{c.unread}</span>}
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{c.lastMessage?.deleted ? '🚫 Deleted' : c.lastMessage?.text || (c.lastMessage?.imageUrl ? '📷 Image' : c.lastMessage?.audioUrl ? '🎤 Voice' : c.lastMessage?.fileUrl ? '📄 File' : 'Start a conversation')}</p>
                  </div>
                </button>
              ))
            )
          ) : (
            <div className="p-3 space-y-3">
              {exploreCards.length === 0 ? (
                <p className="text-sm text-gray-500 text-center p-6">No people found.</p>
              ) : (
                exploreCards.map((u) => (
                  <div key={u._id} className="border border-gray-200 rounded-lg p-4 flex items-center gap-3">
                    {avatar(u) ? <img src={avatar(u)} className="w-12 h-12 rounded-full object-cover" /> : <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">{u.firstName?.[0]}</div>}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{u.firstName} {u.lastName}</p>
                      <p className="text-xs text-gray-500 truncate">{u.university} • 🪙 {u.points} pts</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Link to={`/user/${u._id}`} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 text-center">👤 Profile</Link>
                      <button onClick={() => startChat(u._id)} className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">💬 Chat</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* ===== CHAT AREA ===== */}
      <div className="flex-1 bg-white rounded-xl shadow flex flex-col h-full">
        {!meta ? (
          <div className="flex-1 flex items-center justify-center text-gray-400"><p>Select a conversation to start messaging</p></div>
        ) : (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center relative">
              <div className="flex items-center gap-3">
                {isGroup ? (
                  meta.groupPhoto ? <img src={`${SERVER_URL}${meta.groupPhoto}`} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center">👥</div>
                ) : avatar(other) ? (
                  <img src={avatar(other)} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500">{other?.firstName?.[0]}</div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">
                    {isGroup ? `${meta.name} • ${meta.participants.length} members` : `${other?.firstName} ${other?.lastName}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {!isGroup && (onlineMap[other?._id] ? <span className="text-green-600">🟢 Online</span> : <span>⚪ Offline</span>)}
                    {isGroup && (meta.description || 'Group chat')}
                  </p>
                </div>
                {!isGroup && other && <Link to={`/user/${other._id}`} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 ml-2">👤 View Profile</Link>}
                {isGroup && <button onClick={() => { setShowGroupInfo(!showGroupInfo); setGName(meta.name || ''); setGDesc(meta.description || ''); }} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 ml-2">ℹ️ Info</button>}
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => setShowChatSearch(!showChatSearch)} className="text-lg text-gray-500 hover:text-gray-800" title="Search in chat">🔍</button>
                <button onClick={() => setShowMedia(!showMedia)} className="text-lg text-gray-500 hover:text-gray-800" title="Media gallery">🖼️</button>
                {!isGroup && isPending && !isStarter && (
                  <button onClick={acceptRequest} className="bg-green-600 text-white text-xs px-3 py-1.5 rounded hover:bg-green-700">✅ Accept</button>
                )}
                <button onClick={() => setMenuOpen(!menuOpen)} className="text-xl text-gray-500 hover:text-gray-800">⋮</button>
              </div>

              {menuOpen && (
                <div className="absolute right-4 top-14 bg-white border border-gray-200 rounded-lg shadow-xl z-50 w-44">
                  {!isGroup && other && <Link to={`/user/${other._id}`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">👤 View Profile</Link>}
                  <button onClick={() => doSettings(metaPinned ? 'unpin' : 'pin')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">{metaPinned ? '📌 Unpin Chat' : '📌 Pin Chat'}</button>
                  <button onClick={() => doSettings(metaMuted ? 'unmute' : 'mute')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">{metaMuted ? '🔔 Unmute' : '🔇 Mute'}</button>
                  <button onClick={() => doSettings(metaArchived ? 'unarchive' : 'archive')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">{metaArchived ? '📤 Unarchive' : '📦 Archive'}</button>
                  {!isGroup && other && (
                    <>
                      <button onClick={blockUser} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">🚫 Block User</button>
                      <button onClick={() => { setShowReport(true); setMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">🚩 Report User</button>
                    </>
                  )}
                  {isGroup && !iAmCreator && <button onClick={leaveGroup} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">🚪 Leave Group</button>}
                </div>
              )}
            </div>

            {showChatSearch && (
              <div className="p-2 border-b border-gray-100 bg-gray-50">
                <input value={chatSearch} onChange={(e) => setChatSearch(e.target.value)} placeholder="🔍 Search in this conversation..." className="input-field" autoFocus />
              </div>
            )}

            {/* Group info panel */}
            {showGroupInfo && isGroup && (
              <div className="border-b border-gray-100 bg-gray-50 p-4 max-h-72 overflow-y-auto">
                {iAmAdmin ? (
                  <div className="space-y-2 mb-3">
                    <input value={gName} onChange={(e) => setGName(e.target.value)} className="input-field" placeholder="Group name" />
                    <input value={gDesc} onChange={(e) => setGDesc(e.target.value)} className="input-field" placeholder="Group description" />
                    <input type="file" accept="image/*" onChange={(e) => setGPhoto(e.target.files[0])} className="text-xs" />
                    <button onClick={saveGroupInfo} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700">💾 Save Info</button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 mb-2">{meta.description || 'No description'}</p>
                )}
                <p className="text-sm font-semibold text-gray-800 mb-2">Members</p>
                {meta.participants.map((p) => {
                  const pid = (p._id || p).toString();
                  const isCreator = String(meta.starter) === pid;
                  const isAdmin = meta.admins.some((a) => (a._id || a).toString() === pid);
                  return (
                    <div key={pid} className="flex justify-between items-center py-1.5">
                      <p className="text-sm text-gray-800">{p.firstName} {p.lastName}{isCreator && ' 👑'}{isAdmin && !isCreator && ' 🛡️'}{pid === me && ' (You)'}</p>
                      <div className="flex gap-1">
                        {iAmCreator && !isCreator && !isAdmin && <button onClick={() => makeAdmin(pid)} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Make Admin</button>}
                        {iAmAdmin && !isCreator && pid !== me && <button onClick={() => removeMember(pid)} className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Remove</button>}
                      </div>
                    </div>
                  );
                })}
                {iAmAdmin && (
                  <div className="mt-3 border-t pt-2">
                    <p className="text-xs text-gray-500 mb-1">Add members:</p>
                    {explore.filter((u) => !meta.participants.some((p) => (p._id || p).toString() === u._id.toString())).map((u) => (
                      <div key={u._id} className="flex justify-between items-center py-1">
                        <p className="text-xs text-gray-700">{u.firstName} {u.lastName}</p>
                        <button onClick={() => addMember(u._id)} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">+ Add</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Media gallery */}
            {showMedia && (
              <div className="border-b border-gray-100 bg-gray-50 p-4 max-h-60 overflow-y-auto">
                <p className="text-sm font-semibold text-gray-800 mb-2">🖼️ Shared Media ({mediaItems.length})</p>
                {mediaItems.length === 0 ? <p className="text-xs text-gray-500">No media yet.</p> : (
                  <div className="grid grid-cols-4 gap-2">
                    {mediaItems.map((m) => (
                      <div key={m._id}>
                        {m.imageUrl && <img src={m.imageUrl.startsWith('http') ? m.imageUrl : `${SERVER_URL}${m.imageUrl}`} className="rounded h-16 w-full object-cover" />}
                        {m.audioUrl && <audio controls src={`${SERVER_URL}${m.audioUrl}`} className="w-full h-10" />}
                        {m.fileUrl && <a href={`${SERVER_URL}${m.fileUrl}`} download={m.fileName} className="text-xs bg-white border rounded p-2 block truncate">📄 {m.fileName}</a>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Messages */}
            <div ref={scrollBoxRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {isPending && isStarter && (
                <div className="text-center text-xs text-yellow-700 bg-yellow-50 p-2 rounded">⚠️ Message Request: up to 5 messages before acceptance. ({mySentCount}/5)</div>
              )}
              {visibleMessages.map((m) => (
                <div key={m._id} id={`msg-${m._id}`} className={`flex ${m.sender._id === user._id ? 'justify-end' : 'justify-start'} group`}>
                  <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm relative transition ${highlightId === m._id ? 'ring-4 ring-yellow-400' : ''} ${m.sender._id === user._id ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white text-gray-800 rounded-bl-sm shadow'}`}>
                    {isGroup && m.sender._id !== user._id && <p className="text-xs font-semibold text-blue-600 mb-0.5">{m.sender.firstName} {m.sender.lastName}</p>}
                    {m.replyTo && (
                      <div
                        onClick={() => { const el = document.getElementById(`msg-${m.replyTo._id}`); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); setHighlightId(m.replyTo._id); setTimeout(() => setHighlightId(null), 1200); } }}
                        className="border-l-4 border-blue-400 bg-black bg-opacity-10 rounded px-2 py-1 mb-1 text-xs cursor-pointer hover:bg-opacity-20"
                      >
                        <p className="font-semibold">{m.replyTo.sender?.firstName} {m.replyTo.sender?.lastName}</p>
                        <p className="truncate">{m.replyTo.deleted ? '🚫 Deleted' : m.replyTo.text || '📷 Media'}</p>
                      </div>
                    )}
                    {m.forwarded && <p className="text-[10px] opacity-70 italic mb-0.5">↪️ Forwarded</p>}
                    {m.deleted ? (
                      <p className="italic opacity-60">🚫 This message was deleted</p>
                    ) : (
                      <>
                        {m.imageUrl && <img src={m.imageUrl.startsWith('http') ? m.imageUrl : `${SERVER_URL}${m.imageUrl}`} className="rounded-lg mb-2 max-w-full" />}
                        {m.audioUrl && <audio controls src={`${SERVER_URL}${m.audioUrl}`} className="mb-2 max-w-full" />}
                        {m.fileUrl && <a href={`${SERVER_URL}${m.fileUrl}`} download={m.fileName} className="underline block mb-2">📄 {m.fileName}</a>}
                        {m.text && <p>{m.text}</p>}
                      </>
                    )}
                    <p className={`text-[9px] mt-1 text-right ${m.sender._id === user._id ? 'text-blue-100' : 'text-gray-400'}`}>
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {m.sender._id === user._id && <span className={`ml-1 ${m.read ? 'text-cyan-300 font-bold' : ''}`}>✓✓</span>}
                    </p>
                    {/* Hover actions */}
                    <div className={`absolute -top-3 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition`}>
                      <button onClick={() => setReplyTo(m)} className="bg-white border border-gray-200 rounded-full px-1.5 text-xs shadow hover:bg-gray-100" title="Reply">↩️</button>
                      <button onClick={() => openForward(m)} className="bg-white border border-gray-200 rounded-full px-1.5 text-xs shadow hover:bg-gray-100" title="Forward">↪️</button>
                      {m.sender._id === user._id && !m.deleted && (
                        <button onClick={() => deleteMsg(m._id)} className="bg-white border border-gray-200 rounded-full px-1.5 text-xs shadow hover:bg-red-50" title="Delete for everyone">🗑️</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {typingUsers.length > 0 && <div className="text-xs text-gray-500 italic px-2">Typing...</div>}
              <div ref={bottomRef} />
            </div>

            {/* Reply preview */}
            {replyTo && (
              <div className="px-4 py-2 bg-blue-50 border-t border-blue-100 flex justify-between items-center">
                <p className="text-xs text-blue-800 truncate">↩️ Replying to {replyTo.sender?.firstName}: {replyTo.text || ' Media'}</p>
                <button onClick={() => setReplyTo(null)} className="text-blue-600 font-bold">&times;</button>
              </div>
            )}

            {/* Attachment preview */}
            {file && (
              <div className="px-4 py-2 bg-green-50 border-t border-green-100 flex justify-between items-center">
                <p className="text-xs text-green-800 truncate">
                  {file.type.startsWith('audio/') ? '🎤 Voice note' : file.type.startsWith('image/') ? '📷' : '📄'} {file.name} — ready to send
                </p>
                <button type="button" onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="text-green-700 font-bold">&times;</button>
              </div>
            )}

            {/* Emoji picker */}

            {/* Emoji picker */}
            {showEmoji && (
              <div className="px-4 py-2 bg-white border-t border-gray-100 flex gap-2 flex-wrap">
                {EMOJIS.map((e) => (
                  <button key={e} onClick={() => setText((t) => t + e)} className="text-xl hover:scale-125 transition">{e}</button>
                ))}
              </div>
            )}

            {/* Input */}
            {limitReached ? (
              <div className="p-4 border-t border-gray-100 bg-red-50 text-center text-sm text-red-700">🚫 Limit reached. Wait for them to accept or reply.</div>
            ) : (
              <form onSubmit={send} className="p-3 border-t border-gray-100 flex gap-2 items-center bg-white">
                <input type="file" accept="*/*" ref={fileInputRef} onChange={(e) => setFile(e.target.files[0])} className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-gray-500 hover:text-blue-600 text-xl" title="Attach any file">📎</button>
                <button type="button" onClick={() => setShowEmoji(!showEmoji)} className="text-gray-500 hover:text-blue-600 text-xl" title="Emoji">😊</button>
                {recording ? (
                  <button type="button" onClick={stopRec} className="text-red-600 text-xl animate-pulse" title="Stop recording">⏹️</button>
                ) : (
                  <button type="button" onClick={startRec} className="text-gray-500 hover:text-red-600 text-xl" title="Voice note">🎤</button>
                )}
                <input value={text} onChange={(e) => { setText(e.target.value); handleTyping(); }} placeholder="Type a message..." className="input-field flex-1" />
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">Send</button>
              </form>
            )}
          </>
        )}
      </div>

      {/* Group creation modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <form onSubmit={createGroup} className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">👥 Create Group</h2>
              <button type="button" onClick={() => setShowGroupModal(false)} className="text-gray-500 hover:text-gray-800 text-2xl leading-none">&times;</button>
            </div>
            <input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Group name (e.g., FYP Team)" className="input-field mb-4" required />
            <p className="text-xs text-gray-500 mb-2">Select members (you are the creator 👑):</p>
            <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
              {explore.map((u) => (
                <label key={u._id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" checked={groupMembers.includes(u._id)} onChange={(e) => setGroupMembers(e.target.checked ? [...groupMembers, u._id] : groupMembers.filter((id) => id !== u._id))} />
                  <span className="text-sm text-gray-800">{u.firstName} {u.lastName} <span className="text-xs text-gray-400">• {u.university}</span></span>
                </label>
              ))}
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Create Group</button>
          </form>
        </div>
      )}

      {/* Forward modal */}
      {forwardMsg && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">↪️ Forward to...</h2>
              <button onClick={() => setForwardMsg(null)} className="text-gray-500 hover:text-gray-800 text-2xl leading-none">&times;</button>
            </div>
            <div className="max-h-72 overflow-y-auto space-y-2">
              {forwardList.map((c) => (
                <button key={c._id} onClick={() => doForward(c._id)} className="w-full text-left p-3 rounded border border-gray-100 hover:bg-blue-50 flex items-center gap-3">
                  {convoAvatar(c) ? <img src={convoAvatar(c)} className="w-9 h-9 rounded-full object-cover" /> : <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center">👥</div>}
                  <p className="text-sm font-medium text-gray-900">{c.isGroup ? `👥 ${c.name}` : convoName(c)}</p>
                </button>
              ))}
              {forwardList.length === 0 && <p className="text-sm text-gray-500 text-center">No chats available.</p>}
            </div>
          </div>
        </div>
      )}

      {showReport && other && (
        <ReportModal onSubmit={(payload) => userAPI.report(other._id, payload)} onClose={() => setShowReport(false)} />
      )}
    </div>
  );
};

export default InboxPage;