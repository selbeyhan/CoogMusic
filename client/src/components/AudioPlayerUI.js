import React, { useRef, useEffect, useState } from 'react';
import { useUser } from "@clerk/clerk-react";
import { Link } from 'react-router-dom';
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
  const { user } = useUser(); // Clerk user object

  // Update playback progress and handling song end
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
        onNext();
      } else if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play().catch(err => console.error("Playback error:", err));
      } else {
        if (queue.length > 0) {
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
  }, [repeatMode, onNext, queue.length]);

  // Load new song and fetch like state from backend
  useEffect(() => {
    if (!currentSong) return;
    const audio = audioRef.current;

    console.log("Loading new song:", currentSong.title);
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

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio.paused) {
      console.log("Pausing audio.");
      audio.pause();
      setPlaying(false);
    } else {
      console.log("Resuming audio.");
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

  const toggleLike = async () => {
    if (!currentSong || !user?.id) return;

    // Optimistically update local like state
    setLiked(prev => !prev);

    try {
      await fetch("/api/toggle-like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerk_user_id: user.id,
          song_id: currentSong.song_id
        })
      });
    } catch (err) {
      console.error("Error toggling like:", err);
      // Optionally revert local state if error occurs
      setLiked(prev => !prev);
    }
  };

  // Helper function to format time in mm:ss
  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get Volume Icon based on current volume level
  const getVolumeIcon = () => {
    if (volume === 0) return <FaVolumeMute />;
    if (volume < 0.5) return <FaVolumeDown />;
    return <FaVolumeUp />;
  };

  // Toggle mute function
  const toggleMute = () => {
    if (volume === 0) {
      // Remember last volume setting or default to 100%
      const lastVolume = audioRef.current.dataset.lastVolume || 1;
      setVolume(parseFloat(lastVolume));
      audioRef.current.volume = parseFloat(lastVolume);
    } else {
      // Store current volume before muting
      audioRef.current.dataset.lastVolume = volume;
      setVolume(0);
      audioRef.current.volume = 0;
    }
  };

  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    audioRef.current.volume = newVolume;
    // If we're adjusting volume, ensure we're not in muted state
    if (newVolume > 0) {
      audioRef.current.dataset.lastVolume = newVolume;
    }
  };

  // Touch event handlers for volume
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

  // Return empty placeholder if no song is playing
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
            onClick={onPrev}
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
            onClick={onNext}
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
          aria-label="Add to playlist"
        >
          <FaPlus />
        </button>

        <button
          className={`action-btn ${queue.length > 0 ? 'active' : ''}`}
          aria-label="Queue"
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
    </div>
  );
}