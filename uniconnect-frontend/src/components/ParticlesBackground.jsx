import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { SERVER_URL, particleAPI } from '../services/api';
import { Particles } from './fx';

const attempted = new Set();

function loadCanvas(url) {
  return new Promise((res, rej) => {
    const i = new Image();
    i.crossOrigin = 'anonymous';
    i.onload = () => {
      const c = document.createElement('canvas');
      c.width = i.naturalWidth; c.height = i.naturalHeight;
      c.getContext('2d').drawImage(i, 0, 0);
      res(c);
    };
    i.onerror = rej;
    i.src = url;
  });
}

/* ---- Pointillism engine ---- */
const EASE = 0.06;
const CONTRAST = 1.6;
const BUCKETS = 24;
const BUDGET = 26000;
const SIZE_BOOST = 1.38;
const FONT = 'Inter, ui-sans-serif, system-ui, sans-serif';                    // skills chips
const FONT_NAME = '"Oswald", "Chunks Five", Inter, ui-sans-serif, sans-serif';  // MAIN HEADING
const FONT_SUB = 'Calibri, Carlito, "Segoe UI", ui-sans-serif, sans-serif';     // SUB-HEADING

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) { ctx.roundRect(x, y, w, h, r); return; }
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

class PointillismEngine {
  constructor(canvas) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.dpr = Math.max(1, window.devicePixelRatio || 1);
    this.w = 0; this.h = 0; this.region = null; this.cut = null;
    this.particles = []; this.groups = [];
    this.meta = { name: '', bio: '', skills: [], headline: '', university: '' };
    this.chips = []; this.marqueeSpan = 0;
    this.typeItems = []; this.fadeItems = [];
    this.ts = null; this.fs = null;
    this.textTop = 0; this.bioTop = 0; this.skillsTop = 0; this.centerX = 0;
    this.raf = 0; this.running = false;
    this._animate = this._animate.bind(this);
    this._themeObs = new MutationObserver(() => { if (this.cut) this.process(null); });
    this._themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }
  setMeta(meta) { this.meta = meta || { name: '', bio: '', skills: [], headline: '', university: '' }; }
  resize(w, h) {
    this.w = w; this.h = h;
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const contentW = Math.min(w - 32, 896);
    const contentRight = (w + contentW) / 2;
    const gutterW = w - contentRight;
    if (gutterW < 150) { this.region = null; return; }
    const gutterCenter = contentRight + gutterW / 2;
    const rw = Math.max(140, (gutterW - 16) * SIZE_BOOST);
    this.region = { x: gutterCenter - rw / 2, y: 24, w: rw, h: h - 48 };
  }
  process(cut) {
    if (cut) this.cut = cut;
    this.particles = []; this.groups = [];
    const src = this.cut;
    if (!this.region || !src) return;
    const R = this.region;
    const ctx = this.ctx;
    const dark = document.documentElement.classList.contains('dark');
    const m = this.meta;

    /* ---- rotating TYPEWRITER items: name ↔ headline (Oswald) ---- */
    this.typeItems = [];
    for (const t of [m.name || '', m.headline || '']) {
      if (!t) continue;
      let size = 26;
      ctx.font = `600 ${size}px ${FONT_NAME}`;
      while (ctx.measureText(t).width > R.w - 8 && size > 13) { size -= 2; ctx.font = `600 ${size}px ${FONT_NAME}`; }
      this.typeItems.push({ text: t, size });
    }
    const nameH = this.typeItems.length ? 36 : 0;

    /* ---- rotating FADE items: university ↔ bio (Calibri) ---- */
    this.fadeItems = [];
    if (m.university) this.fadeItems.push({ kind: 'uni', lines: [String(m.university)] });
    if (m.bio) {
      ctx.font = `400 12.5px ${FONT_SUB}`;
      const words = String(m.bio).split(/\s+/);
      const lines = []; let line = '';
      for (const wd of words) {
        const test = line ? line + ' ' + wd : wd;
        if (ctx.measureText(test).width > R.w - 8 && line) { lines.push(line); line = wd; if (lines.length === 2) break; }
        else line = test;
      }
      if (lines.length < 2 && line) lines.push(line);
      if (lines.length) this.fadeItems.push({ kind: 'bio', lines });
    }
    const altLines = this.fadeItems.length ? Math.max(...this.fadeItems.map(i => i.lines.length)) : 0;
    const bioH = altLines ? altLines * 17 + 8 : 0;

    this.chips = [];
    if (m.skills && m.skills.length) {
      ctx.font = `400 11px ${FONT}`;
      for (const s of m.skills.slice(0, 8)) {
        const label = s.length > 14 ? s.slice(0, 13) + '…' : s;
        const cw = ctx.measureText(label).width + 18;
        this.chips.push({ label, w: cw });
      }
      this.marqueeSpan = this.chips.reduce((a, c) => a + c.w + 10, 0) + R.w;
    }
    const skillsH = this.chips.length ? 34 : 0;
    const textH = nameH + bioH + skillsH + 6;
    const portraitH = Math.max(120, R.h - textH);

    /* ---- particles ---- */
    const pad = R.w * 0.05;
    const scale = Math.min((R.w - pad * 2) / src.width, (portraitH - pad * 2) / src.height);
    const drawW = Math.max(1, Math.round(src.width * scale));
    const drawH = Math.max(1, Math.round(src.height * scale));
    const offX = Math.round(R.x + (R.w - drawW) / 2);
    const offY = Math.round(R.y + (portraitH - drawH) / 2);

    /* ---- text block hugs the portrait bottom, centered in column ---- */
    const portraitBottom = offY + drawH;
    this.centerX = R.x + R.w / 2;
    this.textTop = portraitBottom + (nameH ? 22 : 0);
    this.bioTop = this.textTop + 20;
    this.skillsTop = this.bioTop + altLines * 17 + 16;   // ✅ FIX: was this.bioLines.length (crash)

    this.ts = { idx: 0, chars: 0, phase: 'typing', t0: performance.now() };
    this.fs = { idx: 0, phase: 'in', t0: performance.now() };

    const cX = drawW / 2, cY = drawH / 2;
    const maxDist = Math.sqrt(cX * cX + cY * cY) || 1;
    const off = document.createElement('canvas'); off.width = drawW; off.height = drawH;
    const octx = off.getContext('2d', { willReadFrequently: true });
    octx.drawImage(src, 0, 0, drawW, drawH);
    const data = octx.getImageData(0, 0, drawW, drawH).data;
    let step = Math.round(Math.sqrt((drawW * drawH) / BUDGET));
    step = Math.max(1, Math.min(9, step || 1));
    const list = [];
    for (let y = 0; y < drawH; y += step) {
      for (let x = 0; x < drawW; x += step) {
        const idx = (y * drawW + x) * 4;
        const r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3];
        if (a < 60) continue;
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        let gray = (lum - 128) * CONTRAST + 128;
        gray = Math.max(0, Math.min(255, gray));
        let color, alpha, sizeFactor;
        if (dark) {
          if (gray < 26) continue;
          if (gray >= 238) { color = 'rgb(244,248,255)'; alpha = 0.95; sizeFactor = 0.46; }
          else {
            const bk = Math.round((gray / 255) * (BUCKETS - 1));
            const g8 = Math.round((bk / (BUCKETS - 1)) * 255);
            color = `rgb(${g8},${g8},${g8})`;
            alpha = 0.5 + (gray / 255) * 0.45;
            sizeFactor = 0.2 + (gray / 255) * 0.26;
          }
        } else {
          const ink = 255 - gray;
          if (ink < 26) continue;
          const bk = Math.round((ink / 255) * (BUCKETS - 1));
          const s = bk / (BUCKETS - 1);
          const v = Math.round(125 - s * 105);
          color = `rgb(${v},${v},${v})`;
          alpha = 0.4 + s * 0.55;
          sizeFactor = 0.2 + s * 0.26;
        }
        const aB = Math.round(alpha * 10) / 10;
        if (aB <= 0.05) continue;
        const jit = step * 0.4;
        const tx = offX + x + (Math.random() - 0.5) * jit;
        const ty = offY + y + (Math.random() - 0.5) * jit;
        const sx = R.x + Math.random() * R.w;
        const sy = R.y + Math.random() * portraitH;
        const ddx = x - cX, ddy = y - cY;
        const vig = 1 - (Math.sqrt(ddx * ddx + ddy * ddy) / maxDist) * 0.18;
        const size = Math.max(0.4, step * sizeFactor * vig * (0.82 + Math.random() * 0.36));
        list.push({ x: sx, y: sy, tx, ty, color, alpha: aB, size });
      }
    }
    this.particles = list;
    const map = new Map();
    for (const p of list) {
      const key = p.color + '|' + p.alpha;
      if (!map.has(key)) map.set(key, { color: p.color, alpha: p.alpha, arr: [] });
      map.get(key).arr.push(p);
    }
    this.groups = Array.from(map.values());
  }
  start() { if (!this.running) { this.running = true; this.raf = requestAnimationFrame(this._animate); } }
  stop() {
    this.running = false; cancelAnimationFrame(this.raf);
    this._themeObs.disconnect();
  }
  _animate() {
    if (!this.running) return;
    const ctx = this.ctx;
    const R = this.region;
    ctx.clearRect(0, 0, this.w, this.h);
    if (!R) { this.raf = requestAnimationFrame(this._animate); return; }
    const dark = document.documentElement.classList.contains('dark');
    const now = performance.now();

    /* particles */
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.x += (p.tx - p.x) * EASE;
      p.y += (p.ty - p.y) * EASE;
    }
    for (let g = 0; g < this.groups.length; g++) {
      const grp = this.groups[g];
      ctx.globalAlpha = grp.alpha; ctx.fillStyle = grp.color; ctx.beginPath();
      for (let j = 0; j < grp.arr.length; j++) {
        const p = grp.arr[j];
        ctx.moveTo(p.x + p.size, p.y);
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      }
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    /* name ↔ headline : type → hold 3s → backspace → next (Oswald, centered, darker) */
    if (this.typeItems.length && this.ts) {
      const multi = this.typeItems.length > 1;
      const it = this.typeItems[this.ts.idx % this.typeItems.length];
      const el = now - this.ts.t0;
      if (this.ts.phase === 'typing') {
        this.ts.chars = Math.min(it.text.length, Math.floor(el / 55));
        if (this.ts.chars >= it.text.length) { this.ts.phase = 'hold'; this.ts.t0 = now; }
      } else if (this.ts.phase === 'hold') {
        this.ts.chars = it.text.length;
        if (multi && el >= 3000) { this.ts.phase = 'deleting'; this.ts.t0 = now; }
      } else {
        this.ts.chars = Math.max(0, it.text.length - Math.floor(el / 28));
        if (this.ts.chars <= 0) { this.ts.idx = (this.ts.idx + 1) % this.typeItems.length; this.ts.phase = 'typing'; this.ts.t0 = now; }
      }
      const shown = it.text.slice(0, this.ts.chars);
      ctx.font = `600 ${it.size}px ${FONT_NAME}`;
      ctx.fillStyle = dark ? 'rgba(226,232,240,0.95)' : 'rgba(17,24,39,0.96)';
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'center';
      ctx.fillText(shown, this.centerX, this.textTop);
      const caretOn = this.ts.phase === 'hold' ? (Math.floor(now / 420) % 2 === 0) : true;
      if (caretOn) {
        const wN = ctx.measureText(shown).width;
        ctx.fillRect(this.centerX + wN / 2 + 3, this.textTop - it.size + 5, 2, it.size - 4);
      }
    }

    /* university ↔ bio : fade + slide cycle (Calibri, centered, darker) */
    if (this.fadeItems.length && this.fs) {
      const multi = this.fadeItems.length > 1;
      const el = now - this.fs.t0;
      let alpha = 1, dy = 0;
      if (this.fs.phase === 'in') {
        const p = Math.min(1, el / 400);
        alpha = p; dy = (1 - p) * 10;
        if (p >= 1) { this.fs.phase = 'show'; this.fs.t0 = now; }
      } else if (this.fs.phase === 'show') {
        if (multi && el >= 3200) { this.fs.phase = 'out'; this.fs.t0 = now; }
      } else {
        const p = Math.min(1, el / 300);
        alpha = 1 - p; dy = -p * 8;
        if (p >= 1) { this.fs.idx = (this.fs.idx + 1) % this.fadeItems.length; this.fs.phase = 'in'; this.fs.t0 = now; }
      }
      const item = this.fadeItems[this.fs.idx % this.fadeItems.length];
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(0, dy);
      ctx.textAlign = 'center';
      if (item.kind === 'uni') {
        ctx.font = `600 13px ${FONT_SUB}`;
        ctx.fillStyle = dark ? 'rgba(148,163,184,0.95)' : 'rgba(31,41,55,0.95)';
        let t = item.lines[0];
        const full = t;
        while (ctx.measureText('🎓 ' + t).width > R.w - 8 && t.length > 4) t = t.slice(0, -2);
        if (t !== full) t = t.trimEnd() + '…';
        ctx.fillText('🎓 ' + t, this.centerX, this.bioTop);
      } else {
        ctx.font = `400 12.5px ${FONT_SUB}`;
        ctx.fillStyle = dark ? 'rgba(148,163,184,0.90)' : 'rgba(31,41,55,0.92)';
        item.lines.forEach((ln, i) => ctx.fillText(ln, this.centerX, this.bioTop + i * 17));
      }
      ctx.restore();
    }

    /* skills chips marquee (clip restored onto its own line) */
    if (this.chips.length) {
      const y = this.skillsTop;
      const off = (now * 0.03) % this.marqueeSpan;
      ctx.save();
      ctx.textAlign = 'left';
      ctx.beginPath(); ctx.rect(R.x, y - 20, R.w, 30); ctx.clip();
      let acc = 0;
      ctx.font = `400 11px ${FONT}`;
      for (const c of this.chips) {
        const x = R.x - c.w + ((acc + off) % this.marqueeSpan);
        ctx.fillStyle = dark ? 'rgba(255,255,255,0.10)' : 'rgba(24,24,28,0.62)';
        roundRectPath(ctx, x, y - 17, c.w, 23, 8);
        ctx.fill();
        ctx.fillStyle = dark ? 'rgba(203,213,225,0.92)' : 'rgba(242,242,245,0.92)';
        ctx.fillText(c.label, x + 9, y - 1);
        acc += c.w + 10;
      }
      ctx.restore();
    }

    this.raf = requestAnimationFrame(this._animate);
  }
}

