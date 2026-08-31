import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI, profileAPI, userAPI, SERVER_URL } from '../services/api';
import RichText from './RichText';
import BrandIcon from './BrandIcon';

const PRESETS = ['#2563eb', '#7c3aed', '#059669', '#e11d48', '#d97706', '#0f172a', '#22d3ee', '#f472b6'];
const TEMPLATES = [
  { key: 'aurora', name: '🌌 Aurora', theme: 'glass', a1: '#22d3ee', a2: '#a855f7', font: 'sans', pattern: 'dots' },
  { key: 'cyber', name: '🤖 Cyber Neon', theme: 'dark', a1: '#facc15', a2: '#f43f5e', font: 'mono', pattern: 'grid' },
  { key: 'royal', name: '👑 Royal', theme: 'modern', a1: '#7c3aed', a2: '#2563eb', font: 'serif', pattern: 'none' },
  { key: 'sunset', name: '🌅 Sunset', theme: 'gradient', a1: '#f97316', a2: '#e11d48', font: 'sans', pattern: 'none' },
  { key: 'emerald', name: '💎 Emerald', theme: 'modern', a1: '#059669', a2: '#22d3ee', font: 'sans', pattern: 'dots' },
  { key: 'noir', name: '🖤 Mono Noir', theme: 'dark', a1: '#e5e7eb', a2: '#6b7280', font: 'mono', pattern: 'grid' },
];

const buildForm = (u) => ({
  username: u.username || '', bio: u.bio || '', location: u.location || '', university: u.university || '', major: u.major || '',
  headline: u.headline || '', superBio: u.superBio || '', openToWork: !!u.openToWork,
  links: u.links || { github: '', linkedin: '', website: '' }, customLinks: u.customLinks || [],
  education: u.education || [], skills: u.skills || [],
  accentColor: u.accentColor || '#2563eb', accent2: u.accent2 || '#a855f7',
  portfolioTheme: u.portfolioTheme || 'modern', portfolioSections: u.portfolioSections || {},
  portfolioFont: u.portfolioFont || 'sans', portfolioPattern: u.portfolioPattern || 'none',
  portfolioFx: u.portfolioFx || {},
});

const FX_LABELS = {
  typewriter: '⌨️ Typewriter name', scrollReveal: '📜 Scroll reveal', tilt: '🃏 3D tilt cards',
  particles: '🌠 Particles', counters: '🔢 Animated counters', gradientBorders: '🌈 Gradient borders',
  glassNav: '🧭 Glass navbar', avatarRing: '💫 Avatar ring', testimonials: '💬 Testimonials',
  qr: '📱 QR card', spotlight: '🖱️ Cursor spotlight', magnetic: '🧲 Magnetic buttons', skillBars: '📊 Skill bars',
};

