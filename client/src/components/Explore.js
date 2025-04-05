import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Explore.css';

function Explore() {
  const [latestSongs, setLatestSongs] = useState([]);

  useEffect(() => {
    axios.get('/newest-songs')
      .then((response) => {
        const top5 = response.data.slice(0, 5).map((song) => ({
          title: song.title,
          artist: song.musician_name,
          imageUrl: song.cover_art_url || '/placeholder.jpg',
        }));
        setLatestSongs(top5);
      })
      .catch((error) => {
        console.error('Error fetching latest songs:', error);
      });
  }, []);

  const genreContent = [
    {
      genre: "Hip-Hop",
      songs: Array(5).fill().map((_, i) => ({
        title: `Hip-Hop Song ${i + 1}`,
        artist: `Artist ${i + 1}`,
        imageUrl: "/placeholder.jpg"
      }))
    },
    {
      genre: "Pop",
      songs: Array(5).fill().map((_, i) => ({
        title: `Pop Song ${i + 1}`,
        artist: `Artist ${i + 1}`,
        imageUrl: "/placeholder.jpg"
      }))
    },
    {
      genre: "Rock",
      songs: Array(5).fill().map((_, i) => ({
        title: `Rock Song ${i + 1}`,
        artist: `Artist ${i + 1}`,
        imageUrl: "/placeholder.jpg"
      }))
    },
    {
      genre: "Electronic",
      songs: Array(5).fill().map((_, i) => ({
        title: `Electronic Song ${i + 1}`,
        artist: `Artist ${i + 1}`,
        imageUrl: "/placeholder.jpg"
      }))
    },
    {
      genre: "Rap",
      songs: Array(5).fill().map((_, i) => ({
        title: `Rap Song ${i + 1}`,
        artist: `Artist ${i + 1}`,
        imageUrl: "/placeholder.jpg"
      }))
    },
    {
      genre: "Other",
      songs: Array(5).fill().map((_, i) => ({
        title: `Other Song ${i + 1}`,
        artist: `Artist ${i + 1}`,
        imageUrl: "/placeholder.jpg"
      }))
    },
  ];

  return (
    <div className="explore-container">
      <div className="logo-container">
        <img
          src="/coogmusiclogonobg.png"
          alt="CoogMusic Logo"
          className="coogmusic-logo"
        />
      </div>

      <section className="latest-songs-section">
        <h2>Latest Releases</h2>
        <div className="horizontal-scroll">
          {latestSongs.map((song, index) => (
            <div key={index} className="song-card">
              <img src={song.imageUrl} alt={song.title} className="song-image-placeholder" />
              <div className="song-info">
                <h3>{song.title}</h3>
                <p>{song.artist}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {genreContent.map((genreSection, index) => (
        <section key={index} className="genre-section">
          <h2>{genreSection.genre}</h2>
          <div className="horizontal-scroll">
            {genreSection.songs.map((song, songIndex) => (
              <div key={songIndex} className="song-card">
                <img src={song.imageUrl} alt={song.title} className="song-image-placeholder" />
                <div className="song-info">
                  <h3>{song.title}</h3>
                  <p>{song.artist}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default Explore;



