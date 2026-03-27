import { useEffect, useState } from 'react';
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, orderBy, getDocs } from "firebase/firestore";
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
          where("userId", "==", user.uid),
          orderBy("completedAt", "desc")
        );
        const snap = await getDocs(q);
        setDrillResults(snap.docs.map(d => ({ id: d.id, ...d.data() })));
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

        <h2 className="subtitle" style={{ fontWeight: '700', color: '#111827', marginBottom: '12px' }}>
          Drill History ({drillResults.length})
        </h2>

        {drillResults.length === 0 ? (
          <p className="label-text">No drills completed yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            {drillResults.map(result => (
              <div key={result.id} style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '12px' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#6b7280' }}>
                  {result.completedAt?.toDate().toLocaleDateString()} — {result.timeTaken}s
                </p>
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
