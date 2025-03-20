/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAudio } from '../contexts/AudioContext'; // Use the context here
import './Home.css';

function Home() {
  const [topSongs, setTopSongs] = useState([]);
  const { setCurrentSong } = useAudio(); // We only need the setter here

  useEffect(() => {
    // Fetch the top 5 songs from your backend
    axios.get('/top-songs')
      .then(response => setTopSongs(response.data))
      .catch(error => {
        console.error('Error fetching top songs:', error);
      });
  }, []);

  // Update the global currentSong whenever a song row is clicked
  const handleSongClick = (song) => {
    setCurrentSong(song);
  };

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
    </div>
  );
}

export default Home;