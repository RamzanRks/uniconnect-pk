import { useEffect, useRef } from 'react';
import '../styles/portfolio.css';

const LivePortfolio = ({ firstName, lastName, university, majorLabel, username, email, skills, available, completion, celebrateKey }) => {
  const zoneRef = useRef(null);
  const fxRef = useRef(null);
  const termRef = useRef(null);
  const nameRef = useRef(null);
  const initialsRef = useRef(null);
  const tagRef = useRef(null);
  const uniRef = useRef(null);
  const majorRef = useRef(null);
  const idRef = useRef(null);
  const statusRef = useRef(null);
  const skillsRef = useRef(null);
  const emailRef = useRef(null);
  const meterRef = useRef(null);
  const pctRef = useRef(null);
  const stampRef = useRef(null);
  const cardRef = useRef(null);
  const typedRef = useRef(null);

  const log = (msg, type = 'info') => {
    const term = termRef.current; if (!term) return;
    const l = document.createElement('div'); l.className = 'tl ' + type;
    const t = new Date().toTimeString().slice(0, 8);
    l.innerHTML = `<span class="t">${t}</span><span class="m">› ${msg}</span>`;
    term.appendChild(l);
    while (term.children.length > 6) term.removeChild(term.firstChild);
  };

  const scramble = (el, text, dur = 240) => {
    if (!el) return;
    if (el._raf) cancelAnimationFrame(el._raf);
    const chars = '!<>-_\\/[]{}—=+*^?#', start = performance.now();
    const fr = (now) => {
      const p = (now - start) / dur;
      if (p >= 1) { el.textContent = text; el._raf = null; return; }
      let out = '';
      for (let i = 0; i < text.length; i++) out += (i / text.length < p * 1.2) ? text[i] : chars[(Math.random() * chars.length) | 0];
      el.textContent = out; el._raf = requestAnimationFrame(fr);
    };
    el._raf = requestAnimationFrame(fr);
  };

  const pulseCard = () => { const c = cardRef.current; if (!c) return; c.classList.remove('pulse'); void c.offsetWidth; c.classList.add('pulse'); };

  /* typed UniConnect headline */
  useEffect(() => {
    const WORD = 'UniConnect'; let ti = 0, deleting = false, to;
    const loop = () => {
      if (!deleting) { ti++; typedRef.current.textContent = WORD.slice(0, ti); if (ti === WORD.length) { deleting = true; to = setTimeout(loop, 1900); return; } to = setTimeout(loop, 110); }
      else { ti--; typedRef.current.textContent = WORD.slice(0, ti); if (ti === 0) { deleting = false; to = setTimeout(loop, 650); return; } to = setTimeout(loop, 55); }
    };
    loop();
    return () => clearTimeout(to);
  }, []);

  /* ambient terminal */
  useEffect(() => {
    log('boot: uniconnect.live · white edition', 'ok');
    log('robo online 👋');
    const AMBIENT = ['rendering portfolio…', 'particle field stable', 'syncing skill graph…', 'websocket: alive', 'theme: crystal white ✓', 'campus node ping: 12ms'];
    let i = 0;
    const iv = setInterval(() => log(AMBIENT[i++ % AMBIENT.length]), 4200);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* fx canvas: motes + waves + sparks */
  useEffect(() => {
    const zone = zoneRef.current, fx = fxRef.current;
    if (!zone || !fx) return;
    const fctx = fx.getContext('2d');
    let FW, FH, DPR = Math.min(2, devicePixelRatio || 1);
    const size = () => { const r = zone.getBoundingClientRect(); FW = fx.width = Math.max(1, r.width * DPR); FH = fx.height = Math.max(1, r.height * DPR); fx.style.width = r.width + 'px'; fx.style.height = r.height + 'px'; };
    size();
    const motes = [], waves = [], sparksBg = [];
    for (let i = 0; i < 22; i++) sparksBg.push({ x: Math.random(), y: Math.random(), r: .4 + Math.random() * 1.6, sp: .00004 + Math.random() * .00012, ph: Math.random() * 7 });
    const onMove = (e) => { const r = zone.getBoundingClientRect(), x = (e.clientX - r.left) * DPR, y = (e.clientY - r.top) * DPR; for (let i = 0; i < 3; i++) motes.push({ x, y, vx: (Math.random() - .5) * 2.4 * DPR, vy: (Math.random() - .5) * 2.4 * DPR - .4 * DPR, life: 1, hue: Math.random() }); };
    const onClick = (e) => { const r = zone.getBoundingClientRect(), x = (e.clientX - r.left) * DPR, y = (e.clientY - r.top) * DPR; waves.push({ x, y, r: 0, a: 1 }); for (let i = 0; i < 40; i++) { const a = Math.random() * Math.PI * 2, s = (1 + Math.random() * 3.4) * DPR; motes.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, hue: Math.random() }); } pulseCard(); };
    zone.addEventListener('mousemove', onMove);
    zone.addEventListener('click', onClick);
    let raf;
    const render = (t) => {
      fctx.clearRect(0, 0, FW, FH);
      for (const s of sparksBg) { const y = ((s.y - t * s.sp) % 1 + 1) % 1, x = s.x + Math.sin(t * .001 + s.ph) * .02; fctx.fillStyle = `rgba(0,102,255,${.10 + Math.sin(t * .002 + s.ph) * .06})`; fctx.beginPath(); fctx.arc(x * FW, y * FH, s.r * DPR, 0, 7); fctx.fill(); }
      for (let i = motes.length - 1; i >= 0; i--) { const m = motes[i]; m.x += m.vx; m.y += m.vy; m.vy += .03 * DPR; m.vx *= .985; m.life -= .02; if (m.life <= 0) { motes.splice(i, 1); continue; } fctx.fillStyle = `rgba(${m.hue < .5 ? '0,102,255' : '0,163,255'},${m.life * .6})`; fctx.beginPath(); fctx.arc(m.x, m.y, 2.4 * m.life * DPR, 0, 7); fctx.fill(); }
      if (motes.length > 420) motes.splice(0, motes.length - 420);
      for (let i = waves.length - 1; i >= 0; i--) { const w = waves[i]; w.r += 7 * DPR; w.a -= .03; if (w.a <= 0) { waves.splice(i, 1); continue; } fctx.strokeStyle = `rgba(0,102,255,${w.a * .7})`; fctx.lineWidth = 2 * DPR * w.a; fctx.beginPath(); fctx.arc(w.x, w.y, w.r, 0, 7); fctx.stroke(); }
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    const onR = () => size();
    addEventListener('resize', onR);
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', onR); zone.removeEventListener('mousemove', onMove); zone.removeEventListener('click', onClick); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* live bindings */
  const fullName = (firstName.trim() + ' ' + lastName.trim()).trim();
  useEffect(() => {
    scramble(nameRef.current, fullName || 'Your Name');
    if (initialsRef.current) initialsRef.current.textContent = ((firstName.trim()[0] || 'U') + (lastName.trim()[0] || 'C')).toUpperCase();
    if (tagRef.current) tagRef.current.textContent = (fullName ? 'builder' : 'future builder') + ' @ UniConnect';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstName, lastName]);
  useEffect(() => { scramble(uniRef.current, university || 'university?'); }, [university]);
  useEffect(() => { scramble(majorRef.current, majorLabel || 'major?'); if (majorLabel) log('major → ' + majorLabel); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [majorLabel]);
  useEffect(() => { if (idRef.current) idRef.current.textContent = username || '—'; }, [username]);
  useEffect(() => { if (emailRef.current) emailRef.current.textContent = email || '…'; }, [email]);
  useEffect(() => {
    const st = statusRef.current; if (!st) return;
    st.className = 'pf-status ' + (available ? 'open' : 'off');
    st.textContent = available ? 'open to collabs' : 'focus mode';
    log(available ? 'status → OPEN_TO_COLLAB' : 'status → FOCUS_MODE', available ? 'ok' : 'warn');
  }, [available]);
  useEffect(() => {
    const box = skillsRef.current; if (!box) return;
    box.innerHTML = '';
    if (!skills.length) box.innerHTML = '<span class="pf-chip ghost">no skills yet…</span>';
    skills.forEach((n, i) => { const c = document.createElement('span'); c.className = 'pf-chip'; c.textContent = n; c.style.animationDelay = (i * 50) + 'ms'; box.appendChild(c); });
    if (skills.length) log('skills.sync [' + skills.join(', ') + ']', 'ok');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skills]);
  useEffect(() => {
    if (meterRef.current) meterRef.current.style.width = completion + '%';
    if (pctRef.current) pctRef.current.textContent = completion + '%';
    const c = cardRef.current; if (!c) return;
    if (completion === 100) c.classList.add('complete'); else c.classList.remove('complete');
  }, [completion]);
  useEffect(() => {
    if (!celebrateKey) return;
    stampRef.current.classList.add('show');
    pulseCard();
    log('account.created ✓ VERIFIED', 'ok');
  }, [celebrateKey]);

  return (
    <section className="left-panel" ref={zoneRef}>
      <canvas ref={fxRef} id="fxCanvas"></canvas>
      <div className="lp-top">
        <div className="type-line"><span ref={typedRef}></span><span className="type-caret"></span></div>
        <span className="pf-live">LIVE</span>
      </div>
      <div className="pf-header">
        <span className="pf-title">PORTFOLIO</span>
        <div className="meter"><i ref={meterRef}></i></div>
        <span ref={pctRef} id="pfPct">0%</span>
      </div>
      <div className="pf-card" ref={cardRef}>
        <div className="shine"></div>
        <div className="pf-cover"><div className="pf-orbit"><i></i></div></div>
        <div className="pf-avatar"><div className="pf-core" ref={initialsRef}>UC</div></div>
        <div className="pf-body">
          <div className="pf-name-row">
            <h2 ref={nameRef} id="pfName">Your Name</h2>
            <span className="pf-status open" ref={statusRef}>open to collabs</span>
          </div>
          <div ref={tagRef} id="pfTag">future builder @ UniConnect</div>
          <div className="pf-badges">
            <span className="pf-badge">🎓 <i ref={uniRef}>university?</i></span>
            <span className="pf-badge">📚 <i ref={majorRef}>major?</i></span>
            <span className="pf-badge mono"># <i ref={idRef}>—</i></span>
          </div>
          <div className="pf-sec">SKILL STACK</div>
          <div className="pf-skills" ref={skillsRef}></div>
          <div className="pf-sec">CONTACT · ACTIVITY</div>
          <div className="pf-meta">
            <span ref={emailRef} id="pfEmail">…</span>
            <div className="pf-eq"><i></i><i></i><i></i><i></i><i></i></div>
          </div>
        </div>
        <div className="stamp" ref={stampRef}>✓ VERIFIED</div>
      </div>
      <div className="pf-terminal" ref={termRef}></div>
      <div className="ticker"><div className="ticker-track">
        <span>CONNECT · BUILD · HACK · GROW · SHIP · REPEAT · CONNECT · BUILD · HACK · GROW · SHIP · REPEAT ·&nbsp;</span>
        <span>CONNECT · BUILD · HACK · GROW · SHIP · REPEAT · CONNECT · BUILD · HACK · GROW · SHIP · REPEAT ·&nbsp;</span>
      </div></div>
    </section>
  );
};

export default LivePortfolio;