const GlobalPointillismPortrait = ({ cutoutUrl, meta, metaKey, onFail }) => {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);

  useEffect(() => {
    let cancelled = false, rt = null;
    (async () => {
      let cut = null;
      try { cut = await loadCanvas(cutoutUrl); } catch (e) { cut = null; }
      if (cancelled) return;
      if (!cut || !canvasRef.current) { onFail && onFail(); return; }
      const engine = new PointillismEngine(canvasRef.current);
      engineRef.current = engine;
      engine.setMeta(meta);
      const apply = () => {
        const c = canvasRef.current;
        engine.resize(c.offsetWidth, c.offsetHeight);
        engine.process(cut);
      };
      apply();
      if (document.fonts?.ready) document.fonts.ready.then(() => { if (!cancelled) apply(); });
      const onR = () => { clearTimeout(rt); rt = setTimeout(apply, 180); };
      window.addEventListener('resize', onR);
      engine.start();
      engine._cr = () => window.removeEventListener('resize', onR);
    })();
    return () => {
      cancelled = true; clearTimeout(rt);
      const e = engineRef.current;
      if (e) { e._cr && e._cr(); e.stop(); engineRef.current = null; }
    };
  }, [cutoutUrl, onFail]);

  useEffect(() => {
    const e = engineRef.current;
    if (e) { e.setMeta(meta); e.process(null); }
  }, [metaKey]);

  return <canvas ref={canvasRef} className="block w-full h-full" />;
};

