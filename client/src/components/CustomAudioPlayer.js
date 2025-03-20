// src/components/CustomAudioPlayer.js
import React, { useRef, useEffect, useState } from 'react';
import { useAudio } from '../contexts/AudioContext';
import { FaRedoAlt, FaSyncAlt, FaRandom, FaListUl } from 'react-icons/fa';
import SongQueue from './SongQueue'; // Updated import
import './CustomAudioPlayer.css';

const CustomAudioPlayer = () => {
  const { currentSong, setCurrentSong, queue, setQueue } = useAudio();
  const audioRef = useRef(null);

  // repeatMode: 'off', 'one', or 'all'
  const [repeatMode, setRepeatMode] = useState('off');
  // isShuffle: true means shuffle is active
  const [isShuffle, setIsShuffle] = useState(false);
  // isQueueVisible: toggles modal visibility
  const [isQueueVisible, setIsQueueVisible] = useState(false);

  useEffect(() => {
    if (audioRef.current && currentSong) {
      audioRef.current.load();
      audioRef.current.play();
    }
  }, [currentSong]);

  const handleTrackEnd = () => {
    if (repeatMode === 'one') {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else {
      if (queue.length > 0) {
        setCurrentSong(queue[0]);
        setQueue(queue.slice(1));
      } else if (repeatMode === 'all') {
        // Optionally, restart the playlist if desired.
      }
    }
  };

  const toggleShuffle = () => {
    setIsShuffle((prev) => {
      const newShuffle = !prev;
      if (newShuffle && queue.length > 0) {
        const shuffledQueue = [...queue].sort(() => Math.random() - 0.5);
        setQueue(shuffledQueue);
      }
      return newShuffle;
    });
  };

  const toggleRepeatMode = () => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'one';
      if (prev === 'one') return 'all';
      return 'off';
    });
  };

  const renderRepeatIcon = () => {
    if (repeatMode === 'off') {
      return <FaRedoAlt title="Repeat Off" style={{ color: 'inherit' }} />;
    } else if (repeatMode === 'one') {
      return <FaSyncAlt title="Repeat One" style={{ color: 'red' }} />;
    } else if (repeatMode === 'all') {
      return (
        <FaSyncAlt
          title="Repeat All"
          style={{ transform: 'rotate(180deg)', color: 'red' }}
        />
      );
    }
  };

  return (
    <div className="custom-audio-player">
      <div className="controls">
        <button onClick={toggleRepeatMode}>
          {renderRepeatIcon()}
        </button>
        <button onClick={toggleShuffle}>
          <FaRandom
            title={isShuffle ? 'Shuffle On' : 'Shuffle Off'}
            style={{ color: isShuffle ? 'red' : 'inherit' }}
          />
        </button>
        <button onClick={() => setIsQueueVisible(true)}>
          <FaListUl
            title="View Queue"
            style={{ color: isQueueVisible ? 'red' : 'inherit' }}
          />
        </button>
      </div>
      <audio
        ref={audioRef}
        controls
        onEnded={handleTrackEnd}
        src={currentSong ? currentSong.file_url : undefined}
      >
        Your browser does not support the audio element.
      </audio>
      {isQueueVisible && (
        <SongQueue queue={queue} onClose={() => setIsQueueVisible(false)} />
      )}
    </div>
  );
};

export default CustomAudioPlayer;