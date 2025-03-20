import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Home.css';

function Home() {
  const [topSongs, setTopSongs] = useState([]);

  useEffect(() => {
    // Fetch the top 5 songs from your backend endpoint
    axios.get('http://localhost:8080/api/top-songs')
      .then(response => {
        setTopSongs(response.data);
      })
      .catch(error => {
        console.error('Error fetching top songs:', error);
      });
  }, []);

  return (
    <div className="home-container">
      {/* Logo Section */}
      <div className="logo-container">
        {/* Replace this with the path to your updated CoogMusic logo */}
        <img
          src="/coogmusiclogo-updated.png"
          alt="CoogMusic Logo"
          className="coogmusic-logo"
        />
      </div>

      {/* Headline */}
      <h1 className="welcome-text">Welcome to CoogMusic!</h1>
      <p className="subtitle">
        The #1 place for all your UH music streaming needs.
      </p>

      {/* Top Songs Table */}
      <div className="top-songs-container">
        <h2>Top 5 Most Streamed Songs</h2>
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
              <tr key={index}>
                <td>{song.title}</td>
                <td>{song.artistName}</td>
                <td>{song.streamCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Home;
