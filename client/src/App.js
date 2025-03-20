/* eslint-disable no-unused-vars */

/**
 * Disables ESLint warnings for unused variables.
 * These variables are related to the upload song functionality, which is currently
 * commented out and will be re-implemented once user authentication is in place.
 * We need authentication to ensure that only verified users can post songs.
 * Once authentication is set up, we will restore the upload feature and remove this ESLint rule.
 */

import './clerk.css';
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
import CustomAudioPlayer from './components/CustomAudioPlayer'; // Use the custom player
import { AudioProvider } from './contexts/AudioContext';
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
        {/* Render custom audio player outside of Routes so it stays persistent */}
        <CustomAudioPlayer />
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