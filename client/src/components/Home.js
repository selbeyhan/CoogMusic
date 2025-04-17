/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './Home.css';
import { useToast } from '../contexts/ToastContext';

function Home() {
  const [topSongs, setTopSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const audioRef = useRef(null);
  const { showSuccess, showError, showInfo } = useToast();

  useEffect(() => {
    // Fetch the top 5 songs from your backend endpoint
    axios.get('/top-songs')
      .then(response => setTopSongs(response.data))
      .catch(error => {
        console.error('Error fetching top songs:', error);
      });
  }, []);

  const handleAddToPlaylist = (songId) => {
    if (!currentUser) {
      // Replace alert with toast
      showInfo("Please sign in to add songs to playlists");
      return;
    }

    setSelectedSongId(songId);
    setShowPlaylistDropdown(true);
  };


  const confirmAddToPlaylist = async () => {
    if (!selectedPlaylistId) {
      // Replace alert with toast
      showError("Please select a playlist");
      return;
    }

    try {
      if (selectedPlaylistId === "create_new") {
        // Create new playlist
        // ...

        // Replace alert with toast
        showSuccess("Song added to your new playlist!");
      } else {
        // Add to existing playlist
        // ...

        // Replace alert with toast
        showSuccess("Song added to playlist!");
      }

      // Reset state
      // ...
    } catch (error) {
      console.error("Error adding song to playlist:", error);

      // Replace alert with toast
      showError("Failed to add song to playlist. Please try again.");
    }
  };
  // Handle song row click: pause current audio (if any) and set the new song
  const handleSongClick = (song) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setCurrentSong(song);
  };

  // When currentSong updates, load the new source and play
  useEffect(() => {
    if (audioRef.current && currentSong) {
      audioRef.current.load();
      audioRef.current.play();
    }
  }, [currentSong]);

  return (
    <div className="home-container">
      {/* Logo Section */}
      <div className="logo-container">
        <img
          src="/coogmusiclogonobg.png"
          alt="CoogMusic Logo"
          className="coogmusic-logo"
        />
      </div>

      {/* Headline */}
      <h1 className="welcome-text">Welcome to CoogMusic!</h1>
      <p className="subtitle">The #1 place for all your UH music streaming needs.</p>

      {/* Top Songs Table */}
      <div className="top-songs-container">
        <h2>Top 5 Most Streamed Songs</h2>
        <div className="table-scroll">
          <table className="top-songs-table">
            <thead>
              <tr>
                <th>Song</th>
                <th>Artist</th>
                <th>Streams</th>
              </tr>
            </thead>
            <tbody>
              {topSongs.map((song, index) => (
                <tr
                  key={index}
                  onClick={() => handleSongClick(song)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{song.title}</td>
                  <td>{song.file_url}</td>
                  <td>{song.musician_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Always-visible Audio Player */}
      {/* Always-visible Audio Player */}
      <div className="audio-player">
        <audio ref={audioRef} controls src={currentSong ? currentSong.file_url : undefined}>
          Your browser does not support the audio element.
        </audio>
      </div>
    </div>
  );
}

export default Home;
