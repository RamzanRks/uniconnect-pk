import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { profileAPI } from '../services/api';
import { useLocation, useNavigate } from 'react-router-dom';
import TourCelebration from './TourCelebration';

const STEPS = [
  { type: 'welcome', title: '🎓 Welcome to UniConnect PK', text: 'The professional network built exclusively for Pakistani university students. Connect, collaborate, and showcase your work like never before.' },
  { sel: 'a[href="/"]', path: '/', title: '📌 Project Board', text: 'Discover exciting projects from fellow students across Pakistan. Find teammates, apply with your skills, and build real-world projects together.' },
  { sel: 'a[href="/qa"]', path: '/qa', title: '💡 Q&A Hub', text: 'Stuck on a problem? Ask the community! Help others by sharing knowledge. Earn points and badges for being helpful. The best answers rise to the top.' },
  { sel: 'a[href="/inbox"]', path: '/inbox', title: '💬 Inbox', text: 'Real-time messaging with teammates. Send text, voice notes, files, and even code snippets. See who is typing and when messages are read.' },
  { sel: 'a[href="/leaderboard"]', path: '/leaderboard', title: '🏆 Leaderboard', text: 'Climb the ranks by being active! Earn points for posting, answering, rating teammates, and completing projects. See who is leading at your university.' },
  { sel: 'a[href="/profile"]', path: '/profile', title: '👤 Your Profile', text: 'Your digital identity. Showcase your skills, education, certificates, and achievements. Track your portfolio views and manage your reputation.' },
  { type: 'finish', title: '🎉 You Are Ready!', text: 'You have unlocked the full power of UniConnect PK. Start exploring, building, and connecting. Your journey to a stronger professional network begins now!' },
];

const Confetti = () => (
  <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
    {Array.from({ length: 120 }).map((_, i) => {
      const colors = ['#2563eb', '#7c3aed', '#e11d48', '#059669', '#d97706', '#ec4899', '#06b6d4', '#f59e0b'];
      const size = 4 + Math.random() * 8;
      return (
        <div key={i} className="absolute rounded-sm shadow-lg" style={{
          left: `${Math.random() * 100}%`, top: '-20px',
          width: `${size}px`, height: `${size * 1.4}px`,
          background: colors[i % colors.length],
          animation: `confFall ${2 + Math.random() * 2}s linear forwards`,
          animationDelay: `${Math.random() * 0.8}s`,
          transform: `rotate(${Math.random() * 360}deg)`,
        }} />
      );
    })}
    <style>{`@keyframes confFall{to{transform:translateY(110vh) rotate(1440deg);opacity:0}}`}</style>
  </div>
);

