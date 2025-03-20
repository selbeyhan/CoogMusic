// src/contexts/AudioContext.js
import React, { createContext, useContext, useState } from 'react';

const AudioContext = createContext();

export const AudioProvider = ({ children }) => {
  const [currentSong, setCurrentSong] = useState(null);
  // Add a queue to hold upcoming songs
  const [queue, setQueue] = useState([]);

  // Optionally add helper functions here to manage the queue

  return (
    <AudioContext.Provider value={{ currentSong, setCurrentSong, queue, setQueue }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => useContext(AudioContext);