import React, { createContext, useContext, useRef, useState } from 'react';

const AudioContext = createContext();

export const AudioProvider = ({ children }) => {
  const audioRef = useRef(new Audio());       // ← Add this
  const [currentSong, setCurrentSong] = useState(null);
  const [queue, setQueue] = useState([]);

  return (
    <AudioContext.Provider value={{ audioRef, currentSong, setCurrentSong, queue, setQueue }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => useContext(AudioContext);