import { useEffect, useRef, useState } from 'react';

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import gsap from 'gsap';





const EVO_CSS = `
.evo-col{position:relative;min-height:560px;height:100%;overflow:hidden}
#bot-stage{position:fixed;inset:0;pointer-events:none;z-index:80}
@media(max-width:1180px){#bot-stage{position:absolute;z-index:5}}
#bot-stage canvas{width:100%;height:100%;display:block;pointer-events:none}
#bot-bubble{position:absolute;left:50%;top:20%;transform:translate(-50%,-140%);background:rgba(255,255,255,.95);color:#06282e;padding:9px 16px;border-radius:14px;font-size:14px;font-weight:600;white-space:nowrap;box-shadow:0 6px 24px rgba(0,242,255,.35);opacity:0;transition:opacity .35s;pointer-events:none;z-index:7}
#bot-bubble.show{opacity:1}
.float-emoji{position:absolute;pointer-events:none;z-index:6;opacity:0;filter:drop-shadow(0 0 6px rgba(0,242,255,.55))}
#pbar{position:absolute;width:170px;height:12px;border-radius:8px;background:rgba(0,0,0,.5);border:1px solid rgba(0,242,255,.4);display:none;transform:translate(-50%,-50%);z-index:7;overflow:hidden}
#pfill{height:100%;width:0%;background:linear-gradient(90deg,#00f2ff,#7cffb2)}
#meter{position:absolute;display:none;gap:4px;transform:translate(-50%,-50%);z-index:7}
#meter i{width:16px;height:7px;border-radius:4px;background:rgba(255,255,255,.15);transition:.2s}
#combo{position:absolute;display:none;transform:translate(-50%,-50%);font-weight:800;color:#ffe066;font-size:22px;text-shadow:0 0 12px rgba(255,224,102,.8);z-index:7}
#emote-wheel{position:fixed;top:84px;left:46px;display:flex;gap:3px;z-index:95;background:rgba(255, 255, 255, 0.01);border:1px solid rgba(251, 251, 251, 0);padding:6px 8px;border-radius:14px;backdrop-filter:blur(8px)}
#emote-wheel button{position:relative;width:34px;height:34px;border-radius:10px;border:1px solid rgba(255, 255, 255, 1);background:rgba(255, 255, 255, 0.85);font-size:17px;cursor:pointer;transition:.15s}
#emote-wheel button:hover{transform:scale(1.12);box-shadow:0 0 12px rgba(1, 240, 253, 0.52)}
#emote-wheel button::after{content:attr(data-name);position:absolute;top:112%;left:50%;transform:translateX(-50%) scale(.8);opacity:0;pointer-events:none;background:#0a141a;color:#9ff8ff;font-size:10px;font-weight:700;padding:3px 8px;border-radius:8px;border:1px solid rgba(0,242,255,.35);white-space:nowrap;transition:.15s;z-index:99}
#emote-wheel button:hover::after{opacity:1;transform:translateX(-50%) scale(1)}
#skins{position:absolute;left:12px;bottom:58px;display:none;flex-direction:column;gap:6px;z-index:9;background:rgba(10,20,26,.88);padding:10px 12px;border-radius:16px;border:1px solid rgba(0,242,255,.25);backdrop-filter:blur(8px)}
#skins.open{display:flex}
#skins-toggle{position:absolute;left:12px;bottom:12px;z-index:10;width:42px;height:42px;border-radius:14px;border:1px solid rgba(0,242,255,.4);background:rgba(10,20,26,.85);font-size:18px;cursor:pointer;transition:.2s}
#skins-toggle:hover{transform:scale(1.08);box-shadow:0 0 14px rgba(0,242,255,.5)}
#skins input[type="color"]{width:30px;height:24px;border:none;background:none;padding:0;cursor:pointer}
#skins .srow{display:flex;gap:7px;align-items:center}
#skins .srow>span{font-size:12px;width:16px}
#skins button{width:16px;height:16px;border-radius:50%;border:2px solid rgba(255,255,255,.3);cursor:pointer;background:var(--c);transition:.15s}
#skins button:hover{transform:scale(1.3)}
`;




