import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { profileAPI, userAPI, authAPI, SERVER_URL } from '../services/api';
import AvatarCropModal from '../components/AvatarCropModal';
import FollowListModal from '../components/FollowListModal';

const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const [showCrop, setShowCrop] = useState(false);
  const [editing, setEditing] = useState(false);
  const [followList, setFollowList] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [usernameStatus, setUsernameStatus] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const badge =
    user.verificationStatus === 'verified'
      ? { text: '✅ Verified Student', cls: 'bg-green-100 text-green-800' }
      : user.verificationStatus === 'pending'
      ? { text: '⏳ Verification Pending', cls: 'bg-yellow-100 text-yellow-800' }
      : { text: '⚪ Unverified', cls: 'bg-gray-100 text-gray-600' };

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
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowCrop(true)} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700">📷 Change Photo</button>
              {avatarSrc && (
                <button onClick={handleRemoveAvatar} className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-200">️ Remove</button>
              )}
              <button onClick={() => setEditing(!editing)} className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-200">✏️ Edit Profile</button>
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
              <input name="university" value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })} className="input-field" placeholder="University" />
              <input name="major" value={form.major} onChange={(e) => setForm({ ...form, major: e.target.value })} className="input-field" placeholder="Major" />
            </div>
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input-field" placeholder="📍 Location (e.g., Lahore, PK)" />
            <input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} className="input-field" placeholder="Skills (comma separated)" />
            <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} maxLength={300} className="input-field" placeholder="Short bio (max 300)" />
            <div className="grid grid-cols-3 gap-3">
              <input value={form.github} onChange={(e) => setForm({ ...form, github: e.target.value })} className="input-field" placeholder="GitHub URL" />
              <input value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} className="input-field" placeholder="LinkedIn URL" />
              <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="input-field" placeholder="Website URL" />
            </div>

            {/* Education editor */}
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
    </div>
  );
};

export default ProfilePage;