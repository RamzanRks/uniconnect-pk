import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { profileAPI, userAPI, authAPI, topicAPI, projectAPI, SERVER_URL } from '../services/api';
import AvatarCropModal from '../components/AvatarCropModal';
import FollowListModal from '../components/FollowListModal';

import ProfileEditorModal from '../components/ProfileEditorModal';
import CertificateManager from '../components/CertificateManager';
import NotificationPrefsCard from '../components/NotificationPrefsCard';

import SkillSelector from '../components/SkillSelector';
import UniversitySearch from '../components/UniversitySearch';
import FieldPicker from '../components/FieldPicker';

import CoachCard from '../components/CoachCard';
import { Reveal } from '../components/fx';

import ParticlePortraitCard from '../components/ParticlePortraitCard';

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
    campus: user?.campus || '',
    degreeLevel: user?.degreeLevel || '',
    skills: user?.skills || [],
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
      setUsernameStatus(data.available ? 'Available' : 'Taken');
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
        campus: form.campus,
        degreeLevel: form.degreeLevel,
        skills: form.skills,
        links: { github: form.github, linkedin: form.linkedin, website: form.website },
        education: edu,
      });
      await refreshUser();
      setEditing(false);
      setMessage('Profile updated successfully.');
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
      setMessage('Name change requested. Awaiting admin approval.');
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
      setMessage('ID submitted! An admin will review it shortly.');
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
      setMessage(`2FA ${data.twoFAEnabled ? 'enabled' : 'disabled'}.`);
    } catch (err) { setError('Failed to update 2FA'); }
    setSecLoading(false);
  };

  const handleLogoutOthers = async () => {
    if (!window.confirm('Log out all other devices and clear trusted devices? You will stay logged in here.')) return;
    setSecLoading(true);
    try {
      await authAPI.logoutOthers();
      setMessage('All other devices logged out.');
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
      setMessage('Session logged out.');
      const { data } = await authAPI.getSessions();
      setSessions(data.sessions || []);
    } catch (err) { setError('Failed to logout session'); }
    setSecLoading(false);
  };

  const badge =
    user.verificationStatus === 'verified'
      ? { text: 'Verified Student', cls: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' }
      : user.verificationStatus === 'pending'
      ? { text: 'Verification Pending', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' }
      : { text: 'Unverified', cls: 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400' };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Profile Card */}
      <Reveal>
      <div className="relative overflow-hidden rounded-3xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all duration-300 hover:shadow-xl">
        {/* Gradient banner */}
        <div className="h-28 bg-gradient-to-r from-blue-600 to-violet-600 relative">
          <div className="absolute inset-0 dot-pattern opacity-30" />
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6 -mt-16 relative">
            {/* Avatar */}
            <div className="relative shrink-0">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt="avatar"
                  className="w-28 h-28 rounded-2xl object-cover ring-4 ring-white dark:ring-slate-900 shadow-lg"
                />
              ) : (
                <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white flex items-center justify-center text-4xl font-extrabold ring-4 ring-white dark:ring-slate-900 shadow-lg">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </div>
              )}
            </div>

            {/* Identity */}
            <div className="flex-1 sm:pt-12">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                  {user.firstName} {user.lastName}
                </h1>
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${badge.cls}`}>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                  {badge.text}
                </span>
                {user.role === 'admin' && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    Admin
                  </span>
                )}
              </div>

              {user.username && <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1">@{user.username}</p>}
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{user.email}</p>

              <div className="flex items-center gap-x-4 gap-y-1 flex-wrap mt-2 text-sm text-gray-600 dark:text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-gray-400 dark:text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                  {user.university} • {user.major}
                </span>
                {user.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-gray-400 dark:text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                    {user.location}
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-1 mt-4 flex-wrap">
                <button onClick={() => setFollowList('followers')} className="group inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-1.5 rounded-full hover:bg-blue-50 dark:hover:bg-slate-800 transition active:scale-95">
                  <span className="font-extrabold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">{(user.followers || []).length}</span> Followers
                </button>
                <button onClick={() => setFollowList('following')} className="group inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-1.5 rounded-full hover:bg-blue-50 dark:hover:bg-slate-800 transition active:scale-95">
                  <span className="font-extrabold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">{(user.following || []).length}</span> Following
                </button>
                <button onClick={openViews} className="group inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-1.5 rounded-full hover:bg-blue-50 dark:hover:bg-slate-800 transition active:scale-95">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  <span className="font-extrabold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">{viewCount}</span> Views
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mt-5 flex-wrap">
                <button onClick={() => setShowCrop(true)} className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gradient-to-r from-blue-600 to-violet-600 text-white px-3.5 py-2 rounded-full shadow-sm hover:shadow-md hover:opacity-90 transition active:scale-95">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                  Change Photo
                </button>
                {avatarSrc && (
                  <button onClick={handleRemoveAvatar} className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 px-3.5 py-2 rounded-full hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition active:scale-95">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                    Remove
                  </button>
                )}
                <button onClick={() => setShowProEditor(true)} className="inline-flex items-center gap-1.5 text-sm font-semibold bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 px-4 py-2 rounded-full shadow-sm hover:shadow-md hover:border-violet-300 dark:hover:border-violet-500 transition active:scale-95">
                  <svg className="w-4 h-4 text-violet-600 dark:text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                  Pro Editor
                </button>
                <button onClick={() => setShowCerts(true)} className="inline-flex items-center gap-1.5 text-sm font-semibold bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 px-4 py-2 rounded-full shadow-sm hover:shadow-md hover:border-amber-300 dark:hover:border-amber-500 transition active:scale-95">
                  <svg className="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
                  Certificates
                </button>
                <button onClick={() => { window.location.href = `/portfolio/${user.username || user._id}`; }} className="inline-flex items-center gap-1.5 text-sm font-semibold bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 px-4 py-2 rounded-full shadow-sm hover:shadow-md hover:border-green-300 dark:hover:border-green-500 transition active:scale-95">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                  View Portfolio
                </button>
                <button onClick={() => { window.location.href = '/alumni'; }} className="inline-flex items-center gap-1.5 text-sm font-semibold bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 px-4 py-2 rounded-full shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500 transition active:scale-95">
                  <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                  Alumni
                </button>
                <button onClick={handleExport} className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 px-3.5 py-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition active:scale-95">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                  Export My Data
                </button>

                {showProEditor && <ProfileEditorModal onClose={() => setShowProEditor(false)} />}
                {showCerts && <CertificateManager onClose={() => setShowCerts(false)} />}
              </div>
            </div>
          </div>

        {(user.links?.github || user.links?.linkedin || user.links?.website) && (
          <div className="flex gap-2 mt-6 flex-wrap">
            {user.links.github && (
              <a href={user.links.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gray-900 dark:bg-black text-white px-3.5 py-2 rounded-full hover:bg-black hover:shadow-md transition active:scale-95">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
                GitHub
              </a>
            )}
            {user.links.linkedin && (
              <a href={user.links.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-700 text-white px-3.5 py-2 rounded-full hover:bg-blue-800 hover:shadow-md transition active:scale-95">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
                LinkedIn
              </a>
            )}
            {user.links.website && (
              <a href={user.links.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold bg-green-600 text-white px-3.5 py-2 rounded-full hover:bg-green-700 hover:shadow-md transition active:scale-95">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                Website
              </a>
            )}
          </div>
        )}

        {user.bio && <p className="mt-6 text-gray-700 dark:text-slate-300 leading-relaxed">{user.bio}</p>}

        {(user.skills || []).length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {(user.skills || []).map((s, i) => (
              <span key={i} className="text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 px-3 py-1.5 rounded-full">{s}</span>
            ))}
          </div>
        )}

        {(user.education || []).length > 0 && (
          <div className="mt-6 border-t border-gray-100 dark:border-slate-800 pt-5">
            <h3 className="flex items-center gap-2 font-bold tracking-tight text-gray-900 dark:text-white text-sm mb-3">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
              Education
            </h3>
            <div className="space-y-2">
              {user.education.map((e, i) => (
                <p key={i} className="text-sm text-gray-600 dark:text-slate-300">
                  <span className="font-semibold text-gray-900 dark:text-white">{e.degree}</span>
                  {e.field && ` in ${e.field}`} — {e.institution}
                  {(e.startYear || e.endYear) && (
                    <span className="text-gray-400 dark:text-slate-500"> ({e.startYear || ''} – {e.endYear || 'present'})</span>
                  )}
                </p>
              ))}
            </div>
          </div>
        )}

        {message && (
          <div className="flex items-center gap-2.5 bg-green-50 dark:bg-green-500/10 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-500/20 p-3.5 rounded-xl text-sm font-medium mt-5">
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            {message}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2.5 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20 p-3.5 rounded-xl text-sm font-medium mt-5">
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
            {error}
          </div>
        )}

        {/* Edit Form */}
        {editing && (
          <form onSubmit={handleSave} className="mt-6 space-y-4 border-t border-gray-100 dark:border-slate-800 pt-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                Username
                {usernameStatus && (
                  <span className={`ml-2 text-xs font-bold ${usernameStatus === 'Available' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {usernameStatus}
                  </span>
                )}
              </label>
              <input value={form.username} onChange={(e) => checkUsername(e.target.value)} className="input-field rounded-xl" placeholder="unique_username (3-20 chars, a-z 0-9 _ .)" />
            </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <UniversitySearch 
  value={form.university} 
  onChange={(uni) => setForm((f) => ({ ...f, university: uni, campus: '' }))}
  campusValue={form.campus || ''}
  onCampusChange={(campus) => setForm((f) => ({ ...f, campus }))}