export default function EvoBot() {
  const rootRef = useRef(null);
  const initRef = useRef(false);
    const [sceneReady, setSceneReady] = useState(false);   // ✅ NEW


  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const root = rootRef.current;
    const stage = root.querySelector('#bot-stage');
    const bubbleEl = root.querySelector('#bot-bubble');
    const pbarEl = root.querySelector('#pbar');
    const pfillEl = root.querySelector('#pfill');
    const meterEl = root.querySelector('#meter');
    const comboEl = root.querySelector('#combo');
    const wheelEl = root.querySelector('#emote-wheel');
    const cleanups = [];
    const on = (t, e, f, o) => { t.addEventListener(e, f, o); cleanups.push(() => t.removeEventListener(e, f, o)); };

    /* ================= AUDIO ================= */
    window.EVO_SOUNDS = window.EVO_SOUNDS || {};
    window.EVO_CONFIG = Object.assign({ autoSounds: false, synth: true }, window.EVO_CONFIG);
    let audioOn = false;
    const AudioSys = { ctx: null, cache: {},
      ensure() { if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); return this.ctx; },
      play(name, synth, auto = false) { if (auto && !EVO_CONFIG.autoSounds) return; const url = EVO_SOUNDS[name]; if (url) { let a = this.cache[name]; if (!a) { a = new Audio(url); this.cache[name] = a; } a.currentTime = 0; a.play().catch(() => {}); return; } if (EVO_CONFIG.synth && synth) synth(); },
      tone(f, d, type = 'sine', v = .2, slide = null, delay = 0) { if (!audioOn) return; const ctx = this.ensure(); if (!ctx) return; const t0 = ctx.currentTime + delay, o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t0); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, slide), t0 + d); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(v, t0 + .012); g.gain.exponentialRampToValueAtTime(.0001, t0 + d); o.connect(g).connect(ctx.destination); o.start(t0); o.stop(t0 + d + .05); },
      noise(d = .15, v = .25, delay = 0, hp = 900) { if (!audioOn) return; const ctx = this.ensure(); if (!ctx) return; const t0 = ctx.currentTime + delay, len = (ctx.sampleRate * d) | 0, buf = ctx.createBuffer(1, len, ctx.sampleRate); const ch = buf.getChannelData(0); for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len); const s = ctx.createBufferSource(); s.buffer = buf; const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp; const g = ctx.createGain(); g.gain.value = v; s.connect(f).connect(g).connect(ctx.destination); s.start(t0); } };
    const SFX = { boop: a => AudioSys.play('boop', () => AudioSys.tone(520, .09, 'sine', .25, 880), a),
      wheee: a => AudioSys.play('wheee', () => AudioSys.tone(300, .45, 'triangle', .2, 1400), a),
      pop: (a, i = 0) => AudioSys.play('pop', () => AudioSys.noise(.08, .2, i * .06, 1400), a),
      womp: a => AudioSys.play('womp', () => { AudioSys.tone(280, .28, 'sawtooth', .15, 140); AudioSys.tone(200, .4, 'sawtooth', .12, 90, .25); }, a),
      jingle: a => AudioSys.play('jingle', () => [523, 659, 784, 1047].forEach((f, i) => AudioSys.tone(f, .16, 'triangle', .18, null, i * .11)), a),
      tickle: a => AudioSys.play('tickle', () => { for (let i = 0; i < 4; i++) AudioSys.tone(800 + Math.random() * 500, .05, 'square', .08, null, i * .06); }, a),
      startled: a => AudioSys.play('startled', () => AudioSys.tone(900, .12, 'square', .2, 1500), a),
      sneeze: a => AudioSys.play('sneeze', () => { AudioSys.tone(500, .1, 'sawtooth', .15, 900); AudioSys.noise(.2, .3, .1, 600); }, a),
      hiccup: a => AudioSys.play('hiccup', () => AudioSys.tone(220, .07, 'square', .2, 180), a),
      yawn: a => AudioSys.play('yawn', () => AudioSys.tone(420, .5, 'sine', .12, 180), a),
      flap: a => AudioSys.play('flap', () => AudioSys.tone(1200 + Math.random() * 400, .04, 'sine', .05, 1600), a) };
    on(window, 'pointerdown', () => { audioOn = true; AudioSys.ensure(); });
    on(window, 'keydown', () => { audioOn = true; AudioSys.ensure(); });

    /* ================= SCENE ================= */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    stage.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, .1, 50);
    camera.position.set(0, 1.25, 5.25); camera.lookAt(0, .98, 0);
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.1); keyLight.position.set(2, 3, 4); scene.add(keyLight);
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;

    const CYAN = 0x00f2ff;
    const matWhite = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .12, clearcoat: 1, clearcoatRoughness: .08 });
    const matBlack = new THREE.MeshStandardMaterial({ color: 0x101114, roughness: .55 });
    const matVisor = new THREE.MeshPhysicalMaterial({ color: 0x05060a, roughness: .06, metalness: .5, clearcoat: 1, envMapIntensity: 1.5 });
    const matGlow = new THREE.MeshStandardMaterial({ color: 0x003844, emissive: CYAN, emissiveIntensity: 2.6, roughness: .3, side: THREE.DoubleSide });
    const matBlush = new THREE.MeshStandardMaterial({ color: 0x331122, emissive: 0xff7d9d, emissiveIntensity: 1.4, transparent: true, opacity: .85 });
    const GLOWS = [], GLOWMATS = [matGlow], BODYMATS = [matWhite];
    function radialTex(stops) { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); stops.forEach(s => gr.addColorStop(...s)); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); }
    const glowTex = radialTex([[0, 'rgba(255,255,255,1)'], [.4, 'rgba(0,242,255,.4)'], [1, 'rgba(0,242,255,0)']]);
    const shadowTex = radialTex([[0, 'rgba(0,0,0,.55)'], [1, 'rgba(0,0,0,0)']]);
    function addGlow(parent, x, y, z, s, o = .6) { const m = new THREE.SpriteMaterial({ map: glowTex, color: matGlow.emissive.getHex(), transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false }); const sp = new THREE.Sprite(m); sp.position.set(x, y, z); sp.scale.set(s, s, 1); parent.add(sp); GLOWS.push(m); return sp; }

    /* ================= ROBOT ================= */
    const bot = new THREE.Group(), body = new THREE.Group(), neck = new THREE.Group(), head = new THREE.Group();
    const armL = new THREE.Group(), armR = new THREE.Group(), legL = new THREE.Group(), legR = new THREE.Group();
    const eyesGroup = new THREE.Group();
    bot.add(body); body.add(neck, armL, armR, legL, legR); neck.add(head);
    const scrollG = new THREE.Group(); scene.add(scrollG); scrollG.add(bot);
    head.userData.part = 'head'; armL.userData.part = 'armL'; armR.userData.part = 'armR';
    legL.userData.part = 'legL'; legR.userData.part = 'legR';
    const M = (geo, mat, x = 0, y = 0, z = 0, parent = body, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.rotation.set(rx, ry, rz); parent.add(m); return m; };

    M(new THREE.SphereGeometry(.5, 40, 28), matWhite, 0, .92, 0, body, 1, .95, .9).userData.part = 'belly';
    M(new THREE.SphereGeometry(.16, 24, 16), matGlow, 0, .98, .44, body, 1, 1, .5).userData.part = 'belly';
    const coreGlow = addGlow(body, 0, .98, .6, .8, .7);
    const coreLight = new THREE.PointLight(CYAN, 1.5, 3); coreLight.position.set(0, 1.0, .8); body.add(coreLight);
    M(new THREE.CylinderGeometry(.11, .12, .14, 16), matBlack, 0, 1.40, 0);
    neck.position.y = 1.44; head.position.y = .24;
    M(new THREE.SphereGeometry(.55, 40, 28), matWhite, 0, 0, 0, head, .95, .85, .9);
    M(new THREE.SphereGeometry(.5, 40, 28), matVisor, 0, -.02, .30, head, 1, .75, .55);
    M(new THREE.TorusGeometry(.52, .035, 12, 48, Math.PI), matBlack, 0, -.02, 0, head);
    const bandGlow = M(new THREE.TorusGeometry(.545, .011, 8, 32, 1.6), matGlow, 0, -.02, 0, head); bandGlow.rotation.z = (Math.PI - 1.6) / 2;

    head.add(eyesGroup);
    const eyeGeo = new THREE.SphereGeometry(.085, 24, 16), arcGeo = new THREE.TorusGeometry(.085, .028, 12, 24, Math.PI), barGeo = new THREE.BoxGeometry(.16, .035, .03);
    const heartGeo = (() => { const s = new THREE.Shape(); s.moveTo(0, -.06); s.bezierCurveTo(.07, -.01, .06, .05, .03, .05); s.bezierCurveTo(.012, .05, 0, .03, 0, .015); s.bezierCurveTo(0, .03, -.012, .05, -.03, .05); s.bezierCurveTo(-.06, .05, -.07, -.01, 0, -.06); return new THREE.ShapeGeometry(s, 12); })();
    function makeEye(x) { const g = new THREE.Group(); g.position.set(x, .02, .55); eyesGroup.add(g); const oval = new THREE.Mesh(eyeGeo, matGlow); oval.scale.set(1, 1.35, .55); g.add(oval); const up = new THREE.Mesh(arcGeo, matGlow); up.visible = false; g.add(up); const down = new THREE.Mesh(arcGeo, matGlow); down.rotation.z = Math.PI; down.visible = false; g.add(down); const bar = new THREE.Mesh(barGeo, matGlow); bar.position.z = .02; bar.rotation.z = x > 0 ? .5 : -.5; bar.visible = false; g.add(bar); const heart = new THREE.Mesh(heartGeo, matGlow); heart.position.z = .02; heart.visible = false; g.add(heart); const dz = new THREE.Group(); dz.position.z = .02; dz.visible = false; const d1 = new THREE.Mesh(new THREE.SphereGeometry(.028, 10, 8), matGlow); d1.position.x = .055; dz.add(d1); const d2 = new THREE.Mesh(new THREE.SphereGeometry(.02, 10, 8), matGlow); d2.position.x = -.045; dz.add(d2); g.add(dz); addGlow(g, 0, 0, .1, .32, .7); return { g, oval, up, down, bar, heart, dz }; }
    const eyeRt = makeEye(.17), eyeLf = makeEye(-.17);
    function makeBlush(x) { const m = new THREE.Mesh(new THREE.SphereGeometry(.05, 16, 12), matBlush); m.scale.set(1, .62, .35); m.position.set(x, -.12, .51); m.visible = false; head.add(m); return m; }
    const blushR = makeBlush(.30), blushL = makeBlush(-.30);
    const snot = new THREE.Mesh(new THREE.SphereGeometry(.05, 16, 12), new THREE.MeshPhysicalMaterial({ color: 0xbfefff, transparent: true, opacity: .55, roughness: .1, clearcoat: 1 }));
    snot.position.set(0, -.16, .56); snot.visible = false; snot.userData.noHit = true; head.add(snot);

    const podR = new THREE.Group(), podL = new THREE.Group();
    podR.position.set(.52, -.02, 0); podL.position.set(-.52, -.02, 0);
    podR.userData.part = 'pod'; podL.userData.part = 'pod'; head.add(podR, podL);
    function buildPod(g, s) { M(new THREE.CylinderGeometry(.16, .16, .09, 24), matWhite, 0, 0, 0, g, 1, 1, 1, 0, 0, Math.PI / 2); const ring = M(new THREE.TorusGeometry(.16, .02, 12, 32), matGlow, s * .045, 0, 0, g, 1, 1, 1, 0, Math.PI / 2, 0); addGlow(g, s * .1, 0, 0, .45, .55); return ring; }
    const podRingR = buildPod(podR, 1), podRingL = buildPod(podL, -1);
    const antR = new THREE.Group(), antL = new THREE.Group();
    antR.position.set(.22, .4, 0); antL.position.set(-.22, .4, 0);
    antR.userData.part = 'antenna'; antL.userData.part = 'antenna'; head.add(antR, antL);
    let tipL = null;
    [[antR, -1], [antL, 1]].forEach(([a, s]) => { M(new THREE.CylinderGeometry(.012, .012, .34, 8), matBlack, s * .03, .17, 0, a, 1, 1, 1, 0, 0, -s * .18); const tip = M(new THREE.SphereGeometry(.045, 16, 12), matWhite, s * .062, .35, 0, a); if (s === 1) tipL = tip; });

    const REST = { L: .12, R: -.12 };
    function buildArm(g, x) { g.position.set(x, 1.22, 0); g.rotation.z = x > 0 ? REST.L : REST.R; M(new THREE.SphereGeometry(.11, 20, 14), matWhite, 0, 0, 0, g); M(new THREE.CylinderGeometry(.05, .05, .24, 12), matBlack, 0, -.14, 0, g); const foreMat = matWhite.clone(); BODYMATS.push(foreMat); const handMat = matWhite.clone(); BODYMATS.push(handMat); const ringMat = matGlow.clone(); GLOWMATS.push(ringMat); const fore = M(new THREE.CapsuleGeometry(.095, .22, 6, 16), foreMat, 0, -.38, 0, g); const ring = M(new THREE.TorusGeometry(.10, .018, 10, 28), ringMat, 0, -.56, 0, g, 1, 1, 1, Math.PI / 2, 0, 0); const glow = addGlow(g, 0, -.56, 0, .3, .45); const hand = M(new THREE.SphereGeometry(.09, 20, 14), handMat, 0, -.68, 0, g, .9, 1.15, .9); g.userData.coverParts = [fore, ring, glow, hand]; }
    buildArm(armL, .5); buildArm(armR, -.5);
    function buildLeg(g, x) { g.position.set(x, .62, 0); M(new THREE.CapsuleGeometry(.09, .3, 6, 16), matWhite, 0, -.22, 0, g); M(new THREE.SphereGeometry(.16, 24, 16), matWhite, 0, -.52, .05, g, 1.1, .55, 1.5); M(new THREE.TorusGeometry(.14, .016, 10, 28), matGlow, 0, -.585, .05, g, 1, 1, 1, Math.PI / 2, 0, 0); }
    buildLeg(legL, .22); buildLeg(legR, -.22);

    const hat = new THREE.Group();
    M(new THREE.ConeGeometry(.13, .26, 16), new THREE.MeshStandardMaterial({ color: 0xff7d9d, roughness: .4 }), 0, .1, 0, hat);
    M(new THREE.SphereGeometry(.05, 12, 10), matWhite, 0, .24, 0, hat);
    hat.position.set(0, .48, .02); hat.rotation.z = -.12; hat.visible = false; head.add(hat);
    const shades = new THREE.Group();
    const matShade = new THREE.MeshPhysicalMaterial({ color: 0x000000, roughness: .1, clearcoat: 1 });
    M(new THREE.BoxGeometry(.13, .08, .02), matShade, .17, 0, 0, shades);
    M(new THREE.BoxGeometry(.13, .08, .02), matShade, -.17, 0, 0, shades);
    M(new THREE.BoxGeometry(.12, .02, .02), matShade, 0, .02, 0, shades);
    shades.position.set(0, .03, .60); shades.visible = false; head.add(shades);

    const rope = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, 1, 8), matBlack); rope.visible = false; scene.add(rope);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(.09, 16, 12), new THREE.MeshStandardMaterial({ color: 0xd8f65a, roughness: .5 })); ball.visible = false; scene.add(ball);

    const bf = new THREE.Group();
    const wingShape = (() => { const s = new THREE.Shape(); s.moveTo(0, 0); s.bezierCurveTo(.03, .05, .11, .11, .15, .08); s.bezierCurveTo(.18, .05, .13, 0, .09, -.005); s.bezierCurveTo(.14, -.02, .15, -.09, .11, -.11); s.bezierCurveTo(.06, -.13, .015, -.07, 0, -.02); s.closePath(); return s; })();
    const wingGeo = new THREE.ShapeGeometry(wingShape, 12);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0xff9ecf, emissive: 0xff4fd8, emissiveIntensity: .9, side: THREE.DoubleSide, roughness: .4 });
    const wingR = new THREE.Mesh(wingGeo, wingMat); const wingL = new THREE.Mesh(wingGeo, wingMat); wingL.scale.x = -1;
    const bfBody = new THREE.Mesh(new THREE.CapsuleGeometry(.016, .07, 4, 8), new THREE.MeshStandardMaterial({ color: 0x1a1d24, roughness: .5 }));
    bf.add(wingR, wingL, bfBody);
    const bfGlowMat = new THREE.SpriteMaterial({ map: glowTex, color: 0xff4fd8, transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false });
    const bfGlow = new THREE.Sprite(bfGlowMat); bfGlow.scale.set(.4, .4, 1); bf.add(bfGlow);
    bf.visible = false; scene.add(bf);

    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: .4, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = .001; scrollG.add(shadow);
    const hitMeshes = []; bot.traverse(o => { if (o.isMesh && !o.userData.noHit) hitMeshes.push(o); });
    function partOf(o) { let n = o; while (n) { if (n.userData && n.userData.part) return n.userData.part; n = n.parent; } return null; }

    /* ================= CONFETTI ================= */
    const PMAX = 260;
    const pPos = new Float32Array(PMAX * 3), pVel = new Float32Array(PMAX * 3), pCol = new Float32Array(PMAX * 3), pBase = new Float32Array(PMAX * 3), pLife = new Float32Array(PMAX);
    for (let i = 0; i < PMAX; i++) pPos[i * 3 + 1] = -999;
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
    const points = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: .075, map: glowTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    points.frustumCulled = false; scene.add(points);
    let PALETTE = [0x00f2ff, 0xffffff, 0xff7d9d, 0xffe066, 0x7cffb2].map(c => new THREE.Color(c));
    let pCursor = 0;
    function confettiBurst(n = 140, ox = homeX) { for (let k = 0; k < n; k++) { const i = pCursor; pCursor = (pCursor + 1) % PMAX; const i3 = i * 3; pPos[i3] = ox; pPos[i3 + 1] = 1.4; pPos[i3 + 2] = .2; const a = Math.random() * Math.PI * 2, sp = 1 + Math.random() * 2; pVel[i3] = Math.cos(a) * sp; pVel[i3 + 1] = 2 + Math.random() * 3; pVel[i3 + 2] = Math.sin(a) * sp * .8; pLife[i] = 1.2 + Math.random() * .6; const c = PALETTE[(Math.random() * PALETTE.length) | 0]; pBase[i3] = c.r; pBase[i3 + 1] = c.g; pBase[i3 + 2] = c.b; SFX.pop(false, k % 6); } }
    function updateParticles(dt) { for (let i = 0; i < PMAX; i++) { if (pLife[i] <= 0) continue; const i3 = i * 3; pLife[i] -= dt; pVel[i3 + 1] -= 3.5 * dt; pVel[i3] *= (1 - .8 * dt); pVel[i3 + 2] *= (1 - .8 * dt); pPos[i3] += pVel[i3] * dt; pPos[i3 + 1] += pVel[i3 + 1] * dt; pPos[i3 + 2] += pVel[i3 + 2] * dt; const f = Math.max(Math.min(pLife[i], 1), 0); pCol[i3] = pBase[i3] * f; pCol[i3 + 1] = pBase[i3 + 1] * f; pCol[i3 + 2] = pBase[i3 + 2] * f; if (pLife[i] <= 0) { pPos[i3 + 1] = -999; pCol[i3] = pCol[i3 + 1] = pCol[i3 + 2] = 0; } } pGeo.attributes.position.needsUpdate = true; pGeo.attributes.color.needsUpdate = true; }

    /* ================= DOM helpers ================= */
    const _wp = new THREE.Vector3();
    function headScreen(dy = .6) { head.getWorldPosition(_wp); _wp.y += dy; _wp.project(camera); return { x: (_wp.x * .5 + .5) * 100, y: (-_wp.y * .5 + .5) * 100 }; }
    function worldToScreen(x, y) { _wp.set(x, y, 0).project(camera); return { x: (_wp.x * .5 + .5) * 100, y: (-_wp.y * .5 + .5) * 100 }; }
    function emojiPop(list, n = 8) { const arr = Array.isArray(list) ? list : [list]; const hs = headScreen(.5); for (let i = 0; i < n; i++) { const el = document.createElement('div'); el.className = 'float-emoji'; el.textContent = arr[(Math.random() * arr.length) | 0]; el.style.left = (hs.x + (Math.random() * 30 - 15)) + '%'; el.style.top = (hs.y + Math.random() * 8) + '%'; el.style.fontSize = (20 + Math.random() * 14) + 'px'; stage.appendChild(el); gsap.timeline({ onComplete: () => el.remove() }).fromTo(el, { y: 0, opacity: 0, scale: .4, rotation: Math.random() * 40 - 20 }, { y: -30, opacity: 1, scale: 1, duration: .35, ease: 'back.out(2)' }).to(el, { y: -150 - Math.random() * 80, opacity: 0, scale: 1.15, rotation: '+=30', duration: 1.1, ease: 'power1.out' }); } }
    function cryTears(dur = 1.6) { const t0 = performance.now(); (function spawn() { if (performance.now() - t0 > dur * 1000) return; [eyeRt, eyeLf].forEach(o => { if (Math.random() > .25) { o.g.getWorldPosition(_wp); _wp.z += .12; const v = _wp.project(camera); const el = document.createElement('div'); el.className = 'float-emoji'; el.textContent = '💧'; el.style.left = ((v.x * .5 + .5) * 100) + '%'; el.style.top = ((-v.y * .5 + .5) * 100) + '%'; el.style.fontSize = (12 + Math.random() * 9) + 'px'; stage.appendChild(el); gsap.timeline({ onComplete: () => el.remove() }).fromTo(el, { opacity: 0, scale: .5 }, { opacity: 1, scale: 1, duration: .12 }).to(el, { y: 150 + Math.random() * 70, x: Math.random() * 24 - 12, opacity: 0, duration: .9 + Math.random() * .5, ease: 'power2.in' }, 0); } }); setTimeout(spawn, 140); })(); }

    /* ================= STATE ================= */
    const S = { mx: 0, my: 0, hover: false, eyeScale: 1, pulseFreq: 1, expr: 'neutral', busy: false, covered: false, sitting: false, mode: 'idle', asleep: false, mood: 70, sneak: false, walkSpeed: 1.3 };
    const blink = { v: 1 }, wink = { v: 1 }, antWig = { v: 1 }, sleepEye = { v: 1 };
    let phase = 0, activeTL = null, tempT = 0, homeX = 1.1, walkT = 0, walkTarget = 0, walkCb = null, ballTimer = 0;
    let failCount = 0, comboCount = 0, comboT = 0, lastMove = performance.now(), wasIdle = false, hoverStart = 0;
    bot.position.x = homeX;

    function setExpr(e) { S.expr = e; [eyeRt, eyeLf].forEach(o => { o.oval.visible = (e === 'neutral' || e === 'surprise'); o.up.visible = (e === 'happy'); o.down.visible = (e === 'sad'); o.bar.visible = (e === 'angry'); o.heart.visible = (e === 'love'); o.dz.visible = (e === 'dizzy'); }); blushR.visible = blushL.visible = (e === 'happy' || e === 'love'); gsap.to(neck.rotation, { x: e === 'sad' ? .18 : 0, duration: .4, ease: 'power2.out' }); gsap.to(neck.rotation, { z: e === 'love' ? .15 : (e === 'angry' ? -.08 : 0), duration: .4 }); if (e === 'surprise') { gsap.to(S, { eyeScale: 1.5, duration: .25, ease: 'back.out(3)' }); S.pulseFreq = 2; } else { gsap.to(S, { eyeScale: 1, duration: .3 }); S.pulseFreq = e === 'sad' ? .6 : (e === 'love' ? 1.6 : (e === 'dizzy' || e === 'angry' ? 2 : 1)); } }
    function tempExpr(e, ms = 1400) { setExpr(e); clearTimeout(tempT); tempT = setTimeout(() => setExpr('neutral'), ms); }
    function doBlink() { gsap.timeline().to(blink, { v: .12, duration: .05, ease: 'power1.in' }).to(blink, { v: 1, duration: .05, ease: 'power1.out' }); }
    function doWink() { gsap.timeline().to(wink, { v: .1, duration: .09, ease: 'power1.in' }).to(wink, { v: 1, duration: .12, ease: 'power2.out', delay: .18 }); }
    (function sched() { setTimeout(() => { if (!S.asleep) doBlink(); sched(); }, 2200 + Math.random() * 3800); })();

    function say(txt, voice = true) { bubbleEl.textContent = txt; bubbleEl.classList.add('show'); clearTimeout(say._t); say._t = setTimeout(() => bubbleEl.classList.remove('show'), 2600); if (voice && audioOn) { const n = Math.min(6, 2 + (txt.length / 7 | 0)); for (let i = 0; i < n; i++) setTimeout(() => AudioSys.play('voice', () => AudioSys.tone(400 + Math.random() * 500, .05, 'square', .06)), i * 70); } }
    function quickTL() { S.busy = true; activeTL = gsap.timeline({ onComplete: () => { S.busy = false; activeTL = null; } }); return activeTL; }
    function resetPose(dur = .4) { gsap.to(armL.rotation, { x: 0, z: REST.L, duration: dur, ease: 'power2.out' }); gsap.to(armR.rotation, { x: 0, z: REST.R, duration: dur, ease: 'power2.out' }); gsap.to([legL.rotation, legR.rotation], { x: 0, duration: dur }); gsap.to(bot.rotation, { y: 0, z: 0, duration: dur }); gsap.to(bot.position, { y: 0, x: homeX, duration: dur }); gsap.to(neck.rotation, { x: 0, y: 0, z: 0, duration: dur }); gsap.to(body.scale, { x: 1, y: 1, z: 1, duration: dur }); }

    function applyBody(col) { BODYMATS.forEach(m => m.color.set(col)); try { localStorage.setItem('evo-body', col); } catch (e) {} }
    function applyGlow(col) { matGlow.emissive.set(col); GLOWMATS.forEach(m => m.emissive.set(col)); coreLight.color.set(col); GLOWS.forEach(m => m.color.set(col)); PALETTE = [new THREE.Color(col), new THREE.Color(0xffffff), new THREE.Color(0xff7d9d), new THREE.Color(0xffe066), new THREE.Color(0x7cffb2)]; try { localStorage.setItem('evo-glow', col); } catch (e) {} }
    root.querySelectorAll('#skins [data-body]').forEach(b => on(b, 'click', () => { applyBody(b.dataset.body); SFX.boop(); tempExpr('happy'); say('new fit!! 🤖✨'); }));
    root.querySelectorAll('#skins [data-glow]').forEach(b => on(b, 'click', () => { applyGlow(b.dataset.glow); SFX.boop(); tempExpr('happy'); say('NEON!! ⚡✨'); }));
    const skinsEl = root.querySelector('#skins');
    on(root.querySelector('#skins-toggle'), 'click', () => { skinsEl.classList.toggle('open'); SFX.boop(); });
    on(root.querySelector('#bodyPick'), 'input', e => applyBody(e.target.value));
    on(root.querySelector('#glowPick'), 'input', e => applyGlow(e.target.value));
    try { const sb = localStorage.getItem('evo-body'); if (sb) applyBody(sb); const sg = localStorage.getItem('evo-glow'); if (sg) applyGlow(sg); } catch (e) {}

    /* ================= ACTIONS ================= */
    function partReaction(part) { S.mood = Math.min(100, S.mood + 3); switch (part) {
      case 'antenna': tempExpr('surprise'); say('boop!! 📡✨'); emojiPop('✨', 4); SFX.boop(); gsap.fromTo(antWig, { v: .9 }, { v: 1, duration: 1.4, ease: 'elastic.out(1,0.25)' }); break;
      case 'head': tempExpr('happy'); doWink(); say('hehe~ 😊💙'); SFX.boop(); gsap.fromTo(neck.rotation, { z: -.18 }, { z: 0, duration: 1, ease: 'elastic.out(1,0.3)' }); break;
      case 'belly': if (S.busy) return; SFX.tickle(); comboCount = (performance.now() - comboT < 1200) ? comboCount + 1 : 1; comboT = performance.now(); if (comboCount >= 5) { comboCount = 0; comboEl.style.display = 'none'; say('NOO STOP I\'M TICKLISH!! 😂💀'); fallOver(true); return; } if (comboCount > 1) { comboEl.textContent = 'x' + comboCount + ' COMBO!'; comboEl.style.display = 'block'; gsap.fromTo(comboEl, { scale: .6 }, { scale: 1, duration: .3, ease: 'back.out(3)' }); } tempExpr('happy', 1600); say('hehehe TICKLES!! 😆💙'); emojiPop(['😂', '✨', '💙'], 4 + comboCount); quickTL().to(bot.rotation, { z: .08 + comboCount * .03, duration: .09, ease: 'power1.inOut', yoyo: true, repeat: 3 + comboCount }).to(bot.rotation, { z: 0, duration: .2 }); break;
      case 'pod': if (S.busy) return; tempExpr('happy', 2600); say('ooh nice tune!! 🎧'); emojiPop(['🎵', ''], 6); SFX.boop(); shadesOn(); gsap.fromTo([podRingR.scale, podRingL.scale], { x: 1, y: 1, z: 1 }, { x: 1.35, y: 1.35, z: 1.35, duration: .18, yoyo: true, repeat: 5 }); addDanceBeats(quickTL(), 0, 4); break;
      case 'armL': case 'armR': { if (S.busy) return; const arm = part === 'armL' ? armL : armR, side = part === 'armL' ? 1 : -1; tempExpr('happy'); say('high five!! 🖐️✨'); SFX.boop(); quickTL().to(arm.rotation, { z: side * 2.3, duration: .25, ease: 'back.out(2)' }).to(arm.rotation, { z: side * 1.7, duration: .14, ease: 'power1.inOut', yoyo: true, repeat: 3 }).to(arm.rotation, { z: side > 0 ? REST.L : REST.R, duration: .3, ease: 'power2.out' }); break; }
      case 'legL': case 'legR': { if (S.busy) return; const leg = part === 'legL' ? legL : legR; tempExpr('surprise'); say('whoa!! careful!! 😆'); SFX.hiccup(); quickTL().to(bot.position, { y: .08, duration: .12, ease: 'power2.out', yoyo: true, repeat: 1 }).to(leg.rotation, { x: -.6, duration: .12, ease: 'power1.inOut', yoyo: true, repeat: 3 }, 0).to(leg.rotation, { x: 0, duration: .2 }); break; } } }

    function shadesOn() { shades.visible = true; gsap.fromTo(shades.scale, { x: .3, y: .3, z: .3 }, { x: 1, y: 1, z: 1, duration: .3, ease: 'back.out(3)' }); }
    function shadesOff() { shades.visible = false; }
    function hatOn() { hat.visible = true; gsap.fromTo(hat.scale, { x: .2, y: .2, z: .2 }, { x: 1, y: 1, z: 1, duration: .4, ease: 'back.out(3)' }); setTimeout(() => { hat.visible = false; }, 6000); }

    function wave() { if (S.busy || S.covered || S.asleep) return; S.busy = true; setExpr('happy'); doWink(); SFX.boop(); say(['Hello hello! 👋✨', 'Hi hi hi! 😄👋', 'Heyyy friend! 🤖'][(Math.random() * 3) | 0]); activeTL = gsap.timeline({ onComplete: () => { S.busy = false; activeTL = null; setExpr('neutral'); } }).to(armR.rotation, { z: -2.35, x: 0, duration: .45, ease: 'back.out(2.5)' }).to(neck.rotation, { z: .18, duration: .35, ease: 'power2.out' }, '<').to(armR.rotation, { z: -2.05, duration: .16, ease: 'power1.inOut', yoyo: true, repeat: 5 }).to(armR.rotation, { z: REST.R, duration: .5, ease: 'back.out(1.6)' }).to(neck.rotation, { z: 0, duration: .4, ease: 'power2.out' }, '<'); }

    function addDanceBeats(tl, start, beats) { const b = 60 / 112; tl.call(() => shadesOn(), null, start); tl.to(armL.rotation, { z: 2.2, duration: .25, ease: 'back.out(2)' }, start).to(armR.rotation, { z: -2.2, duration: .25, ease: 'back.out(2)' }, start); for (let i = 0; i < beats; i++) { const t0 = start + .3 + i * b, L = i % 2 === 0; tl.to(legL.rotation, { x: L ? -.5 : 0, duration: b / 2, ease: 'power1.out', yoyo: true, repeat: 1 }, t0).to(legR.rotation, { x: L ? 0 : -.5, duration: b / 2, ease: 'power1.out', yoyo: true, repeat: 1 }, t0).to(bot.rotation, { z: L ? .1 : -.1, duration: b / 2, ease: 'power1.inOut', yoyo: true, repeat: 1 }, t0).to(armL.rotation, { z: L ? 2.5 : 1.9, duration: b / 2, ease: 'power1.inOut', yoyo: true, repeat: 1 }, t0).to(armR.rotation, { z: L ? -1.9 : -2.5, duration: b / 2, ease: 'power1.inOut', yoyo: true, repeat: 1 }, t0).to(neck.rotation, { x: .12, duration: b / 2, ease: 'power1.inOut', yoyo: true, repeat: 1 }, t0); } const end = start + .3 + beats * b; tl.call(shadesOff, null, end); tl.to(armL.rotation, { z: REST.L, duration: .4, ease: 'power2.out' }, end).to(armR.rotation, { z: REST.R, duration: .4, ease: 'power2.out' }, end).to(bot.rotation, { z: 0, duration: .4 }, end).to(neck.rotation, { x: 0, duration: .4 }, end); }
    function dance(force = false) { if (S.covered || S.asleep || S.mode !== 'idle') return; if (S.busy && !force) return; if (force && activeTL) { activeTL.kill(); resetPose(.25); } S.busy = true; setExpr('happy'); emojiPop(['🎵', '', '✨'], 6); activeTL = gsap.timeline({ onComplete: () => { S.busy = false; activeTL = null; setExpr('neutral'); } }); addDanceBeats(activeTL, 0, 8); }

    function addExcitedJump(tl, s) { const e = 1 + (S.mood - 50) / 250; tl.to(bot.position, { y: -.12, duration: .22, ease: 'power2.in' }, s).to(body.scale, { y: .9, x: 1.07, z: 1.07, duration: .22 }, s).to(bot.position, { y: .6 * e, duration: .32, ease: 'power2.out' }, s + .22).to(body.scale, { y: 1.07, x: .95, z: .95, duration: .18 }, s + .22).to(armL.rotation, { z: 2.4, duration: .3, ease: 'back.out(2)' }, s + .22).to(armR.rotation, { z: -2.4, duration: .3, ease: 'back.out(2)' }, s + .22).to(bot.position, { y: 0, duration: .28, ease: 'power2.in' }, s + .56).to(body.scale, { y: .88, x: 1.1, z: 1.1, duration: .12 }, s + .84).to(body.scale, { y: 1, x: 1, z: 1, duration: .18 }, s + .96).to(bot.position, { y: .9 * e, duration: .38, ease: 'power2.out' }, s + 1.15).to(bot.rotation, { y: '+=6.2832', duration: .7, ease: 'power1.inOut' }, s + 1.1).to(bot.position, { y: 0, duration: .4, ease: 'bounce.out' }, s + 1.55).to(armL.rotation, { z: REST.L, duration: .4 }, s + 1.9).to(armR.rotation, { z: REST.R, duration: .4 }, s + 1.9); return s + 2.0; }
    function celebrate() { if (S.busy || S.covered || S.asleep || S.mode !== 'idle') return; S.busy = true; S.mood = Math.min(100, S.mood + 15); failCount = 0; setExpr('happy'); hatOn(); SFX.jingle(); say('Yay!! Welcome! 🎉'); emojiPop(['🎉', '', '❤️', '⚡', '✨'], 12); confettiBurst(160); activeTL = gsap.timeline({ onComplete: () => { S.busy = false; activeTL = null; setExpr('neutral'); } }); const end = addExcitedJump(activeTL, 0); activeTL.call(() => confettiBurst(80), null, 1.2); addDanceBeats(activeTL, end + .1, 8); }

    function error() { S.mood = Math.max(0, S.mood - 10); failCount++; if (failCount >= 3) { say('maybe… forgot password? 👉'); fallOver(false); return; } setExpr('sad'); cryTears(1.6 + failCount * .5); SFX.womp(); say(failCount === 1 ? 'Aww nooo 🥺 check it again?' : 'really?? 🥺💔 try try again!'); gsap.timeline({ onComplete: () => setExpr('neutral') }).to(neck.rotation, { y: -.3, duration: .09, ease: 'power1.inOut', yoyo: true, repeat: 3 }).to(neck.rotation, { y: 0, duration: .2 }); }

    let clickTimes = [];
    function annoyed() { setExpr('angry'); say('hey!! stop poking me!! 😤'); emojiPop('💢', 4); SFX.hiccup(); gsap.timeline().to(bot.position, { y: .12, duration: .12, ease: 'power2.out', yoyo: true, repeat: 1 }).to(bot.position, { y: .12, duration: .12, ease: 'power2.out', yoyo: true, repeat: 1 }); setTimeout(() => { if (S.expr === 'angry') setExpr('neutral'); }, 1600); }
    function fallOver(laughing = false) { if (S.busy || S.mode !== 'idle') return; S.busy = true; S.sitting = false; setExpr(laughing ? 'happy' : 'dizzy'); SFX.womp(); say(laughing ? 'I\'m dying!! 😂' : 'whoaaa!! 😵💫'); emojiPop(laughing ? '😂' : '💫', 5); activeTL = gsap.timeline({ onComplete: () => { S.busy = false; activeTL = null; setExpr('neutral'); } }).to([legL.rotation, legR.rotation], { x: 0, duration: .2 }, 0).to(bot.rotation, { z: -1.45, duration: .55, ease: 'power2.in' }, 0).to(bot.position, { y: -.22, x: homeX + 1.15, duration: .55, ease: 'power2.in' }, 0).to(bot.position, { y: -.26, duration: .12, ease: 'bounce.out' }, .55).to({}, { duration: 1.5 }).call(() => say(laughing ? "ok ok I'm up!! 😂" : "i'm okay!! 😵💫️", false)).to(bot.rotation, { z: 0, duration: .7, ease: 'elastic.out(1,0.5)' }).to(bot.position, { y: 0, x: homeX, duration: .7, ease: 'power2.out' }, '<').to(neck.rotation, { y: -.3, duration: .08, yoyo: true, repeat: 3 }).to(neck.rotation, { y: 0, duration: .15 }); }

    function sit() { if (S.busy || S.mode !== 'idle') return; S.sitting = true; say('comfy~ 🪑✨'); SFX.boop(); gsap.timeline().to(bot.position, { y: -.34, duration: .4, ease: 'power2.inOut' }).to([legL.rotation, legR.rotation], { x: -1.45, duration: .4, ease: 'power2.inOut' }, '<'); }
    function stand() { if (S.busy || S.mode !== 'idle') return; S.sitting = false; gsap.timeline().to([legL.rotation, legR.rotation], { x: 0, duration: .35, ease: 'power2.inOut' }).to(bot.position, { y: 0, duration: .35, ease: 'power2.inOut' }, '<'); }

    function setCoverOverlay(on) { [armL, armR].forEach(a => { (a.userData.coverParts || []).forEach(m => { m.material.depthTest = !on; m.renderOrder = on ? 60 : 0; }); }); }
    function coverEyes() { if (S.covered || S.mode !== 'idle') return; if (activeTL) { activeTL.kill(); activeTL = null; S.busy = false; } S.covered = true; setCoverOverlay(true); say("I can't peek!! 🙈"); gsap.timeline().to(armL.rotation, { x: -2.15, z: -.45, duration: .45, ease: 'back.out(1.8)' }).to(armR.rotation, { x: -2.15, z: .45, duration: .45, ease: 'back.out(1.8)' }, '<').to(neck.rotation, { z: .22, duration: .35, ease: 'power2.out' }, '>+.5'); }
    function uncoverEyes() { if (!S.covered) return; S.covered = false; setTimeout(() => { if (!S.covered) setCoverOverlay(false); }, 500); setExpr('happy'); say('phew!! all done? 👀✨'); gsap.timeline({ onComplete: () => setExpr('neutral') }).to(armL.rotation, { x: 0, z: REST.L, duration: .45, ease: 'power2.out' }).to(armR.rotation, { x: 0, z: REST.R, duration: .45, ease: 'power2.out' }, '<').to(neck.rotation, { z: 0, duration: .4 }, '<'); }

    function startWalk(target, cb, speed = 1.3) { if (Math.abs(target - bot.position.x) < .05) { if (cb) cb(); return; } S.mode = 'walk'; S.busy = true; walkTarget = target; walkCb = cb; walkT = 0; S.walkSpeed = speed; }
    function sneakPose(on) { S.sneak = on; gsap.to(neck.rotation, { z: on ? .15 : 0, duration: .3 }); }
    function finishAction(msg) { S.mode = 'idle'; S.busy = false; S.sneak = false; resetPose(.4); setExpr('happy'); say(msg); gsap.fromTo(bot.position, { y: 0 }, { y: .25, duration: .22, ease: 'power2.out', yoyo: true, repeat: 1, delay: .4 }); setTimeout(() => setExpr('neutral'), 1400); }

    const ray = new THREE.Raycaster();
    const hoverNDC = new THREE.Vector2(), clickNDC = new THREE.Vector2();
    const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const carryTarget = new THREE.Vector3(), vel = new THREE.Vector3(), ballVel = new THREE.Vector3();
    let pDown = false, downX = 0, downY = 0, downT = 0, petting = false, pendingPart = null;
    function startCarry() { pDown = false; petting = false; wakeIfAsleep(); if (activeTL) { activeTL.kill(); activeTL = null; } S.busy = true; S.mode = 'carry'; S.sitting = false; S.sneak = false; resetPose(.25); setExpr('surprise'); say('wheee!! picked up?! 👀✨'); SFX.wheee(); gsap.to(armL.rotation, { z: 2.5, duration: .3, ease: 'back.out(2)' }); gsap.to(armR.rotation, { z: -2.5, duration: .3, ease: 'back.out(2)' }); setTimeout(() => { if (S.mode === 'carry') setExpr('happy'); }, 900); vel.set(0, 0, 0); document.body.style.cursor = 'grabbing'; }
    function drop() { S.mode = 'fall'; setExpr('surprise'); say('wheeee!! 😆'); vel.x = THREE.MathUtils.clamp(vel.x, -3, 3); vel.y = THREE.MathUtils.clamp(vel.y, -1, 4); S.mood = Math.min(100, S.mood + 5); }

    function fetch() { if (S.busy || S.mode !== 'idle' || S.covered || S.asleep) return; clearTimeout(ballTimer); S.busy = true; setExpr('happy'); say('fetch time!! 🎾✨'); SFX.boop(); ball.visible = true; ball.scale.set(1, 1, 1); ball.position.set(bot.position.x, 1.2, .3); ballVel.set((Math.random() < .5 ? -1 : 1) * (2 + Math.random() * 2), 3, 0); S.mode = 'fetchThrow'; }
    function fetchPick() { ball.visible = false; SFX.boop(); say('got it!! 😆'); startWalk(homeX, () => { ball.visible = true; ball.position.set(homeX + .45, .07, .3); finishAction('again!! again!! 🎾'); ballTimer = setTimeout(() => { gsap.to(ball.scale, { x: 0, y: 0, z: 0, duration: .45, ease: 'power1.in', onComplete: () => { ball.visible = false; ball.scale.set(1, 1, 1); } }); }, 5000); }); }

    function peekaboo() { if (S.busy || S.mode !== 'idle' || S.asleep) return; S.busy = true; say('hiding… 🙈'); startWalk(homeX + 2.6, () => { setTimeout(() => { gsap.to(bot.position, { x: homeX + 1.55, duration: .35, ease: 'back.out(2)' }); setExpr('happy'); say('boo!! 👻'); SFX.startled(); emojiPop('👻', 3); setTimeout(() => { sneakPose(true); startWalk(homeX, () => { sneakPose(false); finishAction('hehe~ 👻💙'); }, 0.55); }, 700); }, 500); }, 2.4); }

    function doSleep() { if (S.asleep || S.mode !== 'idle') return; S.asleep = true; say('zzz… 💤', false); SFX.yawn(true); gsap.to(sleepEye, { v: .12, duration: .5 }); gsap.to(neck.rotation, { x: .12, duration: .6 }); snot.visible = true; }
    function wakeIfAsleep() { if (!S.asleep) return false; S.asleep = false; gsap.to(neck.rotation, { x: 0, duration: .3 }); gsap.to(sleepEye, { v: 1, duration: .3 }); gsap.fromTo(snot.scale, { x: 1, y: 1, z: 1 }, { x: 1.6, y: 1.6, z: 1.6, duration: .12, onComplete: () => { snot.visible = false; snot.scale.set(1, 1, 1); } }); setExpr('surprise'); SFX.startled(); say('wha-?! I wasn\'t sleeping!! 😱'); gsap.fromTo(bot.position, { y: bot.position.y }, { y: '+=.3', duration: .25, ease: 'power2.out', yoyo: true, repeat: 1 }); return true; }

    let sweatI = 0;
    function startVerify(dur, cb) { if (S.busy || S.mode !== 'idle') return; S.busy = true; S.mode = 'verify'; setExpr('angry'); say('verifying… hnnng!! 💦'); pbarEl.style.display = 'block'; pfillEl.style.width = '0%'; rope.visible = true; gsap.to(armL.rotation, { x: -1.45, z: -.4, duration: .4 }); gsap.to(armR.rotation, { x: -1.45, z: .4, duration: .4 }); gsap.to(bot.rotation, { z: -.15, duration: .4 }); gsap.to([legL.rotation, legR.rotation], { x: .35, duration: .4 }); gsap.to(bot.position, { x: homeX + .15, duration: .3, yoyo: true, repeat: Math.round(dur / .3), ease: 'power1.inOut' }); gsap.to(pfillEl, { width: '100%', duration: dur, ease: 'none' }); sweatI = setInterval(() => emojiPop('💦', 1), 500); setTimeout(() => { clearInterval(sweatI); rope.visible = false; pbarEl.style.display = 'none'; S.mode = 'idle'; S.busy = false; resetPose(.4); cb(); }, dur * 1000 + 200); }

    function randomEvent() { const r = Math.random(); if (r < .34) { setExpr('surprise'); say('ah… ah… ACHOO!! 🤧', false); SFX.sneeze(true); gsap.timeline().to(neck.rotation, { x: -.15, duration: .4 }).to(neck.rotation, { x: .3, duration: .08 }).to(neck.rotation, { x: 0, duration: .5, ease: 'elastic.out(1,.4)' }); gsap.fromTo(antWig, { v: 1.4 }, { v: 1, duration: 1, ease: 'elastic.out(1,.25)' }); emojiPop('💨', 4); setTimeout(() => setExpr('neutral'), 1200); } else if (r < .67) { SFX.hiccup(true); say('hic!! 😳', false); gsap.fromTo(bot.position, { y: 0 }, { y: .12, duration: .12, ease: 'power2.out', yoyo: true, repeat: 1 }); tempExpr('surprise', 900); } else { SFX.yawn(true); say('*yawn* 🥱', false); gsap.fromTo(sleepEye, { v: 1 }, { v: .15, duration: .3, yoyo: true, repeat: 1 }); gsap.fromTo(neck.rotation, { z: 0 }, { z: .2, duration: .4, yoyo: true, repeat: 1 }); } }
    (function evSched() { setTimeout(() => { if (S.mode === 'idle' && !S.busy && !S.asleep && !S.covered) randomEvent(); evSched(); }, 18000 + Math.random() * 14000); })();

    let bfState = 'hidden', bfT = 0, bfPerchT = 0, bfAttempts = 0, bfDodgeT = 0;
    (function bfSched() { setTimeout(() => { if (bfState === 'hidden' && !S.asleep) { bfState = 'fly'; bfT = 0; bfAttempts = 0; bf.visible = true; bf.position.set(-3, 1.6 + Math.random() * .8, .4); } bfSched(); }, 20000 + Math.random() * 18000); })();
    function catchAttempt() { if (S.busy) return; quickTL().to(bot.position, { y: -.1, duration: .15, ease: 'power2.in' }).to(bot.position, { y: .7, duration: .3, ease: 'power2.out' }).to(armL.rotation, { z: 2.6, duration: .2, ease: 'power2.out' }, '<').to(armR.rotation, { z: -2.6, duration: .2, ease: 'power2.out' }, '<').to(bot.position, { x: THREE.MathUtils.clamp(bf.position.x, -2, 2) * .4 + bot.position.x * .6, duration: .3 }, '<').call(() => { say('gotcha!! 😆', false); bfState = 'dodge'; bfDodgeT = 0; }).to(bot.position, { y: 0, duration: .35, ease: 'bounce.out' }).to([armL.rotation, armR.rotation], { z: REST.L, duration: .3 }).to(armR.rotation, { z: REST.R, duration: .3 }, '<'); }
    function bfUpdate(dt, t) { if (bfState === 'fly') { bfT += dt; bf.position.x += dt * .9; bf.position.y = 1.7 + Math.sin(bfT * 3) * .35; bf.position.z = .4; const f = Math.sin(t * 22) * .9; wingR.rotation.y = f; wingL.rotation.y = f; if (Math.random() < .002) SFX.flap(true); if (!S.busy && S.mode === 'idle' && bfAttempts < 2 && Math.abs(bf.position.x - bot.position.x) < .7 && Math.random() < .02) { bfAttempts++; catchAttempt(); } if (bfAttempts >= 2 && bf.position.x > bot.position.x + .5 && Math.random() < .02) bfState = 'toPerch'; if (bf.position.x > 3.2) { bfState = 'hidden'; bf.visible = false; } } else if (bfState === 'dodge') { bfDodgeT += dt; bf.position.y += dt * 1.6; bf.position.x += dt * .9; const f = Math.sin(t * 30) * 1.1; wingR.rotation.y = f; wingL.rotation.y = f; if (bfDodgeT > .7) bfState = 'fly'; } else if (bfState === 'toPerch') { const tip = tipL.getWorldPosition(new THREE.Vector3()); tip.y += .06; bf.position.lerp(tip, dt * 4); const f = Math.sin(t * 22) * .9; wingR.rotation.y = f; wingL.rotation.y = f; if (bf.position.distanceTo(tip) < .05) { bfState = 'perch'; bfPerchT = 0; tempExpr('love', 4200); say('a friend!! 🦋💗', false); } } else if (bfState === 'perch') { bfPerchT += dt; const f = Math.sin(t * 6) * .25; wingR.rotation.y = f; wingL.rotation.y = f; if (bfPerchT > 4) { bfState = 'fly'; bfAttempts = 2; } } }

    /* ================= POINTER ================= */
    const IDLE = { tired: ['so sleepy… 🥱', '*yawn* 🥱', 'five more minutes… 😴'], norm: ['you still there? 👀✨', 'boop me! 🤖', '…or drag me around! 🖐️', '*whistles softly* 🎶'], hype: ['BEST DAY EVER!! 🤩', 'wanna dance!! 🕺✨', 'I love you!! 💙'] };
    function canvasNDC(e, out) { const r = renderer.domElement.getBoundingClientRect(); out.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); }

    on(window, 'pointermove', e => { const moved = Math.hypot(e.movementX || 0, e.movementY || 0); if (S.asleep && moved > 30) wakeIfAsleep(); S.mx = (e.clientX / innerWidth) * 2 - 1; S.my = 1 - (e.clientY / innerHeight) * 2; canvasNDC(e, hoverNDC); lastMove = performance.now(); if (pDown && S.mode === 'idle' && Math.hypot(e.clientX - downX, e.clientY - downY) > 10) startCarry(); });
    on(window, 'pointerdown', e => { if (e.button !== 0) return; if (e.target.closest('#emote-wheel')) return; hideWheel(); if (e.target.closest('input,button,a,select,textarea,label')) return; canvasNDC(e, clickNDC); ray.setFromCamera(clickNDC, camera); const hits = ray.intersectObjects(hitMeshes, false); if (!hits.length) return; if (wakeIfAsleep()) return; if (S.covered) { say("I said I can't look!! 🙈💢"); return; } if (scrollWalk && S.mode === 'walk') { S.mode = 'idle'; S.busy = false; scrollWalk = false; walkCb = null; resetPose(.3); } if (S.mode !== 'idle') return; pDown = true; downX = e.clientX; downY = e.clientY; downT = performance.now(); pendingPart = partOf(hits[0].object); });
    on(window, 'pointerup', e => { if (S.mode === 'carry') drop(); if (petting) { petting = false; if (S.expr === 'love') setExpr('neutral'); } else if (pDown && S.mode === 'idle') { const now = performance.now(); clickTimes.push(now); clickTimes = clickTimes.filter(t => now - t < 2000); if (clickTimes.length >= 6) { clickTimes = []; fallOver(false); } else if (clickTimes.length === 4) annoyed(); else if (!S.busy) partReaction(pendingPart); } pDown = false; if (S.mode === 'idle') document.body.style.cursor = S.hover ? 'grab' : ''; });
    on(window, 'dblclick', e => { if (e.target.closest('input,button,a,select,textarea,label') || S.covered || S.mode !== 'idle') return; canvasNDC(e, clickNDC); ray.setFromCamera(clickNDC, camera); if (ray.intersectObjects(hitMeshes, false).length) dance(true); });
    on(window, 'contextmenu', e => { canvasNDC(e, clickNDC); ray.setFromCamera(clickNDC, camera); if (ray.intersectObjects(hitMeshes, false).length) e.preventDefault(); });

    function showWheel() { const hs = headScreen(1.7); wheelEl.style.display = 'block'; wheelEl.style.left = hs.x + '%'; wheelEl.style.top = '86px'; [...wheelEl.children].forEach((b, i) => { const a = (i / 7) * Math.PI * 2 - Math.PI / 2; b.style.left = Math.cos(a) * 92 + 'px'; b.style.top = Math.sin(a) * 42 + 'px'; }); }
    function hideWheel() {}
    on(wheelEl, 'click', e => { const act = e.target.dataset?.act; hideWheel(); if (!act) return; if (scrollWalk && S.mode === 'walk') { S.mode = 'idle'; S.busy = false; scrollWalk = false; walkCb = null; resetPose(.3); } ({ wave, dance: () => dance(true), sit: () => S.sitting ? stand() : sit(), love: () => { tempExpr('love', 2000); say('💗💗'); }, fetch, peek: peekaboo, sleep: doSleep }[act]?.()); });

    /* password strength meter (called from AuthPage via Bot.strength) */
    function strength(v) { let s = 0; if (v.length >= 4) s++; if (v.length >= 8) s++; if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++; if (/\d/.test(v) || /[^A-Za-z0-9]/.test(v)) s++; return Math.min(4, s); }
    const MCOL = ['#ff5d7d', '#ffb35c', '#ffe066', '#7cffb2'];
    function showStrength(v) { if (!v) { meterEl.style.display = 'none'; return; } meterEl.style.display = 'flex'; const sc = strength(v); [...meterEl.children].forEach((el, i) => { el.style.background = i < sc ? MCOL[sc - 1] : 'rgba(255,255,255,.15)'; }); if (sc <= 1) gsap.to(neck.rotation, { x: .15, duration: .3 }); else if (sc === 4) { emojiPop('💪', 2); gsap.fromTo(body.scale, { x: 1, y: 1, z: 1 }, { x: 1.06, y: 1.06, z: 1.06, duration: .2, yoyo: true, repeat: 1 }); } else gsap.to(neck.rotation, { x: 0, duration: .3 }); }
    function hideStrength() { meterEl.style.display = 'none'; }
    function capsWarn() { tempExpr('surprise', 2000); say('CAPS LOCK is on!! 👀⌨️'); SFX.startled(); }

    let camX = 0, viewL = -2.6, viewR = 2.6, pxToWorld = .002, centered = false, followY = 0, scrollWalk = false;
        function resize() {
      const rect = stage.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
      const fixed = getComputedStyle(stage).position === 'fixed';
      camera.position.z = camera.aspect < 0.9 ? 6.9 : 6.3;
      const W = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z * camera.aspect;
      camX = fixed ? 0.72 * W : 0;
      viewL = camX - W + .6; viewR = camX + W - .6;
      pxToWorld = (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z) / rect.height;
      camera.position.x = camX;
      camera.lookAt(camX, 1.3, 0);
      homeX = 0;
      if (S.mode === 'idle' && !S.busy && !centered) bot.position.x = homeX;
    }
    on(window, 'resize', resize); resize();

    /* ================= MAIN LOOP ================= */
