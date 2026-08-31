'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';

/* ============================================================
   🏆 TOUR CELEBRATION — Premium Sharp Blue Edition
   Palette: Royal Blue · Electric Blue · Sky Blue · White
   Bright, clean, sharp, professional
   ============================================================ */

const BLUE = ['#1e3a8a', '#1d4ed8', '#2563eb', '#0ea5e9', '#38bdf8'];

const now = () => {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
};

const requestFrame = (callback) => {
  if (typeof window === 'undefined') return 0;

  if (window.requestAnimationFrame) {
    return window.requestAnimationFrame(callback);
  }

  return window.setTimeout(() => callback(Date.now()), 16);
};

const cancelFrame = (id) => {
  if (typeof window === 'undefined' || !id) return;

  if (window.cancelAnimationFrame) {
    window.cancelAnimationFrame(id);
  } else {
    window.clearTimeout(id);
  }
};

const globalCss = `
  @keyframes tc-dust {
    to {
      transform: translateY(115vh);
    }
  }

  @keyframes tc-ember {
    to {
      transform: translateY(-120vh);
      opacity: 0;
    }
  }

  @keyframes tc-rays {
    to {
      transform: translate(-50%, -50%) rotate(360deg);
    }
  }

  @keyframes tc-twinkle {
    0%, 100% {
      opacity: 0.12;
      transform: scale(0.8);
    }
    50% {
      opacity: 0.95;
      transform: scale(1.25);
    }
  }

  @keyframes tc-ring {
    from {
      opacity: 0.8;
      transform: scale(0.4);
    }
    to {
      opacity: 0;
      transform: scale(12);
    }
  }

  @keyframes tc-fadein {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes tc-cardin {
    from {
      opacity: 0;
      transform: translateY(26px) scale(0.965);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes tc-fadeup {
    from {
      opacity: 0;
      transform: translateY(14px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes tc-fade {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes tc-shimmer {
    0% {
      background-position: 220% 0;
    }
    100% {
      background-position: -220% 0;
    }
  }

  @keyframes tc-gradshift {
    0%, 100% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
  }

  .tc-root {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 300;
    overflow: hidden;
    background-color: #eff6ff;
    background: radial-gradient(
      ellipse at center,
      #ffffff 0%,
      #e0f2fe 45%,
      #bfdbfe 100%
    );
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #0f172a;
  }

  .tc-root *,
  .tc-root *::before,
  .tc-root *::after {
    box-sizing: border-box;
  }

  .tc-canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10;
    pointer-events: none;
  }

  .tc-layer {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
    pointer-events: none;
  }

  .tc-layer-rays {
    z-index: 0;
  }

  .tc-layer-embers {
    z-index: 10;
  }

  .tc-layer-stars {
    z-index: 10;
  }

  .tc-layer-dust {
    z-index: 20;
  }

  .tc-layer-ring {
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .tc-vignette {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 6;
    pointer-events: none;
    background: radial-gradient(
      ellipse at center,
      transparent 45%,
      rgba(59, 130, 246, 0.16) 100%
    );
  }

  .tc-center {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 30;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 18px;
    transition:
      opacity 1.1s ease,
      transform 1.35s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .tc-card {
    position: relative;
    width: 100%;
    max-width: 430px;
    text-align: center;
    padding: 56px 48px;
    overflow: hidden;
    isolation: isolate;
    border-radius: 10px;
    border: 1px solid rgba(37, 99, 235, 0.22);
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.92) 0%,
      rgba(239, 246, 255, 0.94) 100%
    );
    backdrop-filter: blur(20px) saturate(1.25);
    -webkit-backdrop-filter: blur(20px) saturate(1.25);
    box-shadow:
      0 32px 90px rgba(37, 99, 235, 0.18),
      0 0 0 1px rgba(59, 130, 246, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.92);
    animation: tc-cardin 1.15s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .tc-shimmer {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 0;
    pointer-events: none;
    background: linear-gradient(
      110deg,
      transparent 30%,
      rgba(59, 130, 246, 0.10) 50%,
      transparent 70%
    );
    background-size: 220% 100%;
    animation: tc-shimmer 4.5s ease-in-out infinite;
  }

  .tc-corner {
    position: absolute;
    width: 16px;
    height: 16px;
    z-index: 2;
    pointer-events: none;
    border: 0 solid rgba(37, 99, 235, 0.45);
  }

  .tc-corner-tl {
    top: 12px;
    left: 12px;
    border-top-width: 1px;
    border-left-width: 1px;
  }

  .tc-corner-tr {
    top: 12px;
    right: 12px;
    border-top-width: 1px;
    border-right-width: 1px;
  }

  .tc-corner-bl {
    bottom: 12px;
    left: 12px;
    border-bottom-width: 1px;
    border-left-width: 1px;
  }

  .tc-corner-br {
    bottom: 12px;
    right: 12px;
    border-bottom-width: 1px;
    border-right-width: 1px;
  }

  .tc-content {
    position: relative;
    z-index: 1;
  }

  .tc-brand {
    margin: 0 0 12px;
    font-size: 10px;
    letter-spacing: 0.45em;
    text-transform: uppercase;
    color: rgba(37, 99, 235, 0.78);
    animation: tc-fadeup 0.95s ease both;
    animation-delay: 0.45s;
  }

  .tc-title {
    margin: 0 0 16px;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 44px;
    font-weight: 500;
    line-height: 1.08;
    letter-spacing: 0.02em;
    color: #1e40af;
    text-shadow: 0 2px 24px rgba(37, 99, 235, 0.14);
    animation: tc-fadeup 0.95s ease both;
    animation-delay: 0.58s;
  }

  .tc-divider {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin: 0 0 24px;
    animation: tc-fadeup 0.95s ease both;
    animation-delay: 0.7s;
  }

  .tc-divider-line {
    height: 1px;
    width: 56px;
  }

  .tc-divider-line-left {
    background: linear-gradient(90deg, transparent, rgba(37, 99, 235, 0.55));
  }

  .tc-divider-line-right {
    background: linear-gradient(90deg, rgba(37, 99, 235, 0.55), transparent);
  }

  .tc-divider-star {
    color: #2563eb;
    font-size: 12px;
    line-height: 1;
  }

  .tc-welcome {
    margin: 0 0 6px;
    font-size: 14px;
    color: #1e293b;
    animation: tc-fadeup 0.95s ease both;
    animation-delay: 0.84s;
  }

  .tc-name {
    color: #1d4ed8;
    font-family: Georgia, 'Times New Roman', serif;
    font-weight: 600;
  }

  .tc-sub {
    margin: 0 0 30px;
    font-size: 12px;
    line-height: 1.7;
    color: rgba(51, 65, 85, 0.82);
    animation: tc-fadeup 0.95s ease both;
    animation-delay: 0.96s;
  }

  .tc-points {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 12px;
    margin: 0 0 34px;
    padding: 18px 0;
    border-top: 1px solid rgba(37, 99, 235, 0.18);
    border-bottom: 1px solid rgba(37, 99, 235, 0.18);
    animation: tc-fadeup 0.95s ease both;
    animation-delay: 1.08s;
  }

  .tc-points-label {
    font-size: 10px;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: #64748b;
  }

  .tc-points-value {
    font-size: 48px;
    line-height: 1;
    font-weight: 400;
    font-family: Georgia, 'Times New Roman', serif;
    color: #2563eb;
    text-shadow: 0 0 24px rgba(37, 99, 235, 0.22);
  }

  .tc-button {
    position: relative;
    display: inline-block;
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    overflow: hidden;
    isolation: isolate;
    border: none;
    border-radius: 4px;
    padding: 14px 46px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: #ffffff;
    background: linear-gradient(
      135deg,
      #1d4ed8 0%,
      #3b82f6 48%,
      #0ea5e9 100%
    );
    background-size: 220% 220%;
    box-shadow:
      0 10px 30px rgba(37, 99, 235, 0.35),
      inset 0 1px 0 rgba(255, 255, 255, 0.28);
    transition:
      transform 0.45s ease,
      letter-spacing 0.45s ease,
      box-shadow 0.45s ease,
      filter 0.45s ease;
    animation:
      tc-fade 1s ease both,
      tc-gradshift 5s ease infinite;
    animation-delay: 1.2s, 0s;
  }

  .tc-button:hover {
    transform: translateY(-1px);
    letter-spacing: 0.37em;
    filter: brightness(1.06);
    box-shadow:
      0 14px 36px rgba(37, 99, 235, 0.42),
      inset 0 1px 0 rgba(255, 255, 255, 0.36);
  }

  .tc-button:active {
    transform: translateY(0) scale(0.985);
  }

  .tc-button:focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: 3px;
  }

  .tc-button span {
    position: relative;
    z-index: 1;
  }

  .tc-button::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 0;
    border-radius: 4px;
    background: linear-gradient(
      120deg,
      transparent 20%,
      rgba(255, 255, 255, 0.55) 50%,
      transparent 80%
    );
    transform: translateX(-120%);
    transition: transform 0.9s ease;
  }

  .tc-button:hover::after {
    transform: translateX(120%);
  }

  .tc-hint {
    margin: 24px 0 0;
    font-size: 10px;
    letter-spacing: 0.08em;
    color: #64748b;
    animation: tc-fadeup 0.95s ease both;
    animation-delay: 1.35s;
  }

  @media (max-width: 520px) {
    .tc-card {
      padding: 42px 20px;
    }

    .tc-title {
      font-size: 34px;
    }

    .tc-points {
      gap: 8px;
    }

    .tc-points-value {
      font-size: 40px;
    }

    .tc-button {
      width: 100%;
      padding: 14px 18px;
    }

    .tc-divider-line {
      width: 36px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .tc-root *,
    .tc-root *::before,
    .tc-root *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

/* ---------- Layer 1: Sharp blue fireworks ---------- */
const BlueFireworks = ({ onBurst }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    let frame = 0;

    const rockets = [];
    const sparks = [];

    const launch = (x, y) => {
      rockets.push({
        x: typeof x === 'number' ? x : Math.random() * w,
        y: h,
        ty: typeof y === 'number' ? y : h * (0.15 + Math.random() * 0.3),
        vy: -(8 + Math.random() * 3),
        color: BLUE[(Math.random() * BLUE.length) | 0],
      });
    };

    const explode = (rocket) => {
      const count = 50 + ((Math.random() * 30) | 0);

      for (let i = 0; i < count; i += 1) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.15;
        const speed = 1.5 + Math.random() * 3.5;

        sparks.push({
          x: rocket.x,
          y: rocket.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          decay: 0.008 + Math.random() * 0.014,
          color: rocket.color,
          size: 0.8 + Math.random() * 1.4,
        });
      }
    };

    const tick = () => {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.fillRect(0, 0, w, h);

      ctx.globalCompositeOperation = 'source-over';

      for (let i = rockets.length - 1; i >= 0; i -= 1) {
        const rocket = rockets[i];
        rocket.y += rocket.vy;
        rocket.vy *= 0.985;

        ctx.fillStyle = rocket.color;
        ctx.beginPath();
        ctx.arc(rocket.x, rocket.y, 1.7, 0, Math.PI * 2);
        ctx.fill();

        if (rocket.y <= rocket.ty || rocket.vy > -1) {
          explode(rocket);
          rockets.splice(i, 1);
        }
      }

      for (let i = sparks.length - 1; i >= 0; i -= 1) {
        const spark = sparks[i];

        spark.x += spark.vx;
        spark.y += spark.vy;
        spark.vy += 0.03;
        spark.vx *= 0.988;
        spark.vy *= 0.988;
        spark.life -= spark.decay;

        if (spark.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = Math.max(spark.life, 0) * 0.92;
        ctx.fillStyle = spark.color;
        ctx.beginPath();
        ctx.arc(spark.x, spark.y, spark.size * spark.life, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      frame = requestFrame(tick);
    };

    const autoLaunch = setInterval(() => launch(), 1100);

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };

    const handlePointerDown = (event) => {
      launch(event.clientX, event.clientY);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('pointerdown', handlePointerDown);

    if (onBurst) {
      onBurst.current = launch;
    }

    frame = requestFrame(tick);

    return () => {
      cancelFrame(frame);
      clearInterval(autoLaunch);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointerdown', handlePointerDown);

      if (onBurst) {
        onBurst.current = null;
      }
    };
  }, [onBurst]);

  return <canvas ref={canvasRef} className="tc-canvas" />;
};

/* ---------- Layer 2: Falling blue dust ---------- */
const BlueDust = ({ count = 90 }) => {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, index) => {
      const width = 1 + Math.random() * 2;
      const height = 8 + Math.random() * 16;
      const color = BLUE[index % BLUE.length];

      return {
        id: index,
        left: Math.random() * 100 + '%',
        width: width + 'px',
        height: height + 'px',
        background: 'linear-gradient(180deg, transparent, ' + color + ')',
        opacity: 0.42 + Math.random() * 0.42,
        duration: 4 + Math.random() * 4,
        delay: Math.random() * 2.5,
      };
    });
  }, [count]);

  return (
    <div className="tc-layer tc-layer-dust">
      {particles.map((particle) => (
        <div
          key={particle.id}
          style={{
            position: 'absolute',
            top: '-30px',
            left: particle.left,
            width: particle.width,
            height: particle.height,
            background: particle.background,
            opacity: particle.opacity,
            animation: 'tc-dust ' + particle.duration + 's linear forwards',
            animationDelay: particle.delay + 's',
          }}
        />
      ))}
    </div>
  );
};

/* ---------- Layer 3: Rising blue sparks ---------- */
const BlueEmbers = ({ count = 26 }) => {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, index) => {
      const size = 3 + Math.random() * 5;
      const color = BLUE[index % BLUE.length];

      return {
        id: index,
        left: Math.random() * 100 + '%',
        size,
        color,
        duration: 7 + Math.random() * 6,
        delay: Math.random() * 4,
      };
    });
  }, [count]);

  return (
    <div className="tc-layer tc-layer-embers">
      {particles.map((particle) => (
        <div
          key={particle.id}
          style={{
            position: 'absolute',
            left: particle.left,
            bottom: '-20px',
            width: particle.size,
            height: particle.size,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #ffffff, ' + particle.color + ')',
            boxShadow: '0 0 ' + particle.size * 2 + 'px ' + particle.color,
            animation: 'tc-ember ' + particle.duration + 's ease-in forwards',
            animationDelay: particle.delay + 's',
          }}
        />
      ))}
    </div>
  );
};

/* ---------- Layer 4: Subtle rotating blue rays ---------- */
const Rays = () => {
  return (
    <div className="tc-layer tc-layer-rays">
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: '220vmax',
          height: '220vmax',
          transform: 'translate(-50%, -50%)',
          background:
            'repeating-conic-gradient(from 0deg, rgba(37,99,235,0.06) 0deg 4deg, transparent 4deg 12deg)',
          animation: 'tc-rays 40s linear infinite',
        }}
      />
    </div>
  );
};

/* ---------- Layer 5: Twinkle blue stars ---------- */
const Stars = ({ count = 36 }) => {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, index) => {
      return {
        id: index,
        left: Math.random() * 100 + '%',
        top: Math.random() * 100 + '%',
        size: Math.random() > 0.72 ? 3 : 2,
        duration: 2 + Math.random() * 3,
        delay: Math.random() * 3,
      };
    });
  }, [count]);

  return (
    <div className="tc-layer tc-layer-stars">
      {particles.map((particle) => (
        <div
          key={particle.id}
          style={{
            position: 'absolute',
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
            borderRadius: '50%',
            background: '#2563eb',
            opacity: 0.12,
            animation: 'tc-twinkle ' + particle.duration + 's ease-in-out infinite',
            animationDelay: particle.delay + 's',
          }}
        />
      ))}
    </div>
  );
};

/* ---------- Layer 6: Elegant expanding blue ring ---------- */
const RingPulse = () => {
  return (
    <div className="tc-layer tc-layer-ring">
      {[0, 1].map((index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            width: 60,
            height: 60,
            borderRadius: '50%',
            border: '1px solid rgba(37, 99, 235, 0.45)',
            animation: 'tc-ring 2.6s ease-out infinite',
            animationDelay: index * 1.3 + 's',
            animationFillMode: 'both',
          }}
        />
      ))}
    </div>
  );
};

/* ---------- Elegant blue laurel + medal SVG ---------- */
const LaurelMedal = () => {
  return (
    <div
      style={{
        position: 'relative',
        width: 130,
        height: 130,
        animation: 'tc-fadein 1.2s ease both',
        animationDelay: '0.2s',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(59,130,246,0.35) 0%, transparent 70%)',
          filter: 'blur(18px)',
          transform: 'scale(1.35)',
          pointerEvents: 'none',
        }}
      />

      <svg
        width="130"
        height="130"
        viewBox="0 0 120 120"
        fill="none"
        style={{
          position: 'relative',
          display: 'block',
        }}
      >
        <defs>
          <linearGradient
            id="tc-medal-blue"
            x1="0"
            y1="0"
            x2="120"
            y2="120"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#93c5fd" />
            <stop offset="0.45" stopColor="#3b82f6" />
            <stop offset="1" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>

        <g stroke="url(#tc-medal-blue)" strokeWidth="1.8" fill="none" strokeLinecap="round">
          <path d="M28 88 C 18 70, 16 48, 26 30" />

          {[0, 1, 2, 3, 4].map((index) => (
            <path
              key={'leaf-left-' + index}
              d={
                'M' +
                (24 - index * 1.5) +
                ' ' +
                (80 - index * 12) +
                ' q -10 -2 -12 -10 q 10 -1 12 6'
              }
              fill="rgba(37,99,235,0.16)"
              stroke="none"
            />
          ))}

          <path d="M92 88 C 102 70, 104 48, 94 30" />

          {[0, 1, 2, 3, 4].map((index) => (
            <path
              key={'leaf-right-' + index}
              d={
                'M' +
                (96 + index * 1.5) +
                ' ' +
                (80 - index * 12) +
                ' q 10 -2 12 -10 q -10 -1 -12 6'
              }
              fill="rgba(37,99,235,0.16)"
              stroke="none"
            />
          ))}
        </g>

        <circle cx="60" cy="58" r="26" stroke="rgba(37,99,235,0.25)" strokeWidth="1" fill="none" />
        <circle cx="60" cy="58" r="24" stroke="url(#tc-medal-blue)" strokeWidth="2.4" fill="rgba(59,130,246,0.10)" />
        <circle cx="60" cy="58" r="18" stroke="rgba(59,130,246,0.55)" strokeWidth="0.8" fill="none" />

        <path
          d="M60 46 l3.5 7.5 8 1 -6 5.5 1.5 8 -7 -4 -7 4 1.5 -8 -6 -5.5 8 -1 z"
          fill="url(#tc-medal-blue)"
        />

        <path
          d="M50 36 l-6 -12 M70 36 l6 -12"
          stroke="url(#tc-medal-blue)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

/* ---------- Animated +5 counter ---------- */
const PointsCounter = () => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const startTime = now();
    let frame = 0;

    const tick = (frameTime) => {
      const currentTime = typeof frameTime === 'number' ? frameTime : now();
      const progress = Math.min(1, (currentTime - startTime) / 1800);
      const eased = 1 - Math.pow(1 - progress, 3);

      setValue(Math.round(5 * eased));

      if (progress < 1) {
        frame = requestFrame(tick);
      }
    };

    frame = requestFrame(tick);

    return () => {
      cancelFrame(frame);
    };
  }, []);

  return <span className="tc-points-value">+{value}</span>;
};

/* ---------- Refined fanfare ---------- */
const playFanfare = () => {
  try {
    if (typeof window === 'undefined') return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const audioCtx = new AudioContextClass();

    if (audioCtx.state === 'suspended') {
      const resumePromise = audioCtx.resume();
      if (resumePromise && resumePromise.catch) {
        resumePromise.catch(() => {});
      }
    }

    const master = audioCtx.createGain();
    master.gain.value = 0.9;
    master.connect(audioCtx.destination);

    const notes = [261.63, 329.63, 392.0, 523.25];

    notes.forEach((frequency, index) => {
      const oscillator = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;

      const noteStart = audioCtx.currentTime + index * 0.18;

      gain.gain.setValueAtTime(0.0001, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.1, noteStart + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 1.2);

      oscillator.connect(gain);
      gain.connect(master);

      oscillator.start(noteStart);
      oscillator.stop(noteStart + 1.3);
    });

    window.setTimeout(() => {
      try {
        const closePromise = audioCtx.close();
        if (closePromise && closePromise.catch) {
          closePromise.catch(() => {});
        }
      } catch (closeError) {
        // ignore close error
      }
    }, 2300);
  } catch (error) {
    // audio blocked or unsupported
  }
};

/* ---------- MAIN ---------- */
const TourCelebration = ({ onDone, name }) => {
  const burstRef = useRef(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    playFanfare();

    const enterTimer = setTimeout(() => {
      setEntered(true);
    }, 80);

    const volley = setInterval(() => {
      if (burstRef.current) {
        burstRef.current();
      }
    }, 3000);

    return () => {
      clearTimeout(enterTimer);
      clearInterval(volley);
    };
  }, []);

  return (
    <div className="tc-root" role="dialog" aria-modal="true" aria-label="Tour complete celebration">
      <style>{globalCss}</style>

      <Rays />
      <BlueEmbers />
      <RingPulse />
      <BlueFireworks onBurst={burstRef} />
      <BlueDust />
      <Stars />
      <div className="tc-vignette" />

      <div
        className="tc-center"
        style={{
          opacity: entered ? 1 : 0,
          transform: entered ? 'translateY(0px)' : 'translateY(28px)',
          pointerEvents: entered ? 'auto' : 'none',
        }}
      >
        <div className="tc-card">
          <div className="tc-shimmer" />

          <span className="tc-corner tc-corner-tl" />
          <span className="tc-corner tc-corner-tr" />
          <span className="tc-corner tc-corner-bl" />
          <span className="tc-corner tc-corner-br" />

          <div className="tc-content">
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: 22,
              }}
            >
              <LaurelMedal />
            </div>

            <p className="tc-brand">UniConnect PK</p>

            <h1 className="tc-title">Tour Complete</h1>

            <div className="tc-divider" aria-hidden="true">
              <span className="tc-divider-line tc-divider-line-left" />
              <span className="tc-divider-star">✦</span>
              <span className="tc-divider-line tc-divider-line-right" />
            </div>

            <p className="tc-welcome">
              Welcome aboard, <span className="tc-name">{name || 'Explorer'}</span>.
            </p>

            <p className="tc-sub">
              You have unlocked the full power of the platform.
            </p>

            <div className="tc-points">
              <span className="tc-points-label">Bonus earned</span>
              <PointsCounter />
              <span className="tc-points-label">points</span>
            </div>

            <button
              type="button"
              className="tc-button"
              onClick={() => {
                if (onDone) {
                  onDone();
                }
              }}
            >
              <span>Begin Exploring</span>
            </button>

            <p className="tc-hint">Click anywhere to release a burst of blue</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourCelebration;