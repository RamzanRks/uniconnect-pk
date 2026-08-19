import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    university: user?.university || '',
    major: user?.major || '',
    skills: (user?.skills || []).join(', '),
    bio: user?.bio || '',
  });
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await authAPI.updateProfile(form);
      await refreshUser();
      setEditing(false);
      setMessage('✅ Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleVerify = async () => {
    if (!file) {
      setError('Please choose an image of your university ID card.');
      return;
    }
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

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow p-8">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center text-3xl font-bold">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3 flex-wrap">
              {user.firstName} {user.lastName}
              <span className={`text-xs px-2 py-1 rounded-full ${badge.cls}`}>{badge.text}</span>
            </h1>
            <p className="text-sm text-gray-500">{user.email}</p>
            <p className="text-sm text-gray-600 mt-1">🎓 {user.university} • {user.major}</p>
          </div>
        </div>

        {user.bio && <p className="mt-5 text-gray-700">{user.bio}</p>}

        <div className="mt-4 flex flex-wrap gap-2">
          {(user.skills || []).map((s, i) => (
            <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded font-medium">{s}</span>
          ))}
        </div>

        <button onClick={() => setEditing(!editing)} className="mt-6 text-sm text-blue-600 hover:underline">
          {editing ? 'Cancel' : '✏️ Edit Profile'}
        </button>

        {editing && (
          <form onSubmit={handleSaveProfile} className="mt-4 space-y-4 border-t pt-4">
            <div className="grid grid-cols-2 gap-4">
              <input name="university" value={form.university} onChange={handleChange} className="input-field" placeholder="University" />
              <input name="major" value={form.major} onChange={handleChange} className="input-field" placeholder="Major" />
            </div>
            <input name="skills" value={form.skills} onChange={handleChange} className="input-field" placeholder="Skills (comma separated)" />
            <textarea name="bio" value={form.bio} onChange={handleChange} rows={3} className="input-field" placeholder="Short bio (max 300 chars)" maxLength={300} />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
              Save Changes
            </button>
          </form>
        )}

        {message && !editing && <div className="bg-green-50 text-green-800 p-3 rounded text-sm mt-4">{message}</div>}
        {error && <div className="bg-red-100 text-red-700 p-3 rounded text-sm mt-4">{error}</div>}
      </div>

      {/* Verification Card */}
      <div className="bg-white rounded-xl shadow p-8 mt-6">
        <h2 className="text-lg font-bold text-gray-800">🪪 Student Verification</h2>
        <p className="text-sm text-gray-500 mt-1">
          Get the ✅ Verified badge by uploading your university ID card. An admin will review it.
        </p>

        {user.verificationStatus === 'unverified' && (
          <div className="mt-4">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files[0])}
              className="block text-sm text-gray-600"
            />
            <button
              onClick={handleVerify}
              disabled={loading}
              className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Uploading...' : 'Submit for Verification'}
            </button>
          </div>
        )}

        {user.verificationStatus === 'pending' && (
          <p className="mt-4 text-sm text-yellow-700 bg-yellow-50 p-3 rounded">
            ⏳ Your ID is under review. Please wait for admin approval.
          </p>
        )}

        {user.verificationStatus === 'verified' && (
          <p className="mt-4 text-sm text-green-700 bg-green-50 p-3 rounded">
            ✅ You are a verified student!
          </p>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;