/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useUser } from '@clerk/clerk-react';
import { useAudio } from '../contexts/AudioContext';
import './ArtistProfile.css';

const ArtistProfile = () => {
  const { artistId } = useParams();
  const { user: currentUser } = useUser();
  const { setCurrentSong } = useAudio();

  const [artist, setArtist] = useState(null);
  const [artistSongs, setArtistSongs] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('songs');

  const [currentUserId, setCurrentUserId] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  useEffect(() => {
    const fetchArtistData = async () => {
      try {
        const userResponse = await axios.get(`/api/user-by-id/${artistId}`);
        if (!userResponse.data || !userResponse.data.user) {
          setError("Artist not found");
          setIsLoading(false);
          return;
        }

        const artistData = userResponse.data.user;
        setArtist(artistData);

        const songsResponse = await axios.get(`/api/artist-songs/${artistId}`);
        setArtistSongs(songsResponse.data || []);

        const albumsResponse = await axios.get(`/api/getartistalbums/${artistData.user_id}`);
        setAlbums(albumsResponse.data.albums || []);

        const followersRes = await axios.get(`/api/followers/${artistId}`);
        setFollowerCount(followersRes.data.followers?.length || 0);

        if (currentUser) {
          const res = await axios.get(`/user/${currentUser.id}`);
          const myId = res.data.user.user_id;
          setCurrentUserId(myId);

          const isFollowingRes = await axios.get(`/api/is-following/${myId}/${artistId}`);
          setIsFollowing(isFollowingRes.data.isFollowing);
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching artist data:", error);
        setError(error.response?.data?.error || "Failed to load artist");
        setIsLoading(false);
      }
    };

    fetchArtistData();
  }, [artistId, currentUser]);



  const toggleFollow = async () => {
    if (!currentUserId || !artistId || isButtonDisabled) return;
  
    setIsButtonDisabled(true); // Disable button while request is in flight
  
    try {
      if (isFollowing) {
        await axios.delete('/api/unfollow', {
          data: { follower_id: currentUserId, followed_id: artistId }
        });
        setIsFollowing(false);
        setFollowerCount(prev => prev - 1);
      } else {
        await axios.post('/api/follow', {
          follower_id: currentUserId,
          followed_id: artistId
        });
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
      }
    } catch (err) {
      console.error("Follow toggle error:", err);
    } finally {
      setIsButtonDisabled(false); // Re-enable after response is complete
    }
  };
  
  

  const playSong = (song) => {
    setCurrentSong(song);
    axios.post(`/increment-view/${song.song_id}`).catch(console.error);
  };

  if (isLoading) return <div className="loading-container">Loading artist profile...</div>;
  if (error) return <div className="error-container">{error}</div>;

  const isOwnProfile = currentUserId === parseInt(artistId);

  return (
    <div className="artist-profile-container">
      <div className="artist-header">
        <div className="artist-image">
          <img
            src={artist.profile_picture_url || "/coogmusiclogonobg.png"}
            alt={`${artist.name}'s profile`}
            onError={(e) => e.target.src = "/coogmusiclogonobg.png"}
          />
        </div>
        <div className="artist-info">
          <h1>{artist.name}</h1>
          <p className="artist-bio">{artist.bio || "No bio available."}</p>

            {/* Display Account Type */}
          <div className="artist-account-type">
            <span className="account-type-label"></span>
            <span className="account-type-value">{artist.account_type || "Not specified"}</span>
          </div>

          <div className="artist-stats">
            <div className="stat">
              <span className="stat-value">{artist.monthly_listeners || 0}</span>
              <span className="stat-label">Monthly Views</span>
            </div>
            <div className="stat">
              <span className="stat-value">{artistSongs.length}</span>
              <span className="stat-label">Songs</span>
            </div>
            <div className="stat">
              <span className="stat-value">{albums.length}</span>
              <span className="stat-label">Albums</span>
            </div>
            <div className="stat">
              <span className="stat-value">{followerCount}</span>
              <span className="stat-label">Followers</span>
            </div>
          </div>
          {!isOwnProfile && (
            <button className="follow-btn" onClick={toggleFollow} disabled={isButtonDisabled}>
              {isFollowing ? "Unfollow" : "Follow"}
            </button>
          )}
        </div>
      </div>

      <div className="artist-content">
        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === 'songs' ? 'active' : ''}`}
            onClick={() => setActiveTab('songs')}
          >
            Songs
          </button>
          <button
            className={`tab-btn ${activeTab === 'albums' ? 'active' : ''}`}
            onClick={() => setActiveTab('albums')}
          >
            Albums
          </button>
          <button
            className={`tab-btn ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            About
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'songs' && (
            <div className="songs-tab">
              <h2>Songs</h2>
              {artistSongs.length === 0 ? (
                <p className="no-content">No songs uploaded yet.</p>
              ) : (
                <div className="songs-list">
                  {artistSongs.map((song) => (
                    <div className="song-card" key={song.song_id}>
                      <div className="song-cover">
                        <img
                          src={song.cover_art_url || "https://via.placeholder.com/150"}
                          alt={song.title}
                          onError={(e) => e.target.src = "https://via.placeholder.com/150"}
                        />
                      </div>
                      <div className="song-info">
                        <h3>{song.title}</h3>
                        <p className="song-genre">{song.genre}</p>
                        <p className="song-date">
                          Uploaded: {new Date(song.upload_date).toLocaleDateString()}
                        </p>
                        <p className="song-views">Views: {song.views}</p>
                      </div>
                      <div className="song-controls">
                        <button className="play-btn" onClick={() => playSong(song)}>
                          Play
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'albums' && (
            <div className="albums-tab">
              <h2>Albums</h2>
              {albums.length === 0 ? (
                <p className="no-content">No albums available.</p>
              ) : (
                <div className="albums-list">
                  {albums.map((album) => (
                    <Link key={album.album_id} to={`/album/${album.album_id}`} className="album-card">
                      <div className="album-cover">
                        <img
                          src={album.album_art_url || 'https://via.placeholder.com/300'}
                          alt={album.title}
                          onError={(e) => e.target.src = 'https://via.placeholder.com/300'}
                        />
                      </div>
                      <div className="album-info">
                        <h3>{album.title}</h3>
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
              <h2>About {artist.name}</h2>
              <div className="info-item">
                <span className="label">UH Affiliation:</span>
                <span className="value">{artist.uh_affiliation || "Not specified"}</span>
              </div>
              <div className="info-item">
                <span className="label">Member Since:</span>
                <span className="value">
                  {artist.registration_date
                    ? new Date(artist.registration_date).toLocaleDateString()
                    : "Not available"}
                </span>
              </div>
              <div className="bio-section">
                <h3>Bio</h3>
                <p>{artist.bio || "No bio provided."}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArtistProfile;
