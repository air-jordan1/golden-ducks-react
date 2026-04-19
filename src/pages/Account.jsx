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
        const allResults = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(r => r.accuracy >= 90)
          .sort((a, b) => b.completedAt?.toDate() - a.completedAt?.toDate());

        const seen = new Set();
        const results = allResults.filter(r => {
          if (!r.reference || seen.has(r.reference)) return false;
          seen.add(r.reference);
          return true;
        });
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
              <div style={{ marginBottom: '24px' }}>
                <p className="label-text">Email</p>
                <p style={{ fontWeight: '600', color: '#111827' }}>{profile.email}</p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <p style={{ fontWeight: '600', color: '#111827' }}>{profile.username || profile.email}</p>
                  <button onClick={handleChangeUsername} className="btn-modern" style={{ fontSize: '12px', padding: '4px 8px' }}>Change Username</button>
                </div>
                {error && <p style={{ color: 'red', fontSize: '14px', marginTop: '8px' }}>{error}</p>}

                <p className="label-text" style={{ marginTop: '8px' }}>Preferred Translation</p>
                <p style={{ fontWeight: '600', color: '#111827', textTransform: 'uppercase' }}>{profile.preferredTranslation}</p>
              </div>
            )}

            {profile?.memorizedVerses?.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h2 className="subtitle" style={{ fontWeight: '700', color: '#111827', marginBottom: '12px' }}>
                  Memorized Verses
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {profile.memorizedVerses.map(ref => (
                    <div key={ref} style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f0fdf4', padding: '12px 16px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                      <span style={{ fontSize: '18px' }}>✓</span>
                      <p style={{ margin: 0, fontWeight: '600', color: '#111827' }}>{ref}</p>
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
            <h2 className="subtitle" style={{ fontWeight: '700', color: '#111827', marginBottom: '12px' }}>
              Drill History ({drillResults.length})
            </h2>

            {drillResults.length === 0 ? (
              <p className="label-text">No completed drills yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {drillResults.map(result => (
                  <div key={result.id} style={{ backgroundColor: '#f9fafb', padding: '14px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontWeight: '600', color: '#111827', fontSize: '15px' }}>
                        {result.reference || '—'}
                      </p>
                      <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                        {result.completedAt?.toDate().toLocaleDateString()}
                      </p>
                    </div>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: '700',
                      backgroundColor: '#111827',
                      color: '#ffffff',
                      padding: '4px 10px',
                      borderRadius: '20px',
                    }}>
                      Level {result.level ?? 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Account;
