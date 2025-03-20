/* eslint-disable no-unused-vars */

/**
 * Disables ESLint warnings for unused variables.
 * These variables are related to the upload song functionality, which is currently
 * commented out and will be re-implemented once user authentication is in place.
 * We need authentication to ensure that only verified users can post songs.
 * Once authentication is set up, we will restore the upload feature and remove this ESLint rule.
 */

import './clerk.css'; // Import your custom clerk CSS first
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import Home from './components/Home';
import Header from './components/Header';
import Profile from './components/Profile';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import VerifyEmailRedirect from './components/VerifyEmailRedirect';
import About from './components/About';
import AudioPlayer from './components/AudioPlayer'; // Persistent audio player
import { AudioProvider } from './contexts/AudioContext'; // Wrap the entire app
import './App.css';

function App() {
  const { isSignedIn, user } = useUser();

  useEffect(() => {
    console.log("✅ Custom CSS loaded: clerk.css");
  }, []);

  return (
    <AudioProvider>
      <Router>
        <Header user={user} />
        {/* The AudioPlayer is rendered outside of <Routes> 
            so it persists across all pages */}
        <AudioPlayer />
        <div className="app-container">
          <Routes>
            <Route path="/" element={<Home />} />

            <Route
              path="/profile/:userId"
              element={
                <SignedIn>
                  <Profile />
                </SignedIn>
              }
            />

            <Route path="/about" element={<About />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/signup/verify-email-address" element={<VerifyEmailRedirect />} />

            {/* Catch-all route for signed out users */}
            <Route
              path="*"
              element={
                <SignedOut>
                  <LoginPage />
                </SignedOut>
              }
            />
          </Routes>
        </div>
      </Router>
    </AudioProvider>
  );
}

export default App;