const OnboardingTour = () => {
  // ALL HOOKS AT TOP — before any early returns
  const { user, refreshUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(() => Number(sessionStorage.getItem('tourStep')) || 0);
  const [rect, setRect] = useState(null);
  const [done, setDone] = useState(false);
  const [rewardShown, setRewardShown] = useState(false);
  const [visited, setVisited] = useState({});
  const [celebrate, setCelebrate] = useState(false);

  const active = user && !user.onboarded;
  const s = STEPS[step];
  const isFeature = !!s?.path;
  const here = isFeature && location.pathname.startsWith(s.path);

  // Track visited pages
  useEffect(() => {
    if (here && s.path) {
      setVisited((v) => ({ ...v, [s.path]: true }));
    }
  }, [here, s.path]);

    useEffect(() => { sessionStorage.setItem('tourStep', String(step)); }, [step]);

  // Measure element position
  useEffect(() => {
    if (!active || step === 0 || step === STEPS.length - 1) {
      setRect(null);
      return;
    }
    const measure = () => {
      const el = document.querySelector(STEPS[step].sel);
      if (el) setRect(el.getBoundingClientRect());
      else setRect(null);
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [step, active]);

    // 🎬 Direct preview: visit any page with ?celebrate=1
  if (window.location.search.includes('celebrate=1')) {
    return (
      <TourCelebration
        onDone={() => window.history.replaceState(null, '', window.location.pathname)}
        name={`${user?.firstName || 'Member'} ${user?.lastName || ''}`}
      />
    );
  }
  // EARLY RETURN — after all hooks
  if (!active) return null;

  const finish = () => setCelebrate(true);

  const onCelebrateDone = async () => {
    setCelebrate(false);
    try {
          sessionStorage.removeItem('tourStep');
      await profileAPI.update({ onboarded: true });
      await refreshUser();
    } catch (e) { /* ignore */ }
  };

  const skip = async () => {
    if (!window.confirm('Skip the tour? You will miss 5 bonus points!')) return;
    try {
      await profileAPI.update({ onboarded: true });
      await refreshUser();
    } catch (e) { /* ignore */ }
  };

  const pad = 10;
  const isWelcome = step === 0;
  const isFinish = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[150]">
      {done && <Confetti />}
      
      {!isWelcome && !isFinish && rect && (
        <div className="absolute rounded-xl border-4 border-white transition-all duration-300" style={{
          left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.75)',
        }} />
      )}
      
      {!rect && !isWelcome && !isFinish && <div className="absolute inset-0 bg-black bg-opacity-75" />}

      {/* Main card */}
      <div className={`absolute bg-white rounded-3xl shadow-2xl p-8 transition-all duration-300 ${isWelcome || isFinish ? 'w-[480px] max-w-[90vw]' : 'w-80'}`} style={{
        left: isWelcome || isFinish ? '50%' : (rect ? Math.min(Math.max(rect.left, 12), window.innerWidth - 320) : window.innerWidth / 2 - 160),
        top: isWelcome || isFinish ? '50%' : (rect ? rect.bottom + 20 : window.innerHeight / 2 - 120),
        transform: isWelcome || isFinish ? 'translate(-50%, -50%)' : 'none',
      }}>
        {isWelcome && (
          <div className="text-center">
            <div className="text-6xl mb-4">🎓</div>
            {!rewardShown && (
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-bold px-4 py-2 rounded-full inline-block mb-4 shadow-lg animate-pulse">
                🎁 Complete the tour & earn 5 bonus points!
              </div>
            )}
          </div>
        )}

        <p className="font-extrabold text-xl text-gray-900 mb-2">{s.title}</p>
        <p className="text-sm text-gray-700 leading-relaxed">{s.text}</p>

        {isWelcome && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-gray-700">
            <p className="font-semibold mb-1">✨ What you will learn:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>How to find & join projects</li>
              <li>Where to ask questions & help others</li>
              <li>Real-time messaging features</li>
              <li>Your professional portfolio</li>
              <li>Earning points & climbing ranks</li>
            </ul>
          </div>
        )}

        {isFeature && !visited[s.path] && (
          <div className="mt-3 bg-orange-50 border border-orange-200 rounded-lg p-2 text-xs text-orange-700">
            👉 Click the button below to visit <strong>{s.title}</strong> and continue the tour.
          </div>
        )}

        {isFeature && visited[s.path] && (
          <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-2 text-xs text-green-700">
            ✅ You have visited {s.title}! Ready to continue.
          </div>
        )}

        <div className="flex justify-center gap-1.5 mt-5">
          {STEPS.map((_, i) => (
            <span key={i} className={`h-2 rounded-full transition-all ${i === step ? 'w-8 bg-gradient-to-r from-blue-600 to-purple-600' : i < step ? 'w-2 bg-green-500' : 'w-2 bg-gray-300'}`} />
          ))}
        </div>

        <div className="flex justify-between items-center mt-6">
          <button onClick={skip} className="text-xs text-gray-500 hover:text-gray-700 font-medium">
            {isWelcome ? 'Skip tour' : `Skip (${step + 1}/${STEPS.length})`}
          </button>
          <div className="flex gap-2">
            {step > 0 && !isWelcome && (
              <button onClick={() => setStep(step - 1)} className="text-xs bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 font-medium">
                ← Back
              </button>
            )}
            {isWelcome ? (
              <button onClick={() => { setRewardShown(true); setStep(1); }} className="text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-lg hover:opacity-90 font-bold shadow-lg">
                Start Tour →
              </button>
            ) : isFinish ? (
              <button onClick={finish} className="text-sm bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2.5 rounded-lg hover:opacity-90 font-bold shadow-lg">
                🎉 Claim 5 Points & Finish
              </button>
            ) : isFeature && !visited[s.path] ? (
              <button onClick={() => navigate(s.path)} className="text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-lg hover:opacity-90 font-bold shadow-lg">
                Open {s.title} →
              </button>
            ) : (
              <button onClick={() => setStep(step + 1)} className="text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-lg hover:opacity-90 font-bold shadow-lg">
                Next →
              </button>
            )}
          </div>
        </div>
      </div>

      {celebrate && <TourCelebration onDone={onCelebrateDone} name={`${user.firstName} ${user.lastName}`} />}
    </div>
  );
};

export default OnboardingTour;