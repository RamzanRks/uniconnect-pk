import { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { SERVER_URL } from '../services/api';
import { useAuth } from './AuthContext';
import api from '../services/api';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnread(0);
      return;
    }

    const token = localStorage.getItem('token');
    const socket = io(SERVER_URL, { auth: { token } });

    socket.on('notification', (n) => {
      setNotifications((prev) => [n, ...prev]);
      setUnread((u) => u + 1);
    });

    api.get('/notifications')
      .then(({ data }) => {
        setNotifications(data);
        setUnread(data.filter((n) => !n.read).length);
      })
      .catch(() => {});

    return () => socket.disconnect();
  }, [user]);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unread, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);