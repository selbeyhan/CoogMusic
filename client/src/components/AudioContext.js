import React, { createContext, useState, useContext } from 'react';

const AudioContext = createContext();

export function AudioProvider({ children }) {
  const [currentSong, setCurrentSong] = useState(null);
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState([]);

  // Function to add a song to the queue
  const addToQueue = (song) => {
    setQueue(prevQueue => [...prevQueue, song]);
  };

  // Function to add multiple songs to the queue
  const addMultipleToQueue = (songs) => {
    setQueue(prevQueue => [...prevQueue, ...songs]);
  };

  // Function to clear the queue
  const clearQueue = () => {
    setQueue([]);
  };

  // Function to add to history
  const addToHistory = (song) => {
    setHistory(prevHistory => {
      // Keep only the last 50 songs in history
      const newHistory = [...prevHistory, song];
      if (newHistory.length > 50) {
        return newHistory.slice(newHistory.length - 50);
      }
      return newHistory;
    });
  };

  // Wrapper function for setting current song that also handles history
  const playSong = (song) => {
    if (currentSong) {
      addToHistory(currentSong);
    }
    setCurrentSong(song);
  };

  return (
    <AudioContext.Provider
      value={{
        currentSong,
        setCurrentSong: playSong,
        queue,
        setQueue,
        addToQueue,
        addMultipleToQueue,
        clearQueue,
        history,
        addToHistory
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}