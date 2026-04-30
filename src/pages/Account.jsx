import { useEffect, useState } from 'react';
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs, setDoc } from "firebase/firestore";
import "../App.css";
function Account() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [drillResults, setDrillResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/');
      return;
    }

    async function loadData() {
      try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists()) {
          setProfile(userSnap.data());
        }

        const q = query(
          collection(db, "drillResults"),
          where("userId", "==", user.uid)
        );
        const snap = await getDocs(q);
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));

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
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // This should update the username when called
  const handleChangeUsername = async () => {
    const newUsername = window.prompt("Enter your new username:");
    if (!newUsername || !newUsername.trim()) return;
    const trimmedUsername = newUsername.trim().slice(0, 30);// ensures the username is not outrageously long
    const user = auth.currentUser;
    if (!user) return;// Sanity check; there should always be a user at this point
    try {
      await setDoc(
        doc(db, "users", user.uid),
        { username: trimmedUsername },// completes the db update
        {merge: true}
      );
      
      setProfile(prev => ({ ...prev, username: trimmedUsername })); //completes the local update
      setError('');
    } catch (err) {
      console.error("Error updating username:", err);
      setError('Failed to update username.');
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <p className="loading-text">Loading account...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="modern-card account-card">
        <h1 className="title">Account</h1>

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
          <div className="account-col-right">
            <h2 className="subtitle subtitle--strong">
              Drill History{drillResults.length > 0 ? ` (${drillResults.length})` : ''}
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
  );
}

export default Account;
