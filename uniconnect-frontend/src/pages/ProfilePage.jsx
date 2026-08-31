import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { profileAPI, userAPI, authAPI, topicAPI, projectAPI, SERVER_URL } from '../services/api';
import AvatarCropModal from '../components/AvatarCropModal';
import FollowListModal from '../components/FollowListModal';

import ProfileEditorModal from '../components/ProfileEditorModal';
import CertificateManager from '../components/CertificateManager';
import NotificationPrefsCard from '../components/NotificationPrefsCard';

import CoachCard from '../components/CoachCard';


const ProfilePage = () => {
  const [showProEditor, setShowProEditor] = useState(false);
  const [showCerts, setShowCerts] = useState(false);
  const { user, refreshUser } = useAuth();
  const [showCrop, setShowCrop] = useState(false);
  const [editing, setEditing] = useState(false);
  const [followList, setFollowList] = useState(null);
  const [showViews, setShowViews] = useState(false);
  const [views, setViews] = useState([]);
  const [myProjects, setMyProjects] = useState([]);
  const [viewCount, setViewCount] = useState(0);
  const [topics, setTopics] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [usernameStatus, setUsernameStatus] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

    const [sessions, setSessions] = useState([]);
  const [currentSid, setCurrentSid] = useState('');
  const [twoFAEnabled, setTwoFAEnabled] = useState(true);
  const [secLoading, setSecLoading] = useState(false);

  const [form, setForm] = useState({
    username: user?.username || '',
    bio: user?.bio || '',
    location: user?.location || '',
    major: user?.major || '',
    university: user?.university || '',
    skills: (user?.skills || []).join(', '),
    github: user?.links?.github || '',
    linkedin: user?.links?.linkedin || '',
    website: user?.links?.website || '',
  });
  const [edu, setEdu] = useState(user?.education || []);
  const [eduForm, setEduForm] = useState({ institution: '', degree: '', field: '', startYear: '', endYear: '' });
  const [nameReq, setNameReq] = useState({ firstName: '', lastName: '' });

  const loadExtra = async () => {
    try {
      const { data } = await userAPI.getProfile(user._id);
      setMyProjects(data.projects || []);
      setViewCount(data.viewCount || 0);
    } catch (e) { /* ignore */ }
    topicAPI.popular().then(({ data }) => setTopics(data)).catch(() => {});
  };

  
    useEffect(() => {
    if (user) {
      loadExtra();
      authAPI.getSessions().then(({ data }) => {
        setSessions(data.sessions || []);
        setCurrentSid(data.currentSid || '');
        setTwoFAEnabled(data.twoFAEnabled !== false);
      }).catch(() => {});
    }
  }, [user?._id]);

  if (!user) return null;

  const avatarSrc = user.avatarUrl
    ? (user.avatarUrl.startsWith('http') ? user.avatarUrl : `${SERVER_URL}${user.avatarUrl}`)
    : null;

  const checkUsername = async (value) => {
    setForm((f) => ({ ...f, username: value }));
    if (!value || value.length < 3) { setUsernameStatus(''); return; }
    try {
      const { data } = await userAPI.checkUsername(value);
      setUsernameStatus(data.available ? '✅ Available' : '❌ Taken');
    } catch (e) { setUsernameStatus(''); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await profileAPI.update({
        username: form.username,
        bio: form.bio,
        location: form.location,
        major: form.major,
        university: form.university,
        skills: form.skills,
        links: { github: form.github, linkedin: form.linkedin, website: form.website },
        education: edu,
      });
      await refreshUser();
      setEditing(false);
      setMessage('✅ Profile updated.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update');
    }
  };

  const handleRemoveAvatar = async () => {
    await profileAPI.removeAvatar();
    await refreshUser();
  };

  const handleNameChange = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await profileAPI.requestNameChange(nameReq);
      await refreshUser();
      setNameReq({ firstName: '', lastName: '' });
      setMessage('📝 Name change requested. Awaiting admin approval.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed');
    }
  };

  const addEdu = () => {
    if (!eduForm.institution || !eduForm.degree) return;
    setEdu([...edu, {
      institution: eduForm.institution,
      degree: eduForm.degree,
      field: eduForm.field,
      startYear: Number(eduForm.startYear) || undefined,
      endYear: Number(eduForm.endYear) || undefined,
    }]);
    setEduForm({ institution: '', degree: '', field: '', startYear: '', endYear: '' });
  };

  const handleVerify = async () => {
    if (!file) { setError('Please choose an image of your university ID card.'); return; }
    setLoading(true);
    setError('');
    const fd = new FormData();
    fd.append('idCard', file);
    try {
      await authAPI.requestVerification(fd);
      await refreshUser();
      setFile(null);
      setMessage('✅ ID submitted! An admin will review it shortly.');
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (id, progress) => {
    await projectAPI.updateProgress(id, progress);
    loadExtra();
  };

  const togglePin = async (id) => {
    try {
      await projectAPI.togglePin(id);
      await refreshUser();
      loadExtra();
    } catch (err) {
      setError(err.response?.data?.message || 'Pin failed');
    }
  };

  const toggleTopic = async (tag) => {
    await topicAPI.toggle(tag);
    await refreshUser();
  };

  const openViews = async () => {
    setShowViews(true);
    const { data } = await userAPI.myViews();
    setViews(data);
  };

  const handleExport = async () => {
    const { data } = await authAPI.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'uniconnect-my-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

    const handleToggle2FA = async () => {
    setSecLoading(true);
    try {
      const { data } = await authAPI.setTwoFA(!twoFAEnabled);
      setTwoFAEnabled(data.twoFAEnabled);
      setMessage(`🔐 2FA ${data.twoFAEnabled ? 'enabled' : 'disabled'}.`);
    } catch (err) { setError('Failed to update 2FA'); }
    setSecLoading(false);
  };

  const handleLogoutOthers = async () => {
    if (!window.confirm('Log out all other devices and clear trusted devices? You will stay logged in here.')) return;
    setSecLoading(true);
    try {
      await authAPI.logoutOthers();
      setMessage('✅ All other devices logged out.');
      const { data } = await authAPI.getSessions();
      setSessions(data.sessions || []);
    } catch (err) { setError('Failed to logout others'); }
    setSecLoading(false);
  };

    const handleLogoutSession = async (sid) => {
    if (!window.confirm('Log out this device? If it is currently in use, the user will be signed out.')) return;
    setSecLoading(true);
    try {
      await authAPI.logoutSession(sid);
      setMessage('✅ Session logged out.');
      const { data } = await authAPI.getSessions();
      setSessions(data.sessions || []);
    } catch (err) { setError('Failed to logout session'); }
    setSecLoading(false);
  };

  const badge =
    user.verificationStatus === 'verified'
      ? { text: '✅ Verified Student', cls: 'bg-green-100 text-green-800' }
      : user.verificationStatus === 'pending'
      ? { text: '⏳ Verification Pending', cls: 'bg-yellow-100 text-yellow-800' }
      : { text: ' Unverified', cls: 'bg-gray-100 text-gray-600' };

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow p-8">
        <div className="flex items-start gap-6">
          <div className="relative">
            {avatarSrc ? (
              <img src={avatarSrc} alt="avatar" className="w-24 h-24 rounded-full object-cover border-4 border-blue-100" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-blue-600 text-white flex items-center justify-center text-4xl font-bold">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3 flex-wrap">
              {user.firstName} {user.lastName}
              <span className={`text-xs px-2 py-1 rounded-full ${badge.cls}`}>{badge.text}</span>
              {user.role === 'admin' && <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">🛡️ Admin</span>}
            </h1>
            {user.username && <p className="text-sm text-blue-600 font-medium">@{user.username}</p>}
            <p className="text-sm text-gray-500 mt-1">{user.email}</p>
            <p className="text-sm text-gray-600 mt-1">🎓 {user.university} • {user.major}</p>
            {user.location && <p className="text-sm text-gray-600">📍 {user.location}</p>}

            <div className="flex gap-3 mt-3">
              <button onClick={() => setFollowList('followers')} className="text-sm text-gray-700 hover:text-blue-600">
                <span className="font-bold">{(user.followers || []).length}</span> Followers
              </button>
              <button onClick={() => setFollowList('following')} className="text-sm text-gray-700 hover:text-blue-600">
                <span className="font-bold">{(user.following || []).length}</span> Following
              </button>
              <button onClick={openViews} className="text-sm text-gray-700 hover:text-blue-600">
                👁️ <span className="font-bold">{viewCount}</span> Views
              </button>
            </div>

            <div className="flex gap-2 mt-4 flex-wrap">
              <button onClick={() => setShowCrop(true)} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700">📷 Change Photo</button>
              {avatarSrc && (
                <button onClick={handleRemoveAvatar} className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-200">🗑️ Remove</button>
              )}
              {/* Old editor merged into 🎨 Pro Editor */}
                <button onClick={() => setShowProEditor(true)} className="bg-purple-600 text-white text-sm px-4 py-2 rounded hover:bg-purple-700">🎨 Pro Editor</button>
                <button onClick={() => setShowCerts(true)} className="bg-yellow-500 text-white text-sm px-4 py-2 rounded hover:bg-yellow-600">🏅 Certificates</button>
                <button onClick={() => { window.location.href = `/portfolio/${user.username || user._id}`; }} className="bg-green-600 text-white text-sm px-4 py-2 rounded hover:bg-green-700">🎨 View Portfolio</button>
                                <button onClick={() => { window.location.href = '/alumni'; }} className="bg-indigo-600 text-white text-sm px-4 py-2 rounded hover:bg-indigo-700">🎓 Alumni</button>
                {showProEditor && <ProfileEditorModal onClose={() => setShowProEditor(false)} />}
                {showCerts && <CertificateManager onClose={() => setShowCerts(false)} />}
              <button onClick={handleExport} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700">📤 Export My Data</button>
            </div>
          </div>
        </div>

        {(user.links?.github || user.links?.linkedin || user.links?.website) && (
          <div className="flex gap-3 mt-5 flex-wrap">
            {user.links.github && <a href={user.links.github} target="_blank" rel="noreferrer" className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded hover:bg-black">🐙 GitHub</a>}
            {user.links.linkedin && <a href={user.links.linkedin} target="_blank" rel="noreferrer" className="text-xs bg-blue-700 text-white px-3 py-1.5 rounded hover:bg-blue-800">💼 LinkedIn</a>}
            {user.links.website && <a href={user.links.website} target="_blank" rel="noreferrer" className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700">🌐 Website</a>}
          </div>
        )}

        {user.bio && <p className="mt-5 text-gray-700">{user.bio}</p>}

        <div className="mt-4 flex flex-wrap gap-2">
          {(user.skills || []).map((s, i) => (
            <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded font-medium">{s}</span>
          ))}
        </div>

        {(user.education || []).length > 0 && (
          <div className="mt-6 border-t pt-4">
            <h3 className="font-semibold text-gray-800 text-sm mb-2">🎓 Education</h3>
            {user.education.map((e, i) => (
              <p key={i} className="text-sm text-gray-600">
                <span className="font-medium">{e.degree}</span>{e.field && ` in ${e.field}`} — {e.institution}
                {(e.startYear || e.endYear) && ` (${e.startYear || ''} - ${e.endYear || 'present'})`}
              </p>
            ))}
          </div>
        )}

        {message && <div className="bg-green-50 text-green-800 p-3 rounded text-sm mt-4">{message}</div>}
        {error && <div className="bg-red-100 text-red-700 p-3 rounded text-sm mt-4">{error}</div>}

        {/* Edit Form */}
        {editing && (
          <form onSubmit={handleSave} className="mt-6 space-y-4 border-t pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username {usernameStatus}</label>
              <input value={form.username} onChange={(e) => checkUsername(e.target.value)} className="input-field" placeholder="unique_username (3-20 chars, a-z 0-9 _ .)" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })} className="input-field" placeholder="University" />
              <input value={form.major} onChange={(e) => setForm({ ...form, major: e.target.value })} className="input-field" placeholder="Major" />
            </div>
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input-field" placeholder="📍 Location (e.g., Lahore, PK)" />
            <input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} className="input-field" placeholder="Skills (comma separated)" />
            <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} maxLength={300} className="input-field" placeholder="Short bio (max 300)" />
            <div className="grid grid-cols-3 gap-3">
              <input value={form.github} onChange={(e) => setForm({ ...form, github: e.target.value })} className="input-field" placeholder="GitHub URL" />
              <input value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} className="input-field" placeholder="LinkedIn URL" />
              <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="input-field" placeholder="Website URL" />
            </div>

            <div className="border rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Education History</p>
              {edu.map((e, i) => (
                <div key={i} className="flex justify-between items-center text-sm text-gray-600 mb-1">
                  <span>{e.degree} — {e.institution}</span>
                  <button type="button" onClick={() => setEdu(edu.filter((_, x) => x !== i))} className="text-red-600 text-xs hover:underline">Remove</button>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <input value={eduForm.institution} onChange={(e) => setEduForm({ ...eduForm, institution: e.target.value })} className="input-field" placeholder="Institution" />
                <input value={eduForm.degree} onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })} className="input-field" placeholder="Degree (e.g., BS CS)" />
                <input value={eduForm.field} onChange={(e) => setEduForm({ ...eduForm, field: e.target.value })} className="input-field" placeholder="Field (optional)" />
                <div className="grid grid-cols-2 gap-2">
                  <input value={eduForm.startYear} onChange={(e) => setEduForm({ ...eduForm, startYear: e.target.value })} className="input-field" placeholder="Start" type="number" />
                  <input value={eduForm.endYear} onChange={(e) => setEduForm({ ...eduForm, endYear: e.target.value })} className="input-field" placeholder="End" type="number" />
                </div>
              </div>
              <button type="button" onClick={addEdu} className="mt-2 text-xs bg-gray-800 text-white px-3 py-1.5 rounded hover:bg-black">+ Add Education</button>
            </div>

            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">Save Changes</button>
          </form>
        )}
      </div>

      {/* My Projects: progress + pins */}
      {myProjects.length > 0 && (
        <div className="bg-white rounded-xl shadow p-8 mt-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">📌 My Projects</h2>
          {myProjects.map((p) => (
            <div key={p._id} className="flex justify-between items-center border-b border-gray-100 py-3 last:border-0">
              <div>
                <p className="font-medium text-gray-900">
                  {p.title} {(user.pinnedProjects || []).some((x) => x === p._id || x?._id === p._id) && '📍'}
                </p>
                <p className="text-xs text-gray-500 capitalize">Progress: {p.progress}</p>
              </div>
              <div className="flex gap-2 items-center">
                <select value={p.progress} onChange={(e) => updateProgress(p._id, e.target.value)} className="text-xs border border-gray-300 rounded px-2 py-1">
                  <option value="planning">Planning</option>
                  <option value="building">Building</option>
                  <option value="completed">Completed</option>
                </select>
                <button onClick={() => togglePin(p._id)} className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200">
                  {(user.pinnedProjects || []).some((x) => x === p._id || x?._id === p._id) ? 'Unpin' : 'Pin'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Topic following */}
      <div className="bg-white rounded-xl shadow p-8 mt-6">
        <h2 className="text-lg font-bold text-gray-800 mb-2">#️⃣ Follow Topics</h2>
        <p className="text-sm text-gray-500 mb-4">Personalize your "For You" feed on the Project Board.</p>
        <div className="flex flex-wrap gap-2">
          {topics.map((t) => {
            const followed = (user.followedTopics || []).includes(t.tag);
            return (
              <button
                key={t.tag}
                onClick={() => toggleTopic(t.tag)}
                className={`text-xs px-3 py-1.5 rounded-full border transition ${followed ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}
              >
                #{t.tag} ({t.count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Locked Name Change Card */}
      <div className="bg-white rounded-xl shadow p-8 mt-6">
        <h2 className="text-lg font-bold text-gray-800">🔒 Legal Name (Admin-Approved Changes Only)</h2>
        <p className="text-sm text-gray-500 mt-1">
          Your first and last name are locked for trust & safety. Request a change and an admin will review it.
        </p>
        {user.nameChangeRequest?.firstName ? (
          <p className="mt-4 text-sm text-yellow-700 bg-yellow-50 p-3 rounded">
            ⏳ Pending request: {user.nameChangeRequest.firstName} {user.nameChangeRequest.lastName}
          </p>
        ) : (
          <form onSubmit={handleNameChange} className="mt-4 flex gap-3 flex-wrap">
            <input value={nameReq.firstName} onChange={(e) => setNameReq({ ...nameReq, firstName: e.target.value })} className="input-field max-w-[200px]" placeholder="New first name" required />
            <input value={nameReq.lastName} onChange={(e) => setNameReq({ ...nameReq, lastName: e.target.value })} className="input-field max-w-[200px]" placeholder="New last name" required />
            <button type="submit" className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-black transition">Request Name Change</button>
          </form>
        )}
      </div>






      {/* Verification Card */}



            <NotificationPrefsCard />
          <CoachCard />

     

            {/* Security Center */}
      <div className="bg-white rounded-xl shadow p-8 mt-6">
        
        <h2 className="text-lg font-bold text-gray-800">🔒 Security Center</h2>

        <p className="text-sm text-gray-500 mt-1">Manage your account security and active sessions.</p>
        
        <div className="flex justify-between items-center mt-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-800">Two-Factor Authentication (2FA)</p>
            <p className="text-xs text-gray-500">Require an email code when logging in from a new device.</p>
          </div>
          <button onClick={handleToggle2FA} disabled={secLoading} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${twoFAEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${twoFAEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        <div className="mt-6">
          <div className="flex justify-between items-center mb-3">
            <p className="font-medium text-gray-800">Active Sessions ({sessions.length})</p>
            {sessions.length > 1 && (
              <button onClick={handleLogoutOthers} disabled={secLoading} className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded hover:bg-red-200 font-medium">
                🚪 Logout all other devices
              </button>
            )}
          </div>
          <div className="space-y-2">
            {sessions.map((s) => (
              <div key={s.sid} className={`flex justify-between items-center p-3 rounded-lg border ${s.sid === currentSid ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 truncate">{s.device}</p>
                  <p className="text-xs text-gray-500">IP: {s.ip || 'Unknown'} • {new Date(s.createdAt).toLocaleString()}</p>
                </div>
                {s.sid === currentSid ? (
                  <span className="text-[10px] bg-green-600 text-white px-2 py-0.5 rounded-full font-bold whitespace-nowrap">CURRENT</span>
                ) : (
                  <button onClick={() => handleLogoutSession(s.sid)} disabled={secLoading} className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 font-medium whitespace-nowrap ml-3">
                    Logout
                  </button>
                )}
              </div>
            ))}
            {sessions.length === 0 && <p className="text-sm text-gray-400 text-center">No active sessions found.</p>}
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-8 mt-6">
        <h2 className="text-lg font-bold text-gray-800">🪪 Student Verification</h2>
        {user.verificationStatus === 'unverified' && (
          <div className="mt-4">
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} className="block text-sm text-gray-600" />
            <button onClick={handleVerify} disabled={loading} className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50">
              {loading ? 'Uploading...' : 'Submit for Verification'}
            </button>
          </div>
        )}
        {user.verificationStatus === 'pending' && (
          <p className="mt-4 text-sm text-yellow-700 bg-yellow-50 p-3 rounded">⏳ Your ID is under review.</p>
        )}
        {user.verificationStatus === 'verified' && (
          <p className="mt-4 text-sm text-green-700 bg-green-50 p-3 rounded">✅ You are a verified student!</p>
        )}
      </div>

      {showCrop && <AvatarCropModal onClose={() => setShowCrop(false)} />}
      {followList && <FollowListModal ownerId={user._id} mode={followList} onClose={() => setFollowList(null)} />}
      {showViews && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 max-h-[70vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">👁️ Profile Views</h2>
              <button onClick={() => setShowViews(false)} className="text-gray-500 hover:text-gray-800 text-2xl leading-none">&times;</button>
            </div>
            {views.length === 0 ? (
              <p className="text-gray-500 text-center">No views yet.</p>
            ) : (
              views.map((v) => (
                <div key={v._id} className="flex justify-between items-center border-b border-gray-100 py-2">
                  <p className="text-sm text-gray-800">
                    {v.viewer?.firstName} {v.viewer?.lastName}
                    <span className="text-xs text-gray-400"> • {v.viewer?.university}</span>
                  </p>
                  <p className="text-xs text-gray-400">{new Date(v.viewedAt).toLocaleDateString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;