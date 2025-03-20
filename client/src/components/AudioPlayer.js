import React, { useEffect, useRef } from 'react';
import { useAudio } from '../contexts/AudioContext'; // Adjust the path if needed
import './AudioPlayer.css'; // CSS file for styling the player

const AudioPlayer = () => {
  const { currentSong } = useAudio();
  const audioRef = useRef(null);

  // Whenever the currentSong changes, load and play the new audio
  useEffect(() => {
    if (audioRef.current && currentSong) {
      audioRef.current.load();
      audioRef.current.play();
    }
  }, [currentSong]);

  return (
    <div className="audio-player">
      <audio
        ref={audioRef}
        controls
        src={currentSong ? currentSong.file_url : undefined}
      >
        Your browser does not support the audio element.
      </audio>
    </div>
  );
};

export default AudioPlayer;
