import React, { useState, useEffect } from 'react';
import { useAudio } from '../contexts/AudioContext';
import axios from 'axios';
import './Explore.css';

function Explore() {
  const { setCurrentSong } = useAudio();
  const [isLoading, setIsLoading] = useState(true);
  const [genres, setGenres] = useState([
    { id: 1, name: 'Hip Hop', color: '#FF4444', emoji: '🎤' },
    { id: 2, name: 'Rock', color: '#4444FF', emoji: '🎸' },
    { id: 3, name: 'Pop', color: '#44FF44', emoji: '🎵' },
    { id: 4, name: 'R&B', color: '#FF44FF', emoji: '🎹' },
    { id: 5, name: 'Jazz', color: '#FFFF44', emoji: '🎷' },
    { id: 6, name: 'Electronic', color: '#44FFFF', emoji: '💿' }
  ]);

  const [featuredArtists] = useState([
    { id: 1, name: 'Artist 1', followers: '10K', imageUrl: '/coogmusiclogonobg.png' },
    { id: 2, name: 'Artist 2', followers: '8K', imageUrl: '/coogmusiclogonobg.png' },
    { id: 3, name: 'Artist 3', followers: '15K', imageUrl: '/coogmusiclogonobg.png' },
    { id: 4, name: 'Artist 4', followers: '12K', imageUrl: '/coogmusiclogonobg.png' }
  ]);

  const [featuredPlaylists] = useState([
    { id: 1, name: 'Top Hits 2024', songs: 20, imageUrl: '/coogmusiclogonobg.png' },
    { id: 2, name: 'Chill Vibes', songs: 15, imageUrl: '/coogmusiclogonobg.png' },
    { id: 3, name: 'Workout Mix', songs: 25, imageUrl: '/coogmusiclogonobg.png' },
    { id: 4, name: 'Study Session', songs: 18, imageUrl: '/coogmusiclogonobg.png' }
  ]);

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  const handlePlaySong = async (songId) => {
    try {
      const response = await axios.get(`/api/songs/${songId}`);
      setCurrentSong(response.data);
    } catch (error) {
      console.error('Error playing song:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="explore-loading">
        <div className="loading-spinner"></div>
        <p>Loading amazing music...</p>
      </div>
    );
  }

  return (
    <div className="explore-container">
      {/* Header Section */}
      <div className="explore-header">
        <h1>Explore</h1>
      </div>

      {/* Content Sections */}
      <div className="explore-content">
        {/* Genres Section */}
        <section className="explore-section">
          <h2>🎵 Browse by Genre</h2>
          <div className="genres-grid">
            {genres.map(genre => (
              <div 
                key={genre.id} 
                className="genre-card"
                style={{ backgroundColor: genre.color }}
              >
                <div className="genre-emoji">{genre.emoji}</div>
                <h3>{genre.name}</h3>
                <p>Explore {genre.name}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Artists Section */}
        <section className="explore-section">
          <h2>👥 Featured Artists</h2>
          <div className="artists-grid">
            {featuredArtists.map(artist => (
              <div key={artist.id} className="artist-card">
                <div className="artist-image">
                  <img src={artist.imageUrl} alt={artist.name} />
                </div>
                <h3>{artist.name}</h3>
                <p>{artist.followers} followers</p>
              </div>
            ))}
          </div>
        </section>

        {/* Playlists Section */}
        <section className="explore-section">
          <h2>📀 Popular Playlists</h2>
          <div className="playlists-grid">
            {featuredPlaylists.map(playlist => (
              <div key={playlist.id} className="playlist-card">
                <div className="playlist-image">
                  <img src={playlist.imageUrl} alt={playlist.name} />
                </div>
                <h3>{playlist.name}</h3>
                <p>{playlist.songs} songs</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Explore; 