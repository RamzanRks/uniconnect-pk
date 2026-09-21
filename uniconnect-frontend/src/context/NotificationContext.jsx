import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { SERVER_URL } from '../services/api';
import { useAuth } from './AuthContext';
import api from '../services/api';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const socketRef = useRef(null);
  const markReadInProgress = useRef(false);

  // Fetch initial notifications
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnread(0);
      return;
    }

    api.get('/notifications')
      .then(({ data }) => {
        setNotifications(data);
        setUnread(data.filter((n) => !n.read).length);
      })
      .catch(() => {});
  }, [user]);

  // Socket listener for real-time notifications
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('token');
    const socket = io(SERVER_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on('notification', (n) => {
      setNotifications((prev) => [n, ...prev]);
      setUnread((u) => u + 1);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  // Mark all as read — optimistic update + API call
  const markAllRead = useCallback(async () => {
    if (markReadInProgress.current) return;
    if (unread === 0) return;

    markReadInProgress.current = true;

    // Optimistic: immediately update UI
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);

    try {
      await api.put('/notifications/read');
    } catch (e) {
      console.error('Failed to mark notifications as read', e);
    } finally {
      markReadInProgress.current = false;
    }
  }, [unread]);

  // Mark a single notification as read (for click-through)
  const markOneRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, read: true } : n))
    );
    setUnread((u) => Math.max(0, u - 1));
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unread, markAllRead, markOneRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);