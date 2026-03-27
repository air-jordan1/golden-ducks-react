import { useEffect, useState } from 'react';
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import "../App.css";
import BackButton from "./components/BackButton";

function Account() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [drillResults, setDrillResults] = useState([]);
  const [loading, setLoading] = useState(true);

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
        const results = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
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

  if (loading) {
    return (
      <div className="page-container">
        <p className="loading-text">Loading account...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="modern-card">
        <BackButton />

        <h1 className="title">Account</h1>

        {profile && (
          <div style={{ marginBottom: '24px' }}>
            <p className="label-text">Email</p>
            <p style={{ fontWeight: '600', color: '#111827' }}>{profile.email}</p>
            <p className="label-text" style={{ marginTop: '8px' }}>Preferred Translation</p>
            <p style={{ fontWeight: '600', color: '#111827', textTransform: 'uppercase' }}>{profile.preferredTranslation}</p>
          </div>
        )}

        {profile?.memorizedVerses?.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
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

        <h2 className="subtitle" style={{ fontWeight: '700', color: '#111827', marginBottom: '12px' }}>
          Drill History ({drillResults.length})
        </h2>

        {drillResults.length === 0 ? (
          <p className="label-text">No drills completed yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            {drillResults.map(result => (
              <div key={result.id} style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                    {result.completedAt?.toDate().toLocaleDateString()}
                  </p>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span style={{ fontSize: '14px', color: '#10b981', fontWeight: '600' }}>{result.timeTaken}s</span>
                    {result.accuracy != null && (
                      <span style={{ fontSize: '14px', fontWeight: '600', color: result.accuracy >= 90 ? '#10b981' : result.accuracy >= 70 ? '#f59e0b' : '#ef4444' }}>
                        {result.accuracy}%
                      </span>
                    )}
                  </div>
                </div>
                <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#111827' }}>
                  <strong>Target:</strong> "{result.passage}"
                </p>
                <p style={{ margin: '0', fontSize: '14px', color: '#111827' }}>
                  <strong>Typed:</strong> "{result.userInput}"
                </p>
              </div>
            ))}
          </div>
        )}

        <button onClick={handleSignOut} className="btn-danger">
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default Account;
