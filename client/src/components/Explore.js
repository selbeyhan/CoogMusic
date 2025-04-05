import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Explore.css';
import { useAudio } from '../contexts/AudioContext';

function Explore() {
  const [latestSongs, setLatestSongs] = useState([]);
  const [genreContent, setGenreContent] = useState([]);
  const { setCurrentSong } = useAudio(); 

  useEffect(() => {
    axios.get('/newest-songs')
      .then((response) => {
        const top5 = response.data.slice(0, 5).map((song) => ({
          song_id: song.song_id,
          title: song.title,
          artist: song.musician_name,
          views: song.views,
          imageUrl: song.cover_art_url || '/coogmusiclogonobg.png',
          audioUrl: song.audio_url
        }));
        setLatestSongs(top5);
      })
      .catch((error) => {
        console.error('Error fetching latest songs:', error);
      });

    axios.get('/top-songs-by-genre')
      .then((response) => {
        const formatted = response.data.map(section => ({
          genre: section.genre,
          songs: section.songs.slice(0, 5).map(song => ({
            song_id: song.song_id,
            title: song.title,
            artist: song.musician_name,
            views: song.views,
            imageUrl: song.cover_art_url || '/coogmusiclogonobg.png',
            audioUrl: song.audio_url
          }))
        }));
        setGenreContent(formatted);
      })
      .catch((error) => {
        console.error('Error fetching songs by genre:', error);
      });
  }, []);

  const playSong = (song) => {
    console.log('Clicked song:', song);
    setCurrentSong(song);
    if (song.song_id !== undefined) {
      axios.post(`/increment-view/${song.song_id}`).catch(console.error);
    } else {
      console.error('song_id is undefined for this song');
    }
  };

  return (
    <div className="explore-container">
      <div className="explore-logo-container">
        <img
          src="/coogmusiclogonobg.png"
          alt="CoogMusic Logo"
          className="explore-coogmusic-logo"
        />
      </div>

      <section className="explore-latest-songs-section">
        <h2>Latest Releases</h2>
        <div className="explore-horizontal-scroll">
          {latestSongs.map((song, index) => (
            <div
              key={index}
              className="explore-song-card"
              onClick={() => playSong(song)}
            >
              <img
                src={song.imageUrl}
                alt={song.title}
                className="explore-song-image-placeholder"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/coogmusiclogonobg.png";
                }}
              />
              <div className="explore-song-info">
                <h3>{song.title}</h3>
                <p>{song.artist}</p>
                <p>{song.views} views</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {genreContent.map((genreSection, index) => (
        <section key={index} className="explore-genre-section">
          <h2>{genreSection.genre}</h2>
          {genreSection.songs.length > 0 ? (
            <div className="explore-horizontal-scroll">
              {genreSection.songs.map((song, songIndex) => (
                <div
                  key={songIndex}
                  className="explore-song-card"
                  onClick={() => playSong(song)}
                >
                  <img
                    src={song.imageUrl}
                    alt={song.title}
                    className="explore-song-image-placeholder"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/coogmusiclogonobg.png";
                    }}
                  />
                  <div className="explore-song-info">
                    <h3>{song.title}</h3>
                    <p>{song.artist}</p>
                    <p>{song.views} views</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="explore-no-songs-message">There are no songs for this genre yet.</p>
          )}
        </section>
      ))}
    </div>
  );
}

export default Explore;
