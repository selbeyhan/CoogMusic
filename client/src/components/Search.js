import React, { useState } from 'react';
import './Search.css';

function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = (e) => {
    e.preventDefault();
    // TODO: Implement actual search functionality with backend
    console.log('Searching for:', searchQuery, 'Type:', searchType);
    // Mock search results for now
    setSearchResults([
      { type: 'song', title: 'Sample Song', artist: 'Sample Artist' },
      { type: 'album', title: 'Sample Album', artist: 'Sample Artist' },
      { type: 'playlist', title: 'Sample Playlist', creator: 'Sample User' },
    ]);
  };

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

      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-container">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for songs, albums, artists, or playlists..."
            className="search-input"
          />
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className="search-type"
          >
            <option value="all">All</option>
            <option value="songs">Songs</option>
            <option value="albums">Albums</option>
            <option value="artists">Artists</option>
            <option value="playlists">Playlists</option>
          </select>
          <button type="submit" className="search-button">Search</button>
        </div>
      </form>

      <div className="search-results">
        {searchResults.length > 0 && (
          <>
            <h2>Search Results</h2>
            <div className="results-grid">
              {searchResults.map((result, index) => (
                <div key={index} className="result-card">
                  <div className="result-image-placeholder"></div>
                  <div className="result-info">
                    <h3>{result.title}</h3>
                    <p>{result.artist || result.creator}</p>
                    <span className="result-type">{result.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Search; 