const timer = new THREE.Timer();
const D = THREE.MathUtils.damp;
let zzzT = 0;
renderer.setAnimationLoop(() => {
                setSceneReady(true);   // ✅ UI controls appear only with a live scene

  timer.update();
  const dt = Math.min(timer.getDelta(), .05), t = timer.getElapsed();

      const sy = window.scrollY || 0;
      if (!centered && sy > 300 && S.mode === 'idle' && !S.busy) { centered = true; scrollWalk = true; startWalk(camX, () => { scrollWalk = false; }); }
      else if (centered && sy < 40 && S.mode === 'idle' && !S.busy) { centered = false; scrollWalk = true; startWalk(homeX, () => { scrollWalk = false; }); }
      const targetY = centered ? .45 : Math.min(sy, 240) * pxToWorld;
      scrollG.position.y = D(scrollG.position.y, targetY, 5, dt);
      if (S.mode === 'idle' && !S.busy) bot.rotation.z = D(bot.rotation.z, 0, 6, dt);
      S.mood = Math.max(0, S.mood - dt * .12);
      const bobAmp = .04 + (S.mood / 100) * .03;
      body.position.y = Math.sin(t * 1.6) * bobAmp * (S.asleep ? .5 : 1);
      phase += dt * S.pulseFreq * Math.PI;
      const p = (Math.sin(phase) + 1) / 2;
      const dim = S.asleep ? .5 : 1;
      matGlow.emissiveIntensity = (2.4 + p * 1.6) * dim;
      coreLight.intensity = (1 + p * 1.6) * dim;
      coreGlow.material.opacity = (.45 + p * .4) * dim;
      const idle = performance.now() - lastMove > 5000;
      if (idle && !wasIdle && !S.asleep) { const list = S.mood < 35 ? IDLE.tired : (S.mood > 75 ? IDLE.hype : IDLE.norm); say(list[(Math.random() * list.length) | 0], false); }
      wasIdle = idle;
      if (!S.asleep && S.mode === 'idle' && !S.busy && performance.now() - lastMove > (S.mood < 40 ? 12000 : 22000)) doSleep();
      if (S.asleep) { zzzT += dt; if (zzzT > 1.6) { zzzT = 0; emojiPop('💤', 1); } const ss = .4 + ((Math.sin(t * 1.5) + 1) / 2) * .8; snot.scale.set(ss, ss, ss); }
      let tx = idle ? Math.sin(t * .45) * .22 : S.mx, ty = idle ? Math.sin(t * .30) * .15 : S.my;
      if (bf.visible && bfState !== 'hidden') { const d = bf.position.clone().sub(head.getWorldPosition(new THREE.Vector3())); tx = THREE.MathUtils.clamp(d.x * .8, -1, 1); ty = THREE.MathUtils.clamp(d.y * .8, -1, 1); }
      head.rotation.y = D(head.rotation.y, tx * .18, 6, dt);
      head.rotation.x = D(head.rotation.x, -ty * .12, 6, dt);
      head.rotation.z = D(head.rotation.z, -tx * .02, 6, dt);
      eyesGroup.position.x = D(eyesGroup.position.x, tx * .05, 8, dt);
      eyesGroup.position.y = D(eyesGroup.position.y, ty * .04, 8, dt);
      body.rotation.y = D(body.rotation.y, tx * .03 + 0.4, 4, dt);
      const eyeY = (S.asleep ? sleepEye.v : 1) * blink.v;
      eyeRt.g.scale.set(S.eyeScale, S.eyeScale * eyeY, S.eyeScale);
      eyeLf.g.scale.set(S.eyeScale, S.eyeScale * eyeY * wink.v, S.eyeScale);
      antR.rotation.x = Math.sin(t * 2.1) * .06 + (antWig.v - 1);
      antL.rotation.x = Math.sin(t * 2.1 + 1) * .06 + (antWig.v - 1) * .8;
      if (S.expr === 'dizzy') { eyeRt.dz.rotation.z = t * 9; eyeLf.dz.rotation.z = -t * 9; }
      if (S.expr === 'love') { const hs = 1 + Math.sin(t * 7) * .18; eyeRt.heart.scale.set(hs, hs, hs); eyeLf.heart.scale.set(hs, hs, hs); }
      if (S.mode === 'carry') { ray.setFromCamera(hoverNDC, camera); if (ray.ray.intersectPlane(planeZ, carryTarget)) { const nx = THREE.MathUtils.clamp(carryTarget.x, viewL, viewR); const ny = THREE.MathUtils.clamp(Math.max(.25, carryTarget.y), .25, 2.7); vel.x = D(vel.x, (nx - bot.position.x) * 10, 8, dt); vel.y = D(vel.y, (ny - bot.position.y) * 10, 8, dt); bot.position.x = D(bot.position.x, nx, 14, dt); bot.position.y = D(bot.position.y, ny, 14, dt); bot.rotation.z = D(bot.rotation.z, THREE.MathUtils.clamp(-vel.x * .05, -.4, .4), 6, dt); legL.rotation.x = Math.sin(t * 6) * .15; legR.rotation.x = Math.sin(t * 6 + 1.5) * .15; } if (pDown && !petting && performance.now() - downT > 700) { petting = true; S.mood = Math.min(100, S.mood + 8); setExpr('love'); say("hehe that's nice~ 🥰💗"); } }
      else if (S.mode === 'fall') { vel.y -= 9.5 * dt; bot.position.x += vel.x * dt; bot.position.y += vel.y * dt; bot.rotation.z = D(bot.rotation.z, THREE.MathUtils.clamp(vel.x * .06, -.5, .5), 4, dt); if (bot.position.y <= 0 && vel.y < 0) { bot.position.y = 0; if (Math.abs(vel.y) > 2) { vel.y *= -.38; vel.x *= .6; SFX.pop(); gsap.fromTo(body.scale, { y: .8, x: 1.15, z: 1.15 }, { y: 1, x: 1, z: 1, duration: .4, ease: 'elastic.out(1,.5)' }); emojiPop('💨', 3); } else { SFX.pop(); gsap.fromTo(body.scale, { y: .85, x: 1.12, z: 1.12 }, { y: 1, x: 1, z: 1, duration: .5, ease: 'elastic.out(1,.5)' }); if (Math.abs(bot.position.x - homeX) > .08) startWalk(homeX, () => finishAction('back home! 🏠💙')); else finishAction('that was fun!! 😆✨'); } } }
      else if (S.mode === 'walk') { walkT += dt * (5 + S.walkSpeed * 2.5); const dir = Math.sign(walkTarget - bot.position.x); bot.position.x += dir * S.walkSpeed * dt; const s = Math.sin(walkT); legL.rotation.x = s * .5; legR.rotation.x = -s * .5; armL.rotation.z = (S.sneak ? 1.1 : REST.L) - s * .4; armR.rotation.z = (S.sneak ? -1.1 : REST.R) + s * .4; bot.rotation.z = s * .07;       if (dir === 0 || (dir > 0 && bot.position.x >= walkTarget) || (dir < 0 && bot.position.x <= walkTarget)) { bot.position.x = walkTarget; S.mode = 'idle'; S.busy = false; resetPose(.3); if (walkCb) { const cb = walkCb; walkCb = null; cb(); } } }
      else if (S.mode === 'fetchThrow') { ballVel.y -= 9.5 * dt; ball.position.addScaledVector(ballVel, dt); if (ball.position.y < .09 && ballVel.y < 0) { ball.position.y = .09; ballVel.y *= -.5; ballVel.x *= .7; SFX.pop(); if (Math.abs(ballVel.y) < .6 && Math.abs(ballVel.x) < .3) startWalk(ball.position.x, fetchPick); } }
      else if (S.mode === 'verify') { const a = new THREE.Vector3(homeX - 1.4, .95, 0); const h = new THREE.Vector3(bot.position.x - .45, 1.05, .25); const dirv = h.clone().sub(a); rope.scale.set(1, dirv.length(), 1); rope.position.copy(a).addScaledVector(dirv, .5); rope.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirv.normalize()); }
      if (S.mode !== 'idle') shadow.position.x = bot.position.x; else shadow.position.x = D(shadow.position.x, homeX, 6, dt);
      shadow.material.opacity = Math.max(.08, Math.min(.5, .4 - bot.position.y * .22));
      shadow.scale.setScalar(Math.max(.4, 1 - bot.position.y * .18));
      updateParticles(dt);
      bfUpdate(dt, t);
      if (performance.now() - comboT > 1500 && comboCount > 0) { comboCount = 0; comboEl.style.display = 'none'; }
      if (bubbleEl.classList.contains('show')) { const hs = headScreen(.65); bubbleEl.style.left = hs.x + '%'; bubbleEl.style.top = hs.y + '%'; }
      if (pbarEl.style.display === 'block') { const ps = worldToScreen(homeX - .7, 1.95); pbarEl.style.left = ps.x + '%'; pbarEl.style.top = ps.y + '%'; }
      if (meterEl.style.display === 'flex') { const ms = headScreen(.95); meterEl.style.left = ms.x + '%'; meterEl.style.top = ms.y + '%'; }
      if (comboEl.style.display === 'block') { const cs = headScreen(1.1); comboEl.style.left = cs.x + '%'; comboEl.style.top = cs.y + '%'; }
      if (!S.asleep && S.mode === 'idle') { ray.setFromCamera(hoverNDC, camera); const hov = ray.intersectObjects(hitMeshes, false).length > 0; if (hov !== S.hover) { S.hover = hov; hoverStart = hov ? performance.now() : 0; document.body.style.cursor = hov ? 'grab' : ''; if (hov && !S.busy && !S.covered) { setExpr('happy'); gsap.fromTo(body.scale, { x: 1, y: 1, z: 1 }, { x: 1.04, y: 1.04, z: 1.04, duration: .25, yoyo: true, repeat: 1 }); } else if (!hov && S.expr !== 'love') setExpr('neutral'); } if (S.hover && !S.covered && !S.busy && hoverStart && performance.now() - hoverStart > 2500 && S.expr !== 'love') { setExpr('love'); emojiPop(['💗', ''], 6); say('…you\'re staring!! 💗'); } }
      renderer.render(scene, camera);
    });

    window.Bot = { wave, dance, celebrate, error, say, sit, stand, fetch, peekaboo, coverEyes, uncoverEyes, tears: () => cryTears(1.8), fall: () => fallOver(false), confetti: () => confettiBurst(160), verify: startVerify, applyBody, applyGlow, strength: showStrength, hideStrength, capsWarn, happy: () => setExpr('happy'), sad: () => setExpr('sad'), love: () => setExpr('love'), dizzy: () => setExpr('dizzy'), angry: () => setExpr('angry'), surprise: () => setExpr('surprise'), neutral: () => setExpr('neutral') };

    setTimeout(() => say("Hiya! I'm Evo! 🤖💙", false), 600);
    setTimeout(wave, 1000);

    return () => {
      cleanups.forEach(fn => fn());
      renderer.setAnimationLoop(null);
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      document.body.style.cursor = '';
      setSceneReady(false);
      initRef.current = false;
    };
  }, []);

  return (
    <div className="evo-col" ref={rootRef}>
      <style>{EVO_CSS}</style>
      <div id="bot-stage">
        <div id="bot-bubble"></div>
        <div id="pbar"><div id="pfill"></div></div>
        <div id="meter"><i></i><i></i><i></i><i></i></div>
        <div id="combo"></div>
      </div>
      <div id="emote-wheel">
        <button data-act="wave" data-name="Wave">👋</button><button data-act="dance" data-name="Dance">💃</button><button data-act="sit" data-name="Sit">🪑</button>
        <button data-act="love" data-name="Love">💗</button><button data-act="fetch" data-name="Fetch">🎾</button><button data-act="peek" data-name="Peek">👻</button>
        <button data-act="sleep" data-name="Sleep">😴</button>
      </div>
      
            <button id="skins-toggle" aria-label="colors">🎨</button>
      <div id="skins">
        <div className="srow"><span>🤖</span>
          <button data-body="#ffffff" style={{ '--c': '#ffffff' }}></button><button data-body="#23262d" style={{ '--c': '#23262d' }}></button>
          <button data-body="#cdd5dd" style={{ '--c': '#cdd5dd' }}></button><button data-body="#e63946" style={{ '--c': '#e63946' }}></button>
          <button data-body="#2f6df6" style={{ '--c': '#2f6df6' }}></button><button data-body="#ffc53c" style={{ '--c': '#ffc53c' }}></button>
          <button data-body="#22c55e" style={{ '--c': '#22c55e' }}></button><button data-body="#a855f7" style={{ '--c': '#a855f7' }}></button>
          <button data-body="#ff8c00" style={{ '--c': '#ff8c00' }}></button><button data-body="#00c2d4" style={{ '--c': '#00c2d4' }}></button>
        </div>
        <div className="srow"><span>⚡</span>
          <button data-glow="#00f2ff" style={{ '--c': '#00f2ff' }}></button><button data-glow="#39ff8e" style={{ '--c': '#39ff8e' }}></button>
          <button data-glow="#ff4fd8" style={{ '--c': '#ff4fd8' }}></button><button data-glow="#ff9f1c" style={{ '--c': '#ff9f1c' }}></button>
          <button data-glow="#ff3c5a" style={{ '--c': '#ff3c5a' }}></button><button data-glow="#4dc9ff" style={{ '--c': '#4dc9ff' }}></button>
          <button data-glow="#b6ff3c" style={{ '--c': '#b6ff3c' }}></button><button data-glow="#b44dff" style={{ '--c': '#b44dff' }}></button>
          <button data-glow="#ffd75e" style={{ '--c': '#ffd75e' }}></button><button data-glow="#7c4dff" style={{ '--c': '#7c4dff' }}></button>
          <button data-glow="#ffffff" style={{ '--c': '#ffffff' }}></button><button data-glow="#ff6b00" style={{ '--c': '#ff6b00' }}></button>
          <button data-glow="#00ff88" style={{ '--c': '#00ff88' }}></button><button data-glow="#ff2d55" style={{ '--c': '#ff2d55' }}></button>
        </div>
        <div className="srow"><span>🖌</span>
          <input type="color" id="bodyPick" defaultValue="#ffffff" title="any body color" />
          <input type="color" id="glowPick" defaultValue="#00f2ff" title="any neon color" />
        </div>
      </div>

    </div>
  );
}