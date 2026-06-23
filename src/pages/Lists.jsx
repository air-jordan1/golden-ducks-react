import { useState } from 'react';
import { db } from "../firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import HelpModal from '../components/HelpModal';
import "../App.css";

function Lists() {
  const { profile, user } = useUser();
  const navigate = useNavigate();
  const [newListName, setNewListName] = useState('');
  
  const playlists = profile?.playlists || [];

  const handleCreateList = async () => {
    if (!newListName.trim() || !user) return;
    try {
      await updateDoc(doc(db, "users", user.uid), {
        playlists: arrayUnion({
          id: Date.now().toString(),
          name: newListName.trim(),
          references: []
        })
      });
      setNewListName('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddVerse = async (listId) => {
    const ref = window.prompt("Enter verse reference to add (e.g., Romans 8:28):");
    if (!ref || !ref.trim() || !user) return;
    
    try {
      const updatedPlaylists = playlists.map(p => {
        if (p.id === listId) {
          return { ...p, references: [...p.references, ref.trim()] };
        }
        return p;
      });
      await updateDoc(doc(db, "users", user.uid), {
        playlists: updatedPlaylists
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="page-container">
      <div className="modern-card" style={{ position: 'relative' }}>
        <h1 className="title">My Lists</h1>
        <p className="dashboard-tagline" style={{marginBottom: '24px'}}>Group verses together by topic for focused drilling.</p>
        
        <div style={{ position: 'absolute', top: '24px', right: '20px' }}>
          <HelpModal title="Using Lists">
            <p><strong>What are Lists?</strong></p>
            <p>Lists allow you to group multiple verses together so you can practice them back-to-back without having to enter each reference manually.</p>
            <p><strong>How to use:</strong></p>
            <ul style={{ paddingLeft: '20px' }}>
              <li>Create a new list by typing a name and clicking "Create".</li>
              <li>Click "+ Add Verse" and type a reference (e.g. "John 3:16") to add it to the list.</li>
              <li>Click "Drill Entire List" to jump straight into a Typing Drill for all the verses in sequence.</li>
            </ul>
          </HelpModal>
        </div>
        
        <div style={{display: 'flex', gap: '8px', marginBottom: '24px'}}>
          <input 
            type="text" 
            className="input" 
            placeholder="New list name..."
            value={newListName}
            onChange={e => setNewListName(e.target.value)}
          />
          <button className="btn-modern btn-dark" onClick={handleCreateList}>Create</button>
        </div>

        {playlists.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-subtitle">You haven't created any lists yet.</p>
          </div>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
            {playlists.map(playlist => (
              <div key={playlist.id} className="drill-result-card" style={{flexDirection: 'column', alignItems: 'stretch', gap: '12px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <h3 style={{margin: 0, fontSize: '18px'}}>{playlist.name}</h3>
                  <button 
                    className="btn-modern btn-xs" 
                    onClick={() => handleAddVerse(playlist.id)}
                  >
                    + Add Verse
                  </button>
                </div>
                
                {playlist.references.length === 0 ? (
                  <p style={{margin: 0, fontSize: '13px', color: '#6b7280'}}>No verses added yet.</p>
                ) : (
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                    {playlist.references.map((ref, i) => (
                      <span key={i} style={{background: '#f3f4f6', padding: '4px 10px', borderRadius: '12px', fontSize: '13px'}}>
                        {ref}
                      </span>
                    ))}
                  </div>
                )}
                
                {playlist.references.length > 0 && (
                  <button 
                    className="btn-modern btn-dark" 
                    style={{marginTop: '8px'}}
                    onClick={() => navigate('/typing-drill', { state: { list: playlist.references }})}
                  >
                    Drill Entire List
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Lists;
