let ctx;
const ensure = () => {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
};

export const playTone = (freq = 880, dur = 0.18, type = 'sine', vol = 0.12) => {
  try {
    const c = ensure();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g); g.connect(c.destination);
    o.start(); o.stop(c.currentTime + dur);
  } catch (e) { /* audio blocked */ }
};

export const playMessageSound = () => { playTone(880, 0.12); setTimeout(() => playTone(1174.66, 0.16), 110); };
export const playNotifSound = () => { playTone(659.25, 0.15, 'triangle'); setTimeout(() => playTone(987.77, 0.12, 'triangle'), 120); };