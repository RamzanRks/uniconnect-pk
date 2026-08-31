import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { userAPI, certAPI, ratingAPI, endorsementAPI, messagesAPI, SERVER_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import RichText from '../components/RichText';
import BrandIcon from '../components/BrandIcon';
import CertificateTimeline from '../components/CertificateTimeline';
import { Reveal, Tilt, Particles, Counter, Typewriter, Magnetic, Spotlight, Testimonials, QRCard, SkillBars, Skeleton, EmptyState } from '../components/fx';

const Radar = ({ data, color }) => {
  const n = data.length;
  if (n < 3) return <p className="text-xs opacity-60">Add 3+ skills to unlock the radar.</p>;
  const cx = 100, cy = 100, R = 66;
  const max = Math.max(...data.map((d) => d.value), 1);
  const pt = (i, r) => { const a = (Math.PI * 2 * i) / n - Math.PI / 2; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-[240px] mx-auto">
      {[0.33, 0.66, 1].map((f) => (
        <polygon key={f} points={data.map((_, i) => pt(i, R * f).join(',')).join(' ')} fill="none" stroke="currentColor" opacity="0.15" />
      ))}
      <polygon points={data.map((d, i) => pt(i, (d.value / max) * R).join(',')).join(' ')} fill={color} opacity="0.4" stroke={color} strokeWidth="2" />
      {data.map((d, i) => { const [x, y] = pt(i, R + 16); return <text key={i} x={x} y={y} fontSize="9" textAnchor="middle" fill="currentColor">{String(d.label).slice(0, 9)}</text>; })}
    </svg>
  );
};

const Heatmap = ({ activity, dark }) => {
  const counts = {};
  (activity || []).forEach((a) => { const k = new Date(a.date).toDateString(); counts[k] = (counts[k] || 0) + 1; });
  const cells = [];
  for (let i = 104; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const c = counts[d.toDateString()] || 0;
    cells.push(<div key={i} title={`${c} activity`} className={`w-3 h-3 rounded-[4px] transition hover:scale-125 ${c === 0 ? (dark ? 'bg-white/10' : 'bg-gray-200') : c === 1 ? 'bg-emerald-300' : c === 2 ? 'bg-emerald-500' : 'bg-emerald-700'}`} />);
  }
  return <div className="grid grid-rows-7 grid-flow-col gap-1 overflow-x-auto pb-1">{cells}</div>;
};

const EduTimeline = ({ education, accent, accent2, dark }) => (
  <div className="relative">
    <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-1 rounded" style={{ background: `linear-gradient(180deg, ${accent}, ${accent2})` }} />
    {education.map((e, i) => (
      <div key={i} className={`relative flex mb-6 ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
        <span className="absolute left-1/2 -translate-x-1/2 top-2 w-4 h-4 rounded-full ring-4 ring-white shadow z-10" style={{ background: `linear-gradient(135deg, ${accent}, ${accent2})` }} />
        <div className={`w-[45%] ${i % 2 === 0 ? 'pr-4 text-right' : 'pl-4 text-left'}`}>
          <div className={`rounded-xl p-4 border transition hover:-translate-y-1 hover:shadow-xl ${dark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
            <p className="text-xs font-bold" style={{ color: accent }}>{e.startYear || '?'} – {e.endYear || 'now'} {e.gpa && <span className="ml-1 px-1.5 py-0.5 rounded-full text-white text-[10px]" style={{ background: `linear-gradient(90deg, ${accent}, ${accent2})` }}>GPA {e.gpa}</span>}</p>
            <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>{e.degree}{e.field && ` in ${e.field}`}</p>
            <p className={`text-xs ${dark ? 'text-white/60' : 'text-gray-500'}`}>{e.institution}</p>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const PortfolioPage = () => {
  const { handle } = useParams();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [certsCount, setCertsCount] = useState(0);
  const [ratings, setRatings] = useState(null);
  const [endo, setEndo] = useState({ counts: [] });
  const [activity, setActivity] = useState([]);
  const [shareOpen, setShareOpen] = useState(false);
  const [shotLight, setShotLight] = useState(null);

  useEffect(() => {
    userAPI.portfolio(handle).then(({ data }) => {
      setData(data);
      certAPI.get(data.user._id).then(({ data: c }) => setCertsCount(c.length)).catch(() => {});
      ratingAPI.getUser(data.user._id).then(({ data: r }) => setRatings(r)).catch(() => {});
      endorsementAPI.get(data.user._id).then(({ data: e }) => setEndo(e)).catch(() => {});
      userAPI.getActivity(data.user._id).then(({ data: a }) => setActivity(a)).catch(() => {});
    }).catch(() => setData(null));
  }, [handle]);

  if (!data) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <Skeleton className="h-80 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6"><Skeleton className="h-44" /><Skeleton className="h-44" /><Skeleton className="h-44" /></div>
        <p className="text-center text-xs text-gray-400">Loading portfolio...</p>
      </div>
    );
  }

  const u = data.user;
  const fx = u.portfolioFx || {};
  const on = (k) => fx[k] !== false;
  const isMe = user && user._id === u._id;
  const iFollow = user && (user.following || []).some((f) => (f._id || f).toString() === u._id.toString());
  const accent = u.accentColor || '#2563eb';
  const accent2 = u.accent2 || '#a855f7';
  const theme = u.portfolioTheme || 'modern';
  const dark = theme === 'dark' || theme === 'glass' || theme === 'gradient';
  const sections = u.portfolioSections || {};
  const endoCounts = Object.fromEntries((endo.counts || []).map((c) => [c._id, c.count]));
  const radarData = (u.skills || []).slice(0, 6).map((s) => ({ label: s, value: (endoCounts[s] || 0) + 1 }));
  const shareUrl = `${window.location.origin}/portfolio/${u.username || u._id}`;
  const customLinks = (u.customLinks || []).filter((l) => l.url);
  const hasLinks = u.links?.github || u.links?.linkedin || u.links?.website || customLinks.length > 0;

  const FONTS = { sans: 'Inter, system-ui, sans-serif', serif: 'Georgia, "Times New Roman", serif', mono: '"JetBrains Mono", "Courier New", monospace' };
  const font = FONTS[u.portfolioFont] || FONTS.sans;
  const pattern = u.portfolioPattern || 'none';

  const bg = theme === 'dark' ? '#000' : theme === 'glass' || theme === 'gradient' ? `linear-gradient(135deg, ${accent}, ${accent2})` : '#f3f4f6';
  const card = theme === 'dark' ? 'bg-black/60 border border-yellow-500/20 backdrop-blur-xl' : theme === 'glass' ? 'bg-white/10 border border-white/20 backdrop-blur-xl' : theme === 'gradient' ? 'bg-white shadow-2xl' : 'bg-white shadow-lg';
  const txt = theme === 'modern' ? 'text-gray-900' : 'text-white';
  const sub = theme === 'modern' ? 'text-gray-500' : 'text-white/70';

  const GradWrap = ({ children }) => on('gradientBorders') ? (
    <div className="rounded-3xl p-[2px] anim-grad" style={{ backgroundImage: `linear-gradient(120deg, ${accent}, ${accent2}, ${accent})` }}>{children}</div>
  ) : children;

  const Card = ({ children, span = '', delay = 0 }) => {
    const inner = <div className={`${card} rounded-3xl p-7 h-full transition hover:shadow-2xl`}>{children}</div>;
    const tilted = on('tilt') ? <Tilt>{inner}</Tilt> : inner;
    return on('scrollReveal') ? <Reveal delay={delay} className={span}>{tilted}</Reveal> : <div className={span}>{tilted}</div>;
  };

  const Btn = ({ children, className = '', ...rest }) => on('magnetic') ? <Magnetic><button className={className} {...rest}>{children}</button></Magnetic> : <button className={className} {...rest}>{children}</button>;

  const startChat = async () => {
    try {
      const { data: convo } = await messagesAPI.open({ recipientId: u._id });
      navigate(`/inbox?c=${convo._id}`);
    } catch (e) { alert(e.response?.data?.message || 'Cannot start chat'); }
  };

  const toggleFollow = async () => {
    try {
      if (iFollow) await userAPI.unfollow(u._id); else await userAPI.follow(u._id);
      await refreshUser();
    } catch (e) { alert('Failed'); }
  };

  const downloadCV = () => {
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>${u.firstName} ${u.lastName} — CV</title><style>body{font-family:Arial,sans-serif;padding:40px;color:#222}h1{margin:0}.sub{color:#666;margin:4px 0 16px}h2{border-bottom:2px solid ${accent};padding-bottom:4px;margin-top:24px}li{margin:4px 0}</style></head><body>
<h1>${u.firstName} ${u.lastName}</h1><p class="sub">${u.headline || ''} • ${u.university} • ${u.major}</p>
<h2>Skills</h2><ul>${(u.skills || []).map((s) => `<li>${s}${endoCounts[s] ? ` (${endoCounts[s]} endorsements)` : ''}</li>`).join('')}</ul>
<h2>Education</h2><ul>${(u.education || []).map((e) => `<li><b>${e.degree}</b>${e.field ? ` in ${e.field}` : ''} — ${e.institution}</li>`).join('')}</ul>
<h2>Projects</h2><ul>${(data.projects || []).map((p) => `<li><b>${p.title}</b> (${p.progress}) — ${p.requiredSkills.join(', ')}</li>`).join('')}</ul>
<h2>Links</h2><ul>${[u.links?.github, u.links?.linkedin, u.links?.website, ...customLinks.map((l) => l.url)].filter(Boolean).map((l) => `<li>${l}</li>`).join('')}</ul>
</body></html>`);
    w.document.close();
    w.print();
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: bg, fontFamily: font, animation: 'pageFade .6s ease' }}>
      <style>{`
        @keyframes float {0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-25px) scale(1.08)}}
        @keyframes gradShift {0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes glowPulse {0%,100%{opacity:.2}50%{opacity:.45}}
        @keyframes pageFade {from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        .anim-float{animation:float 8s ease-in-out infinite}
        .anim-grad{background-size:200% 200%;animation:gradShift 6s ease infinite}
        .anim-glow{animation:glowPulse 5s ease-in-out infinite}
      `}</style>

      {pattern !== 'none' && (
        <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: pattern === 'dots' ? 'radial-gradient(circle, #fff 1px, transparent 1px)' : 'linear-gradient(#ffffff22 1px, transparent 1px), linear-gradient(90deg, #ffffff22 1px, transparent 1px)', backgroundSize: pattern === 'dots' ? '24px 24px' : '40px 40px' }} />
      )}
      {theme !== 'modern' && on('particles') && <Particles color={accent} />}
      {dark && on('spotlight') && <Spotlight />}
      {theme !== 'modern' && (
        <>
          <div className="pointer-events-none absolute w-[500px] h-[500px] rounded-full blur-3xl anim-float anim-glow -top-32 -left-32" style={{ background: accent }} />
          <div className="pointer-events-none absolute w-[400px] h-[400px] rounded-full blur-3xl anim-float anim-glow bottom-0 right-0" style={{ background: accent2, animationDelay: '2s' }} />
        </>
      )}

      {/* Sticky glass navbar */}
      {on('glassNav') && (
        <div className={`sticky top-0 z-40 backdrop-blur-xl border-b ${dark ? 'bg-white/10 border-white/10' : 'bg-white/70 border-gray-200'}`}>
          <div className="max-w-6xl mx-auto px-6 py-2.5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              {u.avatarUrl ? <img src={u.avatarUrl.startsWith('http') ? u.avatarUrl : `${SERVER_URL}${u.avatarUrl}`} className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-bold" style={{ background: accent }}>{u.firstName?.[0]}</div>}
              <div>
                <p className={`text-sm font-bold leading-4 ${txt}`}>{u.firstName} {u.lastName}</p>
                <p className={`text-[10px] ${sub}`}>@{u.username || 'portfolio'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {!isMe && <button onClick={toggleFollow} className="text-xs px-3 py-1.5 rounded-full text-white anim-grad" style={{ backgroundImage: `linear-gradient(90deg, ${accent}, ${accent2})` }}>{iFollow ? '✓ Following' : '➕ Follow'}</button>}
              <button onClick={() => navigator.clipboard?.writeText(shareUrl).then(() => alert('🔗 Link copied!'))} className={`text-xs px-3 py-1.5 rounded-full border ${dark ? 'border-white/30 text-white' : 'border-gray-300 text-gray-700'}`}> Share</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto p-6 relative">
        {/* HERO */}
        <GradWrap>
          <div className={`${card} rounded-3xl overflow-hidden transition hover:shadow-2xl relative`}>
            {on('particles') && <Particles color={accent} count={200} interactive={true} />}
            <div className="h-44 anim-grad relative z-10" style={{ background: u.bannerUrl ? `url(${u.bannerUrl.startsWith('http') ? u.bannerUrl : SERVER_URL + u.bannerUrl}) center/cover` : `linear-gradient(120deg, ${accent}, ${accent2}, ${accent})` }} />
            <div className="p-7 relative z-10">
              <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-16">
                <div className={on('avatarRing') ? 'p-1 rounded-full anim-grad w-fit' : ''} style={on('avatarRing') ? { backgroundImage: `linear-gradient(120deg, ${accent}, ${accent2}, ${accent})` } : {}}>
                  <div className="w-28 h-28 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-gray-200">
                    {u.avatarUrl ? <img src={u.avatarUrl.startsWith('http') ? u.avatarUrl : `${SERVER_URL}${u.avatarUrl}`} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white" style={{ background: accent }}>{u.firstName?.[0]}</div>}
                  </div>
                </div>
                <div className="flex-1">
                  <h1 className={`text-3xl font-extrabold ${theme === 'modern' ? 'text-gray-900' : 'text-white'}`} style={theme !== 'modern' && !on('typewriter') ? { background: `linear-gradient(90deg, ${accent}, ${accent2}, ${accent})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundSize: '200% 200%', animation: 'gradShift 5s ease infinite' } : {}}>
                    {on('typewriter') ? <Typewriter text={`${u.firstName} ${u.lastName}`} /> : `${u.firstName} ${u.lastName}`} {u.verificationStatus === 'verified' && '✅'}
                  </h1>
                  {u.headline && <p className="text-sm mt-1 font-medium" style={{ color: theme === 'modern' ? accent : '#fff' }}>{u.headline}</p>}
                  <p className={`text-sm ${sub}`}>🎓 {u.university} • {u.major} {u.location && `• 📍 ${u.location}`}</p>
                  {u.openToWork && (
                    <span className="inline-flex items-center gap-1.5 mt-2 text-[10px] font-bold text-white px-3 py-1 rounded-full shadow-lg" style={{ background: 'linear-gradient(90deg,#10b981,#22d3ee)' }}>
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />OPEN TO WORK
                    </span>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {!isMe && <Btn onClick={toggleFollow} className="text-sm px-4 py-2 rounded-xl text-white font-medium shadow-lg hover:opacity-90 transition anim-grad" style={{ backgroundImage: `linear-gradient(90deg, ${accent}, ${accent2})` }}>{iFollow ? '✓ Following' : '➕ Follow'}</Btn>}
                  {!isMe && <Btn onClick={startChat} className="text-sm px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg">💬 Message</Btn>}
                  <Btn onClick={downloadCV} className="text-sm px-4 py-2 rounded-xl bg-gray-800 text-white hover:bg-black shadow-lg">📄 CV</Btn>
                  <Link to={`/user/${u._id}`} className="text-sm px-4 py-2 rounded-xl bg-white/20 backdrop-blur border border-white/30 hover:bg-white/30">👤 Profile</Link>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-7">
                {[[u.points || 0, 'Points'], [(u.followers || []).length, 'Followers'], [u.viewCount || 0, 'Total Views'], [data.weekViews, 'This Week']].map(([v, l], i) => (
                  <div key={i} className={`rounded-2xl p-4 text-center border transition hover:-translate-y-1 ${dark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                    <p className="text-2xl font-extrabold" style={{ color: accent }}>{on('counters') ? <Counter value={Number(v) || 0} /> : v}</p>
                    <p className={`text-[10px] uppercase tracking-wider ${sub}`}>{l}</p>
                  </div>
                ))}
              </div>

              <div className="relative inline-block mt-6">
                <button onClick={() => setShareOpen(!shareOpen)} className="text-xs px-4 py-2 rounded-full text-white shadow-lg anim-grad" style={{ backgroundImage: `linear-gradient(90deg, ${accent}, ${accent2})` }}>📤 Share Portfolio</button>
                {shareOpen && (
                  <div className="absolute left-0 top-11 bg-white rounded-xl shadow-2xl border border-gray-100 z-40 w-44 overflow-hidden">
                    <button onClick={() => { navigator.clipboard?.writeText(shareUrl); alert('🔗 Link copied!'); setShareOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">🔗 Copy Link</button>
                    <a href={`https://wa.me/?text=${encodeURIComponent(`Check out ${u.firstName}'s portfolio: ${shareUrl}`)}`} target="_blank" rel="noreferrer" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">WhatsApp</a>
                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Facebook</a>
                    <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">LinkedIn</a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </GradWrap>

        {/* BENTO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {u.superBio && (
            <Card span="md:col-span-2">
              <h3 className="font-bold mb-3 text-lg" style={{ color: theme === 'modern' ? accent : '#fff' }}>📖 About</h3>
              <div className={`text-sm ${sub}`}><RichText text={u.superBio} /></div>
            </Card>
          )}

          {sections.skills !== false && (
            <Card className={txt}>
              <h3 className="font-bold mb-3" style={{ color: theme === 'modern' ? accent : '#fff' }}>🎯 Skill Radar</h3>
              <Radar data={radarData} color={accent} />
              {on('skillBars') && <div className="mt-5"><SkillBars data={radarData} accent={accent} accent2={accent2} dark={dark} /></div>}
            </Card>
          )}

          {sections.projects !== false && (
            <Card span="md:col-span-2">
              <h3 className="font-bold mb-4" style={{ color: theme === 'modern' ? accent : '#fff' }}>📌 Projects</h3>
              {data.projects.length === 0 ? (
                <EmptyState icon="📌" title="No projects yet" sub="Projects will appear here once published." />
              ) : (
                <div className="grid gap-3">
                  {data.projects.map((p) => (
                    <Link key={p._id} to={`/project/${p._id}`} className={`block rounded-2xl p-4 border transition hover:-translate-y-1 hover:shadow-xl ${dark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                      <p className={`font-semibold ${txt}`}>{p.title}</p>
                      <p className={`text-xs mt-1 ${sub}`}>{p.requiredSkills.join(' • ')} <span className="capitalize">• {p.progress}</span></p>
                      {(p.screenshots || []).length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {p.screenshots.map((s, i) => (
                            <img key={i} src={s.startsWith('http') ? s : `${SERVER_URL}${s}`} onClick={(e) => { e.preventDefault(); setShotLight(s); }} className="rounded-lg h-20 w-full object-cover transition hover:scale-110 hover:shadow-2xl cursor-pointer" />
                          ))}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          )}

          {sections.activity !== false && (
            <Card className={txt}>
              <h3 className="font-bold mb-3" style={{ color: theme === 'modern' ? accent : '#fff' }}>📊 Activity</h3>
              <Heatmap activity={activity} dark={dark} />
            </Card>
          )}

          {on('testimonials') && ratings && ratings.count > 0 && (
            <Card><Testimonials ratings={ratings} dark={dark} accent={theme === 'modern' ? accent : '#fff'} /></Card>
          )}

          {sections.ratings !== false && ratings && ratings.count > 0 && (
            <Card>
              <h3 className="font-bold mb-2" style={{ color: theme === 'modern' ? accent : '#fff' }}>⭐ Ratings</h3>
              <p className="text-4xl font-extrabold" style={{ color: accent }}>{ratings.avg}<span className="text-sm">/5</span></p>
              <p className={`text-xs ${sub}`}>{ratings.count} ratings</p>
            </Card>
          )}

          {on('qr') && (
            <Card><QRCard url={shareUrl} dark={dark} /></Card>
          )}

          {sections.links !== false && hasLinks && (
            <Card>
              <h3 className="font-bold mb-4" style={{ color: theme === 'modern' ? accent : '#fff' }}>🔗 Links</h3>
              <div className="flex flex-col gap-3 text-sm">
                {u.links?.github && <a className={`flex items-center gap-2 hover:opacity-70 ${txt}`} target="_blank" rel="noreferrer" href={u.links.github}><BrandIcon url={u.links.github} size={18} color={accent} /> GitHub</a>}
                {u.links?.linkedin && <a className={`flex items-center gap-2 hover:opacity-70 ${txt}`} target="_blank" rel="noreferrer" href={u.links.linkedin}><BrandIcon url={u.links.linkedin} size={18} color={accent} /> LinkedIn</a>}
                {u.links?.website && <a className={`flex items-center gap-2 hover:opacity-70 ${txt}`} target="_blank" rel="noreferrer" href={u.links.website}><BrandIcon url={u.links.website} size={18} color={accent} /> Website</a>}
                {customLinks.map((l, i) => <a key={i} className={`flex items-center gap-2 hover:opacity-70 ${txt}`} target="_blank" rel="noreferrer" href={l.url}><BrandIcon url={l.url} size={18} color={accent} /> {l.label || 'Link'}</a>)}
              </div>
            </Card>
          )}

          {sections.education !== false && (u.education || []).length > 0 && (
            <Card span="md:col-span-3" className={txt}>
              <h3 className="font-bold mb-6 text-lg" style={{ color: theme === 'modern' ? accent : '#fff' }}>🎓 Education Journey</h3>
              <EduTimeline education={u.education} accent={accent} accent2={accent2} dark={dark} />
            </Card>
          )}
        </div>

        {sections.certificates !== false && certsCount > 0 && <CertificateTimeline userId={u._id} />}
      </div>

      {shotLight && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-6" onClick={() => setShotLight(null)}>
          <img src={shotLight.startsWith('http') ? shotLight : `${SERVER_URL}${shotLight}`} className="rounded-xl max-h-[85vh] max-w-full" />
        </div>
      )}
    </div>
  );
};

export default PortfolioPage;