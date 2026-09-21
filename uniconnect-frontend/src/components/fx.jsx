import { useState, useEffect, useRef } from 'react';

/* ---------- Scroll reveal (logic unchanged) ---------- */
export const Reveal = ({ children, delay = 0, className = '' }) => {
  const ref = useRef(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setShow(true); obs.disconnect(); }
    }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{ transition: `opacity .7s ease ${delay}ms, transform .7s ease ${delay}ms`, opacity: show ? 1 : 0, transform: show ? 'none' : 'translateY(28px)' }}
    >
      {children}
    </div>
  );
};

/* ---------- 3D tilt (logic unchanged) ---------- */
export const Tilt = ({ children, className = '', max = 7 }) => {
  const ref = useRef(null);
  const onMove = (e) => {
    const el = ref.current;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${px * max}deg) rotateX(${-py * max}deg)`;
  };
  const onLeave = () => { ref.current.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)'; };
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={`${className} transition-transform duration-200 will-change-transform`}>
      {children}
    </div>
  );
};

const toCanvasColor = (c) => {
  if (typeof c !== 'string') return '#6366f1';
  let h = c.trim();
  if (/^#[0-9a-fA-F]{8}$/.test(h)) h = h.slice(0, 7);
  if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(h)) return '#6366f1';
  return h;
};

/* ============================================================
   3D NETWORK GLOBES — large, half-peeking from both screen edges
   Same API: ({ color, count, interactive })
   ============================================================ */
export const Particles = ({ color = '#ffffff', count = 80, interactive = true, image = null }) => {
  const ref = useRef(null);
  const mouse = useRef({ x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 });
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0, raf, last = performance.now();
    let alive = true;
    let portrait = null;

    const setSize = () => {
      w = canvas.offsetWidth || window.innerWidth;
      h = canvas.offsetHeight || window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setSize();

    const rand = (a, b) => a + Math.random() * (b - a);
    const lerp = (a, b, t) => Math.round(a + (b - a) * t);
    const shade = (t) => [lerp(37, 124, t), lerp(99, 58, t), lerp(235, 237, t)];
    const PALETTE = [[37, 99, 235], [59, 130, 246], [99, 102, 241], [124, 58, 237], [139, 92, 246]];
    const pick = () => PALETTE[(Math.random() * PALETTE.length) | 0];
    const scale = Math.max(0.5, Math.min(2, (count || 80) / 80));

    const mkLayer = (n, rMin, rMax, aMin, aMax, sp, px) =>
      Array.from({ length: Math.round(n * scale) }, () => ({
        x: Math.random(), y: Math.random(),
        r: rand(rMin, rMax), a: rand(aMin, aMax),
        vx: rand(-sp, sp), vy: rand(-sp, sp),
        c: pick(), tw: Math.random() * Math.PI * 2, tws: rand(0.6, 1.6), px,
      }));
    const L0 = mkLayer(50, 0.5, 1.0, 0.16, 0.28, 0.006, 8);
    const L1 = mkLayer(30, 0.9, 1.5, 0.24, 0.40, 0.010, 16);
    const L2 = mkLayer(22, 1.3, 2.0, 0.36, 0.60, 0.016, 30);

    // ---- Sample the avatar into a particle point-cloud ----
    const buildPortrait = (img) => {
      if (!alive) return;
      try {
        const maxW = 260;
        const sc = Math.min(1, maxW / (img.naturalWidth || 1));
        const sw = Math.max(1, Math.round((img.naturalWidth || 1) * sc));
        const sh = Math.max(1, Math.round((img.naturalHeight || 1) * sc));
        const off = document.createElement('canvas');
        off.width = sw; off.height = sh;
        const octx = off.getContext('2d', { willReadFrequently: true });
        octx.drawImage(img, 0, 0, sw, sh);
        const data = octx.getImageData(0, 0, sw, sh).data; // throws if CORS-tainted
        const step = 3;
        const dots = [];
        for (let y = 0; y < sh; y += step) {
          for (let x = 0; x < sw; x += step) {
            const i = (y * sw + x) * 4;
            if (data[i + 3] / 255 < 0.5) continue;
            const lum = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
            const ink = 1 - lum;
            if (ink < 0.18) continue;
            dots.push({
              nx: x / sw, ny: y / sh,
              a: Math.min(1, ink * 1.15),
              s: 0.8 + ink * 1.6,
              tw: Math.random() * Math.PI * 2,
              tws: 0.5 + Math.random() * 1.2,
              dx: Math.random() - 0.5, dy: Math.random() - 0.5,
              delay: Math.random() * 0.8,
            });
          }
        }
        portrait = { dots, aspect: sw / sh, birth: performance.now() / 1000 };
      } catch (e) {
        portrait = null; // CORS/decode issue -> graceful fallback to ambient only
      }
    };

    if (image) {
      const imgEl = new Image();
      imgEl.crossOrigin = 'anonymous';
      imgEl.onload = () => buildPortrait(imgEl);
      imgEl.onerror = () => { portrait = null; };
      imgEl.src = image;
    }

    const glow = (cx, cy, R, rgb, a) => {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      g.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
    };

    const tick = (now) => {
      const dt = Math.min(50, now - last); last = now;
      const t = now / 1000;
      try {
        ctx.clearRect(0, 0, w, h);
        const dark = document.documentElement.classList.contains('dark');
        const boost = dark ? 1.25 : 1;
        mouse.current.x += (mouse.current.tx - mouse.current.x) * 0.05;
        mouse.current.y += (mouse.current.ty - mouse.current.y) * 0.05;
        const mx = interactive ? mouse.current.x - 0.5 : 0;
        const my = interactive ? mouse.current.y - 0.5 : 0;

        // ambient brand glows
        const br = 0.5 + 0.5 * Math.sin(t * 0.5);
        const R = Math.max(w, h) * 0.55;
        glow(w * 0.12 - mx * 30, h * 0.18 - my * 30, R * (0.8 + br * 0.12), [37, 99, 235], dark ? 0.16 : 0.10);
        glow(w * 0.88 + mx * 30, h * 0.82 + my * 30, R * (0.8 + (1 - br) * 0.12), [124, 58, 237], dark ? 0.16 : 0.10);

        // ambient star layers + constellation
        const drawLayer = (arr, link) => {
          const pts = [];
          for (const p of arr) {
            p.x += (p.vx * dt) / 1000; p.y += (p.vy * dt) / 1000;
            if (p.x < -0.02) p.x = 1.02; if (p.x > 1.02) p.x = -0.02;
            if (p.y < -0.02) p.y = 1.02; if (p.y > 1.02) p.y = -0.02;
            pts.push({ sx: p.x * w + mx * p.px, sy: p.y * h + my * p.px, p });
          }
          if (link) {
            ctx.lineWidth = 1;
            const MAX = 150;
            for (let i = 0; i < pts.length; i++) {
              for (let j = i + 1; j < pts.length; j++) {
                const dx = pts[i].sx - pts[j].sx, dy = pts[i].sy - pts[j].sy;
                const d2 = dx * dx + dy * dy;
                if (d2 < MAX * MAX) {
                  const a = (1 - Math.sqrt(d2) / MAX) * 0.20 * boost;
                  const ca = pts[i].p.c, cb = pts[j].p.c;
                  ctx.strokeStyle = `rgba(${(ca[0] + cb[0]) >> 1},${(ca[1] + cb[1]) >> 1},${(ca[2] + cb[2]) >> 1},${a})`;
                  ctx.beginPath(); ctx.moveTo(pts[i].sx, pts[i].sy); ctx.lineTo(pts[j].sx, pts[j].sy); ctx.stroke();
                }
              }
            }
          }
          for (const q of pts) {
            const twk = 0.75 + 0.25 * Math.sin(t * q.p.tws + q.p.tw);
            const c = q.p.c;
            ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${q.p.a * twk * boost})`;
            ctx.beginPath(); ctx.arc(q.sx, q.sy, q.p.r, 0, Math.PI * 2); ctx.fill();
          }
        };
        drawLayer(L0, false);
        drawLayer(L1, false);
        drawLayer(L2, true);

        // ---- Particle portrait (right side, PC only) ----
        if (portrait && portrait.dots.length && w >= 1024) {
          let boxH = h * 0.9;
          let boxW = boxH * portrait.aspect;
          const maxBW = w * 0.40;
          if (boxW > maxBW) { boxW = maxBW; boxH = boxW / portrait.aspect; }
          const boxX = w - boxW - w * 0.03 + mx * 14;
          const boxY = (h - boxH) / 2 + my * 14;
          const since = t - portrait.birth;
          const szScale = boxW / 260;
          for (let i = 0; i < portrait.dots.length; i++) {
            const d = portrait.dots[i];
            const pr = Math.min(1, Math.max(0, (since - d.delay) / 1.1));
            if (pr <= 0) continue;
            const ease = 1 - Math.pow(1 - pr, 3);
            const off = (1 - ease) * 60;
            const sx = boxX + d.nx * boxW + d.dx * off;
            const sy = boxY + d.ny * boxH + d.dy * off;
            const twk = 0.8 + 0.2 * Math.sin(t * d.tws + d.tw);
            const c = shade(d.ny);
            ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${d.a * twk * boost * ease})`;
            const sz = Math.max(1, d.s * szScale);
            ctx.fillRect(sx, sy, sz, sz);
          }
        }
      } catch (e) { /* never crash */ }
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e) => {
      mouse.current.tx = e.clientX / (window.innerWidth || 1);
      mouse.current.ty = e.clientY / (window.innerHeight || 1);
    };
    window.addEventListener('mousemove', onMove);
    raf = requestAnimationFrame(tick);
    window.addEventListener('resize', setSize);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', setSize);
      window.removeEventListener('mousemove', onMove);
    };
  }, [color, count, interactive, image]);
  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none" />;
};

/* ---------- Animated counter (logic unchanged) ---------- */
export const Counter = ({ value, duration = 1200, className }) => {
  const ref = useRef(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      const start = performance.now();
      const step = (t) => {
        const p = Math.min(1, (t - start) / duration);
        setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [value, duration]);
  return <span ref={ref} className={className}>{n}</span>;
};

/* ---------- Typewriter (logic unchanged) ---------- */
export const Typewriter = ({ text, speed = 55, className }) => {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (i >= (text || '').length) return;
    const t = setTimeout(() => setI(i + 1), speed);
    return () => clearTimeout(t);
  }, [i, text, speed]);
  return (
    <span className={className}>
      {(text || '').slice(0, i)}
      {i < (text || '').length && <span className="animate-pulse">|</span>}
    </span>
  );
};

/* ---------- Magnetic hover (logic unchanged) ---------- */
export const Magnetic = ({ children, strength = 0.25, className = '' }) => {
  const ref = useRef(null);
  const onMove = (e) => {
    const el = ref.current;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) * strength;
    const y = (e.clientY - (r.top + r.height / 2)) * strength;
    el.style.transform = `translate(${x}px, ${y}px)`;
  };
  const onLeave = () => { ref.current.style.transform = 'translate(0,0)'; };
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={`${className} transition-transform duration-150 inline-block`}>
      {children}
    </div>
  );
};

/* ---------- Mouse spotlight (logic unchanged) ---------- */
export const Spotlight = ({ rgb = '255,255,255' }) => {
  const ref = useRef(null);
  useEffect(() => {
    const move = (e) => {
      if (ref.current) ref.current.style.background = `radial-gradient(600px circle at ${e.clientX}px ${e.clientY}px, rgba(${rgb},0.07), transparent 60%)`;
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, [rgb]);
  return <div ref={ref} className="pointer-events-none fixed inset-0 z-0" />;
};

/* ---------- Testimonials (emoji-free) ---------- */
export const Testimonials = ({ ratings, dark, accent }) => {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!ratings?.ratings?.length) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % ratings.ratings.length), 4000);
    return () => clearInterval(t);
  }, [ratings]);
  if (!ratings?.ratings?.length) return null;
  const r = ratings.ratings[idx];
  return (
    <div className={`rounded-3xl p-7 border ${dark ? 'bg-white/5 border-white/10' : 'bg-white shadow-lg border-gray-100'}`}>
      <h3 className="flex items-center gap-2 font-bold mb-4" style={{ color: accent }}>
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        Testimonials
      </h3>
      <p className="text-sm italic opacity-90">“{r.comment || `Rated ${r.stars} stars for teamwork.`}”</p>
      <div className="flex items-center gap-2 mt-3">
        <span className="inline-flex gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <svg key={s} className={`w-3.5 h-3.5 ${s <= r.stars ? 'text-amber-400' : (dark ? 'text-white/20' : 'text-gray-200')}`} viewBox="0 0 24 24" fill={s <= r.stars ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          ))}
        </span>
        <span className="text-xs opacity-70">— {r.rater?.firstName} {r.rater?.lastName}</span>
      </div>
      <div className="flex gap-1 mt-4">
        {ratings.ratings.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)} aria-label={`Go to testimonial ${i + 1}`} className={`h-1.5 rounded-full transition-all active:scale-90 ${i === idx ? 'w-6' : 'w-2 hover:opacity-70'}`} style={{ background: i === idx ? accent : '#9ca3af55' }} />
        ))}
      </div>
    </div>
  );
};

/* ---------- QR Card (emoji-free) ---------- */
export const QRCard = ({ url, dark }) => (
  <div className={`rounded-3xl p-6 text-center border ${dark ? 'bg-white/5 border-white/10' : 'bg-white shadow-lg border-gray-100'}`}>
    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(url)}`} className="mx-auto rounded-xl bg-white p-2 shadow" alt="QR" />
    <p className="flex items-center justify-center gap-1.5 text-xs mt-3 opacity-70">
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
      Scan to open this portfolio
    </p>
  </div>
);

