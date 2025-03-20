import React, { useRef, useEffect, useState } from 'react';
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
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [repeatMode, onNext]);

  useEffect(() => {
    if (currentSong) {
      const audio = audioRef.current;
      audio.src = currentSong.file_url;
      audio.play();
      setPlaying(true);
    }
  }, [currentSong]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (playing) audio.pause();
    else audio.play();
    setPlaying(!playing);
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
      return 'off';
    });
  };

  const toggleShuffle = () => setShuffle(s => !s);

  return (
    <div className="player-container">
      <audio ref={audioRef} style={{ display: 'none' }} />

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
          onChange={seek}
        />
      </div>

      <div className="player-actions">
        <FaHeart className="action-btn" />
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