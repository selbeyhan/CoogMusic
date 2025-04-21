import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './AdminPortal.css';
import ConfirmModal from './ConfirmModal';
import { useToast } from '../contexts/ToastContext';

function AdminPortal() {
  const { showSuccess, showError, showInfo } = useToast();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showingUnverified, setShowingUnverified] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const [songs, setSongs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState({ type: '', id: null });

  const fetchAdminUsers = async () => {
    try {
      const res = await fetch('/admin-users');
      const data = await res.json();
      const list = data.users || data;
      setUsers(list);
      setFilteredUsers(list);
    } catch (err) {
      console.error('❌ Error fetching admin users:', err);
    }
  };

  const fetchAllSongs = async () => {
    try {
      const res = await fetch('/admin/all-songs');
      const songs = await res.json();
      setSongs(songs);
    } catch (err) {
      console.error('❌ Error fetching songs:', err);
    }
  };

  const fetchAllPlaylists = async () => {
    try {
      const res = await fetch('/admin/all-playlists'); 
      const playlists = await res.json();
      setPlaylists(playlists);
    } catch (err) {
      console.error('❌ Error fetching playlists:', err);
    }
  };

  const fetchAllAlbums = async () => {
    try {
      const res = await fetch('/admin/all-albums'); 
      const albums = await res.json();
      setAlbums(albums);
    } catch (err) {
      console.error('❌ Error fetching albums:', err);
    }
  };

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchAdminUsers();
    } else if (activeTab === 'songs') {
      fetchAllSongs();
    } else if (activeTab === 'playlists') {
      fetchAllPlaylists();
    } else if (activeTab === 'albums') {
      fetchAllAlbums();
    }
  }, [activeTab]);

  // Handle deletion functions
  const handleDeleteItem = (type, id) => {
    setItemToDelete({ type, id });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    const { type, id } = itemToDelete;
    
    try {
      let endpoint = '';
      
      switch (type) {
        case 'song':
          endpoint = `/admin/song/${id}`;
          break;
        case 'playlist':
          endpoint = `/admin/playlist/${id}`;
          break;
        case 'album':
          endpoint = `/admin/album/${id}`;
          break;
        default:
          console.error('Unknown item type:', type);
          return;
      }
      
      const res = await fetch(endpoint, { method: 'DELETE' });
      
      if (res.ok) {
        // Update the appropriate state based on what was deleted
        if (type === 'song') {
          setSongs(songs.filter(song => song.song_id !== id));
        } else if (type === 'playlist') {
          setPlaylists(playlists.filter(playlist => playlist.playlist_id !== id));
        } else if (type === 'album') {
          setAlbums(albums.filter(album => album.album_id !== id));
        }
        
        showSuccess(`${type} deleted successfully`);
      } else {
        console.error(`Failed to delete ${type}:`, await res.json());
        showError(`Failed to delete ${type}`);
      }
    } catch (err) {
      console.error(`Error deleting ${type}:`, err);
      showError(`Error deleting ${type}`);
    } finally {
      setShowDeleteConfirm(false);
      setItemToDelete({ type: '', id: null });
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleDelete = async (user) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    const id = user.clerk_user_id || user.user_id;
    const endpoint = user.clerk_user_id
      ? `/user/${encodeURIComponent(id)}`
      : `/delete-by-id/${encodeURIComponent(id)}`;

    try {
      const res = await fetch(endpoint, { method: 'DELETE' });
      if (res.ok) {
        setUsers(u => u.filter(
          u => u.clerk_user_id !== user.clerk_user_id && u.user_id !== user.user_id
        ));
        setFilteredUsers(u => u.filter(
          u => u.clerk_user_id !== user.clerk_user_id && u.user_id !== user.user_id
        ));
      } else {
        console.error('❌ Delete failed:', await res.json());
      }
    } catch (err) {
      console.error('❌ Error deleting user:', err);
    }
  };

  const handleVerificationChange = async (userId, newStatus) => {
    try {
      const res = await fetch(`/update-verification/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verification_status: newStatus }),
      });
      if (res.ok) {
        setUsers(u => u.map(u =>
          u.user_id === userId ? { ...u, verification_status: newStatus } : u
        ));
        setFilteredUsers(u => u.map(u =>
          u.user_id === userId ? { ...u, verification_status: newStatus } : u
        ));
      } else {
        console.error('❌ Failed to update verification');
      }
    } catch (err) {
      console.error('❌ Error updating verification:', err);
    }
  };

  const handleShowUnverified = () => {
    setFilteredUsers(users.filter(u => u.verification_status === 0));
    setShowingUnverified(true);
  };

  const handleShowAll = () => {
    setFilteredUsers(users);
    setShowingUnverified(false);
  };

  const searchFilteredUsers = filteredUsers.filter(user =>
    Object.values(user).some(val =>
      val?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="admin-portal">
      <h1>Admin Portal</h1>
  
      <div className="button-row">
        <Link to="/admin/reports">
          <button className="primary">Show Data Reports</button>
        </Link>
        <button 
          className={activeTab === 'users' ? 'primary' : ''}
          onClick={() => setActiveTab('users')}
        >
          Manage Users
        </button>
        <button 
          className={activeTab === 'songs' ? 'primary' : ''}
          onClick={() => setActiveTab('songs')}
        >
          Manage Songs
        </button>
        <button 
          className={activeTab === 'playlists' ? 'primary' : ''}
          onClick={() => setActiveTab('playlists')}
        >
          Manage Playlists
        </button>
        <button 
          className={activeTab === 'albums' ? 'primary' : ''}
          onClick={() => setActiveTab('albums')}
        >
          Manage Albums
        </button>
      </div>
  
      <div className="search-container">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>
  
      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          <div className="button-row" style={{ marginBottom: '10px' }}>
            {!showingUnverified
              ? <button onClick={handleShowUnverified}>Show Unverified Users</button>
              : <button onClick={handleShowAll}>Show All Users</button>
            }
          </div>
  
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Type</th>
                <th>Joined</th>
                <th>Avatar</th>
                <th>Bio</th>
                <th>Listens</th>
                <th>Affil</th>
                <th>Status</th>
                <th>Role</th>
                <th>ID</th>
                <th>ClerkID</th>
                <th>Act</th>
              </tr>
            </thead>
            <tbody>
              {searchFilteredUsers.length > 0 ? (
                searchFilteredUsers.map((u, idx) => (
                  <tr key={idx}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.account_type}</td>
                    <td>{u.registration_date}</td>
                    <td>
                      <img
                        src={u.profile_picture_url || 'default-profile.png'}
                        alt="Avatar"
                        width="50"
                        height="50"
                      />
                    </td>
                    <td>{u.bio}</td>
                    <td>{u.monthly_listeners}</td>
                    <td>{u.uh_affiliation}</td>
                    <td>
                      <select
                        value={u.verification_status}
                        onChange={e =>
                          handleVerificationChange(u.user_id, +e.target.value)
                        }
                      >
                        <option value={1}>Verified</option>
                        <option value={0}>Unverified</option>
                      </select>
                    </td>
                    <td>{u.admin_role}</td>
                    <td>{u.user_id}</td>
                    <td>{u.clerk_user_id}</td>
                    <td>
                      <button onClick={() => handleDelete(u)}>Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="13">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
  
      {/* Songs Tab */}
      {activeTab === 'songs' && (
        <table className="users-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Artist</th>
              <th>Genre</th>
              <th>Upload Date</th>
              <th>Views</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {songs.filter(song => 
              song.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              song.musician_name?.toLowerCase().includes(searchTerm.toLowerCase())
            ).map((song, idx) => (
              <tr key={idx}>
                <td>{song.title}</td>
                <td>{song.musician_name}</td>
                <td>{song.genre}</td>
                <td>{new Date(song.upload_date).toLocaleDateString()}</td>
                <td>{song.views}</td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleDeleteItem('song', song.song_id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {songs.length === 0 && (
              <tr>
                <td colSpan="6">No songs found</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
  
      {/* Playlists Tab */}
      {activeTab === 'playlists' && (
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Creator</th>
              <th>Creation Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {playlists.filter(playlist =>
              playlist.name?.toLowerCase().includes(searchTerm.toLowerCase())
            ).map((playlist, idx) => (
              <tr key={idx}>
                <td>{playlist.name}</td>
                <td>{playlist.creator_name}</td>
                <td>{new Date(playlist.creation_date).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => handleDeleteItem('playlist', playlist.playlist_id)}>Delete</button>
                </td>
              </tr>
            ))}
            {playlists.length === 0 && (
              <tr>
                <td colSpan="4">No playlists found</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
  
      {/* Albums Tab */}
      {activeTab === 'albums' && (
        <table className="users-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Artist</th>
              <th>Release Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {albums.filter(album =>
              album.title?.toLowerCase().includes(searchTerm.toLowerCase())
            ).map((album, idx) => (
              <tr key={idx}>
                <td>{album.title}</td>
                <td>{album.artist_name || 'Unknown'}</td>
                <td>{new Date(album.release_date).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => handleDeleteItem('album', album.album_id)}>Delete</button>
                </td>
              </tr>
            ))}
            {albums.length === 0 && (
              <tr>
                <td colSpan="4">No albums found</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
  
      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        message={`Are you sure you want to delete this ${itemToDelete.type}?`}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}

export default AdminPortal;