import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { userAPI, authAPI } from '../services/api';
import UniversitySearch from '../components/UniversitySearch';
import FieldPicker from '../components/FieldPicker';
import SkillSelector from '../components/SkillSelector';

const CompleteProfilePage = () => {
  const { user, loading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '', lastName: '', username: '',
    university: '', campus: '', major: '', degreeLevel: '',
    skills: [],
  });
  const [usernameStatus, setUsernameStatus] = useState('');
  const [error, setError] = useState('');

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  if (!user) { window.location.href = '/login'; return null; }
  if (user.university !== 'Not set') { window.location.href = '/'; return null; }

  const handleUsername = async (value) => {
    setForm((f) => ({ ...f, username: value }));
    if (!value || value.length < 3) { setUsernameStatus(''); return; }
    try {
      const { data } = await userAPI.checkUsername(value);
      setUsernameStatus(data.available ? '✅ Available' : '❌ Taken');
    } catch (e) { setUsernameStatus(''); }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.university.trim()) return setError('Please select your university.');
    if (!form.major || !form.degreeLevel) return setError('Please select your major and degree level.');
    try {
      await authAPI.completeProfile(form); // backend accepts skills as array
      await refreshUser();
      navigate('/');
    } catch (err) { setError(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full bg-white p-10 rounded-xl shadow-lg space-y-4">
        <h2 className="text-2xl font-extrabold text-gray-900 text-center">Complete Your Profile</h2>
        <p className="text-sm text-gray-500 text-center">Welcome! Set up your student profile to continue. This is required once.</p>
        {error && <div className="bg-red-100 text-red-700 p-3 rounded text-sm">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="First Name" required className="input-field" value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
            <input placeholder="Last Name" required className="input-field" value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} />
          </div>
          <div>
            <input placeholder="Username (unique)" className="input-field" value={form.username}
              onChange={(e) => handleUsername(e.target.value)} />
            {usernameStatus && <p className="text-xs mt-1 text-gray-600">{usernameStatus}</p>}
          </div>
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
          <SkillSelector
            selectedSkills={form.skills}
            onAdd={(skill) => setForm((f) => ({ ...f, skills: [...f.skills, skill] }))}
            onRemove={(skill) => setForm((f) => ({ ...f, skills: f.skills.filter((s) => s !== skill) }))}
          />
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Save & Continue →</button>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfilePage;