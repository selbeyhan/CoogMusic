// src/components/SongQueue.js
import React from 'react';
import './SongQueue.css';

const SongQueue = ({ queue, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Song Queue</h2>
        {queue.length > 0 ? (
          <ul>
            {queue.map((song, index) => (
              <li key={index}>{song.title}</li>
            ))}
          </ul>
        ) : (
          <p>No songs in queue</p>
        )}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default SongQueue;