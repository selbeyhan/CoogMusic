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
  const navigate = useNavigate();
  const [currentReport, setCurrentReport] = useState(null);

  // report 1 state (unchanged)
  const [genreCounts, setGenreCounts]       = useState({});
  const [songs, setSongs]                   = useState([]);
  const [startDate, setStartDate]           = useState('');
  const [endDate, setEndDate]               = useState('');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [minViews, setMinViews]             = useState('');
  const [maxViews, setMaxViews]             = useState('');
  const [loading, setLoading]               = useState(false);

  // report 2 state
  const [usersData, setUsersData]         = useState([]);
  const [usersLoading, setUsersLoading]   = useState(false);
  const [minUserViews, setMinUserViews]   = useState('');
  const [maxUserViews, setMaxUserViews]   = useState('');
  const [userLimit, setUserLimit]         = useState('');
  const [userSortBy, setUserSortBy]       = useState('views');
  const [userSortOrder, setUserSortOrder] = useState('desc');

  // toggle a genre checkbox
  function toggleGenre(g) {
    setSelectedGenres(prev =>
      prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
    );
  }

  // normalize raw users from backend into our shape
  function normalizeUsers(raw = []) {
    return raw.map(u => ({
      user_id:    u.user_id,
      name:       u.name,
      totalViews: u.total_views  ?? 0,
      totalLikes: u.total_likes  ?? 0,
    }));
  }

  // fetch report 1 (genre)
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
      setGenreCounts(data.genreCounts || {});
      setSongs(data.songs || []);
    } catch {
      setGenreCounts({});
      setSongs([]);
    } finally {
      setLoading(false);
    }
  };

  // fetch report 2 (users)
  const fetchUsersReport = async () => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('sortBy',    userSortBy);
      params.append('sortOrder', userSortOrder);
      if (minUserViews) params.append('minViews', minUserViews);
      if (maxUserViews) params.append('maxViews', maxUserViews);
      if (userLimit)    params.append('limit',    userLimit);

      const res  = await fetch(`/admin/reports/users?${params}`);
      const json = await res.json();
      setUsersData(normalizeUsers(json.users || []));
    } catch {
      setUsersData([]);
    } finally {
      setUsersLoading(false);
    }
  };

  // clear filters for report 1
  const clearGenreFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedGenres([]);
    setMinViews('');
    setMaxViews('');
    fetchReport();
  };

  // clear filters for report 2
  const clearUsersFilters = () => {
    setMinUserViews('');
    setMaxUserViews('');
    setUserLimit('');
    setUserSortBy('views');
    setUserSortOrder('desc');

    setUsersLoading(true);
    fetch('/admin/reports/users')
      .then(res => res.json())
      .then(json => setUsersData(normalizeUsers(json.users || [])))
      .catch(() => setUsersData([]))
      .finally(() => setUsersLoading(false));
  };

  // prepare chart data for report 1
  const labels          = Object.keys(genreCounts);
  const values          = Object.values(genreCounts);
  const backgroundColor = labels.map(l => genreColors[l] || '#ccc');
  const chartData       = { labels, datasets: [{ data: values, backgroundColor }] };

  return (
    <div className="admin-portal">
      <h1>Admin Portal: Data Reports</h1>
      <div className="button-row">
        <button className="primary" onClick={() => navigate('/adminportal')}>
          ← Back to Users
        </button>
      </div>

      <div className="report-box">
        <div className="report-buttons">
          <button
            className={currentReport === 'genre' ? 'primary' : ''}
            onClick={() => { setCurrentReport('genre'); fetchReport(); }}
          >
            Genre of Songs
          </button>
          <button
            className={currentReport === 'users' ? 'primary' : ''}
            onClick={() => { setCurrentReport('users'); fetchUsersReport(); }}
          >
            Users Report
          </button>
          <button
            className={currentReport === 'report3' ? 'primary' : ''}
            onClick={() => setCurrentReport('report3')}
          >
            Report 3
          </button>
        </div>

        {/* report 1 */}
        {currentReport === 'genre' && (
          <>
            {/* ... unchanged report 1 markup ... */}
          </>
        )}

        {/* report 2 */}
        {currentReport === 'users' && (
          <>
            <h2>Users Report</h2>
            <div className="filters">
              <label>Sort by:
                <select value={userSortBy} onChange={e => setUserSortBy(e.target.value)}>
                  <option value="views">Total Views</option>
                  <option value="likes">Total Likes</option>
                </select>
              </label>
              <label>Order:
                <select value={userSortOrder} onChange={e => setUserSortOrder(e.target.value)}>
                  <option value="desc">Most to Least</option>
                  <option value="asc">Least to Most</option>
                </select>
              </label>
              <label>Min Views:
                <input
                  type="number"
                  value={minUserViews}
                  onChange={e => setMinUserViews(e.target.value)}
                  placeholder="0"
                />
              </label>
              <label>Max Views:
                <input
                  type="number"
                  value={maxUserViews}
                  onChange={e => setMaxUserViews(e.target.value)}
                  placeholder="∞"
                />
              </label>
              <label>Limit:
                <input
                  type="number"
                  value={userLimit}
                  onChange={e => setUserLimit(e.target.value)}
                  placeholder="10"
                />
              </label>
              <button className="primary" onClick={fetchUsersReport}>Fetch Report</button>
              <button className="secondary" onClick={clearUsersFilters}>Clear Filters</button>
            </div>

            {usersLoading
              ? <p>Loading users…</p>
              : usersData.length === 0
                ? <p>No users fit this criteria.</p>
                : (
                  <div className="table">
                    <h3>User Details</h3>
                    <table>
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Name</th>
                          <th>{userSortBy === 'likes' ? 'Total Likes' : 'Total Views'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersData.map((u, idx) => (
                          <tr key={u.user_id}>
                            <td>{idx + 1}</td>
                            <td>{u.name}</td>
                            <td>{userSortBy === 'likes' ? u.totalLikes : u.totalViews}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
            }
          </>
        )}

        {/* report 3 */}
        {currentReport === 'report3' && <p>Report 3 coming soon…</p>}
      </div>
    </div>
  );
}
