import { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { playMessageSound, playNotifSound } from '../utils/sound';

const PREFS = [
  ['messages', '💬 Messages'],
  ['reactions', '❤️ Reactions'],
  ['comments', '💬 Comments'],
  ['follows', '➕ Follows'],
  ['applications', '🤝 Applications'],
  ['system', '🛡️ System (always on)'],
];

const NotificationPrefsCard = () => {
  const { user, refreshUser } = useAuth();
  const [prefs, setPrefs] = useState(user.notifPrefs || {});
  const [sound, setSound] = useState(user.soundEnabled !== false);
  const [muted, setMuted] = useState(!!(user.muteAllUntil && new Date(user.muteAllUntil) > new Date()));
  const [emails, setEmails] = useState(prefs.emails !== false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    setPrefs(user.notifPrefs || {});
    setSound(user.soundEnabled !== false);
    setMuted(!!(user.muteAllUntil && new Date(user.muteAllUntil) > new Date()));
  }, [user._id]);

  const save = async (updates = {}) => {
    setSaving(true);
    try {
      await authAPI.setNotifPrefs({ prefs: { ...prefs, emails }, soundEnabled: sound, muteAll: muted, ...updates });
      await refreshUser();
      setMsg('✅ Saved');
      setTimeout(() => setMsg(''), 1500);
    } catch (e) { setMsg('❌ Failed'); }
    setSaving(false);
  };

  const togglePref = (key) => {
    if (key === 'system') return;
    const next = { ...prefs, [key]: !(prefs[key] !== false) };
    setPrefs(next);
    save({ prefs: next });
  };

  return (
    <div className="bg-white rounded-xl shadow p-8 mt-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-800">🔔 Notification Preferences</h2>
        {msg && <span className="text-xs text-gray-500">{msg}</span>}
      </div>
      <p className="text-sm text-gray-500 mt-1">Control what you hear and see. Critical system alerts always come through.</p>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium">🔊 Sound effects</p>
            <p className="text-xs text-gray-500">Play chimes on new messages/notifications</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { playMessageSound(); }} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200">Test</button>
            <button onClick={() => { const n = !sound; setSound(n); save({ soundEnabled: n }); }} className={`relative inline-flex h-6 w-11 items-center rounded-full ${sound ? 'bg-blue-600' : 'bg-gray-300'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${sound ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium">⏸️ Mute all (1 hour)</p>
            <p className="text-xs text-gray-500">Silence everything except critical alerts</p>
          </div>
          <button onClick={() => { const n = !muted; setMuted(n); save({ muteAll: n }); }} className={`relative inline-flex h-6 w-11 items-center rounded-full ${muted ? 'bg-orange-500' : 'bg-gray-300'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${muted ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium">📧 Email notifications</p>
            <p className="text-xs text-gray-500">Receive email summaries</p>
          </div>
          <button onClick={() => { const n = !emails; setEmails(n); setPrefs({ ...prefs, emails: n }); save({ prefs: { ...prefs, emails: n } }); }} className={`relative inline-flex h-6 w-11 items-center rounded-full ${emails ? 'bg-blue-600' : 'bg-gray-300'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${emails ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium text-gray-700 mb-2">In-app notification types</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {PREFS.map(([key, label]) => {
            const on = prefs[key] !== false;
            const isSystem = key === 'system';
            return (
              <button key={key} onClick={() => togglePref(key)} disabled={isSystem} className={`flex justify-between items-center p-3 rounded-lg border text-left transition ${isSystem ? 'bg-gray-50 cursor-not-allowed' : 'bg-white hover:border-blue-300'} ${on ? 'border-blue-200' : 'border-gray-200 opacity-60'}`}>
                <span className="text-sm">{label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${on ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{on ? 'ON' : 'OFF'}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default NotificationPrefsCard;