import { useEffect, useRef, useState } from 'react';

const MOUTHS = {
  idle: 'M-8 14 q8 7 16 0',
  think: 'M-6 16 q6 3 12 0',
  happy: 'M-10 12 q10 14 20 0 z',
  love: 'M-11 12 q11 16 22 0 z',
  sad: 'M-8 18 q8 -7 16 0',
};

const DevScene = ({ theme, mood, typingTick, covering, completion }) => {
  const rootRef = useRef(null);
  const headRef = useRef(null);
  const pupilsRef = useRef(null);
  const catLookRef = useRef(null);
  const catPupilsRef = useRef(null);
  const sceneRef = useRef(null);
  const typingNowRef = useRef(false);
  const [blink, setBlink] = useState(false);
  const [catBlink, setCatBlink] = useState(false);
  const [catHover, setCatHover] = useState(false);
  const [catJump, setCatJump] = useState(false);
  const [waving, setWaving] = useState(false);
  const [parts, setParts] = useState([]);
  const pidRef = useRef(0);

  /* mouse → person head/pupils + cat head/pupils */
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
      const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
      if (headRef.current) {
        const looking = typingNowRef.current;
        const rot = (nx * (looking ? 3 : 7)).toFixed(2);
        const tx = (nx * (looking ? 1.5 : 3)).toFixed(2);
        const ty = (ny * 2 + (looking ? 5 : 0)).toFixed(2);
        headRef.current.setAttribute('transform', `rotate(${rot} 170 150) translate(${tx} ${ty})`);
      }
      if (pupilsRef.current) {
        pupilsRef.current.setAttribute('transform', `translate(${(nx * 2.8).toFixed(2)} ${(ny * 2.2).toFixed(2)})`);
      }
      if (catLookRef.current) {
        catLookRef.current.setAttribute('transform', `rotate(${(nx * 5).toFixed(2)} 326 262)`);
      }
      if (catPupilsRef.current) {
        catPupilsRef.current.setAttribute('transform', `translate(${(nx * 1.6).toFixed(2)} ${(ny * 1.2).toFixed(2)})`);
      }
    };
    el.addEventListener('mousemove', onMove);
    return () => el.removeEventListener('mousemove', onMove);
  }, []);

  /* person blink */
  useEffect(() => {
    let t1, t2;
    const loop = () => {
      t1 = setTimeout(() => {
        setBlink(true);
        t2 = setTimeout(() => { setBlink(false); loop(); }, 150);
      }, 2400 + Math.random() * 2600);
    };
    loop();
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  /* cat blink */
  useEffect(() => {
    let t1, t2;
    const loop = () => {
      t1 = setTimeout(() => {
        setCatBlink(true);
        t2 = setTimeout(() => { setCatBlink(false); loop(); }, 140);
      }, 3200 + Math.random() * 3000);
    };
    loop();
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  /* typing → hands + look-down + keystroke sparks */
  useEffect(() => {
    if (!typingTick) return;
    const sc = sceneRef.current;
    if (!sc) return;
    typingNowRef.current = true;
    sc.classList.add('typing');
    spawn(['✦', '·'], 2, 38, 66);
    const t = setTimeout(() => { sc.classList.remove('typing'); typingNowRef.current = false; }, 420);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typingTick]);

  /* 100% → confetti */
  useEffect(() => {
    if (completion === 100) spawn(['🎉', '✦', '♥', '★'], 14, 40, 28);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completion]);

  const spawn = (chars, n, x, y) => {
    const add = [];
    for (let i = 0; i < n; i++) {
      add.push({ id: pidRef.current++, ch: chars[(Math.random() * chars.length) | 0], left: x + (Math.random() * 16 - 8), top: y + (Math.random() * 10 - 5), d: Math.random() * .4 });
    }
    setParts((p) => [...p, ...add]);
    setTimeout(() => setParts((p) => p.filter((q) => !add.includes(q))), 1700);
  };

  const clickDev = () => {
    setWaving(true);
    setTimeout(() => setWaving(false), 1100);
    spawn(['✦', '⭐', '✨'], 5, 40, 22);
  };

  const clickCat = (e) => {
    e.stopPropagation();
    setCatJump(true);
    setTimeout(() => setCatJump(false), 650);
    spawn(['♥', '♥', '✦'], 7, 76, 55);
  };

  const armColor = '#4640CE';
  const shadow = { fill: '#0B1F30', opacity: '.10' };
  const RING_C = 754;

  return (
    <div className="uc-scene-wrap" ref={rootRef}>
      <div
        ref={sceneRef}
        className={`uc-scene mood-${mood}${catHover ? ' cat-hover' : ''}${waving ? ' waving' : ''}${covering ? ' covering' : ''}${completion === 100 ? ' ring-done' : ''}${theme === 'dark' ? ' night' : ''}`}
      >
        <svg viewBox="0 0 440 340">
          <defs>
            <linearGradient id="gSkin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFDFC4"/><stop offset="1" stopColor="#F2B48C"/></linearGradient>
            <linearGradient id="gHair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#39404F"/><stop offset="1" stopColor="#1B202C"/></linearGradient>
            <linearGradient id="gShirt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#6D6FF3"/><stop offset="1" stopColor="#4640CE"/></linearGradient>
            <linearGradient id="gLid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#CBD6E4"/><stop offset="1" stopColor="#8FA0B6"/></linearGradient>
            <linearGradient id="gCat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7C8BA1"/><stop offset="1" stopColor="#53627A"/></linearGradient>
            <linearGradient id="gChair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2A3650"/><stop offset="1" stopColor="#1B2436"/></linearGradient>
            <linearGradient id="gRing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#4F46E5"/><stop offset="1" stopColor="#00A3FF"/></linearGradient>
            <radialGradient id="gGlow"><stop offset="0" stopColor="#BFD4FF" stopOpacity=".55"/><stop offset="1" stopColor="#BFD4FF" stopOpacity="0"/></radialGradient>
            <filter id="fBlur"><feGaussianBlur stdDeviation="5"/></filter>
          </defs>

          {/* progress aura ring */}
          <g transform="rotate(-90 170 150)">
            <circle className="ring-track" cx="170" cy="150" r="120" fill="none" strokeWidth="6"/>
            <circle className="ring-fill" cx="170" cy="150" r="120" fill="none" strokeWidth="6" strokeLinecap="round" strokeDasharray={RING_C} strokeDashoffset={RING_C * (1 - completion / 100)}/>
          </g>

          {/* ambient dust */}
          <circle className="mote" cx="60" cy="60" r="2" fill="#00A3FF"/>
          <circle className="mote m2" cx="300" cy="40" r="1.5" fill="#4F46E5"/>
          <circle className="mote m3" cx="90" cy="250" r="1.5" fill="#00A3FF"/>
          <circle className="mote m4" cx="395" cy="150" r="2" fill="#4F46E5"/>

          {/* ground shadows */}
          <ellipse cx="170" cy="326" rx="95" ry="8" {...shadow} filter="url(#fBlur)"/>
          <ellipse cx="332" cy="324" rx="32" ry="5" {...shadow} filter="url(#fBlur)" style={{ transform: catJump ? 'scaleY(.5)' : 'scaleY(1)', transformBox: 'fill-box', transformOrigin: 'center', transition: 'transform .3s' }}/>

          {/* chair */}
          <rect x="98" y="118" width="144" height="124" rx="30" fill="url(#gChair)"/>

          {/* person */}
          <g className="torso-g" onClick={clickDev} style={{ cursor: 'pointer' }}>
            <rect x="116" y="138" width="108" height="104" rx="34" fill="url(#gShirt)"/>
            <path d="M206 162 q10 40 -6 74 l22 0 q8 -40 -16 -74 z" fill="#000" opacity=".08"/>
            <path d="M142 170 q6 10 2 18" stroke="#3730A3" strokeWidth="3" fill="none" opacity=".5" strokeLinecap="round"/>
            <path d="M198 170 q-6 10 -2 18" stroke="#3730A3" strokeWidth="3" fill="none" opacity=".5" strokeLinecap="round"/>
            <path d="M154 142 l16 13 l16 -13 z" fill="#3730A3" opacity=".85"/>
            <rect x="158" y="112" width="24" height="28" rx="9" fill="url(#gSkin)"/>
            <g ref={headRef}>
              <g className="sway">
                <circle cx="170" cy="82" r="38" fill="url(#gSkin)"/>
                <path d="M200 70 q6 14 -2 26 q10 -4 10 -16 q0 -8 -8 -10 z" fill="#000" opacity=".07"/>
                <path d="M134 80 q0 -34 36 -34 q36 0 36 34 q-8 -12 -36 -12 q-28 0 -36 12 z" fill="url(#gHair)"/>
                <path d="M142 56 q14 -10 30 -8" stroke="#fff" strokeWidth="3" fill="none" opacity=".22" strokeLinecap="round"/>
                <path d="M132 68 q38 -32 76 0" stroke="#4F46E5" strokeWidth="9" fill="none" strokeLinecap="round"/>
                <rect x="124" y="74" width="14" height="27" rx="7" fill="#4F46E5"/>
                <rect x="202" y="74" width="14" height="27" rx="7" fill="#4F46E5"/>
                <circle className="led" cx="131" cy="88" r="2.6" fill="#00E5FF"/>
                <circle className="led" cx="209" cy="88" r="2.6" fill="#00E5FF"/>
                <rect className="brow" x="152" y="69" width="13" height="4" rx="2" fill="#2A2E3A"/>
                <rect className="brow" x="175" y="69" width="13" height="4" rx="2" fill="#2A2E3A"/>
                {covering ? (
                  <g stroke="#20242E" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M155 84 q5 4 10 0" fill="none"/>
                    <path d="M175 84 q5 4 10 0" fill="none"/>
                  </g>
                ) : blink ? (
                  <g stroke="#20242E" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="155" y1="83" x2="165" y2="83"/>
                    <line x1="175" y1="83" x2="185" y2="83"/>
                  </g>
                ) : (
                  <g>
                    <ellipse cx="160" cy="82" rx="5.5" ry="6" fill="#fff"/>
                    <ellipse cx="180" cy="82" rx="5.5" ry="6" fill="#fff"/>
                    {mood === 'love' ? (
                      <g fill="#FF4D6D">
                        <path d="M160 86 l-3.4 -3.6 a2.2 2.2 0 1 1 3.4 -2.8 a2.2 2.2 0 1 1 3.4 2.8 z"/>
                        <path d="M180 86 l-3.4 -3.6 a2.2 2.2 0 1 1 3.4 -2.8 a2.2 2.2 0 1 1 3.4 2.8 z"/>
                      </g>
                    ) : (
                      <g ref={pupilsRef}>
                        <circle cx="160" cy="83" r="2.7" fill="#20242E"/>
                        <circle cx="180" cy="83" r="2.7" fill="#20242E"/>
                      </g>
                    )}
                  </g>
                )}
                <path d="M170 86 q3 5 0 7" stroke="#E8A87C" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                <circle className="blush" cx="148" cy="94" r="5.5" fill="#FF8FA3"/>
                <circle className="blush" cx="192" cy="94" r="5.5" fill="#FF8FA3"/>
                <g transform="translate(170 88)">
                  <path d={MOUTHS[mood] || MOUTHS.idle} stroke="#7C2D12" strokeWidth="3" fill={mood === 'happy' || mood === 'love' ? '#8B2F12' : 'none'} strokeLinecap="round"/>
                </g>
                <ellipse className="faceglow" cx="170" cy="98" rx="30" ry="20" fill="url(#gGlow)"/>
              </g>
            </g>
          </g>

          {/* laptop */}
          <rect x="124" y="158" width="92" height="60" rx="9" fill="url(#gLid)" stroke="#7E8CA0"/>
          <circle className="logo" cx="170" cy="188" r="7" fill="#fff" opacity=".9"/>
          <rect x="118" y="219" width="104" height="9" rx="4.5" fill="#7E8CA0"/>

          {/* cat */}
          <g className={`cat${catJump ? ' jump' : ''}`} onClick={clickCat} onMouseEnter={() => setCatHover(true)} onMouseLeave={() => setCatHover(false)} style={{ cursor: 'pointer' }}>
            <path className="tail" d="M356 300 q28 -6 21 -36" stroke="#53627A" strokeWidth="9" fill="none" strokeLinecap="round"/>
            <g className={`cat-body-g${catHover ? ' purr' : ''}`}>
              <ellipse cx="332" cy="296" rx="27" ry="24" fill="url(#gCat)"/>
              <ellipse cx="326" cy="302" rx="12" ry="10" fill="#C9D2E0" opacity=".8"/>
              <path d="M318 280 q6 6 0 12" stroke="#46536B" strokeWidth="4" fill="none" strokeLinecap="round"/>
              <path d="M332 276 q6 6 0 12" stroke="#46536B" strokeWidth="4" fill="none" strokeLinecap="round"/>
            </g>
            <g ref={catLookRef}>
              <g className="cat-head">
                <path className="ear ear-l ear-tw" d="M314 252 l-5 -13 l13 5 z" fill="url(#gCat)"/>
                <path className="ear ear-r" d="M338 252 l5 -13 l-13 5 z" fill="url(#gCat)"/>
                <circle cx="326" cy="262" r="17" fill="url(#gCat)"/>
                {catBlink ? (
                  <g stroke="#10141C" strokeWidth="2" strokeLinecap="round">
                    <line x1="317" y1="260" x2="323" y2="260"/>
                    <line x1="329" y1="260" x2="335" y2="260"/>
                  </g>
                ) : (
                  <g className="eyes-n">
                    <g ref={catPupilsRef}>
                      <circle cx="320" cy="260" r="2.2" fill="#10141C"/>
                      <circle cx="332" cy="260" r="2.2" fill="#10141C"/>
                    </g>
                  </g>
                )}
                <g className="eyes-h" stroke="#10141C" strokeWidth="2" fill="none" strokeLinecap="round">
                  <path d="M317 260 q3 -3 6 0"/>
                  <path d="M329 260 q3 -3 6 0"/>
                </g>
                <path d="M324 266 h4 l-2 3 z" fill="#FF7A90"/>
                <path d="M322 271 q2 3 4 0 q2 3 4 0" stroke="#10141C" strokeWidth="1.5" fill="none"/>
                <g stroke="#94A3B8" strokeWidth="1.2">
                  <line x1="308" y1="264" x2="296" y2="262"/>
                  <line x1="308" y1="268" x2="296" y2="270"/>
                  <line x1="344" y1="264" x2="356" y2="262"/>
                  <line x1="344" y1="268" x2="356" y2="270"/>
                </g>
              </g>
            </g>
          </g>

          {/* arms + hands (normal) */}
          <path d="M132 164 q-26 30 -4 60" stroke={armColor} strokeWidth="14" fill="none" strokeLinecap="round"/>
          <g className="arm-r-normal">
            <path d="M208 164 q26 30 4 60" stroke={armColor} strokeWidth="14" fill="none" strokeLinecap="round"/>
            <circle className="hand hand-r" cx="212" cy="224" r="7.5" fill="url(#gSkin)"/>
          </g>
          <circle className="hand hand-l" cx="128" cy="224" r="7.5" fill="url(#gSkin)"/>

          {/* waving arm (on click) */}
          <g className="arm-wave">
            <path d="M208 168 q30 -14 38 -46" stroke={armColor} strokeWidth="14" fill="none" strokeLinecap="round"/>
            <g className="wave-hand">
              <circle cx="248" cy="116" r="8" fill="url(#gSkin)"/>
            </g>
          </g>

          {/* privacy cover hands (password focus) */}
          <g className="cover-hands">
            <path d="M150 122 q4 -18 8 -30" stroke={armColor} strokeWidth="12" fill="none" strokeLinecap="round"/>
            <path d="M190 122 q-4 -18 -8 -30" stroke={armColor} strokeWidth="12" fill="none" strokeLinecap="round"/>
            <circle cx="160" cy="84" r="9" fill="url(#gSkin)"/>
            <circle cx="180" cy="84" r="9" fill="url(#gSkin)"/>
          </g>
        </svg>

        {parts.map((p) => (
          <span key={p.id} className="uc-part" style={{ left: p.left + '%', top: p.top + '%', animationDelay: p.d + 's', fontSize: 15 }}>
            {p.ch}
          </span>
        ))}
      </div>
    </div>
  );
};

export default DevScene;