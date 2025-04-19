// src/components/DataReports.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import the portal stylesheet
import './AdminPortal.css';
// import Chart.js and Pie component
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function DataReports() {
  // report data state
  const [genreCounts, setGenreCounts] = useState({});
  const [songs, setSongs] = useState([]);
  // filter state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // fetch report from backend route /admin/reports/genre
  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/admin/reports/genre?start=${startDate}&end=${endDate}`
      );
      const data = await res.json();
      // expect { genreCounts: {...}, songs: [...] }
      setGenreCounts(data.genreCounts);
      setSongs(data.songs);
    } catch (err) {
      console.error('❌ Error loading report:', err);
    } finally {
      setLoading(false);
    }
  };

  // initial load
  useEffect(() => {
    fetchReport();
  }, []);

  // prepare data for Pie chart
  const chartData = {
    labels: Object.keys(genreCounts),
    datasets: [
      {
        data: Object.values(genreCounts),
      },
    ],
  };

  return (
    // use the same admin-portal container
    <div className="admin-portal">
      <h1>Admin Portal: Data Reports</h1>

      {/* use the same button-row and primary button styling */}
      <div className="button-row">
        <button className="primary" onClick={() => navigate('/adminportal')}>
          ← Back to Users
        </button>
      </div>

      {/* report box */}
      <div className="report-box">
        <h2>Genre of Songs Report</h2>

        {/* filters for date range */}
        <div className="filters">
          <label>
            Start Date:
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          <label>
            End Date:
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>
          <button className="primary" onClick={fetchReport}>
            Fetch Report
          </button>
        </div>

        {loading ? (
          <p>Loading reports…</p>
        ) : (
          <>
            {/* Pie chart */}
            <div className="chart">
              <Pie data={chartData} />
            </div>

            {/* table of song details */}
            <div className="table">
              <h3>Song Details</h3>
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Artist</th>
                    <th>Genre</th>
                    <th>Upload Date</th>
                  </tr>
                </thead>
                <tbody>
                  {songs.map((song) => (
                    <tr key={song.song_id}>
                      <td>{song.title}</td>
                      <td>{song.artist_name}</td>
                      <td>{song.genre}</td>
                      <td>{new Date(song.upload_date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
