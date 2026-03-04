import React from 'react';
import { signOut } from "firebase/auth";
import { auth } from "../firebase"; 
import { useNavigate } from "react-router-dom";
import "../App.css"; 
import BackButton from "./components/BackButton"; 

function Account() {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      console.log("User successfully signed out");
      navigate('/');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="page-container">
      <div className="modern-card">
        
        <BackButton />

        <h1 className="title">Account</h1>
        <p className="subtitle">Manage your settings and session here.</p>
        
        <button onClick={handleSignOut} className="btn-danger">
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default Account;