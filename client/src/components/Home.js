import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Home.css';

function Home() {
  const [topSongs, setTopSongs] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [description, setDescription] = useState('');
  const [coverArtUrl, setCoverArtUrl] = useState('');
  const [musicianId, setMusicianId] = useState(''); // ----------------- Temporary input field for musician ID -----------------
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Fetch the top 5 songs from your backend endpoint
    axios.get('/top-songs').then(response => { setTopSongs(response.data); })
      .catch(error => {
        console.error('Error fetching top songs:', error);
      });

    // ----------------- Future: Fetch musician_id from user session or authentication system -----------------
    // Instead of manually inputting musician_id, this should be fetched when the user logs in.
    // Example:
    // axios.get('/current-user')
    //   .then(response => setMusicianId(response.data.user_id))
    //   .catch(error => console.error('Error fetching user ID:', error));
  }, []);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };



/* 
  upload func commented out for now; move to after user logs in and is authenticated to post
  
  const handleUpload = async () => {
    if (!title || !genre || !description || !coverArtUrl || !musicianId || !selectedFile) {
      setMessage('All fields are required.');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('genre', genre);
    formData.append('description', description);
    formData.append('cover_art_url', coverArtUrl);
    formData.append('musician_id', musicianId); // ----------------- This should eventually come from user session -----------------
    formData.append('file', selectedFile);

    try {
      const response = await axios.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage('File uploaded successfully: ' + response.data.url);
    } catch (error) {
      console.error('Error uploading file:', error);
      if (error.response) {
        setMessage(`Failed to upload file: ${error.response.data.error || "Unknown error"}`);
      } else {
        setMessage('Failed to upload file. Check server logs.');
      }
    }
  };
*/

  return (
    <div className="home-container">
      {/* Logo Section */}
      <div className="logo-container">
        <img
          src="/coogmusiclogo-updated.png"
          alt="CoogMusic Logo"
          className="coogmusic-logo"
        />
      </div>

      {/* Headline */}
      <h1 className="welcome-text">Welcome to CoogMusic!</h1>
      <p className="subtitle">The #1 place for all your UH music streaming needs.</p>

{/*
  Upload Music Section commented out for now; move to after user logs in and is authenticated to post

  <div className="upload-container">
    <h2>Upload Your Music</h2>
    <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} /><br />
    <input type="text" placeholder="Genre" value={genre} onChange={e => setGenre(e.target.value)} /><br />
    <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)}></textarea><br />
    <input type="text" placeholder="Cover Art URL" value={coverArtUrl} onChange={e => setCoverArtUrl(e.target.value)} /><br />
    
    {/* ----------------- Temporary musician ID input (to be replaced with session data) ----------------- */}
    {/*<input type="text" placeholder="Musician User ID" value={musicianId} onChange={e => setMusicianId(e.target.value)} /><br />
    
    <input type="file" onChange={handleFileChange} /><br />
    <button onClick={handleUpload}>Upload</button>
    <p>{message}</p>
  </div>
*/}


      {/* Top Songs Table */}
      <div className="top-songs-container">
        <h2>Top 5 Most Streamed Songs</h2>
        <table className="top-songs-table">
          <thead>
            <tr>
              <th>Song</th>
              <th>Artist</th>
              <th>Streams</th>
            </tr>
          </thead>
          <tbody>
            {topSongs.map((song, index) => (
              <tr key={index}>
                <td>{song.title}</td>
                <td>{song.file_url}</td>
                <td>{song.musician_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Home;
