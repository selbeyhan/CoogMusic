import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUser, useClerk } from '@clerk/clerk-react';
import axios from 'axios';
import './Profile.css';
import { useAudio } from '../contexts/AudioContext';
import { FaPencilAlt, FaPlay } from 'react-icons/fa'; // Added FaPlay

const Profile = () => {
  const { userId } = useParams();
  const { user: currentUser } = useUser();
  const { signOut } = useClerk();
  const { setCurrentSong } = useAudio(); 

  // Profile state
  const [userProfile, setUserProfile] = useState(null);
  const [userSongs, setUserSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [activeTab, setActiveTab] = useState('songs');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [playlists, setPlaylists] = useState([]);
  const [showCreatePlaylistInput, setShowCreatePlaylistInput] = useState(false);
  const [showUpdateProfilePicModal, setShowUpdateProfilePicModal] = useState(false);
  const [newProfilePicFile, setNewProfilePicFile] = useState(null);

  // Song deletion modal
  const [showDeleteSongModal, setShowDeleteSongModal] = useState(false);
  const [songToDelete, setSongToDelete] = useState(null);

  // Upload form state
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadFormData, setUploadFormData] = useState({
    title: '',
    genre: '',
    description: '',
    cover_art_url: 'https://via.placeholder.com/150'
  });
  const [uploadFile, setUploadFile] = useState(null);

  // For the 3-dot dropdown menu on each song row
  const [activeSongMenuId, setActiveSongMenuId] = useState(null);

  useEffect(() => {
    if (currentUser) {
      setIsOwner(currentUser.id === userId);
    }
  
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get(`/user/${userId}`);
        const userData = response.data.user;
        setUserProfile({
          id: userData.user_id,
          name: userData.name,
          email: userData.email,
          bio: userData.bio || "Music enthusiast and UH student.",
          profilePicture: userData.profile_picture_url || currentUser?.profileImageUrl,
          accountType: userData.account_type || "Musician",
          registrationDate: userData.registration_date || "2023-01-15",
          monthlyListeners: userData.monthly_listeners || 0,
          uhAffiliation: userData.uh_affiliation || "None",
          verification_status: userData.verification_status || false
        });
  
        // Fetch songs for user
        const songsResponse = await axios.get(`/api/profile/${userId}`);
        if (Array.isArray(songsResponse.data) && songsResponse.data.length > 0) {
          const songs = songsResponse.data[0].songs;
          setUserSongs(songs);
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      }
    };
  
    const fetchUserPlaylists = async () => {
      try {
        const response = await axios.get(`/api/getuserplaylists/${userId}`);
        setPlaylists(response.data.playlists || []);
      } catch (error) {
        console.error("Error fetching playlists:", error);
      }
    };
  
    const fetchAll = async () => {
      await fetchUserProfile();
      await fetchUserPlaylists();
      setIsLoading(false);
    };
  
    fetchAll();
  }, [userId, currentUser]);
  
  const handleMenuClick = (songId) => {
    setActiveSongMenuId((prev) => (prev === songId ? null : songId));
  };

  const handleAddToQueue = (song) => {
    alert(`Song "${song.title}" added to queue!`);
  };

  const handleDeleteSongClick = (song) => {
    setSongToDelete(song);
    setShowDeleteSongModal(true);
  };

  const confirmDeleteSong = async () => {
    if (!songToDelete) return;
    try {
      await axios.delete(`/api/song/${songToDelete.song_id}`);
      setUserSongs((prev) => prev.filter((s) => s.song_id !== songToDelete.song_id));
      alert("Song deleted successfully!");
    } catch (error) {
      console.error("Error deleting song:", error);
      alert("Failed to delete song.");
    } finally {
      setShowDeleteSongModal(false);
      setSongToDelete(null);
    }
  };

  const handleSaveBio = async () => {
    try {
      await axios.patch(`/update-bio/${userId}`, { bio: userProfile.newBio });
      setUserProfile((prev) => ({
        ...prev,
        bio: prev.newBio,
        editingBio: false
      }));
      alert("Bio updated successfully!");
    } catch (err) {
      console.error("Error updating bio:", err);
      alert("Failed to update bio.");
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      alert("Playlist name cannot be empty.");
      return;
    }
    try {
      const payload = {
        name: newPlaylistName,
        user_id: userProfile.id
      };
      const response = await axios.post('/api/createPlaylist', payload);
      setPlaylists((prev) => [
        ...prev,
        {
          playlist_id: response.data.playlist_id,
          name: newPlaylistName,
          creation_date: new Date().toISOString(),
          is_public: 0
        }
      ]);
      setNewPlaylistName('');
      alert("Playlist created!");
    } catch (error) {
      console.error("Error creating playlist:", error);
      alert("Failed to create playlist.");
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleUploadFormChange = (e) => {
    const { name, value } = e.target;
    setUploadFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setUploadFile(e.target.files[0]);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      alert('Please select a file to upload');
      return;
    }
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('title', uploadFormData.title);
    formData.append('genre', uploadFormData.genre);
    formData.append('description', uploadFormData.description);
    formData.append('cover_art_url', uploadFormData.cover_art_url);
    formData.append('musician_id', userProfile.id);
    try {
      setIsLoading(true);
      await axios.post('/upload', formData);
      alert('Song uploaded successfully!');
      setShowUploadForm(false);
      setUploadFormData({
        title: '',
        genre: '',
        description: '',
        cover_art_url: 'https://via.placeholder.com/150'
      });
      setUploadFile(null);
    } catch (error) {
      console.error('Error uploading song:', error);
      alert('Failed to upload song. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-image">
          <img
            src={userProfile.profilePicture || '/coogmusiclogonobg.png'}
            alt={`${userProfile.name}'s profile`}
            onError={(e) => (e.target.src = '/coogmusiclogonobg.png')}
            onClick={() => {
              if (isOwner) {
                setShowUpdateProfilePicModal(true);
              }
            }}
            style={{ cursor: isOwner ? 'pointer' : 'default' }}
          />
          {isOwner && (
            <div className="profile-overlay">
              <span>Upload Profile Pic</span>
            </div>
          )}
        </div>
        {showUpdateProfilePicModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Attach a new profile image</h3>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  setNewProfilePicFile(e.target.files[0]);
                }}
              />
              <div className="modal-buttons">
                <button
                  className="cancel-btn"
                  onClick={() => {
                    setShowUpdateProfilePicModal(false);
                    setNewProfilePicFile(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="confirm-btn"
                  onClick={async () => {
                    if (!newProfilePicFile) {
                      alert("Please select an image first.");
                      return;
                    }
                    const formData = new FormData();
                    formData.append("file", newProfilePicFile);
                    formData.append("user_id", userProfile.id);
                    try {
                      const response = await axios.post("/upload-profile-picture", formData);
                      alert("Profile picture updated!");
                      setUserProfile((prev) => ({
                        ...prev,
                        profilePicture: response.data.url
                      }));
                    } catch (err) {
                      console.error("Error uploading profile picture:", err);
                      alert("Failed to upload profile picture.");
                    } finally {
                      setShowUpdateProfilePicModal(false);
                      setNewProfilePicFile(null);
                    }
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="profile-info">
          <h1>{userProfile.name}</h1>
          <p className="account-type">{userProfile.accountType}</p>
          <p className="bio">{userProfile.bio}</p>
          <div className="stats">
            <div className="stat">
              <span className="stat-value">{userProfile.monthlyListeners || 0}</span>
              <span className="stat-label">Monthly Listeners</span>
            </div>
            <div className="stat">
              <span className="stat-value">{userSongs.length}</span>
              <span className="stat-label">Songs</span>
            </div>
          </div>
          {isOwner && userProfile.verification_status && (
            <button
              className="upload-btn"
              onClick={() => setShowUploadForm(!showUploadForm)}
            >
              {showUploadForm ? 'Cancel Upload' : 'Upload New Song'}
            </button>
          )}
          {isOwner && (
            <>
              <button
                className="delete-account-btn"
                onClick={() => setShowDeleteConfirm(true)}
                style={{ marginTop: '10px', backgroundColor: '#ff4d4f', color: '#fff' }}
              >
                Delete Account
              </button>
              {showDeleteConfirm && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <h3>Are you sure you want to delete your account?</h3>
                    <p>This action cannot be undone.</p>
                    <div className="modal-buttons">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="cancel-btn"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await axios.delete(`/user/${currentUser.id}`);
                            await signOut();
                            alert("Account deleted successfully.");
                            window.location.href = "/";
                          } catch (err) {
                            console.error("Error deleting account:", err);
                            alert("Failed to delete account.");
                          }
                        }}
                        className="confirm-btn"
                      >
                        Confirm Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showUploadForm && (
        <div className="upload-form-container">
          <h2>Upload New Song</h2>
          <form onSubmit={handleUploadSubmit} className="upload-form">
            <div className="form-group">
              <label htmlFor="title">Song Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={uploadFormData.title}
                onChange={handleUploadFormChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="genre">Genre</label>
              <input
                type="text"
                id="genre"
                name="genre"
                value={uploadFormData.genre}
                onChange={handleUploadFormChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={uploadFormData.description}
                onChange={handleUploadFormChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="file">Audio File</label>
              <input
                type="file"
                id="file"
                accept="audio/*"
                onChange={handleFileChange}
                required
              />
            </div>
            <button type="submit" className="submit-btn">Upload Song</button>
          </form>
        </div>
      )}

      <div className="profile-content">
        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === 'songs' ? 'active' : ''}`}
            onClick={() => handleTabChange('songs')}
          >
            Songs
          </button>
          <button
            className={`tab-btn ${activeTab === 'playlists' ? 'active' : ''}`}
            onClick={() => handleTabChange('playlists')}
          >
            Playlists
          </button>
          <button
            className={`tab-btn ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => handleTabChange('about')}
          >
            About
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'songs' && (
            <div className="songs-tab">
              <h2>Songs</h2>
              {userSongs.length === 0 ? (
                <p className="no-content">No songs uploaded yet.</p>
              ) : (
                <table className="songs-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Genre</th>
                      <th>Uploaded</th>
                      <th>Views</th>
                      <th>Play</th>
                      <th></th> {/* 3-dot menu column */}
                    </tr>
                  </thead>
                  <tbody>
                    {userSongs.map((song) => (
                      <tr key={song.song_id}>
                        <td>{song.title}</td>
                        <td>{song.genre}</td>
                        <td>{new Date(song.upload_date).toLocaleDateString()}</td>
                        <td>{song.views}</td>
                        <td>
                          <FaPlay
                            className="play-icon"
                            onClick={() => {
                              setCurrentSong(song);
                              axios
                                .post(`/increment-view/${song.song_id}`)
                                .catch(console.error);
                            }}
                          />
                        </td>
                        <td>
                          <div className="dropdown-container">
                            <span className="dots-icon" onClick={() => handleMenuClick(song.song_id)}>
                              &#8942;
                            </span>
                            {activeSongMenuId === song.song_id && (
                              <div className="dropdown-menu">
                                <button onClick={() => handleAddToQueue(song)}>
                                  Add to queue
                                </button>
                                {isOwner && (
                                  <button onClick={() => handleDeleteSongClick(song)}>
                                    Delete
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'playlists' && (
            <div className="playlists-tab">
              <h2>Playlists</h2>
              {isOwner && (
                <>
                  {!showCreatePlaylistInput ? (
                    <button onClick={() => setShowCreatePlaylistInput(true)} style={{ marginBottom: '1rem' }}>
                      Create Playlist
                    </button>
                  ) : (
                    <div className="create-playlist-form">
                      <input
                        type="text"
                        placeholder="Enter playlist name"
                        value={newPlaylistName}
                        onChange={(e) => setNewPlaylistName(e.target.value)}
                        className="playlist-name-input"
                      />
                      <button onClick={handleCreatePlaylist}>Save</button>
                      <button onClick={() => { setShowCreatePlaylistInput(false); setNewPlaylistName(''); }}>
                        Cancel
                      </button>
                    </div>
                  )}
                </>
              )}
              {playlists.length === 0 ? (
                <p className="no-content">No playlists created yet.</p>
              ) : (
                <div className="playlists-list">
                  {playlists.map((playlist) => (
                    <div key={playlist.playlist_id} className="playlist-card-container">
                      <Link to={`/playlist/${playlist.playlist_id}`} className="playlist-card">
                        <h3>{playlist.name}</h3>
                        <p>Created: {new Date(playlist.creation_date || Date.now()).toLocaleDateString()}</p>
                      </Link>
                      {isOwner && (
                        <button
                          onClick={async () => {
                            if (window.confirm(`Are you sure you want to delete playlist "${playlist.name}"?`)) {
                              try {
                                await axios.delete(`/api/playlist/${playlist.playlist_id}`);
                                setPlaylists((prev) => prev.filter((pl) => pl.playlist_id !== playlist.playlist_id));
                                alert('Playlist deleted successfully!');
                              } catch (error) {
                                console.error('Error deleting playlist:', error);
                                alert('Failed to delete playlist. Please try again.');
                              }
                            }
                          }}
                          className="delete-playlist-btn"
                          title="Delete Playlist"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="about-tab">
              <h2>About {userProfile.name}</h2>
              <div className="info-item">
                <span className="label">Account Type:</span>
                <span className="value">{userProfile.accountType}</span>
              </div>
              <div className="info-item">
                <span className="label">UH Affiliation:</span>
                <span className="value">{userProfile.uhAffiliation}</span>
              </div>
              <div className="info-item">
                <span className="label">Member Since:</span>
                <span className="value">{new Date(userProfile.registrationDate).toLocaleDateString()}</span>
              </div>
              <div className="bio-section" style={{ textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <h3 style={{ margin: 0, color: 'red' }}>Bio</h3>
                  {isOwner && !userProfile.editingBio && (
                    <FaPencilAlt
                      style={{ cursor: 'pointer', fontSize: '14px', color: '#555' }}
                      title="Edit Bio"
                      onClick={() =>
                        setUserProfile((prev) => ({
                          ...prev,
                          editingBio: true,
                          newBio: prev.bio
                        }))
                      }
                    />
                  )}
                </div>
                {isOwner && userProfile.editingBio ? (
                  <div style={{ marginTop: '10px' }}>
                    <textarea
                      rows="4"
                      style={{ width: '100%', maxWidth: '500px' }}
                      value={userProfile.newBio}
                      onChange={(e) =>
                        setUserProfile((prev) => ({ ...prev, newBio: e.target.value }))
                      }
                    />
                    <div style={{ marginTop: '10px' }}>
                      <button style={{ marginRight: '10px' }} onClick={handleSaveBio}>
                        Save
                      </button>
                      <button onClick={() => setUserProfile((prev) => ({ ...prev, editingBio: false }))}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p>{userProfile.bio || "No bio provided."}</p>
                )}
              </div>
            </div>
          )}

          {showDeleteSongModal && songToDelete && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h3>Are you sure you want to delete "{songToDelete.title}"?</h3>
                <p>This will also remove it from all playlists and comments.</p>
                <div className="modal-buttons">
                  <button
                    className="cancel-btn"
                    onClick={() => {
                      setShowDeleteSongModal(false);
                      setSongToDelete(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button className="confirm-btn" onClick={confirmDeleteSong}>
                    Confirm Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