const ParticlesBackground = ({ children, color = '#6366f1', count = 80 }) => {
  const { user } = useAuth();
  const [cutout, setCutout] = useState(user?.particleCutoutUrl || '');
  const [failed, setFailed] = useState(false);
  const handleFail = useCallback(() => setFailed(true), []);

  const meta = {
    name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
    headline: user?.headline || '',
    bio: user?.bio || '',
    university: user?.university || '',
    skills: user?.skills || [],
  };
  const metaKey = `${meta.name}|${meta.headline}|${meta.bio}|${meta.university}|${meta.skills.join(',')}`;

  useEffect(() => {
    setCutout(user?.particleCutoutUrl || '');
    setFailed(false);
  }, [user?.particleCutoutUrl, user?._id]);

  useEffect(() => {
    if (!user?._id || !user?.avatarUrl || user?.particleCutoutUrl) return;
    if (attempted.has(user._id)) return;
    attempted.add(user._id);
    particleAPI.regenerate()
      .then(({ data }) => { if (data?.particleCutoutUrl) setCutout(data.particleCutoutUrl); })
      .catch(() => {});
  }, [user?._id, user?.avatarUrl, user?.particleCutoutUrl]);

  const cutoutSrc = cutout ? (cutout.startsWith('http') ? cutout : `${SERVER_URL}${cutout}`) : null;
  const usePortrait = !!cutoutSrc && !failed;

  return (
    <div className="relative">
      <div className="fixed inset-0 pointer-events-none z-0">
        <Particles color={color} count={count} interactive={true} />
      </div>
      {usePortrait && (
        <div className="absolute inset-x-0 top-0 pointer-events-none z-0" style={{ height: '100vh' }}>
          <GlobalPointillismPortrait cutoutUrl={cutoutSrc} meta={meta} metaKey={metaKey} onFail={handleFail} />
        </div>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default ParticlesBackground;