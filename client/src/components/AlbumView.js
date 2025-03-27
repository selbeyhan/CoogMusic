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
        console.log("📀 Album response:", res.data);

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
      <div className="album-header">
        <div className="album-cover">
          <img 
            src={albumInfo?.cover_art_url || 'https://via.placeholder.com/300'} 
            alt={albumInfo?.title} 
          />
        </div>
        <div className="album-info">
          <h1>{albumInfo?.title}</h1>
          <p className="album-artist">
            <Link to={`/artist/${albumInfo?.musician_id}`}>
              {albumInfo?.musician_name}
            </Link>
          </p>
          <p className="album-genre">{albumInfo?.genre}</p>
          <p className="album-release-date">
            Released: {new Date(albumInfo?.release_date).toLocaleDateString()}
          </p>
          <p className="album-description">{albumInfo?.description}</p>
        </div>
      </div>

      <div className="album-songs">
        <h2>Songs</h2>
        {songs.length === 0 ? (
          <p>No songs in this album.</p>
        ) : (
          <div className="songs-table-container">
            <div className="songs-table-scroll">
              <table className="songs-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Title</th>
                    <th>Genre</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {songs.map((song) => (
                    <tr key={song.song_id}>
                      <td>{song.track_number}</td>
                      <td
                        onClick={() => {
                          setCurrentSong(song);
                          axios.post(`/increment-view/${song.song_id}`).catch(console.error);
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        {song.title}
                      </td>
                      <td>{song.genre}</td>
                      <td>{Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlbumView; 