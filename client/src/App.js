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
import Search from './components/Search';
import AlbumView from './components/AlbumView';
import Explore from './components/Explore';
import AudioPlayerUI from './components/AudioPlayerUI';
import { AudioProvider, useAudio } from './contexts/AudioContext';
import './App.css';

// Audio player wrapper component
function AudioPlayerWrapper() {
  const { currentSong, queue, setCurrentSong, setQueue, history, addToHistory } = useAudio();

  function handlePlayNext(nextSong) {
    // If a specific song is provided (from album/playlist context)
    if (nextSong && typeof nextSong === 'object') {
      // Add current song to history if it exists
      if (currentSong) {
        addToHistory(currentSong);
      }
      
      // Play the provided song
      setCurrentSong(nextSong);
      return;
    }
    
    // Otherwise use the queue
    if (queue && queue.length > 0) {
      const nextQueueSong = queue[0];
      const remainingQueue = queue.slice(1);
      
      // Add current song to history if it exists
      if (currentSong) {
        addToHistory(currentSong);
      }
      
      // Update state
      setCurrentSong(nextQueueSong);
      setQueue(remainingQueue);
    }
  }

  function handlePlayPrev(prevSong) {
    // If a specific song is provided (from album/playlist context)
    if (prevSong && typeof prevSong === 'object') {
      // Add current song to the beginning of the queue if it exists
      if (currentSong) {
        setQueue([currentSong, ...queue]);
      }
      
      // Play the provided song
      setCurrentSong(prevSong);
      return;
    }
    
    // Otherwise use the history
    if (history && history.length > 0) {
      const previousSong = history[history.length - 1];
      
      // Add current song to the beginning of the queue if it exists
      if (currentSong) {
        setQueue([currentSong, ...queue]);
      }
      
      // Set the previous song as current
      setCurrentSong(previousSong);
    }
  }

  // Assign functions directly
  const playNext = handlePlayNext;
  const playPrev = handlePlayPrev;

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
            <Route path="/search" element={<Search />} />
            <Route path="/album/:albumId" element={<AlbumView />} />
            <Route path="/explore" element={<Explore />} />
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