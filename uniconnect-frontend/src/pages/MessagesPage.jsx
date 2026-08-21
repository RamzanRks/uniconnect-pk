import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { messagesAPI, SERVER_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';

const MessagesPage = () => {
  const { user } = useAuth();
  const [convos, setConvos] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [searchParams] = useSearchParams();
  const bottomRef = useRef(null);

  const fetchConvos = useCallback(async () => {
    try {
      const { data } = await messagesAPI.getConversations();
      setConvos(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchConvos();
  }, [fetchConvos]);

  const openConvo = useCallback(async (c) => {
    setActive(c);
    try {
      const { data } = await messagesAPI.getMessages(c._id);
      setMessages(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Open conversation from URL (?c=ID)
  useEffect(() => {
    const cId = searchParams.get('c');
    if (cId && convos.length) {
      const c = convos.find((x) => x._id === cId);
      if (c) openConvo(c);
    }
  }, [convos, searchParams, openConvo]);

  // Real-time incoming messages
  useEffect(() => {
    const token = localStorage.getItem('token');
    const s = io(SERVER_URL, { auth: { token } });
    s.on('message', (msg) => {
      if (active && msg.conversation === active._id) {
        setMessages((prev) => [...prev, msg]);
      }
      fetchConvos();
    });
    return () => s.disconnect();
  }, [active, fetchConvos]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || !active) return;
    try {
      const { data } = await messagesAPI.send(active._id, text.trim());
      setMessages((prev) => [...prev, data]);
      setText('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send');
    }
  };

  const other = (c) => c.participants.find((p) => p._id !== user._id);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">💬 Team Messages</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Conversations list */}
        <div className="bg-white rounded-lg shadow h-[70vh] overflow-y-auto">
          {convos.length === 0 ? (
            <p className="text-sm text-gray-500 text-center p-6">No chats yet. Chats open after a teammate is accepted.</p>
          ) : (
            convos.map((c) => (
              <button
                key={c._id}
                onClick={() => openConvo(c)}
                className={`w-full text-left p-4 border-b border-gray-100 hover:bg-blue-50 transition ${active?._id === c._id ? 'bg-blue-50' : ''}`}
              >
                <p className="font-semibold text-gray-900 text-sm">
                  {other(c)?.firstName} {other(c)?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">📌 {c.project?.title}</p>
              </button>
            ))
          )}
        </div>

        {/* Chat window */}
        <div className="md:col-span-2 bg-white rounded-lg shadow flex flex-col h-[70vh]">
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Select a conversation
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-gray-100">
                <p className="font-semibold text-gray-900">
                  {other(active)?.firstName} {other(active)?.lastName}
                  <span className="text-xs text-gray-500 font-normal"> • {other(active)?.university}</span>
                </p>
                <p className="text-xs text-gray-500">📌 {active.project?.title}</p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m) => (
                  <div key={m._id} className={`flex ${m.sender._id === user._id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${m.sender._id === user._id ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                      {m.text}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={send} className="p-3 border-t border-gray-100 flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message..."
                  className="input-field"
                />
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;