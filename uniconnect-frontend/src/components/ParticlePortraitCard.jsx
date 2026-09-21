import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { particleAPI, SERVER_URL } from '../services/api';

const REMOVERS = [
  { name: 'remove.bg', url: 'https://www.remove.bg/' },
  { name: 'Adobe Express', url: 'https://www.adobe.com/express/feature/image/remove-background' },
  { name: 'erase.bg', url: 'https://www.erase.bg/' },
];

const ParticlePortraitCard = () => {
  const { user, refreshUser } = useAuth();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [file, setFile] = useState(null);
  const inputRef = useRef(null);

  const cutoutSrc = user?.particleCutoutUrl
    ? (user.particleCutoutUrl.startsWith('http') ? user.particleCutoutUrl : `${SERVER_URL}${user.particleCutoutUrl}`)
    : null;

  const runAuto = async () => {
    setBusy(true); setErr(''); setMsg('');
    try {
      const { data } = await particleAPI.regenerate();
      if (data?.particleCutoutUrl) {
        await refreshUser();
        setMsg('AI cutout created — your particle portrait is live!');
      } else {
        setErr('The AI worker returned nothing. It may be offline — use the manual option below, it always works.');
      }
    } catch (e) {
      setErr('Auto AI is offline right now. Use the manual option below — it always works.');
    }
    setBusy(false);
  };

  const runManual = async () => {
    if (!file) { setErr('Choose a transparent PNG first.'); return; }
    setBusy(true); setErr(''); setMsg('');
    try {
      const fd = new FormData();
      fd.append('cutout', file);
      await particleAPI.uploadCutout(fd);
      await refreshUser();
      setMsg('Cutout uploaded — your particle portrait is live!');
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (e) {
      setErr(e.response?.data?.message || 'Upload failed. Make sure it is a PNG with a transparent background.');
    }
    setBusy(false);
  };

  return (
    <div className="rounded-3xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all duration-300 hover:shadow-xl p-6 sm:p-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>
          <h2 className="text-lg font-extrabold tracking-tight text-gray-900 dark:text-white">Particle Portrait</h2>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cutoutSrc ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400'}`}>
          {cutoutSrc ? 'Live' : 'Not set yet'}
        </span>
      </div>
      <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
        Your profile photo, rebuilt as thousands of interactive particles behind every page. Generate it with AI automatically — or make it yourself in 30 seconds.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mt-5">
        {/* Auto AI */}
        <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 p-4">
          <p className="text-sm font-bold text-gray-800 dark:text-white">Option 1 — Automatic AI</p>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">One click. Uses our server-side portrait AI (needs the worker running).</p>
          <button
            onClick={runAuto}
            disabled={busy}
            className="mt-3 inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-sm hover:shadow-md hover:opacity-90 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v3"/><path d="M18.4 5.6l-2.1 2.1"/><path d="M21 12h-3"/><path d="M5.6 5.6l2.1 2.1"/><path d="M3 12h3"/><path d="M12 10a4 4 0 0 1 4 4c0 1.5-.8 2.6-2 3.3V19h-4v-1.7c-1.2-.7-2-1.8-2-3.3a4 4 0 0 1 4-4Z"/></svg>
            {busy ? 'Working...' : 'Generate with AI'}
          </button>
        </div>

        {/* Manual */}
        <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 p-4">
          <p className="text-sm font-bold text-gray-800 dark:text-white">Option 2 — Do it yourself</p>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">1) Remove your photo's background with any free tool:</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {REMOVERS.map((r) => (
              <a
                key={r.name}
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 px-2.5 py-1 rounded-full hover:bg-blue-50 dark:hover:bg-blue-500/10 transition active:scale-95"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
                {r.name}
              </a>
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">2) Download the transparent PNG, then upload it here:</p>
          <div className="flex items-center gap-2 mt-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/png"
              onChange={(e) => setFile(e.target.files[0])}
              className="block w-full text-xs text-gray-600 dark:text-slate-400 file:mr-2 file:rounded-full file:border-0 file:bg-blue-50 dark:file:bg-blue-500/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-blue-700 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-500/20 cursor-pointer"
            />
            <button
              onClick={runManual}
              disabled={busy}
              className="shrink-0 inline-flex items-center gap-1.5 bg-gray-800 dark:bg-slate-700 text-white text-xs font-semibold px-3.5 py-2 rounded-full hover:bg-black dark:hover:bg-slate-600 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
              Upload
            </button>
          </div>
        </div>
      </div>

      {/* Preview */}
      {cutoutSrc && (
        <div className="flex items-center gap-4 mt-5">
          <div
            className="w-16 h-16 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden shrink-0"
            style={{ backgroundImage: 'conic-gradient(#e5e7eb 0 25%, transparent 0 50%, #e5e7eb 0 75%, transparent 0)', backgroundSize: '16px 16px' }}
          >
            <img src={cutoutSrc} alt="cutout preview" className="w-full h-full object-contain" />
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400">Current cutout — this is what your particles are built from. Upload a new one anytime to update.</p>
        </div>
      )}

      {msg && (
        <div className="flex items-center gap-2.5 bg-green-50 dark:bg-green-500/10 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-500/20 p-3 rounded-xl text-sm font-medium mt-4">
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          {msg}
        </div>
      )}
      {err && (
        <div className="flex items-center gap-2.5 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20 p-3 rounded-xl text-sm font-medium mt-4">
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
          {err}
        </div>
      )}
    </div>
  );
};

export default ParticlePortraitCard;