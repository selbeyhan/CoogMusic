import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import './Profile.css';

const Profile = () => {
  const { userId } = useParams();
  const { user: currentUser } = useUser();
  const [userProfile, setUserProfile] = useState(null);
  const [userSongs, setUserSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [activeTab, setActiveTab] = useState('songs');

  // Upload form state
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadFormData, setUploadFormData] = useState({
    title: '',
    genre: '',
    description: '',
    cover_art_url: 'https://via.placeholder.com/150'
  });
  const [uploadFile, setUploadFile] = useState(null);

  useEffect(() => {
    // Set if the current user is the profile owner
    if (currentUser) {
      setIsOwner(currentUser.id === userId);
    }

    // Fetch user profile data
    const fetchUserProfile = async () => {
      try {
        // ✅ Real API call to get user data from MySQL via backend
        const response = await axios.get(`/user/${currentUser?.id}`);
        const userData = response.data.user;
        console.log("🔍 MySQL user profile:", userData); // <-- ADD THIS


        setUserProfile({
          id: userData.user_id,
          name: userData.name,
          email: userData.email,
          bio: userData.bio || "Music enthusiast and UH student.",
          profilePicture: currentUser?.profileImageUrl || 'https://via.placeholder.com/150',
          accountType: userData.account_type || "Musician",
          registrationDate: userData.registration_date || "2023-01-15",
          monthlyListeners: userData.monthly_listeners || 0,
          uhAffiliation: userData.uh_affiliation || "None"
        });

        // Fetch user's songs
        // Replace with actual API endpoint when available
        // const songsResponse = await axios.get(`/api/users/${userId}/songs`);
        // setUserSongs(songsResponse.data);

        // Mocked songs data
        setUserSongs([
          {
            id: 1,
            title: "My First Track",
            genre: "Pop",
            uploadDate: "2023-02-10",
            duration: 180,
            fileUrl: "https://coogsmusicstorage.blob.core.windows.net/songs/sample1.mp3",
            coverArtUrl: "https://via.placeholder.com/150"
          },
          {
            id: 2,
            title: "Coog Vibes",
            genre: "Hip-Hop",
            uploadDate: "2023-03-15",
            duration: 210,
            fileUrl: "https://coogsmusicstorage.blob.core.windows.net/songs/sample2.mp3",
            coverArtUrl: "https://via.placeholder.com/150"
          }
        ]);

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching profile data:", error);
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId, currentUser]);

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

      // Refresh songs list or add the new song to the existing list
      // In a real app, you'd fetch the updated list or add the new song with its returned data

      alert('Song uploaded successfully!');
      setShowUploadForm(false);
      setUploadFormData({
        title: '',
        genre: '',
        description: '',
        cover_art_url: 'https://via.placeholder.com/150'
      });
      setUploadFile(null);
      setIsLoading(false);
    } catch (error) {
      console.error('Error uploading song:', error);
      alert('Failed to upload song. Please try again.');
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
            onError={(e) => e.target.src = '/coogmusiclogonobg.png'}
          />
        </div>
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
          {isOwner && (
            <button
              className="upload-btn"
              onClick={() => setShowUploadForm(!showUploadForm)}
            >
              {showUploadForm ? 'Cancel Upload' : 'Upload New Song'}
            </button>
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
                <div className="songs-list">
                  {userSongs.map(song => (
                    <div className="song-card" key={song.id}>
                      <div className="song-cover">
                        <img src={song.coverArtUrl || "https://via.placeholder.com/150"} alt={song.title} />
                      </div>
                      <div className="song-info">
                        <h3>{song.title}</h3>
                        <p className="song-genre">{song.genre}</p>
                        <p className="song-date">Uploaded: {new Date(song.uploadDate).toLocaleDateString()}</p>
                      </div>
                      <div className="song-controls">
                        <button className="play-btn">Play</button>
                        {isOwner && (
                          <button className="delete-btn">Delete</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'playlists' && (
            <div className="playlists-tab">
              <h2>Playlists</h2>
              <p className="no-content">No playlists created yet.</p>
              {/* Add playlist content when feature is implemented */}
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
              <div className="bio-section">
                <h3>Bio</h3>
                <p>{userProfile.bio || "No bio provided."}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
