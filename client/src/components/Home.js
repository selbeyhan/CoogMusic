/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAudio } from '../contexts/AudioContext';
import { useUser } from '@clerk/clerk-react';
import AudioPlayerUI from './AudioPlayerUI';
import { Link } from 'react-router-dom';
import './Home.css'; // Will need to be updated with new styles

function Home() {
  // Keep existing state variables
  const [topSongs, setTopSongs] = useState([]);
  const [newestSongs, setNewestSongs] = useState([]);
  const [featuredArtists, setFeaturedArtists] = useState([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const { currentSong, setCurrentSong } = useAudio();
  const { user: currentUser } = useUser();

  // Keep existing playlist dropdown states
  const [playlists, setPlaylists] = useState([]);
  const [showPlaylistDropdown, setShowPlaylistDropdown] = useState(false);
  const [selectedSongId, setSelectedSongId] = useState(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState("");
  const [newPlaylistName, setNewPlaylistName] = useState(""); // For creating new playlists

  // Existing data fetching logic
  useEffect(() => {
    axios.get('/top-songs')
      .then(response => setTopSongs(response.data))
      .catch(error => {
        console.error('Error fetching top songs:', error);
      });

    axios.get('/newest-songs')
      .then(response => setNewestSongs(response.data))
      .catch(error => {
        console.error('Error fetching newest songs:', error);
      });

    // New: fetch featured artists
    axios.get('/featured-artists')
      .then(response => setFeaturedArtists(response.data))
      .catch(error => {
        console.error('Error fetching featured artists:', error);
      });
  }, []);

  // Keep existing user playlist fetching
  useEffect(() => {
    if (currentUser) {
      axios.get(`/api/getuserplaylists/${currentUser.id}`)
        .then(response => {
          setPlaylists(response.data.playlists || []);
        })
        .catch(error => console.error("Error fetching playlists:", error));
    }
  }, [currentUser]);

  // Banner carousel rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex(prev =>
        prev === (topSongs.length > 4 ? 4 : topSongs.length - 1) ? 0 : prev + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [topSongs]);

  // Keep existing song click handler
  const handleSongClick = (song) => {
    setCurrentSong(song);
    incrementViewCount(song.song_id);
  };

  // Keep existing increment view count function
  const incrementViewCount = async (songId) => {
    try {
      await axios.post(`/increment-view/${songId}`);
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  // Fixed playlist functionality
  const handleAddToPlaylist = (songId) => {
    if (!currentUser) {
      alert("Please sign in to add songs to playlists");
      return;
    }

    setSelectedSongId(songId);
    setShowPlaylistDropdown(true);
  };

  // Handle adding song to selected playlist
  const addSongToPlaylist = async () => {
    try {
      if (selectedPlaylistId === "create_new") {
        if (!newPlaylistName.trim()) {
          alert("Please enter a playlist name");
          return;
        }

        // Create new playlist first
        const createResponse = await axios.post('/api/createPlaylist', {
          name: newPlaylistName,
          user_id: currentUser.id
        });

        // Then add song to the newly created playlist
        await axios.post('/api/addToPlaylist', {
          playlist_id: createResponse.data.playlist_id,
          song_id: selectedSongId
        });

        // Refresh playlists
        const playlistsResponse = await axios.get(`/api/getuserplaylists/${currentUser.id}`);
        setPlaylists(playlistsResponse.data.playlists || []);
      } else if (selectedPlaylistId) {
        // Add to existing playlist
        await axios.post('/api/addToPlaylist', {
          playlist_id: selectedPlaylistId,
          song_id: selectedSongId
        });
      } else {
        alert("Please select a playlist");
        return;
      }

      // Reset states and close dropdown
      setSelectedPlaylistId("");
      setNewPlaylistName("");
      setSelectedSongId(null);
      setShowPlaylistDropdown(false);

      alert("Song added to playlist successfully!");
    } catch (error) {
      console.error("Error adding song to playlist:", error);
      alert("Failed to add song to playlist");
    }
  };

  return (
    <div className="home-container modern">
      {/* Logo Section (smaller) */}
      <div className="logo-container">
        <img
          src="/coogmusiclogonobg.png"
          alt="CoogMusic Logo"
          className="coogmusic-logo"
        />
      </div>

      {/* Hero Banner Carousel */}
      <section className="hero-banner">
        {topSongs.length > 0 && (
          <div className="banner-content" style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.8)),
                             url(${topSongs[currentBannerIndex]?.cover_art_url || '/coogmusiclogonobg.png'})`
          }}>
            <div className="banner-text">
              <h1>Welcome to CoogMusic</h1>
              <p>The #1 place for all your UH music streaming needs</p>
              <div className="banner-featured-song">
                <div className="now-trending">Now Trending</div>
                <h2>{topSongs[currentBannerIndex]?.title}</h2>
                <p>By <Link to={`/artist/${topSongs[currentBannerIndex]?.musician_id}`}>{topSongs[currentBannerIndex]?.musician_name}</Link></p>
                <div className="banner-actions">
                  <button className="play-now-btn" onClick={() => handleSongClick(topSongs[currentBannerIndex])}>
                    Play Now
                  </button>
                  <button className="add-to-playlist-btn" onClick={() => handleAddToPlaylist(topSongs[currentBannerIndex]?.song_id)}>
                    Add to Playlist
                  </button>
                </div>
              </div>
            </div>
            <div className="carousel-indicators">
              {topSongs.slice(0, 5).map((_, index) => (
                <span
                  key={index}
                  className={`indicator ${index === currentBannerIndex ? 'active' : ''}`}
                  onClick={() => setCurrentBannerIndex(index)}
                ></span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Top Songs Grid */}
      <section className="featured-section">
        <div className="section-header">
          <h2>Top Songs</h2>
          <Link to="/explore" className="view-all">View All</Link>
        </div>
        <div className="songs-grid">
          {topSongs.slice(0, 8).map((song, index) => (
            <div className="song-card" key={index}>
              <div className="song-artwork" onClick={() => handleSongClick(song)}>
                <img
                  src={song.cover_art_url || "/coogmusiclogonobg.png"}
                  alt={song.title}
                  onError={(e) => e.target.src = "/coogmusiclogonobg.png"}
                />
                <div className="play-overlay">
                  <span className="play-icon">▶</span>
                </div>
              </div>
              <div className="song-details">
                <h3 className="song-title">{song.title}</h3>
                <Link to={`/artist/${song.musician_id}`} className="song-artist">
                  {song.musician_name}
                </Link>
                <div className="song-meta">
                  <span className="views">{song.views} plays</span>
                  <button
                    className="add-to-playlist"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToPlaylist(song.song_id);
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <div className="section-header">
          <h2>Browse Categories</h2>
        </div>
        <div className="categories-grid">
          {['Hip Hop', 'Pop', 'Rock', 'R&B', 'Electronic', 'Jazz'].map((genre, index) => (
            <div className="category-card" key={index}>
              <div className="category-image" style={{ backgroundColor: `hsl(${index * 60}, 70%, 65%)` }}>
                <span className="category-icon">♪</span>
              </div>
              <h3>{genre}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Artists Section */}
      <section className="featured-section">
        <div className="section-header">
          <h2>Featured Artists</h2>
          <Link to="/explore" className="view-all">View All</Link>
        </div>
        <div className="artists-grid">
          {(featuredArtists.length > 0 ?
            // If we have featured artists, use them
            featuredArtists.slice(0, 6).map((artist, index) => (
              <Link to={`/artist/${artist.id}`} className="artist-card" key={index}>
                <div className="artist-avatar">
                  <img
                    src={artist.profileImage || "/coogmusiclogonobg.png"}
                    alt={artist.name}
                    onError={(e) => e.target.src = "/coogmusiclogonobg.png"}
                  />
                </div>
                <h3>{artist.name}</h3>
              </Link>
            ))
            :
            // Otherwise, extract unique artists from top songs
            Array.from(
              new Map(
                topSongs.map(song => [
                  song.musician_id,
                  {
                    id: song.musician_id,
                    name: song.musician_name,
                    profileImage: `/team/artist${song.musician_id % 5 + 1}.jpg`
                  }
                ])
              ).values()
            ).slice(0, 6).map((artist, index) => (
              <Link to={`/artist/${artist.id}`} className="artist-card" key={index}>
                <div className="artist-avatar">
                  <img
                    src={artist.profileImage || "/coogmusiclogonobg.png"}
                    alt={artist.name}
                    onError={(e) => e.target.src = "/coogmusiclogonobg.png"}
                  />
                </div>
                <h3>{artist.name}</h3>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* New Releases Section */}
      <section className="featured-section newest-section">
        <div className="section-header">
          <h2>New Releases</h2>
          <Link to="/explore" className="view-all">View All</Link>
        </div>
        <div className="staggered-grid">
          {newestSongs.slice(0, 7).map((song, index) => (
            <div
              className={`release-card ${index < 2 ? 'large' : 'small'}`}
              key={index}
              onClick={() => handleSongClick(song)}
            >
              <div className="release-artwork">
                <img
                  src={song.cover_art_url || "/coogmusiclogonobg.png"}
                  alt={song.title}
                  onError={(e) => e.target.src = "/coogmusiclogonobg.png"}
                />
                <div className="release-overlay">
                  <div className="release-info">
                    <h3>{song.title}</h3>
                    <p>{song.musician_name}</p>
                    <span className="release-date">
                      {new Date(song.upload_date).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    className="play-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSongClick(song);
                    }}
                  >
                    ▶
                  </button>
                  <button
                    className="add-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToPlaylist(song.song_id);
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Updated playlist dropdown */}
      {showPlaylistDropdown && (
        <div className="playlist-dropdown-overlay">
          <div className="playlist-dropdown">
            <h3>Add to Playlist</h3>
            <select
              value={selectedPlaylistId}
              onChange={(e) => {
                const value = e.target.value;
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

            {selectedPlaylistId === "create_new" && (
              <div className="new-playlist-input">
                <label htmlFor="new-playlist-name">Playlist Name:</label>
                <input
                  type="text"
                  id="new-playlist-name"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Enter new playlist name"
                />
              </div>
            )}

            <div className="dropdown-actions">
              <button
                onClick={addSongToPlaylist}
                disabled={!selectedPlaylistId || (selectedPlaylistId === "create_new" && !newPlaylistName.trim())}
              >
                Add Song
              </button>
              <button onClick={() => {
                setShowPlaylistDropdown(false);
                setSelectedPlaylistId("");
                setNewPlaylistName("");
              }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;