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
          imageUrl: song.cover_art_url || '/coogmusiclogonobg.png',
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
      songs: [
        { title: "Hip-Hop Song 1", artist: "Artist 1", imageUrl: "/coogmusiclogonobg.png" },
        { title: "Hip-Hop Song 2", artist: "Artist 2", imageUrl: "/coogmusiclogonobg.png" },
        { title: "Hip-Hop Song 3", artist: "Artist 3", imageUrl: "/coogmusiclogonobg.png" },
        { title: "Hip-Hop Song 4", artist: "Artist 4", imageUrl: "/coogmusiclogonobg.png" },
        { title: "Hip-Hop Song 5", artist: "Artist 5", imageUrl: "/coogmusiclogonobg.png" },
      ]
    },
    {
      genre: "Pop",
      songs: [
        { title: "Pop Song 1", artist: "Artist 1", imageUrl: "/coogmusiclogonobg.png" },
        { title: "Pop Song 2", artist: "Artist 2", imageUrl: "/coogmusiclogonobg.png" },
        { title: "Pop Song 3", artist: "Artist 3", imageUrl: "/coogmusiclogonobg.png" },
        { title: "Pop Song 4", artist: "Artist 4", imageUrl: "/coogmusiclogonobg.png" },
        { title: "Pop Song 5", artist: "Artist 5", imageUrl: "/coogmusiclogonobg.png" },
      ]
    },
    {
      genre: "Rock",
      songs: [
        { title: "Rock Song 1", artist: "Artist 1", imageUrl: "/coogmusiclogonobg.png" },
        { title: "Rock Song 2", artist: "Artist 2", imageUrl: "/coogmusiclogonobg.png" },
        { title: "Rock Song 3", artist: "Artist 3", imageUrl: "/coogmusiclogonobg.png" },
        { title: "Rock Song 4", artist: "Artist 4", imageUrl: "/coogmusiclogonobg.png" },
        { title: "Rock Song 5", artist: "Artist 5", imageUrl: "/coogmusiclogonobg.png" },
      ]
    },
    {
      genre: "Electronic",
      songs: [
        { title: "Electronic Song 1", artist: "Artist 1", imageUrl: "/coogmusiclogonobg.png" },
        { title: "Electronic Song 2", artist: "Artist 2", imageUrl: "/coogmusiclogonobg.png" },
        { title: "Electronic Song 3", artist: "Artist 3", imageUrl: "/coogmusiclogonobg.png" },
        { title: "Electronic Song 4", artist: "Artist 4", imageUrl: "/coogmusiclogonobg.png" },
        { title: "Electronic Song 5", artist: "Artist 5", imageUrl: "/coogmusiclogonobg.png" },
      ]
    },
    {
      genre: "Rap",
      songs: [
        { title: "Rap Song 1", artist: "Artist 1", imageUrl: "/coogmusiclogonobg.png" },
        { title: "Rap Song 2", artist: "Artist 2", imageUrl: "/coogmusiclogonobg.png" },
        { title: "Rap Song 3", artist: "Artist 3", imageUrl: "/coogmusiclogonobg.png" },
        { title: "Rap Song 4", artist: "Artist 4", imageUrl: "/coogmusiclogonobg.png" },
        { title: "Rap Song 5", artist: "Artist 5", imageUrl: "/coogmusiclogonobg.png" },
      ]
    },
    {
      genre: "Other",
      songs: [
        { title: "Other Song 1", artist: "Artist 1", imageUrl: "/coogmusiclogonobg.png" },
        { title: "Other Song 2", artist: "Artist 2", imageUrl: "/coogmusiclogonobg.png" },
        { title: "Other Song 3", artist: "Artist 3", imageUrl: "/coogmusiclogonobg.png" },
        { title: "Other Song 4", artist: "Artist 4", imageUrl: "/coogmusiclogonobg.png" },
        { title: "Other Song 5", artist: "Artist 5", imageUrl: "/coogmusiclogonobg.png" },
      ]
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
              <img
                src={song.imageUrl}
                alt={song.title}
                className="song-image-placeholder"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/coogmusiclogonobg.png";
                }}
              />
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
