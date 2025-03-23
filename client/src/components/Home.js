/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useAudio } from '../contexts/AudioContext';
import './Home.css';

function Home() {
  const [topSongs, setTopSongs] = useState([]);
  const { currentSong, setCurrentSong } = useAudio();
  const audioRef = useRef(null);

  useEffect(() => {
    axios.get('/top-songs')
      .then(response => setTopSongs(response.data))
      .catch(error => {
        console.error('Error fetching top songs:', error);
      });
  }, []);

  const handleSongClick = (song) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
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

  useEffect(() => {
    if (audioRef.current && currentSong) {
      audioRef.current.src = currentSong.file_url;
      audioRef.current.load();
      audioRef.current.play();
    }
  }, [currentSong]);

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
                  <td>{song.title}</td>
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
                    <td>{song.title}</td>
                    <td>{song.musician_name}</td>
                    <td>{new Date(song.upload_date).toLocaleDateString()}</td>
                    <td>{song.views}</td>
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
