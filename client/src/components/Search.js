import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAudio } from '../contexts/AudioContext';
import './Search.css';

function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [searchResults, setSearchResults] = useState({
    songs: [],
    artists: [],
    playlists: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const { setCurrentSong } = useAudio();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const response = await axios.get(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(response.data || { songs: [], artists: [], playlists: [] });
    } catch (error) {
      console.error('Error searching:', error);
      // Fallback to empty results on error
      setSearchResults({ songs: [], artists: [], playlists: [] });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaySong = (song) => {
    setCurrentSong(song);
    // Increment view count
    axios.post(`/increment-view/${song.song_id}`).catch(console.error);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Get filtered results based on active tab
  const getFilteredResults = () => {
    if (activeTab === 'all') {
      return {
        songs: searchResults.songs.slice(0, 5),
        artists: searchResults.artists.slice(0, 5),
        playlists: searchResults.playlists.slice(0, 5)
      };
    }
    return {
      songs: activeTab === 'songs' ? searchResults.songs : [],
      artists: activeTab === 'artists' ? searchResults.artists : [],
      playlists: activeTab === 'playlists' ? searchResults.playlists : []
    };
  };

  const filteredResults = getFilteredResults();
  const hasResults = 
    filteredResults.songs.length > 0 || 
    filteredResults.artists.length > 0 || 
    filteredResults.playlists.length > 0;

  return (
    <div className="search-container">
      {/* Logo Section */}
      <div className="logo-container">
        <img
          src="/coogmusiclogonobg.png"
          alt="CoogMusic Logo"
          className="coogmusic-logo"
        />
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-container">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for songs, artists, or playlists..."
            className="search-input"
          />
          <button type="submit" className="search-button" disabled={isLoading}>
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {/* Tabs Navigation */}
      <div className="search-tabs">
        <button 
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => handleTabChange('all')}
        >
          All
        </button>
        <button 
          className={`tab-btn ${activeTab === 'songs' ? 'active' : ''}`}
          onClick={() => handleTabChange('songs')}
        >
          Songs
        </button>
        <button 
          className={`tab-btn ${activeTab === 'artists' ? 'active' : ''}`}
          onClick={() => handleTabChange('artists')}
        >
          Artists
        </button>
        <button 
          className={`tab-btn ${activeTab === 'playlists' ? 'active' : ''}`}
          onClick={() => handleTabChange('playlists')}
        >
          Playlists
        </button>
      </div>

      {/* Search Results */}
      <div className="search-results-container">
        {isLoading ? (
          <div className="loading-message">Searching...</div>
        ) : searchQuery && !hasResults ? (
          <div className="no-results-message">No results found for "{searchQuery}"</div>
        ) : (
          <div className="search-results">
            {/* Songs Section */}
            {filteredResults.songs.length > 0 && (
              <div className="result-section">
                <h2>Songs</h2>
                <div className="songs-list">
                  {filteredResults.songs.map(song => (
                    <div className="song-card" key={song.song_id}>
                      <div className="song-cover">
                        <img 
                          src={song.cover_art_url || "/coogmusiclogonobg.png"} 
                          alt={song.title}
                          onError={(e) => e.target.src = "/coogmusiclogonobg.png"} 
                        />
                      </div>
                      <div className="song-info">
                        <h3>{song.title}</h3>
                        <p className="song-genre">{song.genre}</p>
                        <p className="song-artist">
                          <Link to={`/artist/${song.musician_id}`}>
                            {song.musician_name}
                          </Link>
                        </p>
                      </div>
                      <div className="song-controls">
                        <button
                          className="play-btn"
                          onClick={() => handlePlaySong(song)}
                        >
                          Play
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {activeTab === 'all' && searchResults.songs.length > 5 && (
                  <button 
                    className="view-more-btn"
                    onClick={() => handleTabChange('songs')}
                  >
                    View More Songs
                  </button>
                )}
              </div>
            )}



            {/* Artists Section */}
            {filteredResults.artists.length > 0 && (
              <div className="result-section">
                <h2>Artists</h2>
                <div className="artists-list">
                  {filteredResults.artists.map(artist => (
                    <Link 
                      to={`/artist/${artist.user_id}`} 
                      className="artist-card" 
                      key={artist.user_id}
                    >
                      <div className="artist-image">
                        <img 
                          src={artist.profile_picture_url || "/coogmusiclogonobg.png"} 
                          alt={artist.name}
                          onError={(e) => e.target.src = "/coogmusiclogonobg.png"} 
                        />
                      </div>
                      <div className="artist-info">
                        <h3>{artist.name}</h3>
                        <p>{artist.songs_count || 0} Songs</p>
                        {artist.bio && (
                          <p className="artist-bio-preview">
                            {artist.bio.length > 50 ? artist.bio.substring(0, 50) + '...' : artist.bio}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
                {activeTab === 'all' && searchResults.artists.length > 5 && (
                  <button 
                    className="view-more-btn"
                    onClick={() => handleTabChange('artists')}
                  >
                    View More Artists
                  </button>
                )}
              </div>
            )}

            {/* Playlists Section */}
            {filteredResults.playlists.length > 0 && (
              <div className="result-section">
                <h2>Playlists</h2>
                <div className="playlists-list">
                  {filteredResults.playlists.map(playlist => (
                    <Link 
                      to={`/playlist/${playlist.playlist_id}`}
                      className="playlist-card"
                      key={playlist.playlist_id}
                    >
                      <h3>{playlist.name}</h3>
                      <p>Created by {playlist.creator_name}</p>
                      <p>Songs: {playlist.songs_count || 0}</p>
                    </Link>
                  ))}
                </div>
                {activeTab === 'all' && searchResults.playlists.length > 5 && (
                  <button 
                    className="view-more-btn"
                    onClick={() => handleTabChange('playlists')}
                  >
                    View More Playlists
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Search;