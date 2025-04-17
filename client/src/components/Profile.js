/* eslint-disable no-unused-vars */
import { useToast } from '../contexts/ToastContext';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUser, useClerk } from '@clerk/clerk-react';
import axios from 'axios';
import './Profile.css';
import { useAudio } from '../contexts/AudioContext';
import { FaPencilAlt } from 'react-icons/fa'; // import at the top
import ConfirmModal from './ConfirmModal';


const Profile = () => {
  const { userId } = useParams();
  const { user: currentUser } = useUser();
  const { signOut } = useClerk(); // ✅ Use useClerk to get signOut
  const { setCurrentSong } = useAudio();
  const audioFileRef = useRef(null);
  const coverArtRef = useRef(null);
  const { showSuccess, showError, showInfo } = useToast();
  const [showDeleteAccountConfirmModal, setShowDeleteAccountConfirmModal] = useState(false);
  const [showDeleteSongConfirmModal, setShowDeleteSongConfirmModal] = useState(false);
  const [showDeletePlaylistConfirmModal, setShowDeletePlaylistConfirmModal] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState(null);
  const [songToDelete, setSongToDelete] = useState(null);

  const [editingPlaylistId, setEditingPlaylistId] = useState(null);
  const [editedPlaylistName, setEditedPlaylistName] = useState('');
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followingUsers, setFollowingUsers] = useState([]);

  const [editingSongId, setEditingSongId] = useState(null);
  const [editedSongData, setEditedSongData] = useState({
    title: '',
    genre: '',
    description: ''
  });

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
  const [showDeleteSongModal, setShowDeleteSongModal] = useState(false);
  const [likedSongs, setLikedSongs] = useState([]); // Added from second file
  const [albumCoverFile, setAlbumCoverFile] = useState(null);

  const [albumCreated, setAlbumCreated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Upload form state
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadFormData, setUploadFormData] = useState({
    title: '',
    genre: '',
    description: '',
    cover_art_url: 'https://via.placeholder.com/300'
  });
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadCoverArtFile, setUploadCoverArtFile] = useState(null);

  const [editedSongCoverArtFile, setEditedSongCoverArtFile] = useState(null);

  // Album-related state variables
  const [albums, setAlbums] = useState([]);
  const [showCreateAlbumInput, setShowCreateAlbumInput] = useState(false);
  const [newAlbumData, setNewAlbumData] = useState({
    title: '',
    genre: '',
    description: '',
    album_art_url: 'https://via.placeholder.com/300'
  });

  const [showAlbumSongModal, setShowAlbumSongModal] = useState(false);
  const [albumSongs, setAlbumSongs] = useState([]);
  const [newAlbumSongData, setNewAlbumSongData] = useState({
    title: '',
    genre: '',
    description: '',
    file: null,
    coverArt: null
  });

  const fetchSongs = async () => {
    try {
      const response = await axios.get(`/api/profile/${userId}`);
      if (Array.isArray(response.data) && response.data.length > 0) {
        setUserSongs(response.data[0].songs);
      }
    } catch (error) {
      console.error("Error fetching songs:", error);
    }
  };

  useEffect(() => {
    if (currentUser) {
      setIsOwner(currentUser.id === userId);
    }

    const fetchUserProfile = async () => {
      try {
        console.log("🔍 Current User ID:", currentUser?.id);
        console.log("🔍 Profile User ID:", userId);

        const response = await axios.get(`/user/${userId}`);
        const userData = response.data.user;
        console.log("🔍 MySQL user profile:", userData);

        setUserProfile({
          id: userData.user_id,
          name: userData.name,
          email: userData.email,
          bio: userData.bio || "No bio yet.",
          profilePicture: userData.profile_picture_url || currentUser?.profileImageUrl,
          accountType: userData.account_type || "Musician",
          registrationDate: userData.registration_date || "2023-01-15",
          monthlyListeners: userData.monthly_listeners || 0,
          uhAffiliation: userData.uh_affiliation || "None",
          verification_status: userData.verification_status || false
        });
        console.log("MySQL user_id (logged in):", userData.user_id);

        console.log(`🔍 Fetching songs for user: ${userId}`);
        const songsResponse = await axios.get(`/api/profile/${userId}`);
        console.log("🔍 Songs fetched:", songsResponse.data);

        if (Array.isArray(songsResponse.data) && songsResponse.data.length > 0) {
          const songs = songsResponse.data[0].songs;
          setUserSongs(songs);
        } else {
          console.error("❌ Songs data is not in the expected format:", songsResponse.data);
        }

        // Fetch followers and following counts
        const followersRes = await axios.get(`/api/followers/${userData.user_id}`);
        setFollowerCount(followersRes.data.followers?.length || 0);

        // ✅ Use MySQL user_id instead of Clerk userId
        const followingRes = await axios.get(`/api/following/${userData.user_id}`);
        setFollowingCount(followingRes.data.following?.length || 0);

        // ✅ Fetch full user info of followed users
        const followedIds = followingRes.data.following.map(f => f.followed_id);
        if (followedIds.length > 0) {
          const detailsRes = await axios.post(`/api/following-details`, { ids: followedIds });
          setFollowingUsers(detailsRes.data.users || []);
        }

        // ALBUM FEATURE: Fetch user's albums
        const albumsResponse = await axios.get(`/api/getuseralbums/${userId}`);
        setAlbums(albumsResponse.data.albums || []);
      } catch (error) {
        console.error("Error fetching profile data:", error);
      }
    };

    const fetchUserPlaylists = async () => {
      try {
        const response = await axios.get(`/api/getuserplaylists/${userId}`);
        console.log("📀 Playlists fetched:", response.data.playlists);
        setPlaylists(response.data.playlists || []);
      } catch (error) {
        console.error("❌ Error fetching playlists:", error);
      }
    };

    const fetchLikedSongs = async () => {
      try {
        console.log(`➡️ Fetching user likes from Clerk user_id: ${userId}`);
        const response = await axios.get(`/api/profile-likes/${userId}`);
        setLikedSongs(response.data.likedSongs || []);
      } catch (error) {
        console.error("❌ Error fetching liked songs:", error);
      }
    };

    const fetchAll = async () => {
      await fetchUserProfile();
      await fetchUserPlaylists();
      await fetchLikedSongs();
      setIsLoading(false);
    };

    fetchAll();
  }, [userId, currentUser]);


  const handleSaveBio = async () => {
    try {
      await axios.patch(`/update-bio/${userId}`, { bio: userProfile.newBio });
      setUserProfile(prev => ({
        ...prev,
        bio: prev.newBio,
        editingBio: false
      }));
      showSuccess("Bio updated successfully!");
    } catch (err) {
      console.error("Error updating bio:", err);
      showError("Failed to update bio.");
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      showError("Playlist name cannot be empty.");
      return;
    }

    try {
      const payload = {
        name: newPlaylistName,
        user_id: userProfile.id
      };

      console.log("🛠 Creating playlist with payload:", payload); // Log user_id and name

      const response = await axios.post('/api/createPlaylist', payload); // send to backend

      console.log("✅ Playlist created with response:", response.data); // Log server response

      // Update playlist state
      setPlaylists(prev => [
        ...prev,
        {
          playlist_id: response.data.playlist_id, // backend should return the new id
          name: newPlaylistName,
          creation_date: new Date().toISOString(),
          is_public: 0
        }
      ]);

      setNewPlaylistName('');
      setShowCreatePlaylistInput(false);
      showSuccess("Playlist created successfully!");
    } catch (error) {
      console.error("Error creating playlist:", error);
      showError("Failed to create playlist. Please try again.");
    }
  };

  // Handle playlist name updates
  const handleUpdatePlaylist = async (playlistId) => {
    if (!editedPlaylistName.trim()) {
      showError("Playlist name cannot be empty");
      return;
    }

    try {
      await axios.patch(`/api/playlist/update/${playlistId}`, { name: editedPlaylistName });

      // Update local state
      setPlaylists(prevPlaylists =>
        prevPlaylists.map(pl =>
          pl.playlist_id === playlistId
            ? { ...pl, name: editedPlaylistName }
            : pl
        )
      );

      // Reset edit mode
      setEditingPlaylistId(null);
      setEditedPlaylistName('');

      showSuccess("Playlist updated successfully!");
    } catch (error) {
      console.error('Error updating playlist:', error);
      showError('Failed to update playlist. Please try again.');
    }
  };

  const handleUpdateSong = async (songId) => {
    try {
      // Create a new FormData instance and append text fields
      const formData = new FormData();
      if (editedSongData.title) formData.append("title", editedSongData.title);
      if (editedSongData.genre) formData.append("genre", editedSongData.genre);
      if (editedSongData.description) formData.append("description", editedSongData.description);

      // Append new cover art file if one was provided
      if (editedSongCoverArtFile) {
        formData.append("cover_art", editedSongCoverArtFile);
      }

      // Send PATCH request to update the song; ensure the endpoint matches your server route
      const response = await axios.patch(`/api/song/update/${songId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Update local state: merge updated fields and, if returned, update the cover_art_url
      setUserSongs((prevSongs) =>
        prevSongs.map((song) =>
          song.song_id === songId
            ? { ...song, ...editedSongData, cover_art_url: response.data.url || song.cover_art_url }
            : song
        )
      );

      // Reset edit mode and clear form states
      setEditingSongId(null);
      setEditedSongData({ title: '', genre: '', description: '' });
      setEditedSongCoverArtFile(null);

      showSuccess("Song updated successfully!");
    } catch (error) {
      console.error("Error updating song:", error);
      showError("Failed to update song. Please try again.");
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleUploadFormChange = (e) => {
    const { name, value } = e.target;
    setUploadFormData({
      ...uploadFormData,
      [name]: value
    });
  };

  const handleFileChange = (e) => {
    setUploadFile(e.target.files[0]);
  };

  // ALBUM FEATURE: Handler for creating an album
  const handleUploadAlbumSongs = async (albumId) => {
    const formData = new FormData();

    formData.append("album_id", albumId);
    formData.append("musician_id", userProfile.id);

    albumSongs.forEach((song) => {
      formData.append("titles", song.title);
      formData.append("genres", song.genre || '');
      formData.append("descriptions", song.description || '');
      // if you collect files later, use:
      formData.append("files", song.file);
      formData.append("cover_arts", song.coverArt);
    });

    try {
      const response = await axios.post("/api/upload-album-songs", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      console.log("✅ Songs uploaded:", response.data);
      showSuccess("Songs added to album!");
      setAlbumSongs([]); // clear albumSongs after success
    } catch (err) {
      console.error("❌ Failed to upload album songs:", err);
      showError("Upload failed.");
    }
  };

  const handleCreateAlbum = async () => {
    if (!newAlbumData.title.trim()) {
      showError("Album title cannot be empty.");
      return;
    }

    if (albumCreated || isSubmitting) return; // ✅ Prevent double submission
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", newAlbumData.title);
      formData.append("description", newAlbumData.description);
      formData.append("musician_id", userProfile.id);

      if (albumCoverFile) {
        formData.append("cover_art", albumCoverFile);
      }

      formData.append("album_art_url", newAlbumData.album_art_url);

      const response = await axios.post("/api/createAlbum", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("✅ Album created with response:", response.data);
      const newAlbumId = response.data.album_id;

      await handleUploadAlbumSongs(newAlbumId); // ✅ Upload songs after album creation

      setAlbums((prev) => [
        ...prev,
        {
          album_id: newAlbumId,
          title: newAlbumData.title,
          album_art_url: response.data.album_art_url, // ✅ Use returned image URL
          description: newAlbumData.description,
          release_date: new Date().toISOString(),
          views: 0
        }
      ]);

      setNewAlbumData({
        title: '',
        description: '',
        album_art_url: 'https://via.placeholder.com/300'
      });
      setAlbumCoverFile(null);
      setShowCreateAlbumInput(false);
      setAlbumCreated(true); // ✅ Set flag after success
      showSuccess("Album created successfully!");
    } catch (error) {
      console.error("❌ Error creating album:", error);
      showError("Failed to create album.");
    } finally {
      setIsSubmitting(false); // ✅ Always reset
    }
  };

  // ALBUM FEATURE: Handler for album form field changes
  const handleAlbumDataChange = (e) => {
    const { name, value } = e.target;
    setNewAlbumData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNewAlbumSongChange = (e) => {
    const { name, value } = e.target;
    setNewAlbumSongData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSongToAlbum = () => {
    if (!newAlbumSongData.title.trim()) {
      showError("Song title required");
      return;
    }
    if (!newAlbumSongData.genre) { // <-- Manual check for genre
      showError("Song genre is required");
      return;
    }
    if (!newAlbumSongData.file) {
      showError("Please select an audio file for the song.");
      return;
    }

    setAlbumSongs((prev) => [...prev, newAlbumSongData]);
    showSuccess(`"${newAlbumSongData.title}" added to album`);

    // Reset song input data
    setNewAlbumSongData({ title: '', genre: '', description: '', file: null, coverArt: null });

    // Clear file inputs manually
    if (audioFileRef.current) audioFileRef.current.value = null;
    if (coverArtRef.current) coverArtRef.current.value = null;
  };

  const handleCancelAlbumCreation = () => {
    setShowCreateAlbumInput(false);
    setNewAlbumData({
      title: '',
      description: '',
      album_art_url: 'https://via.placeholder.com/300'
    });
    setAlbumCoverFile(null);
    setAlbumSongs([]);
    setShowAlbumSongModal(false);

    // Reset song input refs
    if (audioFileRef.current) audioFileRef.current.value = null;
    if (coverArtRef.current) coverArtRef.current.value = null;
  };

  //album stuff

  const handleUploadSubmit = async (e) => {
    e.preventDefault();

    if (!uploadFile) {
      showError('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('title', uploadFormData.title);
    formData.append('genre', uploadFormData.genre);
    formData.append('description', uploadFormData.description);
    formData.append('cover_art_url', uploadFormData.cover_art_url);
    formData.append('musician_id', userProfile.id);

    if (uploadCoverArtFile) {
      formData.append('cover_art', uploadCoverArtFile);
    }

    try {
      setIsLoading(true);
      await axios.post('/upload', formData);

      // Refresh songs list or add the new song to the existing list
      // In a real app, you'd fetch the updated list or add the new song with its returned data

      showSuccess('Song uploaded successfully!');
      setShowUploadForm(false);
      setUploadFormData({
        title: '',
        genre: '',
        description: '',
        cover_art_url: 'https://via.placeholder.com/150'
      });
      setUploadFile(null);
      await fetchSongs();  // Refresh the song list
      setIsLoading(false);
    } catch (error) {
      console.error('Error uploading song:', error);
      showError('Failed to upload song. Please try again.');
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
                console.log("🖼 Profile image clicked");
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
                  console.log("📁 Selected profile picture:", e.target.files[0]);
                }}
              />

              <div className="modal-buttons">
                <button
                  className="cancel-btn"
                  onClick={() => {
                    setShowUpdateProfilePicModal(false);
                    setNewProfilePicFile(null);
                    console.log("❌ Cancel profile picture change");
                  }}
                >
                  Cancel
                </button>

                <button
                  className="confirm-btn"
                  onClick={async () => {
                    if (!newProfilePicFile) {
                      showError("Please select an image first.");
                      return;
                    }

                    const formData = new FormData();
                    formData.append("file", newProfilePicFile);
                    formData.append("user_id", userProfile.id);

                    try {
                      console.log("⬆️ Uploading new profile picture...");
                      const response = await axios.post("/upload-profile-picture", formData);
                      console.log("✅ Server response:", response.data);

                      showSuccess("Profile picture updated successfully!");
                      setUserProfile((prev) => ({
                        ...prev,
                        profilePicture: response.data.url
                      }));
                    } catch (err) {
                      console.error("❌ Error uploading profile picture:", err);
                      showError("Failed to upload profile picture.");
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
              <span className="stat-label">Monthly Views</span>
            </div>
            <div className="stat">
              <span className="stat-value">{userSongs.length}</span>
              <span className="stat-label">Songs</span>
            </div>
            <div className="stat">
              <span className="stat-value">{followerCount}</span>
              <span className="stat-label">Followers</span>
            </div>
            <div className="stat">
              <span className="stat-value">{followingCount}</span>
              <span className="stat-label">Following</span>
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
                onClick={() => setShowDeleteAccountConfirmModal(true)}
              >
                Delete Account
              </button>
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
              <select
                id="genre"
                name="genre"
                value={uploadFormData.genre}
                onChange={handleUploadFormChange}
                required
              >
                <option value="" disabled>Select Genre</option>
                <option value="Hip-Hop">Hip-Hop</option>
                <option value="Pop">Pop</option>
                <option value="Rock">Rock</option>
                <option value="Electronic">Electronic</option>
                <option value="Rap">Rap</option>
                <option value="Other">Other</option>
              </select>
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
            <div className="form-group">
              <label htmlFor="coverArt">Cover Art</label>
              <input
                type="file"
                id="coverArt"
                accept="image/*"
                onChange={(e) => setUploadCoverArtFile(e.target.files[0])}
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

          {/* Only render Albums tab if the profile owner is verified */}
          {userProfile?.verification_status && (
            <button
              className={`tab-btn ${activeTab === 'albums' ? 'active' : ''}`}
              onClick={() => handleTabChange('albums')}
            >
              Albums
            </button>
          )}

          <button
            className={`tab-btn ${activeTab === 'likes' ? 'active' : ''}`}
            onClick={() => handleTabChange('likes')}
          >
            Likes
          </button>

          <button
            className={`tab-btn ${activeTab === 'following' ? 'active' : ''}`}
            onClick={() => handleTabChange('following')}
          >
            Following
          </button>

        </div>

        <div className="tab-content">
          {activeTab === 'songs' && (
            <div className="songs-tab">
              <h2>Songs</h2>
              {userSongs.length === 0 ? (
                <p className="no-content">No songs uploaded yet.</p>
              ) : (
                <div className="songs-list">
                  {userSongs.map(song => (
                    <div className="song-card" key={song.song_id}>
                      {editingSongId === song.song_id ? (
                        <div className="edit-song-form">
                        <h3>Edit Song</h3>
                        <div className="form-group">
                          <label>Title:</label>
                          <input
                            type="text"
                            value={editedSongData.title}
                            onChange={(e) =>
                              setEditedSongData({ ...editedSongData, title: e.target.value })
                            }
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Genre:</label>
                          <select
                            value={editedSongData.genre}
                            onChange={(e) =>
                              setEditedSongData({ ...editedSongData, genre: e.target.value })
                            }
                            required
                          >
                            <option value="" disabled>Select Genre</option>
                            <option value="Hip-Hop">Hip-Hop</option>
                            <option value="Pop">Pop</option>
                            <option value="Rock">Rock</option>
                            <option value="Electronic">Electronic</option>
                            <option value="Rap">Rap</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Description:</label>
                          <textarea
                            value={editedSongData.description}
                            onChange={(e) =>
                              setEditedSongData({ ...editedSongData, description: e.target.value })
                            }
                            rows="3"
                          />
                        </div>
                        <div className="form-group">
                          <label>New Cover Art:</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              setEditedSongCoverArtFile(e.target.files[0])
                            }
                          />
                        </div>
                        <div className="edit-song-buttons">
                          <button onClick={() => handleUpdateSong(song.song_id)}>Save</button>
                          <button onClick={() => {
                            setEditingSongId(null);
                            setEditedSongData({
                              title: '',
                              genre: '',
                              description: ''
                            });
                            setEditedSongCoverArtFile(null);
                          }}>Cancel</button>
                        </div>
                      </div>

                      ) : (
                        <>
                          <div className="song-cover">
                            {/* img source commented out for now */}
                            {/* <img src={song.cover_art_url || "https://via.placeholder.com/150"} alt={song.title} /> */}
                          </div>
                          <div className="song-info">
                            <h3>{song.title}</h3>
                            <p className="song-genre">{song.genre}</p>
                            <p className="song-date">Uploaded: {new Date(song.upload_date).toLocaleDateString()}</p>
                            <p className="song-views">Views: {song.views}</p> {/* Display views */}
                          </div>
                          <div className="song-controls">
                            <button
                              className="play-btn"
                              onClick={() => {
                                setCurrentSong(song); // Set song globally
                                axios.post(`/increment-view/${song.song_id}`).catch(console.error); // Increment view count
                              }}
                            >
                              Play
                            </button>

                            {isOwner && (
                              <>
                                <button
                                  className="edit-btn"
                                  onClick={() => {
                                    // Close any other modals that might be open
                                    setShowDeleteSongModal(false);
                                    setShowDeleteConfirm(false);
                                    setShowUpdateProfilePicModal(false);

                                    // Then enable editing for the clicked song
                                    setEditingSongId(song.song_id);
                                    setEditedSongData({
                                      title: song.title,
                                      genre: song.genre || '',
                                      description: song.description || ''
                                    });
                                  }}
                                >
                                  Edit
                                </button>

                                <button
                                  className="delete-btn"
                                  onClick={() => {
                                    setSongToDelete(song);
                                    setShowDeleteSongConfirmModal(true);
                                  }}
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
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
                      <button
                        onClick={() => {
                          setShowCreatePlaylistInput(false);
                          setNewPlaylistName('');
                        }}
                      >
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
                      {editingPlaylistId === playlist.playlist_id ? (
                        <div className="edit-playlist-form">
                          <input
                            type="text"
                            value={editedPlaylistName}
                            onChange={(e) => setEditedPlaylistName(e.target.value)}
                            className="playlist-name-input"
                            placeholder="Enter new playlist name"
                          />
                          <div className="edit-buttons">
                            <button onClick={() => handleUpdatePlaylist(playlist.playlist_id)}>
                              Save
                            </button>
                            <button onClick={() => {
                              setEditingPlaylistId(null);
                              setEditedPlaylistName('');
                            }}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Link
                            to={`/playlist/${playlist.playlist_id}`}
                            className="playlist-card"
                          >
                            <h3>{playlist.name}</h3>
                            <p>Created: {new Date(playlist.creation_date || Date.now()).toLocaleDateString()}</p>
                          </Link>
                          {isOwner && (
                            <div className="playlist-actions">
                              <button
                                onClick={() => {
                                  setEditingPlaylistId(playlist.playlist_id);
                                  setEditedPlaylistName(playlist.name);
                                }}
                                className="edit-playlist-btn"
                                title="Edit Playlist"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  setPlaylistToDelete(playlist);
                                  setShowDeletePlaylistConfirmModal(true);
                                }}
                                className="delete-playlist-btn"
                                title="Delete Playlist"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

{activeTab === 'albums' && userProfile?.verification_status && (
  <div className="albums-tab">
    <h2>Albums</h2>
    {isOwner && (
      <>
        {!showCreateAlbumInput ? (
          <button
            onClick={() => setShowCreateAlbumInput(true)}
            style={{ marginBottom: '1rem' }}
          >
            Create Album
          </button>
        ) : (
          <div className="create-album-form">
            <div className="form-group">
              <input
                type="text"
                name="title"
                placeholder="Album Title"
                value={newAlbumData.title}
                onChange={handleAlbumDataChange}
                className="album-name-input"
                required
              />
            </div>
            <div className="form-group">
              {/* Removed Genre input for albums */}
            </div>
            <div className="form-group">
              <textarea
                name="description"
                placeholder="Description"
                value={newAlbumData.description}
                onChange={handleAlbumDataChange}
                className="album-description-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="albumCoverArt">Album Cover Art</label>
              <input
                type="file"
                id="albumCoverArt"
                accept="image/*"
                onChange={(e) => setAlbumCoverFile(e.target.files[0])}
              />
            </div>

            {/* ✅ Add New Song button  */}
            <button onClick={() => setShowAlbumSongModal(true)}>
              Add New Song
            </button>

            <div className="form-buttons">
              <button onClick={handleCreateAlbum}>Create Album</button>
              <button onClick={handleCancelAlbumCreation}>Cancel</button>
            </div>
          </div>
        )}

        {/* ✅ Album Song Modal (visible if showAlbumSongModal is true) */}
        {showAlbumSongModal && (
  <div className="modal-overlay">
    <div className="modal-content">
      <h3>Add Song to Album</h3>

      <div className="form-group">
        <input
          type="text"
          name="title"
          placeholder="Song Title"
          value={newAlbumSongData.title}
          onChange={handleNewAlbumSongChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="albumSongGenre">Genre</label>
        <select
          id="albumSongGenre"
          name="genre"
          value={newAlbumSongData.genre}
          onChange={handleNewAlbumSongChange}
          required
        >
          <option value="" disabled>Select Genre</option>
          <option value="Hip-Hop">Hip-Hop</option>
          <option value="Pop">Pop</option>
          <option value="Rock">Rock</option>
          <option value="Electronic">Electronic</option>
          <option value="Rap">Rap</option>
          <option value="Other">Other</option>
        </select>
      </div>


      <div className="form-group">
        <textarea
          name="description"
          placeholder="Description"
          value={newAlbumSongData.description}
          onChange={handleNewAlbumSongChange}
        />
      </div>

      <div className="form-group">
        <label>Audio File</label>
        <input
          type="file"
          accept="audio/*"
          ref={audioFileRef}
          onChange={(e) =>
            setNewAlbumSongData((prev) => ({
              ...prev,
              file: e.target.files[0]
            }))
          }
        />
      </div>

      <div className="form-group">
        <label>Cover Art (Optional)</label>
        <input
          type="file"
          accept="image/*"
          ref={coverArtRef}
          onChange={(e) =>
            setNewAlbumSongData((prev) => ({
              ...prev,
              coverArt: e.target.files[0]
            }))
          }
        />
      </div>

      <div className="modal-buttons">
        <button onClick={handleAddSongToAlbum}>Save Song</button>
        <button onClick={() => setShowAlbumSongModal(false)}>Cancel</button>
      </div>

      {albumSongs.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <strong>Added Songs:</strong>
          <ul>
            {albumSongs.map((song, idx) => (
              <li key={idx}>
                {song.title} - {song.genre}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  </div>
)}



      </>
    )}

    {albums.length === 0 ? (
      <p className="no-content">No albums created yet.</p>
    ) : (
      <div className="albums-list">
        {albums.map((album) => (
          <Link
            to={`/album/${album.album_id}`}
            key={album.album_id}
            className="album-card"
          >
            <div className="album-cover">
              <img
                src={album.album_art_url || 'https://via.placeholder.com/300'}
                alt={album.title}
              />
            </div>
            <div className="album-info">
              <h3>{album.title}</h3>
              <p className="album-genre">{album.genre}</p>
              <p className="album-date">
                Released: {new Date(album.release_date).toLocaleDateString()}
              </p>
              <p className="album-views">Views: {album.views}</p>
            </div>
          </Link>
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
                        setUserProfile((prev) => ({ ...prev, editingBio: true, newBio: prev.bio }))
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
                      <button
                        onClick={() =>
                          setUserProfile((prev) => ({ ...prev, editingBio: false }))
                        }
                      >
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


          {activeTab === 'following' && (
            <div className="following-tab">
              <h2>Following</h2>
              {followingUsers.length === 0 ? (
                <p className="no-content">You're not following anyone yet.</p>
              ) : (
                <div className="artists-grid">
                  {followingUsers.map(user => (
                    <Link to={`/artist/${user.user_id}`} key={user.user_id} className="artist-card">
                      <div className="artist-avatar">
                        <img
                          src={user.profile_picture_url || '/coogmusiclogonobg.png'}
                          alt={user.name}
                          onError={(e) => e.target.src = '/coogmusiclogonobg.png'}
                        />
                      </div>
                      <h3>{user.name}</h3>
                      <p>{user.account_type}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}


          {activeTab === 'likes' && (
            <div className="likes-tab">
              <h2>Liked Songs</h2>
              {likedSongs.length === 0 ? (
                <p className="no-content">No liked songs yet.</p>
              ) : (
                <div className="songs-list">
                  {likedSongs.map(song => (
                    <div className="song-card" key={song.song_id}>
                      <div className="song-info">
                        <h3>{song.title}</h3>
                        <p className="song-genre">{song.genre}</p>
                        <p className="song-date">
                          Uploaded: {new Date(song.upload_date).toLocaleDateString()}
                        </p>
                        <p className="song-views">Views: {song.views}</p>
                      </div>
                      <div className="song-controls">
                        <button
                          className="play-btn"
                          onClick={() => {
                            setCurrentSong(song);
                            axios.post(`/increment-view/${song.song_id}`).catch(console.error);
                          }}
                        >
                          Play
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* All confirmation modals */}
      <ConfirmModal
        isOpen={showDeleteAccountConfirmModal}
        message="Are you sure you want to delete your account? This action cannot be undone."
        onConfirm={async () => {
          try {
            await axios.delete(`/user/${currentUser.id}`);
            await signOut();
            showSuccess("Account deleted successfully.");
            window.location.href = "/";
          } catch (err) {
            console.error("Error deleting account:", err);
            showError("Failed to delete account.");
          }
        }}
        onCancel={() => setShowDeleteAccountConfirmModal(false)}
      />

      <ConfirmModal
        isOpen={showDeleteSongConfirmModal}
        message={songToDelete ? `Are you sure you want to delete "${songToDelete.title}"? This will also remove it from all playlists and comments.` : ""}
        onConfirm={async () => {
          try {
            await axios.delete(`/api/song/${songToDelete.song_id}`);
            setUserSongs(prev => prev.filter(s => s.song_id !== songToDelete.song_id));
            showSuccess("Song deleted successfully!");
          } catch (error) {
            console.error("Error deleting song:", error);
            showError("Failed to delete song.");
          } finally {
            setShowDeleteSongConfirmModal(false);
            setSongToDelete(null);
          }
        }}
        onCancel={() => {
          setShowDeleteSongConfirmModal(false);
          setSongToDelete(null);
        }}
      />

      <ConfirmModal
        isOpen={showDeletePlaylistConfirmModal}
        message={playlistToDelete ? `Are you sure you want to delete playlist "${playlistToDelete.name}"?` : ""}
        onConfirm={async () => {
          try {
            await axios.delete(`/api/playlist/${playlistToDelete.playlist_id}`);
            setPlaylists(prev => prev.filter(pl => pl.playlist_id !== playlistToDelete.playlist_id));
            showSuccess("Playlist deleted successfully!");
          } catch (error) {
            console.error("Error deleting playlist:", error);
            showError("Failed to delete playlist. Please try again.");
          } finally {
            setShowDeletePlaylistConfirmModal(false);
            setPlaylistToDelete(null);
          }
        }}
        onCancel={() => {
          setShowDeletePlaylistConfirmModal(false);
          setPlaylistToDelete(null);
        }}
      />
    </div>
  );
};

export default Profile;