const Bar = ({ pct, accent, accent2, dark }) => {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(pct), 150); return () => clearTimeout(t); }, [pct]);
  return (
    <div className={`h-2.5 rounded-full overflow-hidden ${dark ? 'bg-white/10' : 'bg-gray-200'}`}>
      <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${w}%`, background: `linear-gradient(90deg, ${accent}, ${accent2})`, boxShadow: `0 0 12px ${accent}88` }} />
    </div>
  );
};

/* ---------- Skill bars ---------- */
export const SkillBars = ({ data, accent, accent2, dark }) => {
  const max = Math.max(...data.map((x) => x.value), 1);
  return (
    <div className="space-y-4">
      {data.map((d, i) => (
        <div key={i}>
          <div className="flex justify-between text-xs mb-1 opacity-80">
            <span className="font-medium">{d.label}</span>
            <span>{d.value} endorsement{d.value === 1 ? '' : 's'}</span>
          </div>
          <Bar pct={(d.value / max) * 100} accent={accent} accent2={accent2} dark={dark} />
        </div>
      ))}
    </div>
  );
};

/* ---------- Skeleton ---------- */
export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse rounded-xl bg-gray-200 dark:bg-slate-800 ${className}`} />
);

/* ---------- Empty state (emoji-free) ---------- */
export const EmptyState = ({ icon, title, sub }) => (
  <div className="text-center py-12">
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 mb-4">
      {icon || (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
      )}
    </div>
    <p className="font-semibold text-gray-700 dark:text-slate-200">{title}</p>
    {sub && <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">{sub}</p>}
  </div>
);