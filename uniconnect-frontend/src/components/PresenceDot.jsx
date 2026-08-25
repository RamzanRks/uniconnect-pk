import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { SERVER_URL, presenceAPI } from '../services/api';

const PresenceDot = ({ userId }) => {
  const [online, setOnline] = useState(false);

  useEffect(() => {
    let active = true;
    presenceAPI.get([userId])
      .then(({ data }) => { if (active) setOnline(!!data[userId]); })
      .catch(() => {});

    const socket = io(SERVER_URL, { auth: { token: localStorage.getItem('token') } });
    socket.on('presence', (p) => {
      if (p.userId === userId) setOnline(p.online);
    });

    return () => { active = false; socket.disconnect(); };
  }, [userId]);

  if (!online) return null;
  return (
    <span className="inline-block w-2.5 h-2.5 bg-green-500 rounded-full ml-1 align-middle" title="Online now" />
  );
};

export default PresenceDot;