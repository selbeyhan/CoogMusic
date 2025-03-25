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
import Header from './components/Header';
import Home from './components/Home';
import Profile from './components/Profile';
import About from './components/About';
import LoginPage from './components/LoginPage';
import AdminPortal from './components/AdminPortal';
import SignupPage from './components/SignupPage';
import VerifyEmailRedirect from './components/VerifyEmailRedirect';
import PlaylistView from './components/PlaylistView';
import ArtistProfile from './components/ArtistProfile';



import AudioPlayerUI from './components/AudioPlayerUI';
import { AudioProvider, useAudio } from './contexts/AudioContext';

import './App.css';

function AudioPlayerWrapper() {
  const { currentSong, queue, setCurrentSong, setQueue } = useAudio();

  const playNext = () => {
    if (queue.length) {
      setCurrentSong(queue[0]);
      setQueue(queue.slice(1));
    }
  };

  const playPrev = () => {
    // Implement history if desired; placeholder no‑op for now.
  };

  return (
    <AudioPlayerUI
      currentSong={currentSong}
      queue={queue}
      onNext={playNext}
      onPrev={playPrev}
    />
  );
}

function App() {
  const { user } = useUser();

  useEffect(() => {
    console.log('✅ Custom CSS loaded: clerk.css');
  }, []);

  return (
    <AudioProvider>
      <Router>
        <Header user={user} />

        {/* Persistent bottom audio player across all routes */}
        <AudioPlayerWrapper />

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
            <Route path="/artist/:artistId" element={<ArtistProfile />} />
            <Route path="/playlist/:playlistId" element={<PlaylistView />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/adminportal" element={<AdminPortal />} />
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
