import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI, authAPI } from '../services/api';
import { GoogleLogin } from '@react-oauth/google';

const PasswordInput = ({ name, value, onChange, placeholder }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input name={name} type={show ? 'text' : 'password'} placeholder={placeholder} required className="input-field pr-10" value={value} onChange={onChange} />
      <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">{show ? '🙈' : '👁️'}</button>
    </div>
  );
};

const AuthPage = ({ mode }) => {
  const [view, setView] = useState(mode);
  const [forgotStep, setForgotStep] = useState(1);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '', university: '', major: '', skills: '', username: '' });
  const [pendingEmail, setPendingEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [usernameStatus, setUsernameStatus] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user, login } = useAuth();

  useEffect(() => {
    if (user) window.location.href = user.university === 'Not set' ? '/complete-profile' : '/';
  }, [user]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleUsername = async (value) => {
    setFormData({ ...formData, username: value });
    if (!value || value.length < 3) { setUsernameStatus(''); return; }
    try {
      const { data } = await userAPI.checkUsername(value);
      setUsernameStatus(data.available ? '✅ Available' : '❌ Taken');
    } catch (e) { setUsernameStatus(''); }
  };

  const switchView = (v) => { setView(v); setError(''); setSuccess(''); setCode(''); setForgotStep(1); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      if (view === 'login') {
        const { data } = await authAPI.login({ email: formData.email, password: formData.password });
        if (data.twoFA) {
          setPendingEmail(data.email);
          setView('two-fa');
          setSuccess('🔐 New device detected! Check your email (or backend terminal) for the 6-digit login code.');
          return;
        }
        if (!data.emailVerified) {
          localStorage.setItem('token', data.token);
          setPendingEmail(data.email);
          await authAPI.resendCode(data.email);
          setView('verify-email');
          return;
        }
        await login({ email: formData.email, password: formData.password });
      } else if (view === 'register') {
        const payload = { ...formData, skills: formData.skills.split(',').map((s) => s.trim()).filter(Boolean) };
        const { data } = await authAPI.register(payload);
        setPendingEmail(data.email);
        setView('verify-email');
              } else if (view === 'two-fa') {
        const { data } = await authAPI.verifyTwoFA(pendingEmail, code);
        localStorage.setItem('token', data.token);
        window.location.href = '/';
      } else if (view === 'verify-email') {
        await authAPI.verifyEmail(pendingEmail, code);
        switchView('login');
        setSuccess('✅ Email verified! Please login.');
      } else if (view === 'forgot') {
        if (forgotStep === 1) {
          const email = String(new FormData(e.target).get('email') || '').trim();
          if (!email) { setError('Enter your email.'); return; }
          await authAPI.forgotPassword(email);
          setPendingEmail(email);
          setSuccess('Code sent! Check your email (or backend terminal).');
          setForgotStep(2);
        } else if (forgotStep === 2) {
          await authAPI.checkCode(pendingEmail, code);
          setSuccess('✅ Code verified. Now set a new password.');
          setForgotStep(3);
        } else {
          if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
          if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
          await authAPI.resetPassword({ email: pendingEmail, code, newPassword });
          switchView('login');
          setSuccess('✅ Password reset! Login with your new password.');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  const handleResend = async () => {
    try { await authAPI.resendCode(pendingEmail); setSuccess('Code resent! (check email / backend terminal)'); }
    catch (err) { setError(err.response?.data?.message || 'Failed to resend'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-6 bg-white p-10 rounded-xl shadow-lg">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          {view === 'login' && 'Welcome Back'}
          {view === 'register' && 'Join UniConnect'}
          {view === 'verify-email' && 'Verify Email'}
                    {view === 'two-fa' && 'Verify Device'}
          {view === 'forgot' && (forgotStep === 1 ? 'Reset Password' : forgotStep === 2 ? 'Enter Code' : 'New Password')}
        </h2>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded text-sm">{error}</div>}
        {success && <div className="bg-green-100 text-green-700 p-3 rounded text-sm">{success}</div>}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {view === 'register' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <input name="firstName" placeholder="First Name" required className="input-field" onChange={handleChange} />
                <input name="lastName" placeholder="Last Name" required className="input-field" onChange={handleChange} />
                <input name="university" placeholder="University" required className="input-field" onChange={handleChange} />
                <input name="major" placeholder="Major" required className="input-field" onChange={handleChange} />
              </div>
              <div>
                <input name="username" placeholder="Username (unique, 3-20 chars)" className="input-field" onChange={(e) => handleUsername(e.target.value)} />
                {usernameStatus && <p className="text-xs mt-1 text-gray-600">{usernameStatus}</p>}
              </div>
              <input name="skills" placeholder="Skills (comma separated)" className="input-field" onChange={handleChange} />
            </>
          )}

          {(view === 'login' || view === 'register') && (
            <>
              <input name="email" type="email" placeholder="University Email (.edu)" required className="input-field" value={formData.email} onChange={handleChange} />
              <PasswordInput name="password" value={formData.password} onChange={handleChange} placeholder="Password" />
            </>
          )}

                    {view === 'two-fa' && (
            <>
              <p className="text-sm text-gray-600">We sent a login code to <strong>{pendingEmail}</strong> to verify this new device.</p>
              <input placeholder="Enter 6-digit code" required className="input-field" value={code} onChange={(e) => setCode(e.target.value)} autoFocus />
            </>
          )}

          {view === 'verify-email' && (
            <>
              <p className="text-sm text-gray-600">We sent a 6-digit code to <strong>{pendingEmail}</strong> (valid 15 min).</p>
              <input placeholder="Enter 6-digit code" required className="input-field" value={code} onChange={(e) => setCode(e.target.value)} />
            </>
          )}

          {view === 'forgot' && forgotStep === 1 && (
            <input name="email" type="email" placeholder="Enter your email — fully editable" required className="input-field" autoComplete="off" />
          )}

          {view === 'forgot' && forgotStep === 2 && (
            <>
              <p className="text-sm text-gray-600">Code sent to <strong>{pendingEmail}</strong>. It expires in 15 minutes.</p>
              <input placeholder="Enter 6-digit code" required className="input-field" value={code} onChange={(e) => setCode(e.target.value)} />
            </>
          )}

          {view === 'forgot' && forgotStep === 3 && (
            <>
              <PasswordInput name="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New Password (min 8 chars)" />
              <PasswordInput name="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm New Password" />
            </>
          )}

          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
                        {view === 'two-fa' && 'Verify & Login'}
            {view === 'login' && 'Sign In'}
            {view === 'register' && 'Create Account'}
            {view === 'verify-email' && 'Verify Email'}
            {view === 'forgot' && (forgotStep === 1 ? 'Send Reset Code' : forgotStep === 2 ? 'Verify Code' : 'Reset Password')}
          </button>

          {(view === 'verify-email' || (view === 'forgot' && forgotStep > 1)) && (
            <button type="button" onClick={handleResend} className="w-full text-sm text-blue-600 hover:underline">Resend Code</button>
          )}
        </form>

        {view === 'login' && import.meta.env.VITE_GOOGLE_CLIENT_ID && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs text-gray-500">Or continue with</p>
            <GoogleLogin
              onSuccess={async (cred) => {
                try {
                  const { data } = await authAPI.googleLogin(cred.credential);
                  localStorage.setItem('token', data.token);
                  window.location.reload();
                } catch (err) { setError(err.response?.data?.message || 'Google login failed'); }
              }}
              onError={() => setError('Google login failed')}
            />
          </div>
        )}

        <p className="text-center text-sm text-gray-500">
          {view === 'login' ? (
            <>
              <button onClick={() => switchView('register')} className="text-blue-600 hover:underline">Need an account? Register</button>
              <br />
              <button onClick={() => switchView('forgot')} className="text-blue-600 hover:underline mt-2">Forgot Password?</button>
            </>
          ) : (
            <button onClick={() => switchView('login')} className="text-blue-600 hover:underline">Back to Login</button>
          )}
        </p>
      </div>
    </div>
  );
};

export default AuthPage;