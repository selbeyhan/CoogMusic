import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAudio } from '../contexts/AudioContext';
import { useUser } from '@clerk/clerk-react';
import './AlbumView.css';

const AlbumView = () => {
  const { albumId } = useParams();
  const { user } = useUser();
  const [albumInfo, setAlbumInfo] = useState(null);
  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const coverInputRef = useRef(null);
  const { setCurrentSong } = useAudio();

  useEffect(() => {
    const fetchAlbumData = async () => {
      try {
        const res = await axios.get(`/api/album/${albumId}`);
        setAlbumInfo(res.data.album);
        setSongs(res.data.songs || []);

        if (user) {
            const userRes = await axios.get(`/user/${user.id}`);
            const internalUserId = userRes.data.user.user_id;

          if (internalUserId === res.data.album.musician_id) {
            setIsOwner(true);
          }
        }
      } catch (err) {
        console.error("Error fetching album:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlbumData();
  }, [albumId, user]);

  const handleDeleteSong = async (songId) => {
    if (!window.confirm("Are you sure you want to delete this song?")) return;

    try {
      await axios.delete(`/api/song/${songId}`);
      setSongs(prev => prev.filter(song => song.song_id !== songId));
    } catch (err) {
      console.error("Error deleting song:", err);
    }
  };

  const handleAlbumEdit = () => {
    setNewTitle(albumInfo?.title || '');
    setNewDescription(albumInfo?.description || '');  // Add description field
    setShowEditModal(true);
  };

  const handleUpdateAlbum = async () => {
    const formData = new FormData();
    formData.append('title', newTitle);
    formData.append('description', newDescription);  // Add description to the form data
    formData.append('album_id', albumId);

    if (coverInputRef.current?.files[0]) {
      formData.append('cover_art', coverInputRef.current.files[0]);
    }

    try {
      const res = await axios.patch('/editalbumtitleorpic', formData);
      setAlbumInfo(prev => ({
        ...prev,
        title: newTitle,
        description: newDescription,  // Update description
        album_art_url: res.data.album_art_url || prev.album_art_url,
      }));
      setShowEditModal(false);
    } catch (err) {
      console.error("Error updating album:", err);
    }
  };

  if (isLoading) return <div className="loading">Loading album...</div>;

  console.log("Album View Loaded");

  return (
    <div className="album-view">
      <div className="album-header">
        <h2>{albumInfo?.title || 'Album'}</h2>
        {isOwner && (
          <button onClick={handleAlbumEdit} className="edit-button">Edit Album</button>
        )}
      </div>
      <img src={albumInfo?.album_art_url} alt="Album Art" className="album-cover" />
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
                  {isOwner && <th>Actions</th>}
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
                    {isOwner && (
                      <td>
                        <button 
                          onClick={() => handleDeleteSong(song.song_id)} 
                          className="delete-song-button"
                        >
                          ✖
                        </button>
                        {console.log(`Delete button loaded for song: ${song.title}`)}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Album Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Edit Album</h3>
            <label>New Album Title:</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <label>New Album Description:</label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
            <label>New Cover Art (optional):</label>
            <input type="file" ref={coverInputRef} accept="image/*" />
            <div className="modal-actions">
              <button onClick={handleUpdateAlbum}>Save Changes</button>
              <button onClick={() => setShowEditModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlbumView;
