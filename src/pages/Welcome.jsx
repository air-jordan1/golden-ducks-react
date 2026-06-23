import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import "../App.css";
import { useUser } from '../context/UserContext';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import HelpModal from '../components/HelpModal';
import { getVerseOfTheDay } from '../data/DailyVerses';
import { getPipelineCategory } from '../utils/srs';

const StreakIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
  </svg>
);

const GoalIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

function Welcome() {
  const { profile, user } = useUser();
  const navigate = useNavigate();
  const [dueVerses, setDueVerses] = useState([]);
  const [srsPipeline, setSrsPipeline] = useState({ Learning: 0, Familiar: 0, Mastered: 0 });
  const [loadingSRS, setLoadingSRS] = useState(true);

  const currentStreak = profile?.currentStreak || 0;
  const drillsToday = profile?.drillsToday || 0;

  useEffect(() => {
    if (!user) return;
    
    async function fetchSRS() {
      try {
        const q = query(collection(db, "verseProgress"), where("userId", "==", user.uid));
        const snap = await getDocs(q);
        
        const due = [];
        const pipeline = { Learning: 0, Familiar: 0, Mastered: 0 };
        const now = Date.now();
        
        snap.forEach(doc => {
          const data = doc.data();
          const category = getPipelineCategory(data.srsLevel || 0);
          pipeline[category]++;
          
          if (data.nextReviewDate) {
            const reviewTime = new Date(data.nextReviewDate).getTime();
            if (now >= reviewTime) {
              due.push(data.reference);
            }
          }
        });
        
        setSrsPipeline(pipeline);
        setDueVerses(due);
      } catch (err) {
        console.error("Failed to load SRS data", err);
      } finally {
        setLoadingSRS(false);
      }
    }
    
    fetchSRS();
  }, [user]);

  const handleReviewDue = () => {
    if (dueVerses.length > 0) {
      navigate('/typing-drill', { state: { list: dueVerses } });
    }
  };

  const verseOfTheDay = getVerseOfTheDay();
  const todayStr = new Date().toISOString().split('T')[0];
  const isDailyCompleted = profile?.dailyChallengeCompletedDate === todayStr;

  const handleDailyChallenge = () => {
    navigate('/typing-drill', { state: { dailyChallengeReference: verseOfTheDay, isDailyChallenge: true } });
  };

  return (
    <div className="dashboard-page">
      {/* Hero */}
      <section className="dashboard-hero" style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: '24px', right: '40px' }}>
          <HelpModal title="Dashboard">
            <p><strong>Streaks:</strong> Practice every day to maintain your streak!</p>
            <p><strong>Daily Goal:</strong> Try to complete at least 3 drills a day.</p>
            <p><strong>Spaced Repetition (SRS):</strong> We will automatically remind you to review verses that you haven't practiced in a few days. This is scientifically proven to improve long-term memorization.</p>
          </HelpModal>
        </div>
        <h1 className="dashboard-greeting">What do you want to do?</h1>
        <p className="dashboard-tagline">Pick a tool to help you memorize, view your progress, or manage your settings.</p>
        
        <div style={{display: 'flex', gap: '16px', marginTop: '20px', flexWrap: 'wrap', justifyContent: 'center'}}>
          <div className="modern-card" style={{flex: '0 1 280px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px'}}>
            <div style={{color: '#8b0000', display: 'flex'}}><StreakIcon /></div>
            <div style={{textAlign: 'left'}}>
              <h3 style={{margin: 0, fontSize: '18px'}}>{currentStreak} Day Streak</h3>
              <p style={{margin: 0, fontSize: '14px', color: 'var(--text-muted)'}}>Keep it up!</p>
            </div>
          </div>
          <div className="modern-card" style={{flex: '0 1 280px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px'}}>
            <div style={{color: '#f59e0b', display: 'flex'}}><GoalIcon /></div>
            <div style={{textAlign: 'left'}}>
              <h3 style={{margin: 0, fontSize: '18px'}}>{drillsToday} / 3 Drills</h3>
              <p style={{margin: 0, fontSize: '14px', color: 'var(--text-muted)'}}>Daily Goal</p>
            </div>
          </div>
        </div>
        
        {/* Daily Challenge Card */}
        <div className="modern-card" style={{ maxWidth: '576px', margin: '20px auto 0', padding: '24px', border: '2px solid #374151', background: '#f9fafb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: '0 0 8px', color: '#111827' }}>Daily Global Challenge</h3>
                {isDailyCompleted && <span style={{ backgroundColor: '#10b981', color: 'white', fontSize: '12px', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold', marginBottom: '8px' }}>Completed!</span>}
              </div>
              <p style={{ margin: '0 0 16px', color: '#4b5563', fontSize: '15px' }}>
                Join everyone worldwide in memorizing today's verse: <strong>{verseOfTheDay}</strong>
              </p>
            </div>
          </div>
          {!isDailyCompleted && (
            <button className="btn-modern btn-dark" onClick={handleDailyChallenge} style={{ width: '100%' }}>
              Drill Today's Verse
            </button>
          )}
        </div>
        
        {/* SRS Pipeline Card */}
        {!loadingSRS && (
          <div className="modern-card" style={{ maxWidth: '576px', margin: '20px auto 0', padding: '24px', border: '2px solid #e5e7eb', background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#111827' }}>Memorization Pipeline</h3>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 4px', fontSize: '14px', color: '#6b7280', fontWeight: 'bold' }}>Learning</p>
                <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#3b82f6' }}>{srsPipeline.Learning}</p>
              </div>
              <div style={{ color: '#d1d5db', fontSize: '20px' }}>➔</div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 4px', fontSize: '14px', color: '#6b7280', fontWeight: 'bold' }}>Familiar</p>
                <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#f59e0b' }}>{srsPipeline.Familiar}</p>
              </div>
              <div style={{ color: '#d1d5db', fontSize: '20px' }}>➔</div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 4px', fontSize: '14px', color: '#6b7280', fontWeight: 'bold' }}>Mastered</p>
                <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>{srsPipeline.Mastered}</p>
              </div>
            </div>
            {dueVerses.length > 0 && (
              <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f3f4f6', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
                  <span style={{ color: '#ef4444', fontSize: '20px' }}>⚠️</span>
                  <p style={{ margin: 0, color: '#ef4444', fontWeight: 'bold', fontSize: '16px' }}>
                    {dueVerses.length} {dueVerses.length === 1 ? 'verse is' : 'verses are'} due for review
                  </p>
                </div>
                <button className="btn-modern btn-danger" onClick={handleReviewDue} style={{ width: '100%', padding: '12px' }}>
                  Review Now
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Dashboard Cards */}
      <div className="dashboard-cards">
        <Link to="/typing-drill" viewTransition className="dashboard-card">
          <div className="dashboard-card-icon icon-blue">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#8b0000" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h3>Typing Drill</h3>
          <p>Choose a verse and type it from memory to sharpen retention</p>
          <span className="dashboard-card-arrow">→</span>
        </Link>
        
        <Link to="/lists" viewTransition className="dashboard-card">
          <div className="dashboard-card-icon icon-purple">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#4f46e5" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </div>
          <h3>My Lists</h3>
          <p>Group verses together by topic for focused sequential drilling</p>
          <span className="dashboard-card-arrow">→</span>
        </Link>

        <Link to="/reference-quiz" viewTransition className="dashboard-card">
          <div className="dashboard-card-icon" style={{ backgroundColor: '#fff7ed', color: '#ea580c' }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3>Reference Quiz</h3>
          <p>Read a passage and try to identify its Scripture reference</p>
          <span className="dashboard-card-arrow">→</span>
        </Link>

        <Link to="/test" viewTransition className="dashboard-card">
          <div className="dashboard-card-icon" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3>Test Module</h3>
          <p>Generate a comprehensive test based on your past drill history</p>
          <span className="dashboard-card-arrow">→</span>
        </Link>

        <Link to="/account" viewTransition className="dashboard-card">
          <div className="dashboard-card-icon icon-green">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#6b4422" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3>My Account</h3>
          <p>View your drill history, accuracy scores, and memorized verses</p>
          <span className="dashboard-card-arrow">→</span>
        </Link>

        <Link to="/settings" viewTransition className="dashboard-card">
          <div className="dashboard-card-icon icon-purple">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#3d2b1f" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3>Settings</h3>
          <p>Choose your preferred Bible translation</p>
          <span className="dashboard-card-arrow">→</span>
        </Link>
      </div>
    </div>
  );
}

export default Welcome;
