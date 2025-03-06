import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Home.css';

function Home() {
  const [topSongs, setTopSongs] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    // Fetch the top 5 songs from your backend endpoint
    axios.get('top-songs')
      .then(response => {
        setTopSongs(response.data);
      })
      .catch(error => {
        console.error('Error fetching top songs:', error);
      });
  }, []);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('File uploaded successfully: ' + response.data.url);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file.');
    }
  };

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
      <p className="subtitle">
        The #1 place for all your UH music streaming needs.
      </p>

      {/* Upload Music Section */}
      <div className="upload-container">
        <h2>Upload Your Music</h2>
        <input type="file" onChange={handleFileChange} />
        <button onClick={handleUpload}>Upload</button>
      </div>

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
