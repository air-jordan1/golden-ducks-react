import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion, query, collection, where, getDocs, arrayRemove } from 'firebase/firestore';
import { useUser } from '../context/UserContext';
import '../App.css';

function Friends() {
  const { user, profile } = useUser();
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFriends() {
      setLoading(true);
      try {
        const followingUids = profile.following || [];
        if (followingUids.length === 0) {
          setFriends([]);
          setLoading(false);
          return;
        }

        // Firestore 'in' queries are limited to 10 items, but fine for prototype
        // To handle > 10, chunk the array
        const chunks = [];
        for (let i = 0; i < followingUids.length; i += 10) {
          chunks.push(followingUids.slice(i, i + 10));
        }

        let allFriends = [];
        for (const chunk of chunks) {
          const q = query(collection(db, 'users'), where('__name__', 'in', chunk));
          const snap = await getDocs(q);
          snap.forEach(docSnap => {
            allFriends.push({ id: docSnap.id, ...docSnap.data() });
          });
        }

        // Add self to leaderboard
        allFriends.push({ id: user.uid, ...profile, isMe: true });

        // Sort by streak descending
        allFriends.sort((a, b) => (b.currentStreak || 0) - (a.currentStreak || 0));
        setFriends(allFriends);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (!profile) return;
    fetchFriends();
  }, [profile, user.uid]);

  async function handleAddFriend(e) {
    e.preventDefault();
    setSearchError('');
    if (!searchQuery.trim()) return;

    try {
      const q = query(collection(db, 'users'), where('username', '==', searchQuery.trim()));
      const snap = await getDocs(q);
      if (snap.empty) {
        setSearchError('User not found. Check the username and try again.');
        return;
      }
      
      const foundUser = snap.docs[0];
      if (foundUser.id === user.uid) {
        setSearchError("You can't add yourself!");
        return;
      }

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        following: arrayUnion(foundUser.id)
      });

      setSearchQuery('');
      // profile will automatically update via onSnapshot in UserContext, which triggers useEffect
    } catch (err) {
      console.error(err);
      setSearchError('Error finding user.');
    }
  }

  async function handleRemove(friendId) {
    if (!window.confirm("Remove this friend?")) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        following: arrayRemove(friendId)
      });
    } catch (err) {
      console.error(err);
    }
  }

  if (loading && friends.length === 0) {
    return <div className="page-container"><p>Loading...</p></div>;
  }

  return (
    <div className="page-container">
      <div className="modern-card" style={{ maxWidth: '600px', margin: '40px auto', padding: '32px', textAlign: 'left' }}>
        <h1 className="title" style={{ marginBottom: '8px' }}>Friends Leaderboard</h1>
        <p className="subtitle" style={{ marginBottom: '32px' }}>Keep each other accountable by tracking streaks.</p>

        <form onSubmit={handleAddFriend} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <input
            type="text"
            className="input"
            placeholder="Add friend by username..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn-modern btn-dark" style={{ width: 'auto', padding: '0 24px' }}>Add</button>
        </form>
        {searchError && <p style={{ color: '#ef4444', fontSize: '14px', marginTop: '-8px', marginBottom: '24px' }}>{searchError}</p>}

        <div style={{ marginTop: '32px' }}>
          {friends.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{ color: '#6b7280' }}>You haven't added any friends yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {friends.map((friend, index) => (
                <div key={friend.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px',
                  border: friend.isMe ? '2px solid #f59e0b' : '1px solid #e5e7eb',
                  borderRadius: '12px',
                  background: friend.isMe ? '#fffbeb' : '#fff'
                }}>
                  <div style={{ width: '32px', fontWeight: 'bold', color: '#9ca3af' }}>
                    #{index + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 'bold', color: '#111827', fontSize: '16px' }}>
                      {friend.username || friend.email} {friend.isMe && '(You)'}
                    </p>
                    <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '14px' }}>
                      {friend.drillsToday || 0} drills today
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#d97706' }}>
                      <span style={{ fontSize: '20px' }}>🔥</span>
                      <span style={{ fontWeight: 'bold', fontSize: '18px' }}>{friend.currentStreak || 0}</span>
                    </div>
                  </div>
                  {!friend.isMe && (
                    <button 
                      onClick={() => handleRemove(friend.id)}
                      style={{ marginLeft: '16px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px' }}
                      title="Remove friend"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Friends;
