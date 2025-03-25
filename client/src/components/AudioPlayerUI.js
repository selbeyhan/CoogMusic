import React, { useRef, useEffect, useState } from 'react';
import { useUser } from "@clerk/clerk-react";
import {
  FaStepBackward,
  FaPlay,
  FaPause,
  FaStepForward,
  FaRandom,
  FaRedoAlt,
  FaVolumeUp,
  FaHeart,
  FaPlus,
  FaListUl,
} from 'react-icons/fa';
import './AudioPlayerUI.css';

export default function AudioPlayerUI({ currentSong, queue, onNext, onPrev }) {
  const audioRef = useRef(new Audio());
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
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
      }
    };
    const handleEnded = () => {
      if (repeatMode === 'all') {
        onNext();
      } else if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play().catch(err => console.error("Playback error:", err));
      } else {
        setPlaying(false);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [repeatMode, onNext]);

  // Load new song and fetch like state from backend
  useEffect(() => {
    if (!currentSong) return;
    const audio = audioRef.current;

    console.log("Loading new song:", currentSong.title);
    audio.pause();
    audio.src = "";
    audio.load();
    audio.src = currentSong.file_url;
    audio.load();

    const handleLoadedMetadata = () => {
      setProgress(0);
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

  return (
    <div className="player-container">
      <audio ref={audioRef} style={{ position: 'absolute', left: '-9999px' }} />

      <div className="player-controls">
        <FaStepBackward className="control-btn" onClick={onPrev} />
        {playing ? (
          <FaPause className="control-btn play-btn" onClick={togglePlay} />
        ) : (
          <FaPlay className="control-btn play-btn" onClick={togglePlay} />
        )}
        <FaStepForward className="control-btn" onClick={onNext} />
        <FaRandom
          className={`control-btn ${shuffle && 'active'}`}
          onClick={toggleShuffle}
        />
        <FaRedoAlt
          className={`control-btn ${repeatMode !== 'off' && 'active'}`}
          onClick={toggleRepeat}
        />
      </div>

      <div className="player-progress">
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onInput={seek}
        />
      </div>

      <div className="player-actions">
        <FaHeart
          className={`action-btn ${liked ? 'liked' : ''}`}
          onClick={toggleLike}
        />
        <FaPlus className="action-btn" />
        <FaListUl className={`action-btn ${queue.length > 0 && 'active'}`} />
        <FaVolumeUp />
        <input
          type="range"
          className="volume-slider"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => {
            const vol = +e.target.value;
            setVolume(vol);
            audioRef.current.volume = vol;
          }}
        />
      </div>
    </div>
  );
}
