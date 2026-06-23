import { useEffect, useState } from 'react';
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { doc, collection, query, where, getDocs, setDoc } from "firebase/firestore";
import "../App.css";
import { useUser } from '../context/UserContext';
import { ActivityCalendar } from 'react-activity-calendar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import HelpModal from '../components/HelpModal';
import { BADGES } from '../utils/achievements';

function Account() {
  const navigate = useNavigate();
  const { profile, loading: profileLoading, user } = useUser();
  const [drillResults, setDrillResults] = useState([]);
  const [allDrills, setAllDrills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profileLoading) return;
    if (!user) {
      navigate('/');
      return;
    }

    async function loadData() {
      try {
        const q = query(
          collection(db, "drillResults"),
          where("userId", "==", user.uid)
        );
        const snap = await getDocs(q);
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAllDrills(all);

        const bestByRef = {};
        all.forEach(r => {
          if (!r.reference) return;
          const existing = bestByRef[r.reference];
          if (!existing || r.accuracy > existing.accuracy) {
            bestByRef[r.reference] = r;
          }
        });

        const results = Object.values(bestByRef)
          .sort((a, b) => b.completedAt?.toDate() - a.completedAt?.toDate());
        setDrillResults(results);
      } catch (err) {
        console.error("Error loading account data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [navigate, user, profileLoading]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/', { viewTransition: true });
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleChangeUsername = async () => {
    const newUsername = window.prompt("Enter your new username:");
    if (!newUsername || !newUsername.trim()) return;
    const trimmedUsername = newUsername.trim().slice(0, 30);
    if (!user) return;
    try {
      await setDoc(
        doc(db, "users", user.uid),
        { username: trimmedUsername },
        {merge: true}
      );
      setError('');
    } catch (err) {
      console.error("Error updating username:", err);
      setError('Failed to update username.');
    }
  };

  // Calculations
  const heatmapData = [];
  const chartData = [];

  if (allDrills.length > 0) {
    const activityMap = {};
    allDrills.forEach(d => {
      if (!d.completedAt) return;
      const dateStr = d.completedAt.toDate().toISOString().split('T')[0];
      activityMap[dateStr] = (activityMap[dateStr] || 0) + 1;
      
      if (d.timeTaken && d.passage) {
        const words = d.passage.split(' ').length;
        const wpm = Math.round((words / d.timeTaken) * 60);
        chartData.push({
          date: new Date(d.completedAt.toDate()).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}),
          wpm,
          accuracy: d.accuracy || 0,
          timestamp: d.completedAt.toDate().getTime()
        });
      }
    });

    Object.keys(activityMap).forEach(date => {
      heatmapData.push({
        date,
        count: activityMap[date],
        level: Math.min(4, Math.ceil(activityMap[date] / 2))
      });
    });

    chartData.sort((a, b) => a.timestamp - b.timestamp);
  }

  if (loading || profileLoading) {
    return (
      <div className="page-container">
        <p className="loading-text">Loading account...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="modern-card account-card" style={{ position: 'relative' }}>
        <h1 className="title">Account</h1>
        
        <div style={{ position: 'absolute', top: '24px', right: '20px' }}>
          <HelpModal title="Your Account Dashboard">
            <p><strong>Activity Map:</strong> Shows how many drills you complete each day. The darker the color, the more drills you did!</p>
            <p><strong>Performance Trends:</strong> A graph comparing your Words Per Minute (speed) and Accuracy over time.</p>
            <p><strong>Memorized Verses:</strong> Verses you successfully completed on Level 4 with 100% accuracy.</p>
          </HelpModal>
        </div>

        <div className="account-columns">
          {/* Left column */}
          <div className="account-col-left">
            {profile && (
              <div className="profile-section">
                <p className="label-text">Email</p>
                <p className="field-value">{profile.email}</p>

                <div className="username-row">
                  <p className="field-value">{profile.username || profile.email}</p>
                  <button onClick={handleChangeUsername} className="btn-modern btn-xs">Change Username</button>
                </div>
                {error && <p className="account-error">{error}</p>}

                <p className="label-text" style={{ marginTop: '8px' }}>Preferred Translation</p>
                <p className="field-value field-value--upper">{profile.preferredTranslation}</p>
              </div>
            )}

            {profile && (
              <div className="profile-section" style={{ marginTop: '32px' }}>
                <h2 className="subtitle subtitle--strong">Badges & Achievements</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                  {Object.values(BADGES).map(badge => {
                    const isEarned = profile.achievements?.includes(badge.id);
                    return (
                      <div key={badge.id} style={{ 
                        opacity: isEarned ? 1 : 0.4, 
                        filter: isEarned ? 'none' : 'grayscale(100%)',
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        width: '90px',
                        textAlign: 'center'
                      }}>
                        <div style={{ 
                          width: '56px', height: '56px', borderRadius: '50%', 
                          backgroundColor: isEarned ? '#fef3c7' : '#e5e7eb',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          marginBottom: '8px', border: `2px solid ${isEarned ? '#f59e0b' : '#9ca3af'}`,
                          boxShadow: isEarned ? '0 4px 12px rgba(245, 158, 11, 0.2)' : 'none'
                        }}>
                          <span style={{ fontSize: '24px' }}>{isEarned ? '🏆' : '🔒'}</span>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: '700', lineHeight: '1.2', color: '#1a1209' }}>{badge.title}</span>
                        <span style={{ fontSize: '10px', color: '#6b5c4e', marginTop: '4px' }}>{badge.description}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {profile?.memorizedVerses?.length > 0 && (
              <div className="profile-section">
                <h2 className="subtitle subtitle--strong">Memorized Verses</h2>
                <div className="memorized-verses-list">
                  {profile.memorizedVerses.map(ref => (
                    <div key={ref} className="memorized-verse-item">
                      <span className="verse-checkmark">✓</span>
                      <p className="verse-ref">{ref}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={handleSignOut} className="btn-danger">
              Sign Out
            </button>
          </div>

          {/* Right column */}
          <div className="account-col-right" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Heatmap Section */}
            <div>
              <h2 className="subtitle subtitle--strong">Activity Map</h2>
              {allDrills.length === 0 ? (
                <p className="empty-state-subtitle">Complete drills to see your activity.</p>
              ) : (
                <div style={{ background: '#ffffff', border: '1px solid #e8ddd4', padding: '16px', borderRadius: '12px' }}>
                  <ActivityCalendar 
                    data={heatmapData} 
                    theme={{
                      light: ['#f0f0f0', '#c4edde', '#7ac7c4', '#f73859', '#8b0000'],
                    }}
                  />
                </div>
              )}
            </div>

            {/* Charts Section */}
            {chartData.length > 0 && (
              <div>
                <h2 className="subtitle subtitle--strong">Performance Trends</h2>
                <div style={{ background: '#ffffff', border: '1px solid #e8ddd4', padding: '16px', borderRadius: '12px', width: '100%', height: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="wpm" stroke="#8b0000" activeDot={{ r: 8 }} name="WPM" />
                      <Line yAxisId="right" type="monotone" dataKey="accuracy" stroke="#10b981" name="Accuracy %" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div>
              <h2 className="subtitle subtitle--strong">
                Best Drill Results{drillResults.length > 0 ? ` (${drillResults.length})` : ''}
              </h2>

              {drillResults.length === 0 ? (
                <div className="empty-state">
                  <p className="empty-state-title">No drills yet</p>
                  <p className="empty-state-subtitle">Your attempts will appear here.</p>
                  <button className="empty-state-btn" onClick={() => navigate('/typing-drill')}>
                    Start your first drill
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {drillResults.map(result => {
                    const acc = result.accuracy ?? 0;
                    const accColor = acc >= 90 ? '#10b981' : acc >= 70 ? '#f59e0b' : '#ef4444';
                    return (
                      <div key={result.id} className="drill-result-card">
                        <div>
                          <p className="drill-result-ref">{result.reference || '—'}</p>
                          <p className="drill-result-date">
                            {result.completedAt?.toDate().toLocaleDateString()} &middot; Level {result.level ?? 1}{result.timeTaken ? ` · ${result.timeTaken}s` : ''}
                          </p>
                        </div>
                        <span className="drill-result-badge" style={{ background: accColor }}>
                          {acc}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Account;
