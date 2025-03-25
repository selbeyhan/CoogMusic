/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAudio } from '../contexts/AudioContext';
import { useUser } from '@clerk/clerk-react'; // Access current user
import AudioPlayerUI from './AudioPlayerUI'; // Custom audio player
import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  const [topSongs, setTopSongs] = useState([]);
  const [newestSongs, setNewestSongs] = useState([]);

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



  //get newest songs
  useEffect(() => {
    axios.get('/newest-songs')
      .then(response => setNewestSongs(response.data))
      .catch(error => {
        console.error('Error fetching newest songs:', error);
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
        // Prompt for playlist name instead of redirecting
        const playlistName = prompt("Enter a name for your new playlist:");
        
        if (playlistName && playlistName.trim()) {
          // Create the playlist and add the song to it
          createPlaylistAndAddSong(playlistName, songId);
        }
      }
      return;
    }
  
    setSelectedSongId(songId);
    setShowPlaylistDropdown(true);
  };
  
  // Add a new function to create a playlist and add a song to it
  const createPlaylistAndAddSong = async (playlistName, songId) => {
    try {
      // Create the playlist
      const createResponse = await axios.post('/api/createPlaylist', {
        name: playlistName,
        user_id: currentUser.id
      });
      
      if (createResponse.data && createResponse.data.playlist_id) {
        // Add the song to the playlist
        await axios.post('/api/addToPlaylist', {
          playlist_id: createResponse.data.playlist_id,
          song_id: songId
        });
        
        // Refresh the playlists
        const refreshResponse = await axios.get(`/api/getuserplaylists/${currentUser.id}`);
        setPlaylists(refreshResponse.data.playlists || []);
        
        alert(`Song added to your new playlist "${playlistName}"!`);
      }
    } catch (error) {
      console.error("Error creating playlist:", error);
      alert("Failed to create playlist or add song.");
    }
  };

  // Confirm adding the song to the chosen playlist
  const confirmAddToPlaylist = async () => {
    if (!selectedPlaylistId) {
      alert("Please select a playlist first.");
      return;
    }
  
    // Handle "create_new" option
    if (selectedPlaylistId === "create_new") {
      const newPlaylistName = prompt("Enter a name for your new playlist:");
      
      if (!newPlaylistName || !newPlaylistName.trim()) {
        alert("Playlist name cannot be empty.");
        return;
      }
      
      try {
        // Create the new playlist
        const createResponse = await axios.post('/api/createPlaylist', {
          name: newPlaylistName,
          user_id: currentUser.id
        });
        
        if (createResponse.data && createResponse.data.playlist_id) {
          // Add song to the new playlist
          await axios.post('/api/addToPlaylist', {
            playlist_id: createResponse.data.playlist_id,
            song_id: selectedSongId
          });
          
          alert(`Song added to your new playlist "${newPlaylistName}"!`);
          
          // Refresh playlists
          const playlistsResponse = await axios.get(`/api/getuserplaylists/${currentUser.id}`);
          setPlaylists(playlistsResponse.data.playlists || []);
        }
      } catch (error) {
        console.error("Error creating playlist:", error);
        alert("Failed to create playlist.");
      }
      
      setShowPlaylistDropdown(false);
      setSelectedSongId(null);
      setSelectedPlaylistId("");
      return;
    }
  
    // Handle existing playlist
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
          <tr key={index}>
            <td
              onClick={() => handleSongClick(song)}
              style={{ cursor: 'pointer' }}
            >
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
            <td>
              <Link to={`/artist/${song.musician_id}`}>
                {song.musician_name}
              </Link>
            </td>
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
        {newestSongs.map((song, index) => (
          <tr key={index}>
            <td
              onClick={() => handleSongClick(song)}
              style={{ cursor: 'pointer' }}
            >
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
            <td>
              <Link to={`/artist/${song.musician_id}`}>
                {song.musician_name}
              </Link>
            </td>
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
