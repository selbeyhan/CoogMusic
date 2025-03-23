/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAudio } from '../contexts/AudioContext';
import { useUser } from '@clerk/clerk-react'; // Access current user
import AudioPlayerUI from './AudioPlayerUI'; // Custom audio player
import './Home.css';

function Home() {
  const [topSongs, setTopSongs] = useState([]);
  const { currentSong, setCurrentSong } = useAudio();
  const { user: currentUser } = useUser();

  // Playlist dropdown states
  const [playlists, setPlaylists] = useState([]);
  const [showPlaylistDropdown, setShowPlaylistDropdown] = useState(false);
  const [selectedSongId, setSelectedSongId] = useState(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState("");

  // 1. Fetch top songs once
  useEffect(() => {
    axios.get('/top-songs')
      .then(response => setTopSongs(response.data))
      .catch(error => {
        console.error('Error fetching top songs:', error);
      });
  }, []);

  // 2. Fetch user playlists if currentUser is available
  useEffect(() => {
    console.log("Current user ID:", currentUser?.id);

    if (currentUser) {
      axios.get(`/api/getuserplaylists/${currentUser.id}`)
        .then(response => {
          console.log("Fetched playlists:", response.data.playlists);
          setPlaylists(response.data.playlists || []);
        })
        .catch(error => console.error("Error fetching playlists:", error));
    }
  }, [currentUser]);

  // Play the clicked song & increment views
  const handleSongClick = (song) => {
    setCurrentSong(song);
    incrementViewCount(song.song_id);
  };

  const incrementViewCount = async (songId) => {
    try {
      const response = await axios.post(`/increment-view/${songId}`);
      console.log(response.data.message);
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  // Show dropdown to add a song to a playlist
  const handleAddToPlaylist = (songId) => {
    console.log("handleAddToPlaylist called for songId:", songId);
    console.log("Current playlists length:", playlists.length);

    if (playlists.length === 0) {
      if (window.confirm("You have no playlists. Would you like to create one now?")) {
        window.location.href = "/profile"; // or your profile route
      }
      return;
    }

    setSelectedSongId(songId);
    setShowPlaylistDropdown(true);
  };

  // Confirm adding the song to the chosen playlist
  const confirmAddToPlaylist = async () => {
    if (!selectedPlaylistId) {
      alert("Please select a playlist first.");
      return;
    }

    if (selectedPlaylistId === "create_new") {
      alert("Please create a new playlist in your profile.");
      setShowPlaylistDropdown(false);
      setSelectedSongId(null);
      setSelectedPlaylistId("");
      return;
    }

    try {
      const payload = {
        playlist_id: selectedPlaylistId,
        song_id: selectedSongId
      };
      console.log("Sending payload:", payload);
      const response = await axios.post('/api/addToPlaylist', payload);
      alert(response.data.message || "Song added to playlist!");
    } catch (error) {
      console.error("Error adding song to playlist:", error);
      alert("Failed to add song to playlist.");
    }
    setShowPlaylistDropdown(false);
    setSelectedSongId(null);
    setSelectedPlaylistId("");
  };

  const cancelPlaylistDropdown = () => {
    setShowPlaylistDropdown(false);
    setSelectedSongId(null);
    setSelectedPlaylistId("");
  };

  // Basic next/prev handlers for AudioPlayerUI
  const onNext = () => {
    if (!currentSong || topSongs.length === 0) return;
    const currentIndex = topSongs.findIndex(song => song.song_id === currentSong.song_id);
    const nextIndex = (currentIndex + 1) % topSongs.length;
    setCurrentSong(topSongs[nextIndex]);
  };

  const onPrev = () => {
    if (!currentSong || topSongs.length === 0) return;
    const currentIndex = topSongs.findIndex(song => song.song_id === currentSong.song_id);
    const prevIndex = (currentIndex - 1 + topSongs.length) % topSongs.length;
    setCurrentSong(topSongs[prevIndex]);
  };

  return (
    <div className="home-container">
      <div className="logo-container">
        <img
          src="/coogmusiclogonobg.png"
          alt="CoogMusic Logo"
          className="coogmusic-logo"
        />
      </div>

      <h1 className="welcome-text">Welcome to CoogMusic!</h1>
      <p className="subtitle">The #1 place for all your UH music streaming needs.</p>

      {/* Top Songs Table */}
      <div className="top-songs-container">
        <h2>Top 5 Most Streamed Songs</h2>
        <div className="table-scroll">
          <table className="top-songs-table">
            <thead>
              <tr>
                <th>Song Title</th>
                <th>Artist</th>
                <th>Views</th>
              </tr>
            </thead>
            <tbody>
              {topSongs.map((song, index) => (
                <tr
                  key={index}
                  onClick={() => handleSongClick(song)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToPlaylist(song.song_id);
                      }}
                      style={{ marginRight: '8px' }}
                    >
                      +
                    </button>
                    {song.title}
                  </td>
                  <td>{song.musician_name}</td>
                  <td>{song.views}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Newest Songs Section */}
      <div className="newest-songs-container" style={{ marginTop: '40px' }}>
        <h2>Newest Songs</h2>
        <div className="table-scroll">
          <table className="top-songs-table">
            <thead>
              <tr>
                <th>Song Title</th>
                <th>Artist</th>
                <th>Uploaded</th>
                <th>Views</th>
              </tr>
            </thead>
            <tbody>
              {topSongs
                .slice()
                .sort((a, b) => new Date(b.upload_date) - new Date(a.upload_date))
                .slice(0, 20)
                .map((song, index) => (
                  <tr
                    key={index}
                    onClick={() => handleSongClick(song)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToPlaylist(song.song_id);
                        }}
                        style={{ marginRight: '8px' }}
                      >
                        +
                      </button>
                      {song.title}
                    </td>
                    <td>{song.musician_name}</td>
                    <td>{new Date(song.upload_date).toLocaleDateString()}</td>
                    <td>{song.views}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dropdown for adding song to a playlist */}
      {showPlaylistDropdown && (
        <div className="playlist-dropdown-overlay">
          <div className="playlist-dropdown">
            <label>Select a Playlist:</label>
            <select
              value={selectedPlaylistId}
              onChange={(e) => {
                const value = e.target.value;
                console.log("Dropdown changed, selected playlist_id:", value);
                setSelectedPlaylistId(value);
              }}
            >
              <option value="">-- Select a Playlist --</option>
              {playlists.map((pl) => (
                <option key={pl.playlist_id} value={pl.playlist_id}>
                  {pl.name}
                </option>
              ))}
              <option value="create_new">Create New Playlist</option>
            </select>
            <div style={{ marginTop: '8px' }}>
              <button onClick={confirmAddToPlaylist} style={{ marginRight: '8px' }}>
                Add Song
              </button>
              <button onClick={cancelPlaylistDropdown}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Render AudioPlayerUI to control playback */}
      
    </div>
  );
}

export default Home;
