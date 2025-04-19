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
import DataReports from './components/DataReports';     // ← NEW
import SignupPage from './components/SignupPage';
import VerifyEmailRedirect from './components/VerifyEmailRedirect';
import PlaylistView from './components/PlaylistView';
import ArtistProfile from './components/ArtistProfile';
import Search from './components/Search';
import AlbumView from './components/AlbumView';
import Explore from './components/Explore';
import AudioPlayerUI from './components/AudioPlayerUI';
import { AudioProvider, useAudio } from './contexts/AudioContext';
import { ToastProvider } from './contexts/ToastContext';
import './App.css';

function AudioPlayerWrapper() {
  const { currentSong, queue, setCurrentSong, setQueue, history, addToHistory } = useAudio();

  function handlePlayNext(nextSong) {
    if (nextSong && typeof nextSong === 'object') {
      if (currentSong) addToHistory(currentSong);
      setCurrentSong(nextSong);
      return;
    }
    if (queue?.length > 0) {
      const [nextQueueSong, ...rest] = queue;
      if (currentSong) addToHistory(currentSong);
      setCurrentSong(nextQueueSong);
      setQueue(rest);
    }
  }

  function handlePlayPrev(prevSong) {
    if (prevSong && typeof prevSong === 'object') {
      if (currentSong) setQueue([currentSong, ...queue]);
      setCurrentSong(prevSong);
      return;
    }
    if (history?.length > 0) {
      const previous = history[history.length - 1];
      if (currentSong) setQueue([currentSong, ...queue]);
      setCurrentSong(previous);
    }
  }

  return (
    <AudioPlayerUI
      currentSong={currentSong}
      queue={queue}
      onNext={handlePlayNext}
      onPrev={handlePlayPrev}
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
      <ToastProvider>
        <Router>
          <Header user={user} />
          <AudioPlayerWrapper />

          <div className="app-container">
            <Routes>
              <Route path="/" element={<Home />} />

              <Route
                path="/profile/:userId"
                element={<SignedIn><Profile /></SignedIn>}
              />

              <Route path="/artist/:artistId" element={<ArtistProfile />} />
              <Route path="/playlist/:playlistId" element={<PlaylistView />} />
              <Route path="/about" element={<About />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route
                path="/signup/verify-email-address"
                element={<VerifyEmailRedirect />}
              />

              {/* Admin pages */}
              <Route path="/adminportal" element={<AdminPortal />} />
              <Route path="/admin/reports" element={<DataReports />} />  {/* ← NEW */}

              <Route path="/search" element={<Search />} />
              <Route path="/album/:albumId" element={<AlbumView />} />
              <Route path="/explore" element={<Explore />} />

              <Route
                path="*"
                element={<SignedOut><LoginPage /></SignedOut>}
              />
            </Routes>
          </div>
        </Router>
      </ToastProvider>
    </AudioProvider>
  );
}

export default App;