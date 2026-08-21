import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../services/api';

const AuthPage = ({ mode }) => {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '', university: '', major: '', skills: '', username: '',
  });
  const [usernameStatus, setUsernameStatus] = useState('');
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUsername = async (value) => {
    setFormData({ ...formData, username: value });
    if (!value || value.length < 3) { setUsernameStatus(''); return; }
    try {
      const { data } = await userAPI.checkUsername(value);
      setUsernameStatus(data.available ? '? Available' : '? Taken');
    } catch (e) { setUsernameStatus(''); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'register') {
        const payload = { ...formData, skills: formData.skills.split(',').map((s) => s.trim()).filter(Boolean) };
        await register(payload);
      } else {
        await login({ email: formData.email, password: formData.password });
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {mode === 'register' ? 'Join UniConnect' : 'Welcome Back'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {mode === 'register' ? 'Strictly for university students. Use your .edu email.' : 'Sign in to continue'}
          </p>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded text-sm">{error}</div>}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="grid grid-cols-2 gap-4">
              <input name="firstName" placeholder="First Name" required className="input-field" onChange={handleChange} />
              <input name="lastName" placeholder="Last Name" required className="input-field" onChange={handleChange} />
              <input name="university" placeholder="University" required className="input-field" onChange={handleChange} />
              <input name="major" placeholder="Major (e.g., CS)" required className="input-field" onChange={handleChange} />
              <div className="col-span-2">
                <input name="username" placeholder="Username (unique, 3-20 chars)" className="input-field" onChange={(e) => handleUsername(e.target.value)} />
                {usernameStatus && <p className="text-xs mt-1 text-gray-600">{usernameStatus}</p>}
              </div>
              <input name="skills" placeholder="Skills (comma separated)" className="input-field col-span-2" onChange={handleChange} />
            </div>
          )}

          <div className="space-y-4">
            <input name="email" type="email" placeholder="University Email (.edu)" required className="input-field" onChange={handleChange} />
            <input name="password" type="password" placeholder="Password" required className="input-field" onChange={handleChange} />
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
            {mode === 'register' ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          {mode === 'register'
            ? <a href="/login" className="text-blue-600 hover:underline">Already have an account? Login</a>
            : <a href="/register" className="text-blue-600 hover:underline">Need an account? Register</a>}
        </p>
      </div>
    </div>
  );
};

export default AuthPage;