const ProfileEditorModal = ({ onClose }) => {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState(null);
  const [loaded, setLoaded] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tab, setTab] = useState('basics');
  const [skillInput, setSkillInput] = useState('');
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [error, setError] = useState('');
  const taRef = useRef(null);

  useEffect(() => {
    userAPI.getProfile(user._id).then(({ data }) => {
      const f = buildForm(data.user);
      setForm(f); setLoaded(f);
      setProjects(data.projects || []);
    }).catch(() => {});
  }, [user._id]);

  if (!form) return null;
  const dirty = JSON.stringify(form) !== JSON.stringify(loaded) || !!bannerFile;
  const close = () => { if (dirty && !window.confirm('Discard unsaved changes?')) return; onClose(); };

  const apply = (before, after = before, ph = 'text') => {
    const ta = taRef.current; if (!ta) return;
    const s = ta.selectionStart, e = ta.selectionEnd, v = ta.value;
    const sel = v.slice(s, e) || ph;
    setForm({ ...form, superBio: v.slice(0, s) + before + sel + after + v.slice(e) });
    setTimeout(() => { ta.focus(); ta.setSelectionRange(s + before.length, s + before.length + sel.length); }, 0);
  };

  const save = async () => {
    setError('');
    try {
      await profileAPI.update({ ...form, skills: form.skills.join(', ') });
      if (bannerFile) { const fd = new FormData(); fd.append('banner', bannerFile); await authAPI.setBanner(fd); }
      await refreshUser();
      onClose();
    } catch (err) { setError(err.response?.data?.message || 'Failed to save'); }
  };

  const T = form.portfolioTheme;
  const prevBg = T === 'dark' ? '#000' : T === 'glass' || T === 'gradient' ? `linear-gradient(135deg, ${form.accentColor}, ${form.accent2})` : '#f3f4f6';
  const prevCard = T === 'dark' ? '#111' : T === 'glass' ? 'rgba(255,255,255,0.12)' : '#fff';
  const prevText = T === 'modern' ? '#111' : '#fff';
  const prevSub = T === 'modern' ? '#6b7280' : 'rgba(255,255,255,0.75)';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[94vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">🚀 Profile Studio <span className="text-xs text-gray-400">— your personal website builder</span></h2>
          <button onClick={close} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
        </div>

        <div className="flex gap-2 mb-5 flex-wrap">
          {['basics', 'links', 'education', 'appearance'].map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${tab === t ? 'text-white shadow' : 'bg-gray-100 text-gray-600'}`} style={tab === t ? { background: `linear-gradient(90deg, ${form.accentColor}, ${form.accent2})` } : {}}>{t}</button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {error && <div className="bg-red-100 text-red-700 p-3 rounded text-sm">{error}</div>}

            {tab === 'basics' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <input className="input-field" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
                  <input className="input-field" placeholder="📍 Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                  <input className="input-field" placeholder="University" value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })} />
                  <input className="input-field" placeholder="Major" value={form.major} onChange={(e) => setForm({ ...form, major: e.target.value })} />
                </div>
                <input className="input-field" placeholder='Headline' value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} maxLength={120} />
                <input className="input-field" placeholder="Short bio (profile)" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} maxLength={300} />
                <div>
                  <div className="flex gap-1 mb-1 flex-wrap">
                    <button onClick={() => apply('**')} title="Bold" className="w-7 h-7 rounded bg-gray-800 text-white text-xs font-bold hover:bg-black">B</button>
                    <button onClick={() => apply('*')} title="Italic" className="w-7 h-7 rounded bg-gray-600 text-white text-xs italic hover:bg-gray-700">I</button>
                    <button onClick={() => apply('__')} title="Underline" className="w-7 h-7 rounded bg-gray-500 text-white text-xs underline hover:bg-gray-600">U</button>
                    <button onClick={() => apply('~~')} title="Strikethrough" className="w-7 h-7 rounded bg-gray-400 text-white text-xs line-through hover:bg-gray-500">S</button>
                    <button onClick={() => apply('`')} title="Code" className="w-7 h-7 rounded bg-gray-700 text-white text-xs hover:bg-gray-800">&lt;/&gt;</button>
                    <button onClick={() => apply('\n# ', '', 'Heading')} title="Heading" className="w-7 h-7 rounded bg-blue-600 text-white text-xs font-bold hover:bg-blue-700">H</button>
                    <button onClick={() => apply('\n> ', '', 'quote')} title="Quote" className="w-7 h-7 rounded bg-purple-600 text-white text-xs hover:bg-purple-700">❝</button>
                    <button onClick={() => apply('\n- ', '', 'item')} title="Bullet" className="w-7 h-7 rounded bg-green-600 text-white text-xs hover:bg-green-700">•</button>
                    <button onClick={() => apply('[', '](https://)', 'link')} title="Link" className="w-7 h-7 rounded bg-sky-600 text-white text-xs hover:bg-sky-700">🔗</button>
                  </div>
                  <textarea ref={taRef} className="input-field" rows={6} placeholder="Super Bio — select text & use toolbar" value={form.superBio} onChange={(e) => setForm({ ...form, superBio: e.target.value })} maxLength={2000} />
                  <p className="text-xs text-gray-400 text-right">{form.superBio.length}/2000</p>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={form.openToWork} onChange={(e) => setForm({ ...form, openToWork: e.target.checked })} /> 🟢 Open to projects/teams
                </label>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Skills</p>
                  <div className="flex gap-2">
                    <input className="input-field" placeholder="Add skill..." value={skillInput} onChange={(e) => setSkillInput(e.target.value)} />
                    <button onClick={() => { if (skillInput.trim() && !form.skills.includes(skillInput.trim())) setForm({ ...form, skills: [...form.skills, skillInput.trim()] }); setSkillInput(''); }} className="text-white px-3 rounded" style={{ background: form.accentColor }}>+</button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.skills.map((s) => (
                      <span key={s} className="text-xs px-2 py-1 rounded-full text-white flex items-center gap-1" style={{ background: `linear-gradient(90deg, ${form.accentColor}, ${form.accent2})` }}>{s}<button onClick={() => setForm({ ...form, skills: form.skills.filter((x) => x !== s) })}>✕</button></span>
                    ))}
                  </div>
                </div>
              </>
            )}

            {tab === 'links' && (
              <>
                <input className="input-field" placeholder="GitHub URL" value={form.links.github} onChange={(e) => setForm({ ...form, links: { ...form.links, github: e.target.value } })} />
                <input className="input-field" placeholder="LinkedIn URL" value={form.links.linkedin} onChange={(e) => setForm({ ...form, links: { ...form.links, linkedin: e.target.value } })} />
                <input className="input-field" placeholder="Website URL" value={form.links.website} onChange={(e) => setForm({ ...form, links: { ...form.links, website: e.target.value } })} />
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Custom Links ({form.customLinks.length}/6) — WhatsApp, Facebook, anything</p>
                  {form.customLinks.map((l, i) => (
                    <div key={i} className="flex gap-2 mb-2 items-center">
                      <BrandIcon url={l.url} size={18} />
                      <input className="input-field w-1/3" placeholder="Label" value={l.label} onChange={(e) => { const c = [...form.customLinks]; c[i] = { ...c[i], label: e.target.value }; setForm({ ...form, customLinks: c }); }} />
                      <input className="input-field flex-1" placeholder="URL" value={l.url} onChange={(e) => { const c = [...form.customLinks]; c[i] = { ...c[i], url: e.target.value }; setForm({ ...form, customLinks: c }); }} />
                      <button onClick={() => setForm({ ...form, customLinks: form.customLinks.filter((_, x) => x !== i) })} className="text-red-600">✕</button>
                    </div>
                  ))}
                  {form.customLinks.length < 6 && <button onClick={() => setForm({ ...form, customLinks: [...form.customLinks, { label: '', url: '' }] })} className="text-xs bg-gray-100 px-3 py-1.5 rounded hover:bg-gray-200">+ Add Link</button>}
                </div>
              </>
            )}

            {tab === 'education' && (
              <div>
                {form.education.map((ed, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-3 mb-3 space-y-2">
                    <div className="flex gap-2">
                      <input className="input-field" placeholder="Degree" value={ed.degree} onChange={(e) => { const c = [...form.education]; c[i] = { ...c[i], degree: e.target.value }; setForm({ ...form, education: c }); }} />
                      <input className="input-field" placeholder="Field" value={ed.field} onChange={(e) => { const c = [...form.education]; c[i] = { ...c[i], field: e.target.value }; setForm({ ...form, education: c }); }} />
                    </div>
                    <input className="input-field" placeholder="Institution" value={ed.institution} onChange={(e) => { const c = [...form.education]; c[i] = { ...c[i], institution: e.target.value }; setForm({ ...form, education: c }); }} />
                    <div className="grid grid-cols-3 gap-2">
                      <input className="input-field" type="number" placeholder="Start yr" value={ed.startYear || ''} onChange={(e) => { const c = [...form.education]; c[i] = { ...c[i], startYear: Number(e.target.value) || undefined }; setForm({ ...form, education: c }); }} />
                      <input className="input-field" type="number" placeholder="End yr" value={ed.endYear || ''} onChange={(e) => { const c = [...form.education]; c[i] = { ...c[i], endYear: Number(e.target.value) || undefined }; setForm({ ...form, education: c }); }} />
                      <input className="input-field" placeholder="GPA / %" value={ed.gpa || ''} onChange={(e) => { const c = [...form.education]; c[i] = { ...c[i], gpa: e.target.value }; setForm({ ...form, education: c }); }} />
                    </div>
                    <button onClick={() => setForm({ ...form, education: form.education.filter((_, x) => x !== i) })} className="text-xs text-red-600">Remove</button>
                  </div>
                ))}
                {form.education.length < 5 && <button onClick={() => setForm({ ...form, education: [...form.education, { institution: '', degree: '', field: '' }] })} className="text-xs bg-gray-100 px-3 py-1.5 rounded hover:bg-gray-200">+ Add Education</button>}
              </div>
            )}

            {tab === 'appearance' && (
              <>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">🎭 One-Click Templates (6)</p>
                  <div className="grid grid-cols-3 gap-2">
                    {TEMPLATES.map((t) => (
                      <button key={t.key} onClick={() => setForm({ ...form, portfolioTheme: t.theme, accentColor: t.a1, accent2: t.a2, portfolioFont: t.font, portfolioPattern: t.pattern })} className="p-3 rounded-xl border border-gray-200 text-xs font-medium hover:shadow-md transition" style={{ background: `linear-gradient(135deg, ${t.a1}22, ${t.a2}22)` }}>{t.name}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Theme Base</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[['modern', '⬜'], ['dark', '⬛'], ['glass', '🔮'], ['gradient', '🌈']].map(([k, ic]) => (
                      <button key={k} onClick={() => setForm({ ...form, portfolioTheme: k })} className={`p-2 rounded-lg border text-xs capitalize ${form.portfolioTheme === k ? 'border-blue-600 bg-blue-50 font-bold' : 'border-gray-200'}`}>{ic} {k}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Typography</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[['sans', 'Modern Sans'], ['serif', 'Classic Serif'], ['mono', 'Hacker Mono']].map(([k, label]) => (
                      <button key={k} onClick={() => setForm({ ...form, portfolioFont: k })} className={`p-2 rounded-lg border text-xs ${form.portfolioFont === k ? 'border-blue-600 bg-blue-50 font-bold' : 'border-gray-200'}`}>{label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Background Pattern</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[['none', 'Clean'], ['dots', '• Dots'], ['grid', '# Grid']].map(([k, label]) => (
                      <button key={k} onClick={() => setForm({ ...form, portfolioPattern: k })} className={`p-2 rounded-lg border text-xs ${form.portfolioPattern === k ? 'border-blue-600 bg-blue-50 font-bold' : 'border-gray-200'}`}>{label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Gradient Colors</p>
                  <div className="flex gap-2 items-center flex-wrap">
                    {PRESETS.map((c) => (
                      <button key={c} onClick={() => setForm({ ...form, accentColor: c })} className="w-7 h-7 rounded-full ring-2 ring-white shadow" style={{ background: c }} />
                    ))}
                    <input type="color" value={form.accentColor} onChange={(e) => setForm({ ...form, accentColor: e.target.value })} className="w-9 h-9 cursor-pointer" title="Accent 1" />
                    <input type="color" value={form.accent2} onChange={(e) => setForm({ ...form, accent2: e.target.value })} className="w-9 h-9 cursor-pointer" title="Accent 2" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Banner</p>
                  {(bannerPreview || user.bannerUrl) && (
                    <img src={bannerPreview || (user.bannerUrl.startsWith('http') ? user.bannerUrl : `${SERVER_URL}${user.bannerUrl}`)} className="h-20 w-full object-cover rounded-lg mb-2" />
                  )}
                  <input type="file" accept="image/*" onChange={(e) => { setBannerFile(e.target.files[0]); setBannerPreview(URL.createObjectURL(e.target.files[0])); }} className="text-sm" />
                </div>

                                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">✨ Effects Switchboard (your visitors see what you enable)</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(FX_LABELS).map(([k, label]) => (
                      <label key={k} className={`flex items-center gap-2 text-xs p-2 rounded-lg border cursor-pointer transition ${form.portfolioFx[k] !== false ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
                        <input type="checkbox" checked={form.portfolioFx[k] !== false} onChange={(e) => setForm({ ...form, portfolioFx: { ...form.portfolioFx, [k]: e.target.checked } })} /> {label}
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Portfolio Sections</p>
                  {['projects', 'certificates', 'skills', 'ratings', 'activity', 'education', 'links'].map((s) => (
                    <label key={s} className="flex items-center gap-2 text-sm text-gray-700 py-1">
                      <input type="checkbox" checked={form.portfolioSections[s] !== false} onChange={(e) => setForm({ ...form, portfolioSections: { ...form.portfolioSections, [s]: e.target.checked } })} /> Show {s}
                    </label>
                  ))}
                </div>
              </>
            )}

            <button onClick={save} className="w-full text-white py-2.5 rounded-xl font-semibold shadow-lg hover:opacity-90 transition" style={{ background: `linear-gradient(90deg, ${form.accentColor}, ${form.accent2})` }}>💾 Save Changes</button>
          </div>

          {/* FULL LIVE PREVIEW */}
          <div className="rounded-2xl p-5 overflow-y-auto max-h-[70vh]" style={{ background: prevBg }}>
            <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: prevSub }}>Live Portfolio Preview</p>
            <div className="rounded-xl overflow-hidden shadow-xl" style={{ background: prevCard }}>
              <div className="h-20" style={{ background: bannerPreview || (user.bannerUrl ? `url(${user.bannerUrl.startsWith('http') ? user.bannerUrl : SERVER_URL + user.bannerUrl}) center/cover` : `linear-gradient(120deg, ${form.accentColor}, ${form.accent2})`) }} />
              <div className="p-4">
                <p className="font-extrabold" style={{ color: prevText }}>{user.firstName} {user.lastName} ✅</p>
                <p className="text-xs mt-0.5" style={{ color: form.accentColor }}>{form.headline || 'Headline preview'}</p>
                <p className="text-[10px] mt-0.5" style={{ color: prevSub }}>🎓 {form.university} • {form.major}</p>
                {form.openToWork && (
                  <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-bold text-white px-2 py-0.5 rounded-full" style={{ background: 'linear-gradient(90deg,#10b981,#22d3ee)' }}>
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />OPEN TO WORK
                  </span>
                )}
                {form.superBio && <div className="text-[10px] mt-2" style={{ color: prevSub }}><RichText text={form.superBio} /></div>}
                {form.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {form.skills.map((s) => <span key={s} className="text-[9px] px-2 py-0.5 rounded-full text-white" style={{ background: `linear-gradient(90deg, ${form.accentColor}, ${form.accent2})` }}>{s}</span>)}
                  </div>
                )}
                {form.portfolioSections.projects !== false && projects.length > 0 && (
                  <div className="mt-3">
                    <p className="text-[10px] font-bold mb-1" style={{ color: form.accentColor }}>📌 PROJECTS</p>
                    {projects.slice(0, 3).map((p) => (
                      <p key={p._id} className="text-[10px] mb-1" style={{ color: prevSub }}>▸ {p.title} <span className="opacity-60">({p.progress})</span></p>
                    ))}
                  </div>
                )}
                {form.portfolioSections.education !== false && form.education.length > 0 && (
                  <div className="mt-3">
                    <p className="text-[10px] font-bold mb-1" style={{ color: form.accentColor }}>🎓 EDUCATION</p>
                    {form.education.map((e, i) => <p key={i} className="text-[10px]" style={{ color: prevSub }}>▸ {e.degree} — {e.institution} ({e.startYear || '?'}–{e.endYear || 'now'}){e.gpa && ` • GPA ${e.gpa}`}</p>)}
                  </div>
                )}
                {form.portfolioSections.links !== false && (
                  <div className="flex gap-2 mt-3">
                    {form.links.github && <BrandIcon url={form.links.github} size={14} color={form.accentColor} />}
                    {form.links.linkedin && <BrandIcon url={form.links.linkedin} size={14} color={form.accentColor} />}
                    {form.customLinks.filter((l) => l.url).map((l, i) => <BrandIcon key={i} url={l.url} size={14} color={form.accentColor} />)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditorModal;