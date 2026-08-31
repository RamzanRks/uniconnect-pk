import { useState, useEffect, useRef } from 'react';

export const Reveal = ({ children, delay = 0, className = '' }) => {
  const ref = useRef(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShow(true); obs.disconnect(); } }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={className} style={{ transition: `opacity .7s ease ${delay}ms, transform .7s ease ${delay}ms`, opacity: show ? 1 : 0, transform: show ? 'none' : 'translateY(28px)' }}>
      {children}
    </div>
  );
};

export const Tilt = ({ children, className = '', max = 7 }) => {
  const ref = useRef(null);
  const onMove = (e) => {
    const el = ref.current; const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${px * max}deg) rotateX(${-py * max}deg)`;
  };
  const onLeave = () => { ref.current.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)'; };
  return <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={`${className} transition-transform duration-200 will-change-transform`}>{children}</div>;
};

const toCanvasColor = (c) => {
  if (typeof c !== 'string') return '#6366f1';
  let h = c.trim();
  if (/^#[0-9a-fA-F]{8}$/.test(h)) h = h.slice(0, 7); // strip alpha
  if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(h)) return '#6366f1';
  return h;
};

export const Particles = ({ color = '#ffffff', count = 120, interactive = true }) => {
  const ref = useRef(null);
  const mouse = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const col = toCanvasColor(color);
    let w = canvas.width = canvas.offsetWidth || window.innerWidth;
    let h = canvas.height = canvas.offsetHeight || window.innerHeight;
    let raf;

    const ps = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 3 + 1,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      o: Math.random() * 0.6 + 0.3,
      glow: Math.random() > 0.7,
    }));

    const tick = () => {
      try {
        ctx.clearRect(0, 0, w, h);

        ps.forEach((p) => {
          if (interactive) {
            const dx = p.x - mouse.current.x;
            const dy = p.y - mouse.current.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            if (dist < 120) {
              const force = (120 - dist) / 120;
              p.vx += (dx / dist) * force * 0.3;
              p.vy += (dy / dist) * force * 0.3;
            }
          }

          p.x += p.vx; p.y += p.vy;
          p.vx *= 0.98; p.vy *= 0.98;

          if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
          if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;

          ctx.globalAlpha = p.o;

          if (p.glow) {
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
            grad.addColorStop(0, col);
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.globalAlpha = 0.15;
        ctx.strokeStyle = col;
        ctx.lineWidth = 0.5;
        for (let i = 0; i < ps.length; i++) {
          for (let j = i + 1; j < ps.length; j++) {
            const dx = ps[i].x - ps[j].x;
            const dy = ps[i].y - ps[j].y;
            if (dx * dx + dy * dy < 10000) {
              ctx.beginPath();
              ctx.moveTo(ps[i].x, ps[i].y);
              ctx.lineTo(ps[j].x, ps[j].y);
              ctx.stroke();
            }
          }
        }
        ctx.globalAlpha = 1;
      } catch (e) { /* never crash the app */ }
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onLeave = () => { mouse.current = { x: -1000, y: -1000 }; };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('blur', onLeave);
    tick();

    const onResize = () => {
      w = canvas.width = canvas.offsetWidth || window.innerWidth;
      h = canvas.height = canvas.offsetHeight || window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('blur', onLeave);
    };
  }, [color, count, interactive]);

  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none" />;
};

export const Counter = ({ value, duration = 1200, className }) => {
  const ref = useRef(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current; if (!el) return;
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

export const Typewriter = ({ text, speed = 55, className }) => {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (i >= (text || '').length) return;
    const t = setTimeout(() => setI(i + 1), speed);
    return () => clearTimeout(t);
  }, [i, text, speed]);
  return <span className={className}>{(text || '').slice(0, i)}{i < (text || '').length && <span className="animate-pulse">|</span>}</span>;
};

export const Magnetic = ({ children, strength = 0.25, className = '' }) => {
  const ref = useRef(null);
  const onMove = (e) => {
    const el = ref.current; const r = el.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) * strength;
    const y = (e.clientY - (r.top + r.height / 2)) * strength;
    el.style.transform = `translate(${x}px, ${y}px)`;
  };
  const onLeave = () => { ref.current.style.transform = 'translate(0,0)'; };
  return <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={`${className} transition-transform duration-150 inline-block`}>{children}</div>;
};

export const Spotlight = ({ rgb = '255,255,255' }) => {
  const ref = useRef(null);
  useEffect(() => {
    const move = (e) => { if (ref.current) ref.current.style.background = `radial-gradient(600px circle at ${e.clientX}px ${e.clientY}px, rgba(${rgb},0.07), transparent 60%)`; };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, [rgb]);
  return <div ref={ref} className="pointer-events-none fixed inset-0 z-0" />;
};

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
      <h3 className="font-bold mb-4" style={{ color: accent }}>💬 Testimonials</h3>
      <p className="text-sm italic opacity-90">“{r.comment || `Rated ${r.stars} stars for teamwork.`}”</p>
      <p className="text-xs mt-3 opacity-70">{'⭐'.repeat(r.stars)} — {r.rater?.firstName} {r.rater?.lastName}</p>
      <div className="flex gap-1 mt-4">
        {ratings.ratings.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)} className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-6' : 'w-2'}`} style={{ background: i === idx ? accent : '#9ca3af55' }} />
        ))}
      </div>
    </div>
  );
};

export const QRCard = ({ url, dark }) => (
  <div className={`rounded-3xl p-6 text-center border ${dark ? 'bg-white/5 border-white/10' : 'bg-white shadow-lg border-gray-100'}`}>
    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(url)}`} className="mx-auto rounded-xl bg-white p-2 shadow" alt="QR" />
    <p className="text-xs mt-3 opacity-70">📱 Scan to open this portfolio</p>
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

export const SkillBars = ({ data, accent, accent2, dark }) => {
  const max = Math.max(...data.map((x) => x.value), 1);
  return (
    <div className="space-y-4">
      {data.map((d, i) => (
        <div key={i}>
          <div className="flex justify-between text-xs mb-1 opacity-80"><span className="font-medium">{d.label}</span><span>{d.value} endorsement{d.value === 1 ? '' : 's'}</span></div>
          <Bar pct={(d.value / max) * 100} accent={accent} accent2={accent2} dark={dark} />
        </div>
      ))}
    </div>
  );
};

export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse rounded-xl bg-gray-200 ${className}`} />
);

export const EmptyState = ({ icon = '📭', title, sub }) => (
  <div className="text-center py-12">
    <div className="text-6xl mb-4 drop-shadow-lg">{icon}</div>
    <p className="font-semibold text-gray-700">{title}</p>
    {sub && <p className="text-sm text-gray-400 mt-1">{sub}</p>}
  </div>
);