import React from 'react';
import './Explore.css';

function Explore() {
  // Mock data - replace with actual data from your backend
  const latestSongs = [
    { title: "Latest Hit 1", artist: "Artist 1", imageUrl: "/placeholder.jpg" },
    { title: "Latest Hit 2", artist: "Artist 2", imageUrl: "/placeholder.jpg" },
    { title: "Latest Hit 3", artist: "Artist 3", imageUrl: "/placeholder.jpg" },
    { title: "Latest Hit 4", artist: "Artist 4", imageUrl: "/placeholder.jpg" },
    { title: "Latest Hit 5", artist: "Artist 5", imageUrl: "/placeholder.jpg" },
    { title: "Latest Hit 6", artist: "Artist 6", imageUrl: "/placeholder.jpg" },
  ];

  const genreContent = [
    {
      genre: "Hip Hop",
      songs: [
        { title: "Hip Hop Song 1", artist: "Artist 1", imageUrl: "/placeholder.jpg" },
        { title: "Hip Hop Song 2", artist: "Artist 2", imageUrl: "/placeholder.jpg" },
        { title: "Hip Hop Song 3", artist: "Artist 3", imageUrl: "/placeholder.jpg" },
        { title: "Hip Hop Song 4", artist: "Artist 4", imageUrl: "/placeholder.jpg" },
      ]
    },
    {
      genre: "Rock",
      songs: [
        { title: "Rock Song 1", artist: "Artist 1", imageUrl: "/placeholder.jpg" },
        { title: "Rock Song 2", artist: "Artist 2", imageUrl: "/placeholder.jpg" },
        { title: "Rock Song 3", artist: "Artist 3", imageUrl: "/placeholder.jpg" },
        { title: "Rock Song 4", artist: "Artist 4", imageUrl: "/placeholder.jpg" },
      ]
    },
    {
      genre: "Pop",
      songs: [
        { title: "Pop Song 1", artist: "Artist 1", imageUrl: "/placeholder.jpg" },
        { title: "Pop Song 2", artist: "Artist 2", imageUrl: "/placeholder.jpg" },
        { title: "Pop Song 3", artist: "Artist 3", imageUrl: "/placeholder.jpg" },
        { title: "Pop Song 4", artist: "Artist 4", imageUrl: "/placeholder.jpg" },
      ]
    },
    {
      genre: "R&B",
      songs: [
        { title: "R&B Song 1", artist: "Artist 1", imageUrl: "/placeholder.jpg" },
        { title: "R&B Song 2", artist: "Artist 2", imageUrl: "/placeholder.jpg" },
        { title: "R&B Song 3", artist: "Artist 3", imageUrl: "/placeholder.jpg" },
        { title: "R&B Song 4", artist: "Artist 4", imageUrl: "/placeholder.jpg" },
      ]
    }
  ];

  return (
    <div className="explore-container">
      {/* Logo Section */}
      <div className="logo-container">
        <img
          src="/coogmusiclogonobg.png"
          alt="CoogMusic Logo"
          className="coogmusic-logo"
        />
      </div>

      {/* Latest Songs Section */}
      <section className="latest-songs-section">
        <h2>Latest Releases</h2>
        <div className="horizontal-scroll">
          {latestSongs.map((song, index) => (
            <div key={index} className="song-card">
              <div className="song-image-placeholder"></div>
              <div className="song-info">
                <h3>{song.title}</h3>
                <p>{song.artist}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Genre Sections */}
      {genreContent.map((genreSection, index) => (
        <section key={index} className="genre-section">
          <h2>{genreSection.genre}</h2>
          <div className="horizontal-scroll">
            {genreSection.songs.map((song, songIndex) => (
              <div key={songIndex} className="song-card">
                <div className="song-image-placeholder"></div>
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
