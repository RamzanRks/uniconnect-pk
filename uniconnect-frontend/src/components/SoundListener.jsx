import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { SERVER_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { playMessageSound, playNotifSound } from '../utils/sound';

const SoundListener = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      auth: { token }, // ← critical: pass auth token
    });

    socket.emit('join', user._id);

    const onNotif = (n) => {
      if (user.soundEnabled === false) return;
      if (user.muteAllUntil && new Date(user.muteAllUntil) > new Date() && n.type !== 'system') return;
      const prefs = user.notifPrefs || {};
      const map = { message: 'messages', reaction: 'reactions', comment: 'comments', follow: 'follows', application: 'applications' };
      const key = map[n.type];
      if (key && prefs[key] === false) return;
      if (n.type === 'message') playMessageSound();
      else playNotifSound();
    };

    socket.on('notification', onNotif);
    return () => { socket.off('notification', onNotif); socket.disconnect(); };
  }, [user]);

  return null;
};

export default SoundListener;