/>
  <FieldPicker
    value={form.major}
    level={form.degreeLevel}
    onChange={(major) => setForm((f) => ({ ...f, major, degreeLevel: '' }))}
    onLevelChange={(degreeLevel) => setForm((f) => ({ ...f, degreeLevel }))}
  />
</div>
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input-field rounded-xl" placeholder="Location (e.g., Lahore, PK)" />
            <SkillSelector
  selectedSkills={form.skills}
  onAdd={(skill) => setForm((prev) => ({ ...prev, skills: [...prev.skills, skill] }))}
  onRemove={(skill) => setForm((prev) => ({ ...prev, skills: prev.skills.filter((s) => s !== skill) }))}
/>
            <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} maxLength={300} className="input-field rounded-xl" placeholder="Short bio (max 300)" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input value={form.github} onChange={(e) => setForm({ ...form, github: e.target.value })} className="input-field rounded-xl" placeholder="GitHub URL" />
              <input value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} className="input-field rounded-xl" placeholder="LinkedIn URL" />
              <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="input-field rounded-xl" placeholder="Website URL" />
            </div>

            <div className="border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-4">
              <p className="text-sm font-bold tracking-tight text-gray-800 dark:text-white mb-2">Education History</p>
              {edu.map((e, i) => (
                <div key={i} className="flex justify-between items-center text-sm text-gray-600 dark:text-slate-300 mb-1.5">
                  <span>{e.degree} — {e.institution}</span>
                  <button type="button" onClick={() => setEdu(edu.filter((_, x) => x !== i))} className="text-red-600 dark:text-red-400 text-xs font-semibold hover:underline active:scale-95 transition">Remove</button>
                </div>
              ))}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                <input value={eduForm.institution} onChange={(e) => setEduForm({ ...eduForm, institution: e.target.value })} className="input-field rounded-xl" placeholder="Institution" />
                <input value={eduForm.degree} onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })} className="input-field rounded-xl" placeholder="Degree (e.g., BS CS)" />
                <input value={eduForm.field} onChange={(e) => setEduForm({ ...eduForm, field: e.target.value })} className="input-field rounded-xl" placeholder="Field (optional)" />
                <div className="grid grid-cols-2 gap-2">
                  <input value={eduForm.startYear} onChange={(e) => setEduForm({ ...eduForm, startYear: e.target.value })} className="input-field rounded-xl" placeholder="Start" type="number" />
                  <input value={eduForm.endYear} onChange={(e) => setEduForm({ ...eduForm, endYear: e.target.value })} className="input-field rounded-xl" placeholder="End" type="number" />
                </div>
              </div>
              <button type="button" onClick={addEdu} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold bg-gray-800 dark:bg-slate-700 text-white px-3.5 py-2 rounded-full hover:bg-black dark:hover:bg-slate-600 transition active:scale-95">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                Add Education
              </button>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button type="submit" className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-sm hover:shadow-lg hover:opacity-90 transition active:scale-95">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                Save Changes
              </button>
              <button type="button" onClick={() => setEditing(false)} className="text-sm font-semibold text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white px-4 py-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition active:scale-95">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
      </div>
      </Reveal>

      

      {/* My Projects: progress + pins */}
      {myProjects.length > 0 && (
        <Reveal>
        <div className="rounded-3xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all duration-300 hover:shadow-xl p-6 sm:p-8">
          <h2 className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-gray-900 dark:text-white mb-5">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="17" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>
            My Projects
          </h2>
          {myProjects.map((p) => (
            <div key={p._id} className="flex justify-between items-center gap-3 border-b border-gray-100 dark:border-slate-800 py-3.5 last:border-0">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 font-semibold text-gray-900 dark:text-white">
                  <span className="truncate">{p.title}</span>
                  {(user.pinnedProjects || []).some((x) => x === p._id || x?._id === p._id) && (
                    <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="17" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>
                  )}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400 capitalize mt-0.5">Progress: {p.progress}</p>
              </div>
              <div className="flex gap-2 items-center shrink-0">
                <select value={p.progress} onChange={(e) => updateProgress(p._id, e.target.value)} className="text-xs font-semibold border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 rounded-full px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                  <option value="planning">Planning</option>
                  <option value="building">Building</option>
                  <option value="completed">Completed</option>
                </select>
                <button onClick={() => togglePin(p._id)} className={`inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full transition active:scale-95 ${(user.pinnedProjects || []).some((x) => x === p._id || x?._id === p._id) ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'}`}>
                  {(user.pinnedProjects || []).some((x) => x === p._id || x?._id === p._id) ? 'Unpin' : 'Pin'}
                </button>
              </div>
            </div>
          ))}
        </div>
        </Reveal>
      )}

      {/* Topic following */}
      <Reveal>
      <div className="rounded-3xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all duration-300 hover:shadow-xl p-6 sm:p-8">
        <h2 className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-gray-900 dark:text-white mb-1.5">
          <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/></svg>
          Follow Topics
        </h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-5">Personalize your "For You" feed on the Project Board.</p>
        <div className="flex flex-wrap gap-2">
          {topics.map((t) => {
            const followed = (user.followedTopics || []).includes(t.tag);
            return (
              <button
                key={t.tag}
                onClick={() => toggleTopic(t.tag)}
                className={`inline-flex items-center gap-1 text-xs font-semibold px-3.5 py-1.5 rounded-full border transition active:scale-95 ${followed ? 'bg-blue-600 text-white border-blue-600 shadow-sm hover:bg-blue-700' : 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
              >
                <span className="opacity-70">#</span>{t.tag}
                <span className={`ml-0.5 ${followed ? 'text-blue-100' : 'text-gray-400 dark:text-slate-500'}`}>({t.count})</span>
              </button>
            );
          })}
        </div>
      </div>
      </Reveal>

<Reveal>
        <ParticlePortraitCard />
      </Reveal>


      {/* Locked Name Change Card */}
      <Reveal>
      <div className="rounded-3xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all duration-300 hover:shadow-xl p-6 sm:p-8">
        <div className="flex items-center gap-2 flex-wrap">
          <svg className="w-5 h-5 text-gray-500 dark:text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <h2 className="text-lg font-extrabold tracking-tight text-gray-900 dark:text-white">Legal Name</h2>
          <span className="text-xs font-semibold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 px-2.5 py-1 rounded-full">Admin-Approved Changes Only</span>
        </div>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
          Your first and last name are locked for trust & safety. Request a change and an admin will review it.
        </p>
        {user.nameChangeRequest?.firstName ? (
          <div className="mt-4 flex items-center gap-2.5 text-sm font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-3.5 rounded-xl">
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Pending request: {user.nameChangeRequest.firstName} {user.nameChangeRequest.lastName}
          </div>
        ) : (
          <form onSubmit={handleNameChange} className="mt-5 flex gap-3 flex-wrap items-center">
            <input value={nameReq.firstName} onChange={(e) => setNameReq({ ...nameReq, firstName: e.target.value })} className="input-field rounded-xl max-w-[220px]" placeholder="New first name" required />
            <input value={nameReq.lastName} onChange={(e) => setNameReq({ ...nameReq, lastName: e.target.value })} className="input-field rounded-xl max-w-[220px]" placeholder="New last name" required />
            <button type="submit" className="inline-flex items-center gap-2 bg-gray-800 dark:bg-slate-700 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-black dark:hover:bg-slate-600 shadow-sm hover:shadow-md transition active:scale-95">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              Request Name Change
            </button>
          </form>
        )}
      </div>
      </Reveal>






      {/* Verification Card */}



      <Reveal>
        <NotificationPrefsCard />
      </Reveal>
      <Reveal>
        <CoachCard />
      </Reveal>

     

      {/* Security Center */}
      <Reveal>
      <div className="rounded-3xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all duration-300 hover:shadow-xl p-6 sm:p-8">
        <h2 className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-gray-900 dark:text-white">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
          Security Center
        </h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1.5">Manage your account security and active sessions.</p>

        {/* 2FA */}
        <div className="flex justify-between items-center gap-4 mt-5 p-4 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 rounded-2xl">
          <div className="flex items-start gap-3">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z"/><circle cx="16.5" cy="7.5" r=".5"/></svg>
            </span>
            <div>
              <p className="font-semibold text-gray-800 dark:text-white">Two-Factor Authentication (2FA)</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Require an email code when logging in from a new device.</p>
            </div>
          </div>
          <button onClick={handleToggle2FA} disabled={secLoading} aria-label="Toggle two-factor authentication" className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${twoFAEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-700'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${twoFAEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Sessions */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-3 gap-3">
            <p className="font-bold tracking-tight text-gray-800 dark:text-white">Active Sessions <span className="text-gray-400 dark:text-slate-500">({sessions.length})</span></p>
            {sessions.length > 1 && (
              <button onClick={handleLogoutOthers} disabled={secLoading} className="inline-flex items-center gap-1.5 text-xs font-semibold bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20 px-3 py-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-500/20 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                Logout all other devices
              </button>
            )}
          </div>
          <div className="space-y-2">
            {sessions.map((s) => (
              <div key={s.sid} className={`flex justify-between items-center gap-3 p-3.5 rounded-2xl border transition ${s.sid === currentSid ? 'border-green-300 dark:border-green-500/30 bg-green-50 dark:bg-green-500/10' : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50'}`}>
                <div className="min-w-0 flex-1 flex items-center gap-3">
                  <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl shrink-0 ${s.sid === currentSid ? 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'}`}>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{s.device}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">IP: {s.ip || 'Unknown'} • {new Date(s.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                {s.sid === currentSid ? (
                  <span className="text-[10px] bg-green-600 text-white px-2.5 py-1 rounded-full font-bold whitespace-nowrap uppercase tracking-wide">Current</span>
                ) : (
                  <button onClick={() => handleLogoutSession(s.sid)} disabled={secLoading} className="inline-flex items-center gap-1 text-xs font-semibold bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 px-3 py-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-500/20 transition active:scale-95 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                    Logout
                  </button>
                )}
              </div>
            ))}
            {sessions.length === 0 && <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-4">No active sessions found.</p>}
          </div>
        </div>
      </div>
      </Reveal>
      <Reveal>
      <div className="rounded-3xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all duration-300 hover:shadow-xl p-6 sm:p-8">
        <h2 className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-gray-900 dark:text-white">
          <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 10h2"/><path d="M16 14h2"/><path d="M6.17 15a3 3 0 0 1 5.66 0"/><circle cx="9" cy="11" r="2"/><rect x="2" y="5" width="20" height="14" rx="2"/></svg>
          Student Verification
        </h2>
        {user.verificationStatus === 'unverified' && (
          <div className="mt-4">
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Upload your university ID card</label>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} className="block w-full text-sm text-gray-600 dark:text-slate-400 file:mr-3 file:rounded-full file:border-0 file:bg-blue-50 dark:file:bg-blue-500/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-500/20 cursor-pointer" />
            <button onClick={handleVerify} disabled={loading} className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-sm hover:shadow-lg hover:opacity-90 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  Uploading...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                  Submit for Verification
                </>
              )}
            </button>
          </div>
        )}
        {user.verificationStatus === 'pending' && (
          <div className="mt-4 flex items-center gap-2.5 text-sm font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-3.5 rounded-xl">
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Your ID is under review.
          </div>
        )}
        {user.verificationStatus === 'verified' && (
          <div className="mt-4 flex items-center gap-2.5 text-sm font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 p-3.5 rounded-xl">
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            You are a verified student!
          </div>
        )}
      </div>
      </Reveal>

      {showCrop && <AvatarCropModal onClose={() => setShowCrop(false)} />}
      {followList && <FollowListModal ownerId={user._id} mode={followList} onClose={() => setFollowList(null)} />}
      {showViews && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl border border-gray-100 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-4">
              <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                Profile Views
              </h2>
              <button onClick={() => setShowViews(false)} aria-label="Close" className="inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white transition active:scale-95">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            {views.length === 0 ? (
              <p className="text-gray-500 dark:text-slate-400 text-center py-6">No views yet.</p>
            ) : (
              <div className="space-y-1">
                {views.map((v) => (
                  <div key={v._id} className="flex justify-between items-center gap-3 border-b border-gray-100 dark:border-slate-800 py-2.5 last:border-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-slate-200">
                      {v.viewer?.firstName} {v.viewer?.lastName}
                      <span className="text-xs text-gray-400 dark:text-slate-500 font-normal"> • {v.viewer?.university}</span>
                    </p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 whitespace-nowrap">{new Date(v.viewedAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;