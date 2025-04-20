// src/components/DataReports.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminPortal.css';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const genreColors = {
  'Hip-Hop': '#FF6384',
  Pop:        '#36A2EB',
  Rock:       '#FFCE56',
  Electronic: '#4BC0C0',
  Rap:        '#9966FF',
  Other:      '#FF9F40'
};

export default function DataReports() {
  const [currentReport, setCurrentReport]      = useState(null);
  const [genreCounts, setGenreCounts]          = useState({});
  const [songs, setSongs]                      = useState([]);
  const [startDate, setStartDate]              = useState('');
  const [endDate, setEndDate]                  = useState('');
  const [selectedGenres, setSelectedGenres]    = useState([]);
  const [minViews, setMinViews]                = useState('');
  const [maxViews, setMaxViews]                = useState('');
  const [loading, setLoading]                  = useState(false);
  const navigate                               = useNavigate();

  function toggleGenre(genre) {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  }

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate)         params.append('start', startDate);
      if (endDate)           params.append('end', endDate);
      selectedGenres.forEach(g => params.append('genre', g));
      if (minViews)          params.append('minViews', minViews);
      if (maxViews)          params.append('maxViews', maxViews);

      const res  = await fetch(`/admin/reports/genre?${params}`);
      const data = await res.json();
      setGenreCounts(data.genreCounts);
      setSongs(data.songs);
    } catch (err) {
      console.error('Error loading report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenreClick = () => {
    setCurrentReport('genre');
    fetchReport();
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedGenres([]);
    setMinViews('');
    setMaxViews('');
    fetchReport();
  };

  const labels          = Object.keys(genreCounts);
  const values          = Object.values(genreCounts);
  const backgroundColor = labels.map(l => genreColors[l] || '#ccc');
  const chartData       = { labels, datasets: [{ data: values, backgroundColor }] };

  return (
    <div className="admin-portal">
      <h1>Admin Portal: Data Reports</h1>
      <div className="button-row">
        <button className="primary" onClick={() => navigate('/adminportal')}>
          Back to Users
        </button>
      </div>

      <div className="report-box">
        <div className="report-buttons">
          <button
            className={currentReport === 'genre' ? 'primary' : ''}
            onClick={handleGenreClick}
          >
            Genre of Songs
          </button>
          <button
            className={currentReport === 'report2' ? 'primary' : ''}
            onClick={() => setCurrentReport('report2')}
          >
            Report 2
          </button>
          <button
            className={currentReport === 'report3' ? 'primary' : ''}
            onClick={() => setCurrentReport('report3')}
          >
            Report 3
          </button>
        </div>

        {currentReport === 'genre' && (
          <>
            <h2>Genre of Songs Report</h2>
            <div className="filters">
              <label>
                Start Date:
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
              </label>
              <label>
                End Date:
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
              </label>

              <fieldset className="genre-checkboxes">
                <legend>Genres:</legend>
                {Object.keys(genreColors).map(g => (
                  <label key={g}>
                    <input
                      type="checkbox"
                      value={g}
                      checked={selectedGenres.includes(g)}
                      onChange={() => toggleGenre(g)}
                    />{' '}
                    {g}
                  </label>
                ))}
              </fieldset>

              <label>
                Min Views:
                <input
                  type="number"
                  value={minViews}
                  onChange={e => setMinViews(e.target.value)}
                  placeholder="0"
                />
              </label>
              <label>
                Max Views:
                <input
                  type="number"
                  value={maxViews}
                  onChange={e => setMaxViews(e.target.value)}
                  placeholder="∞"
                />
              </label>

              <button className="primary" onClick={fetchReport}>
                Fetch Report
              </button>
              <button className="secondary" onClick={clearFilters}>
                Clear Filters
              </button>
            </div>

            {loading ? (
              <p>Loading reports…</p>
            ) : (
              <>
                <div className="chart">
                  <Pie data={chartData} />
                </div>
                <div className="table">
                  <h3>Song Details</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Artist</th>
                        <th>Genre</th>
                        <th>Views</th>
                        <th>Upload Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {songs.map(song => (
                        <tr key={song.song_id}>
                          <td>{song.title}</td>
                          <td>{song.artist_name}</td>
                          <td>{song.genre}</td>
                          <td>{song.views}</td>
                          <td>{new Date(song.upload_date).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
