import { signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { auth, provider, db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

const Login = () => {
  const navigate = useNavigate();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Google Sign-In Error:", error);
    }
  };

  const createUserProfileIfNew = async (user) => {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        email: user.email,
        preferredTranslation: "kjv",
        createdAt: new Date(),
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.email) {
        try {
          await createUserProfileIfNew(user);
        } catch (error) {
          console.error("Error creating user profile:", error);
        }
        navigate(`/welcome/${encodeURIComponent(user.email)}`);
      } else {
        setIsCheckingAuth(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  if (isCheckingAuth) {
    return (
      <div className="landing-loading">
        <p className="loading-text">Loading...</p>
      </div>
    );
  }

  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className="landing-nav">
        <div className="nav-left">
          <span className="nav-logo">Scripturize</span>
          <span className="nav-link">Study tools</span>
          <span className="nav-link">Translations</span>
        </div>
        <div className="nav-center">
          <div className="nav-search">
            <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0, color: '#9ca3af' }}>
              <circle cx="11" cy="11" r="8" />
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35" />
            </svg>
            <span>Search for verses...</span>
          </div>
        </div>
        <div className="nav-right">
          <button className="nav-btn-outline" onClick={handleGoogleSignIn}>Log in</button>
          <button className="nav-btn-primary" onClick={handleGoogleSignIn}>Sign up for free</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <h1 className="hero-title">
          How do you want to<br />memorize Scripture?
        </h1>
        <p className="hero-subtitle">
          Master the Word with Scripturize's interactive typing drills,<br />
          accuracy tracking, and verse memory tools.
        </p>
        <button className="hero-cta" onClick={handleGoogleSignIn}>Sign up for free</button>
        <button className="hero-secondary" onClick={handleGoogleSignIn}>Already have an account? Log in</button>
      </section>

      {/* Feature Cards */}
      <section className="landing-features">
        <div className="feature-card feature-blue">
          <h3>Typing Drills</h3>
          <p>Type out Bible verses from memory to reinforce deep retention</p>
        </div>
        <div className="feature-card feature-orange">
          <h3>Accuracy Tracking</h3>
          <div className="feature-stats">
            <div className="stat-item">
              <span className="stat-label">Score</span>
              <span className="stat-value">98%</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Verses</span>
              <span className="stat-value">24</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Time</span>
              <span className="stat-value">4m</span>
            </div>
          </div>
        </div>
        <div className="feature-card feature-lightblue">
          <h3>Translation Support</h3>
          <p>Study in KJV or ASV — choose the translation that works for you</p>
        </div>
        <div className="feature-card feature-yellow">
          <h3>Memory Vault</h3>
          <p>Every verse you type perfectly gets saved to your memory vault</p>
        </div>
      </section>
    </div>
  );
};

export default Login;
