/* eslint-disable no-unused-vars */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useUser } from "@clerk/clerk-react";
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  FaStepBackward,
  FaPlay,
  FaPause,
  FaStepForward,
  FaRandom,
  FaRedoAlt,
  FaVolumeUp,
  FaVolumeMute,
  FaVolumeDown,
  FaHeart,
  FaPlus,
  FaListUl,
} from 'react-icons/fa';
import './AudioPlayerUI.css';
import { useAudio } from '../contexts/AudioContext';

export default function AudioPlayerUI({ currentSong, queue, onNext, onPrev }) {
  const audioRef = useRef(new Audio());
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [repeatMode, setRepeatMode] = useState('off');
  const [shuffle, setShuffle] = useState(false);
  const [liked, setLiked] = useState(false);
  const { user } = useUser();
  const location = useLocation();
  const audioContext = useAudio();
  
  // Playlist states
  const [playlists, setPlaylists] = useState([]);
  const [showPlaylistDropdown, setShowPlaylistDropdown] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState("");
  const [newPlaylistName, setNewPlaylistName] = useState("");
  
  // Context for album/playlist navigation
  const [contextSongs, setContextSongs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [contextType, setContextType] = useState(null);
  const [contextId, setContextId] = useState(null);

  // --- Moved and wrapped functions to fix dependency errors ---

  const incrementViewCount = useCallback(async (songId) => {
    try {
      await axios.post(`/increment-view/${songId}`);
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  }, []);

  const handleNextSong = useCallback(() => {
    try {
      // First check if we're in a context (album/playlist)
      if (contextSongs.length > 0 && currentIndex !== -1) {
        let nextIndex;
        if (shuffle) {
          do {
            nextIndex = Math.floor(Math.random() * contextSongs.length);
          } while (nextIndex === currentIndex && contextSongs.length > 1);
        } else {
          nextIndex = (currentIndex + 1) % contextSongs.length;
        }
        
        const nextSong = contextSongs[nextIndex];
        
        if (nextSong && nextSong.song_id) {
          if (typeof audioContext.setCurrentSong === 'function') {
            if (typeof audioContext.addToHistory === 'function' && currentSong) {
              audioContext.addToHistory(currentSong);
            }
            audioContext.setCurrentSong(nextSong);
          } else {
            onNext(nextSong);
          }
          try {
            incrementViewCount(nextSong.song_id);
          } catch (viewError) {
            console.error("Failed to increment view count:", viewError);
          }
          return;
        }
      }
      
      // If we're not in a context or couldn't find next song, use the queue
      if (audioContext.queue && audioContext.queue.length > 0 &&
          typeof audioContext.setCurrentSong === 'function' &&
          typeof audioContext.setQueue === 'function') {
        const nextQueueSong = audioContext.queue[0];
        const remainingQueue = audioContext.queue.slice(1);
        if (currentSong && typeof audioContext.addToHistory === 'function') {
          audioContext.addToHistory(currentSong);
        }
        audioContext.setCurrentSong(nextQueueSong);
        audioContext.setQueue(remainingQueue);
      } else {
        onNext();
      }
    } catch (error) {
      console.error("Error in handleNextSong:", error);
      onNext();
    }
  }, [contextSongs, currentIndex, shuffle, audioContext, currentSong, onNext, incrementViewCount]);

  const fetchUserPlaylists = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await axios.get(`/api/getuserplaylists/${user.id}`);
      setPlaylists(response.data.playlists || []);
    } catch (error) {
      console.error("Error fetching playlists:", error);
    }
  }, [user?.id]);

  // --- End of moved functions ---

  // Update playback progress and handle song end
  useEffect(() => {
    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
        setCurrentTime(audio.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      if (repeatMode === 'all') {
        handleNextSong();
      } else if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play().catch(err => console.error("Playback error:", err));
      } else {
        if (contextSongs.length > 0 && currentIndex < contextSongs.length - 1) {
          handleNextSong();
        } else if (queue.length > 0) {
          onNext();
        } else {
          setPlaying(false);
        }
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [handleNextSong, repeatMode, onNext, queue.length, contextSongs, currentIndex]);

  // Detect if we're viewing an album or playlist
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/album/')) {
      const albumId = path.split('/album/')[1];
      setContextType('album');
      setContextId(albumId);
      fetchAlbumSongs(albumId);
    } else if (path.includes('/playlist/')) {
      const playlistId = path.split('/playlist/')[1];
      setContextType('playlist');
      setContextId(playlistId);
      fetchPlaylistSongs(playlistId);
    } else {
      setContextType(null);
      setContextId(null);
      setContextSongs([]);
      setCurrentIndex(-1);
    }
  }, [location.pathname]);

  // When a new song is selected, find its index in the context
  useEffect(() => {
    if (currentSong && contextSongs.length > 0) {
      const index = contextSongs.findIndex(song => song.song_id === currentSong.song_id);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  }, [currentSong, contextSongs]);

  // Fetch album songs for navigation
  const fetchAlbumSongs = async (albumId) => {
    try {
      const response = await axios.get(`/api/album/${albumId}`);
      if (response.data && response.data.songs) {
        setContextSongs(response.data.songs);
      }
    } catch (error) {
      console.error("Error fetching album songs:", error);
    }
  };

  // Fetch playlist songs for navigation
  const fetchPlaylistSongs = async (playlistId) => {
    try {
      const response = await axios.get(`/api/playlist/${playlistId}`);
      if (response.data && response.data.songs) {
        setContextSongs(response.data.songs);
      }
    } catch (error) {
      console.error("Error fetching playlist songs:", error);
    }
  };

  // Load new song and fetch like state
  useEffect(() => {
    if (!currentSong) return;
    const audio = audioRef.current;

    audio.pause();
    audio.src = "";
    audio.load();
    audio.src = `/stream/${currentSong.song_id}`;
    audio.load();

    const handleLoadedMetadata = () => {
      setProgress(0);
      setDuration(audio.duration);
      audio.play().catch(err => console.error("Playback error:", err));
      setPlaying(true);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);

    // Fetch like state for the current song
    const fetchLikeState = async () => {
      if (!user?.id || !currentSong.song_id) return;
      try {
        const res = await fetch(`/api/isLiked?clerk_user_id=${encodeURIComponent(user.id)}&song_id=${currentSong.song_id}`);
        const data = await res.json();
        setLiked(data.liked);
      } catch (err) {
        console.error("Error fetching like state:", err);
      }
    };

    fetchLikeState();
  }, [currentSong, user]);

  // Fetch user playlists when the user is available
  useEffect(() => {
    if (user) {
      fetchUserPlaylists();
    }
  }, [user, fetchUserPlaylists]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio.paused) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().catch(err => console.error("Playback error:", err));
      setPlaying(true);
    }
  };

  const seek = (e) => {
    const audio = audioRef.current;
    if (audio.duration) {
      const pct = +e.target.value;
      audio.currentTime = (pct / 100) * audio.duration;
      setProgress(pct);
    }
  };

  const toggleRepeat = () => {
    const audio = audioRef.current;
    setRepeatMode(prev => {
      if (prev === 'off') {
        audio.loop = true;
        return 'one';
      }
      if (prev === 'one') {
        audio.loop = false;
        return 'all';
      }
      audio.loop = false;
      return 'off';
    });
  };

  const toggleShuffle = () => setShuffle(s => !s);

  const handlePrevSong = () => {
    try {
      if (contextSongs.length === 0 || currentIndex === -1) {
        onPrev();
        return;
      }

      let prevIndex;
      if (shuffle) {
        do {
          prevIndex = Math.floor(Math.random() * contextSongs.length);
        } while (prevIndex === currentIndex && contextSongs.length > 1);
      } else {
        prevIndex = currentIndex === 0 ? contextSongs.length - 1 : currentIndex - 1;
      }

      const prevSong = contextSongs[prevIndex];
      
      if (prevSong && prevSong.song_id) {
        onPrev(prevSong);
        incrementViewCount(prevSong.song_id);
      } else {
        onPrev();
      }
    } catch (error) {
      console.error("Error in handlePrevSong:", error);
      onPrev();
    }
  };

  const toggleLike = async () => {
    if (!currentSong || !user?.id) return;
  
    try {
      const res = await fetch("/api/toggle-like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerk_user_id: user.id,
          song_id: currentSong.song_id
        })
      });
  
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data.error?.toLowerCase() || "";
  
        if (msg.includes("your own song")) {
          alert("You cannot like your own song.");
        } else {
          alert("Failed to toggle like.");
        }
        return;
      }
  
      // Only toggle like status if the server accepted it
      setLiked(prev => !prev);
    } catch (err) {
      console.error("Error toggling like:", err);
      alert("You cannot like your own song.");
    }
  };
  

  const handleAddToPlaylist = () => {
    if (!user) {
      alert("Please sign in to add songs to playlists");
      return;
    }
    fetchUserPlaylists();
    setShowPlaylistDropdown(true);
  };

  const addSongToPlaylist = async () => {
    try {
      if (selectedPlaylistId === "create_new") {
        if (!newPlaylistName.trim()) {
          alert("Please enter a playlist name");
          return;
        }
        const createResponse = await axios.post('/api/createPlaylist', {
          name: newPlaylistName,
          user_id: user.id
        });
        const addToPlaylistResponse = await axios.post('/api/addToPlaylist', {
          playlist_id: createResponse.data.playlist_id,
          song_id: currentSong.song_id
        });
        const playlistsResponse = await axios.get(`/api/getuserplaylists/${user.id}`);
        setPlaylists(playlistsResponse.data.playlists || []);
      } else if (selectedPlaylistId) {
        const response = await axios.post('/api/addToPlaylist', {
          playlist_id: selectedPlaylistId,
          song_id: currentSong.song_id
        });
      } else {
        alert("Please select a playlist");
        return;
      }
      setSelectedPlaylistId("");
      setNewPlaylistName("");
      setShowPlaylistDropdown(false);
      alert("Song added to playlist successfully!");
    } catch (error) {
      console.error("Error adding song to playlist:", error.response ? error.response.data : error);
      alert("Failed to add song to playlist. Please try again.");
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getVolumeIcon = () => {
    if (volume === 0) return <FaVolumeMute />;
    if (volume < 0.5) return <FaVolumeDown />;
    return <FaVolumeUp />;
  };

  const toggleMute = () => {
    if (volume === 0) {
      const lastVolume = audioRef.current.dataset.lastVolume || 1;
      setVolume(parseFloat(lastVolume));
      audioRef.current.volume = parseFloat(lastVolume);
    } else {
      audioRef.current.dataset.lastVolume = volume;
      setVolume(0);
      audioRef.current.volume = 0;
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    audioRef.current.volume = newVolume;
    if (newVolume > 0) {
      audioRef.current.dataset.lastVolume = newVolume;
    }
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    updateVolumeFromTouch(e.touches[0]);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    updateVolumeFromTouch(e.touches[0]);
  };

  const updateVolumeFromTouch = (touch) => {
    const slider = document.querySelector('.volume-slider-touch');
    if (!slider) return;
    const rect = slider.getBoundingClientRect();
    const offsetX = touch.clientX - rect.left;
    let newVolume = offsetX / rect.width;
    newVolume = Math.min(1, Math.max(0, newVolume));
    setVolume(newVolume);
    audioRef.current.volume = newVolume;
    if (newVolume > 0) {
      audioRef.current.dataset.lastVolume = newVolume;
    }
  };

  if (!currentSong) {
    return null;
  }

  return (
    <div className="player-container">
      <audio ref={audioRef} style={{ display: 'none' }} />

      {/* Left section: Song info and cover art */}
      <div className="player-song-info">
        <div className="player-cover-art">
          <img
            src={currentSong.cover_art_url || "/coogmusiclogonobg.png"}
            alt={currentSong.title}
            onError={(e) => e.target.src = "/coogmusiclogonobg.png"}
          />
        </div>
        <div className="player-track-info">
          <h4 className="player-track-title">{currentSong.title}</h4>
          <p className="player-track-artist">
            <Link to={`/artist/${currentSong.musician_id}`}>
              {currentSong.musician_name}
            </Link>
          </p>
        </div>
      </div>

      {/* Center section: Playback controls and progress */}
      <div className="player-controls-container">
        <div className="player-controls">
          <button
            className={`control-btn ${shuffle ? 'active' : ''}`}
            onClick={toggleShuffle}
            aria-label="Shuffle"
          >
            <FaRandom />
          </button>

          <button
            className="control-btn"
            onClick={handlePrevSong}
            aria-label="Previous track"
          >
            <FaStepBackward />
          </button>

          <button
            className="control-btn play-btn"
            onClick={togglePlay}
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <FaPause /> : <FaPlay />}
          </button>

          <button
            className="control-btn"
            onClick={handleNextSong}
            aria-label="Next track"
          >
            <FaStepForward />
          </button>

          <button
            className={`control-btn ${repeatMode !== 'off' ? 'active' : ''}`}
            onClick={toggleRepeat}
            aria-label="Repeat"
          >
            <FaRedoAlt />
          </button>
        </div>

        <div className="player-progress-container">
          <span className="progress-time">{formatTime(currentTime)}</span>
          <div className="player-progress">
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={seek}
              aria-label="Seek"
            />
            <div className="progress-bar" style={{ width: `${progress}%` }}></div>
          </div>
          <span className="progress-time">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Right section: Volume and additional controls */}
      <div className="player-actions">
        <button
          className={`action-btn ${liked ? 'liked' : ''}`}
          onClick={toggleLike}
          aria-label={liked ? "Unlike" : "Like"}
        >
          <FaHeart />
        </button>

        <button
          className="action-btn"
          onClick={handleAddToPlaylist}
          aria-label="Add to playlist"
        >
          <FaPlus />
        </button>

        <button
          className={`action-btn ${contextSongs.length > 0 ? 'active' : ''}`}
          aria-label="Context Queue"
        >
          <FaListUl />
        </button>

        <div className="volume-container">
          <button
            className="action-btn volume-icon"
            onClick={toggleMute}
            aria-label={volume === 0 ? "Unmute" : "Mute"}
          >
            {getVolumeIcon()}
          </button>
          
          <div style={{ 
            position: 'relative', 
            width: '100px',
            height: '30px',
            display: 'flex', 
            alignItems: 'center',
            flex: '1'
          }}>
            {/* Background track */}
            <div style={{
              position: 'absolute',
              width: '100%',
              height: '6px',
              backgroundColor: '#535353',
              borderRadius: '3px'
            }}></div>
            
            {/* Green fill */}
            <div style={{
              position: 'absolute',
              width: `${volume * 100}%`,
              height: '6px',
              backgroundColor: '#1db954',
              borderRadius: '3px',
              zIndex: 1
            }}></div>
            
            {/* Range input */}
            <input
              type="range"
              className="volume-slider-touch"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              style={{
                width: '100%',
                position: 'absolute',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                background: 'transparent',
                margin: 0,
                zIndex: 2,
                height: '30px',
                cursor: 'pointer'
              }}
            />
            
            {/* Visible slider thumb */}
            <div style={{
              position: 'absolute',
              left: `calc(${volume * 100}% - 8px)`,
              width: '16px',
              height: '16px',
              backgroundColor: 'white',
              borderRadius: '50%',
              zIndex: 3,
              pointerEvents: 'none',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}></div>
          </div>
        </div>
      </div>

      {/* Playlist dropdown */}
      {showPlaylistDropdown && (
        <div
          className="playlist-dropdown-overlay"
          onClick={(e) => {
            if (e.target.className === 'playlist-dropdown-overlay') {
              setShowPlaylistDropdown(false);
              setSelectedPlaylistId("");
              setNewPlaylistName("");
            }
          }}
        >
          <div
            className="playlist-dropdown"
            onClick={(e) => e.stopPropagation()}
          >
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
                <label htmlFor="new-playlist-name">
                  Playlist Name:
                </label>
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
              <button
                onClick={() => {
                  setShowPlaylistDropdown(false);
                  setSelectedPlaylistId("");
                  setNewPlaylistName("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}