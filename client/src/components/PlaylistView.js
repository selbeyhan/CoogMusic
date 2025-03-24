// client/src/components/PlaylistView.js
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAudio } from '../contexts/AudioContext';
import './PlaylistView.css';

const PlaylistView = () => {
  const { playlistId } = useParams();
  const [playlistInfo, setPlaylistInfo] = useState(null);
  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { setCurrentSong } = useAudio();

  useEffect(() => {
    const fetchPlaylistData = async () => {
      try {
        const res = await axios.get(`/api/playlist/${playlistId}`);
        console.log("📀 Playlist response:", res.data);

        setPlaylistInfo(res.data.playlist);
        setSongs(res.data.songs || []);
      } catch (err) {
        console.error("Error fetching playlist:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlaylistData();
  }, [playlistId]);

  if (isLoading) return <div className="loading">Loading playlist...</div>;

  return (
    <div className="playlist-view">
      <h2>{playlistInfo?.name || 'Playlist'}</h2>
      {songs.length === 0 ? (
        <p>No songs in this playlist.</p>
      ) : (
        <div className="playlist-table-container">
          <div className="playlist-table-scroll">
            <table className="playlist-table">
              <thead>
                <tr>
                  <th>Song Title</th>
                  <th>Artist</th>
                  <th>Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {songs.map((song) => (
                  <tr key={song.song_id}>
                    <td
                      onClick={() => {
                        setCurrentSong(song);
                        axios.post(`/increment-view/${song.song_id}`).catch(console.error);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {song.title}
                    </td>
                    <td>
                      <Link to={`/artist/${song.musician_id}`}>
                        {song.musician_name}
                      </Link>
                    </td>
                    <td>{new Date(song.upload_date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaylistView;
