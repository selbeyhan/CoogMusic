import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAudio } from '../contexts/AudioContext';
import './AlbumView.css';

const AlbumView = () => {
  const { albumId } = useParams();
  const [albumInfo, setAlbumInfo] = useState(null);
  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { setCurrentSong } = useAudio();

  useEffect(() => {
    const fetchAlbumData = async () => {
      try {
        const res = await axios.get(`/api/album/${albumId}`);
        console.log("🎵 Album response:", res.data);

        setAlbumInfo(res.data.album);
        setSongs(res.data.songs || []);
      } catch (err) {
        console.error("Error fetching album:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlbumData();
  }, [albumId]);

  if (isLoading) return <div className="loading">Loading album...</div>;

  return (
    <div className="album-view">
      <h2>{albumInfo?.title || 'Album'}</h2>
      <p>{albumInfo?.description}</p>
      {songs.length === 0 ? (
        <p>No songs in this album.</p>
      ) : (
        <div className="album-table-container">
          <div className="album-table-scroll">
            <table className="album-table">
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

export default AlbumView;
