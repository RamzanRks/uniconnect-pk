import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI, authAPI } from '../services/api';
import { GoogleLogin } from '@react-oauth/google';
import EvoBot from '../components/EvoBot';
import LivePortfolio from '../components/LivePortfolio';
import '../styles/auth.css';

import UniversitySearch from '../components/UniversitySearch';
import FieldPicker from '../components/FieldPicker';
import SkillSelector from '../components/SkillSelector';
import PasswordStrength from '../components/PasswordStrength';

import BrandLogo from '../components/BrandLogo';


const AuthPage = ({ mode }) => {
  const [view, setView] = useState(mode || 'register');
  const [forgotStep, setForgotStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '',
    university: '', campus: '', major: '', degreeLevel: '', skills: [], username: '',
  });
  const [pendingEmail, setPendingEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [usernameStatus, setUsernameStatus] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitDone, setSubmitDone] = useState(false);
  const [celebrateKey, setCelebrateKey] = useState(0);
  const [theme, setTheme] = useState(localStorage.getItem('uc-theme') || 'light');
  const [showPwd, setShowPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfPwd, setShowConfPwd] = useState(false);

  const { user, login } = useAuth();
  const prevPwdFocus = useRef(false);

  /* redirect if logged in */
  useEffect(() => {
    if (user) window.location.href = user.university === 'Not set' ? '/complete-profile' : '/';
  }, [user]);

  /* theme + dark class + hide app navbar */
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('uc-theme', theme);
    
  }, [theme]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleUsername = async (value) => {
    setFormData({ ...formData, username: value });
    if (!value || value.length < 3) { setUsernameStatus(''); return; }
    try {
      const { data } = await userAPI.checkUsername(value);
      setUsernameStatus(data.available ? '✅ Available' : '❌ Taken');
    } catch (e) { setUsernameStatus(''); }
  };

  const switchView = (v) => {
    setView(v); setError(''); setSuccess(''); setCode('');
    setForgotStep(1); setSubmitDone(false); setIsSubmitting(false);
    setNewPassword(''); setConfirmPassword('');
  };

  /* ---- wire Evo Bot ---- */
  useEffect(() => {
    const Bot = window.Bot;
    if (!Bot) return;
    if (formData.password) Bot.strength(formData.password); else Bot.hideStrength();
  }, [formData.password]);

  const onPwdFocus = () => { if (!prevPwdFocus.current) { prevPwdFocus.current = true; if (window.Bot) window.Bot.coverEyes(); } };
  const onPwdBlur = () => { prevPwdFocus.current = false; if (window.Bot) { window.Bot.uncoverEyes(); window.Bot.hideStrength(); } };

  const triggerCelebrate = () => { setCelebrateKey((k) => k + 1); if (window.Bot) window.Bot.celebrate(); };
  const triggerError = () => { if (window.Bot) window.Bot.error(); };

  /* password strength for caps warning */
  const onPwdKeyDown = (e) => {
    if (e.getModifierState && e.getModifierState('CapsLock') && window.Bot) {
      window.Bot.capsWarn();
    }
  };

  /* completion calc */
  const checks = [
    formData.firstName.trim(), formData.lastName.trim(),
    formData.university.trim(), formData.major.trim(),
    formData.username.trim(), formData.email.trim(),
    formData.password.length >= 8, formData.skills.length > 0,
  ];
  const completion = Math.round(checks.filter(Boolean).length / checks.length * 100);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setIsSubmitting(true);
    try {
      if (view === 'login') {
        const { data } = await authAPI.login({ email: formData.email, password: formData.password });
        if (data.twoFA) {
          setPendingEmail(data.email);
          setView('two-fa');
          setSuccess('🔐 New device detected! Check your email (or backend terminal) for the 6-digit login code.');
          setIsSubmitting(false); return;
        }
        if (!data.emailVerified) {
          localStorage.setItem('token', data.token);
          setPendingEmail(data.email);
          await authAPI.resendCode(data.email);
          setView('verify-email');
          setIsSubmitting(false); return;
        }
        localStorage.setItem('token', data.token);
        triggerCelebrate();
        window.location.href = data.university === 'Not set' ? '/complete-profile' : '/';
        return;
      } else if (view === 'register') {
        const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/;
        if (!passwordRegex.test(formData.password)) {
          setError('Password must be 8+ characters with an uppercase letter, a number and a symbol.');
          triggerError(); setIsSubmitting(false); return;
        }
        if (formData.password !== confirmPassword) {
          setError('Passwords do not match.'); triggerError(); setIsSubmitting(false); return;
        }
        if (!formData.university.trim()) { setError('Please select your university.'); setIsSubmitting(false); return; }
        if (!formData.major || !formData.degreeLevel) { setError('Please select your major and degree level.'); setIsSubmitting(false); return; }
        const payload = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          university: formData.university,
          campus: formData.campus,
          major: formData.major,
          degreeLevel: formData.degreeLevel,
          skills: formData.skills,
          username: formData.username,
        };
        const { data } = await authAPI.register(payload);
        setPendingEmail(data.email);
        setSubmitDone(true);
        triggerCelebrate();
        setTimeout(() => {
          switchView('verify-email');
          setSuccess('✅ Account created! Enter the 6-digit code we emailed you.');
        }, 1400);
        return;
      } else if (view === 'two-fa') {
        const { data } = await authAPI.verifyTwoFA(pendingEmail, code);
        localStorage.setItem('token', data.token);
        triggerCelebrate();
        window.location.href = '/';
      } else if (view === 'verify-email') {
        await authAPI.verifyEmail(pendingEmail, code);
        switchView('login');
        setSuccess('✅ Email verified! Please login.');
      } else if (view === 'forgot') {
        if (forgotStep === 1) {
          const email = String(new FormData(e.target).get('email') || '').trim();
          if (!email) { setError('Enter your email.'); setIsSubmitting(false); return; }
          await authAPI.forgotPassword(email);
          setPendingEmail(email);
          setSuccess('Code sent! Check your email (or backend terminal).');
          setForgotStep(2);
        } else if (forgotStep === 2) {
          await authAPI.checkCode(pendingEmail, code);
          setSuccess('✅ Code verified. Now set a new password.');
          setForgotStep(3);
        } else {
          if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); setIsSubmitting(false); return; }
          if (newPassword !== confirmPassword) { setError('Passwords do not match.'); setIsSubmitting(false); return; }
          await authAPI.resetPassword({ email: pendingEmail, code, newPassword });
          switchView('login');
          setSuccess('✅ Password reset! Login with your new password.');
        }
      }
      setIsSubmitting(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
      triggerError();
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    try { await authAPI.resendCode(pendingEmail); setSuccess('Code resent! (check email / backend terminal)'); }
    catch (err) { setError(err.response?.data?.message || 'Failed to resend'); }
  };

  const HEADLINES = {
    register: 'Join UniConnect',
    login: 'Welcome Back',
    'verify-email': 'Verify Email',
    'two-fa': 'Verify Device',
    forgot: forgotStep === 1 ? 'Reset Password' : forgotStep === 2 ? 'Enter Code' : 'New Password',
  };

  return (
    <div className="uc-root" data-theme={theme}>
      {/* ══════ 100% TOP BANNER ══════ */}
      <header className="uc-top">
        <div className="uc-logo">
  <BrandLogo size={42} />
  <div>
    <b>UniConnect <span style={{ color: '#00A3FF' }}>PK</span></b>
    <span>the living workshop</span>
  </div>
</div>
        <div className="uc-top-right">
          <button className={`uc-nav-btn${view === 'login' ? ' active' : ''}`} onClick={() => switchView('login')}>Login</button>
          <button className={`uc-nav-btn uc-nav-cta${view === 'register' ? ' active' : ''}`} onClick={() => switchView('register')}>Join Network</button>
          <button className="uc-switch" onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))} aria-label="toggle theme">
            <span className="uc-knob">{theme === 'dark' ? '🌙' : '☀️'}</span>
          </button>
        </div>
      </header>

      {/* ══════ 3-ZONE MAIN ══════ */}
      <main className={`uc-main${view === 'register' ? '' : ' is-login'}`}>
        {/* Zone 1 · Evo Robot (left) */}
        <div className="uc-zone uc-zone-robot">
          <EvoBot />
        </div>

        {/* Zone 2 · Live Portfolio (center) — register view only */}
        {view === 'register' && (
        <div className="uc-zone uc-zone-portfolio">
          <LivePortfolio
            firstName={formData.firstName}
            lastName={formData.lastName}
            university={formData.university}
            majorLabel={formData.major}
            username={formData.username}
            email={formData.email}
            skills={formData.skills}
            available={true}
            completion={completion}
            celebrateKey={celebrateKey}
          />
        </div>
        )}

        {/* Zone 3 · Form (right) */}
        <div className="uc-zone uc-zone-form">
          <div className="uc-form-card">
            <h1 className="uc-h1">{HEADLINES[view]}</h1>
            <p className="uc-sub">
              {view === 'register' && 'Connect with students. Build projects. Grow together.'}
              {view === 'login' && 'Sign in to continue to your dashboard.'}
              {view === 'verify-email' && `We sent a 6-digit code to ${pendingEmail} (valid 15 min).`}
              {view === 'two-fa' && `We sent a login code to ${pendingEmail} to verify this new device.`}
              {view === 'forgot' && forgotStep === 1 && 'Enter your email to receive a reset code.'}
              {view === 'forgot' && forgotStep === 2 && `Code sent to ${pendingEmail}. It expires in 15 minutes.`}
              {view === 'forgot' && forgotStep === 3 && 'Set a new strong password.'}
            </p>

            {error && <div className="uc-alert uc-alert-err">{error}</div>}
            {success && <div className="uc-alert uc-alert-ok">{success}</div>}

            <form onSubmit={handleSubmit} className="uc-form">
              {view === 'register' && (
                <>
                  <div className="uc-row">
                    <div className="uc-field">
                      <label className="uc-label">First name</label>
                      <input className="uc-in" name="firstName" placeholder="First name" required onChange={handleChange} />
                    </div>
                    <div className="uc-field">
                      <label className="uc-label">Last name</label>
                      <input className="uc-in" name="lastName" placeholder="Last name" required onChange={handleChange} />
                    </div>
                  </div>
                  <div className="uc-field">
                    <label className="uc-label">University *</label>
                    <UniversitySearch
                      value={formData.university}
                      onChange={(uni) => setFormData((f) => ({ ...f, university: uni, campus: '' }))}
                      campusValue={formData.campus || ''}
                      onCampusChange={(campus) => setFormData((f) => ({ ...f, campus }))}
                    />
                  </div>
                  <div className="uc-field">
                    <label className="uc-label">Major & Degree *</label>
                    <FieldPicker
                      value={formData.major}
                      level={formData.degreeLevel}
                      onChange={(major) => setFormData((f) => ({ ...f, major, degreeLevel: '' }))}
                      onLevelChange={(degreeLevel) => setFormData((f) => ({ ...f, degreeLevel }))}
                    />
                  </div>
                  <div className="uc-field">
                    <label className="uc-label">Username</label>
                    <input
                      className="uc-in"
                      name="username"
                      placeholder="username (3-20 chars)"
                      onChange={(e) => handleUsername(e.target.value)}
                    />
                    {usernameStatus && <span className="uc-status">{usernameStatus}</span>}
                  </div>
                  <div className="uc-field">
                    <label className="uc-label">Skills</label>
                    <SkillSelector
                      selectedSkills={formData.skills}
                      onAdd={(skill) => setFormData((f) => ({ ...f, skills: [...f.skills, skill] }))}
                      onRemove={(skill) => setFormData((f) => ({ ...f, skills: f.skills.filter((s) => s !== skill) }))}
                    />
                  </div>
                  <div className="uc-field">
                    <label className="uc-label">Email</label>
                    <input className="uc-in" name="email" type="email" placeholder="you@uni.edu.pk" required value={formData.email} onChange={handleChange} />
                  </div>
                  <div className="uc-field">
                    <label className="uc-label">Password</label>
                    <div className="uc-in-wrap">
                      <input
                        className="uc-in"
                        name="password"
                        type={showPwd ? 'text' : 'password'}
                        placeholder="••••••••"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        onFocus={onPwdFocus}
                        onBlur={onPwdBlur}
                        onKeyDown={onPwdKeyDown}
                      />
                      <button type="button" className="uc-eye" onClick={() => setShowPwd((s) => !s)}>{showPwd ? '🙈' : '👁️'}</button>
                    </div>
                    <PasswordStrength password={formData.password} />
                  </div>
                  <div className="uc-field">
                    <label className="uc-label">Confirm password</label>
                    <div className="uc-in-wrap">
                      <input
                        className="uc-in"
                        type={showConfPwd ? 'text' : 'password'}
                        placeholder="Repeat password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <button type="button" className="uc-eye" onClick={() => setShowConfPwd((s) => !s)}>{showConfPwd ? '🙈' : '👁️'}</button>
                    </div>
                    {confirmPassword && confirmPassword !== formData.password && (
                      <span className="uc-status" style={{ color: '#FF4D6D' }}>Passwords do not match</span>
                    )}
                  </div>
                </>
              )}

              {view === 'login' && (
                <>
                  <div className="uc-field">
                    <label className="uc-label">Email</label>
                    <input className="uc-in" name="email" type="email" placeholder="you@uni.edu.pk" required value={formData.email} onChange={handleChange} />
                  </div>
                  <div className="uc-field">
                    <label className="uc-label">Password</label>
                    <div className="uc-in-wrap">
                      <input
                        className="uc-in"
                        name="password"
                        type={showPwd ? 'text' : 'password'}
                        placeholder="••••••••"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        onFocus={onPwdFocus}
                        onBlur={onPwdBlur}
                        onKeyDown={onPwdKeyDown}
                      />
                      <button type="button" className="uc-eye" onClick={() => setShowPwd((s) => !s)}>{showPwd ? '🙈' : '👁️'}</button>
                    </div>
                  </div>
                </>
              )}

              {view === 'two-fa' && (
                <div className="uc-field">
                  <label className="uc-label">6-digit code</label>
                  <input className="uc-in" placeholder="Enter 6-digit code" required value={code} onChange={(e) => setCode(e.target.value)} autoFocus />
                </div>
              )}

              {view === 'verify-email' && (
                <div className="uc-field">
                  <label className="uc-label">6-digit code</label>
                  <input className="uc-in" placeholder="Enter 6-digit code" required value={code} onChange={(e) => setCode(e.target.value)} />
                </div>
              )}

              {view === 'forgot' && forgotStep === 1 && (
                <div className="uc-field">
                  <label className="uc-label">Email</label>
                  <input className="uc-in" name="email" type="email" placeholder="Enter your email" required autoComplete="off" />
                </div>
              )}

              {view === 'forgot' && forgotStep === 2 && (
                <div className="uc-field">
                  <label className="uc-label">6-digit code</label>
                  <input className="uc-in" placeholder="Enter 6-digit code" required value={code} onChange={(e) => setCode(e.target.value)} />
                </div>
              )}

              {view === 'forgot' && forgotStep === 3 && (
                <>
                  <div className="uc-field">
                    <label className="uc-label">New password</label>
                    <div className="uc-in-wrap">
                      <input
                        className="uc-in"
                        type={showNewPwd ? 'text' : 'password'}
                        placeholder="Min 8 chars"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <button type="button" className="uc-eye" onClick={() => setShowNewPwd((s) => !s)}>{showNewPwd ? '🙈' : '👁️'}</button>
                    </div>
                  </div>
                  <div className="uc-field">
                    <label className="uc-label">Confirm password</label>
                    <div className="uc-in-wrap">
                      <input
                        className="uc-in"
                        type={showConfPwd ? 'text' : 'password'}
                        placeholder="Repeat new password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <button type="button" className="uc-eye" onClick={() => setShowConfPwd((s) => !s)}>{showConfPwd ? '🙈' : '👁️'}</button>
                    </div>
                  </div>
                </>
              )}

              <button type="submit" className={`uc-submit${submitDone ? ' uc-done' : ''}`} disabled={isSubmitting}>
                {submitDone ? '✓ Account Created' : isSubmitting ? (view === 'register' ? 'Creating…' : 'Processing…') : (
                  <>
                    {view === 'two-fa' && 'Verify & Login'}
                    {view === 'login' && 'Sign In'}
                    {view === 'register' && 'Create Account'}
                    {view === 'verify-email' && 'Verify Email'}
                    {view === 'forgot' && (forgotStep === 1 ? 'Send Reset Code' : forgotStep === 2 ? 'Verify Code' : 'Reset Password')}
                  </>
                )}
                <span className="uc-arrow">{isSubmitting && !submitDone ? '↻' : '→'}</span>
              </button>

              {(view === 'verify-email' || (view === 'forgot' && forgotStep > 1)) && (
                <button type="button" onClick={handleResend} className="uc-resend">Resend Code</button>
              )}
            </form>

            {view === 'login' && import.meta.env.VITE_GOOGLE_CLIENT_ID && (
              <div className="uc-oauth">
                <div className="uc-oauth-line"><i></i><span>or continue with</span><i></i></div>
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

            <div className="uc-foot">
              {view === 'login' ? (
                <>
                  Need an account? <button onClick={() => switchView('register')}>Register</button>
                  <span className="uc-dot">•</span>
                  <button onClick={() => switchView('forgot')}>Forgot Password?</button>
                </>
              ) : (
                <>Already have an account? <button onClick={() => switchView('login')}>Back to Login</button></>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AuthPage;