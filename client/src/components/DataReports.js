/* eslint-disable no-unused-vars */


// src/components/DataReports.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminPortal.css';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title
);

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
  const [minUserLikes, setMinUserLikes]   = useState('');
  const [maxUserLikes, setMaxUserLikes]   = useState('');
  const [userLimit, setUserLimit]         = useState('');
  const [userSortBy, setUserSortBy]       = useState('views');
  const [userSortOrder, setUserSortOrder] = useState('desc');


  //report  state
  const [engagementData, setEngagementData]       = useState([]);
  const [engagementLoading, setEngagementLoading] = useState(false);
  const [engagementStart, setEngagementStart]     = useState('');
  const [engagementEnd, setEngagementEnd]         = useState('');

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

      // only append the relevant min/max pair
      if (userSortBy === 'views') {
        if (minUserViews) params.append('minViews', minUserViews);
        if (maxUserViews) params.append('maxViews', maxUserViews);
      } else {
        if (minUserLikes) params.append('minLikes', minUserLikes);
        if (maxUserLikes) params.append('maxLikes', maxUserLikes);
      }

      if (userLimit) params.append('limit', userLimit);

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
    setMinUserLikes('');
    setMaxUserLikes('');
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





  // normalize raw engagement rows into our shape
  function normalizeEngagement(raw = []) {
    return raw.map(r => ({
      day:              r.day,
      views:            r.views,
      uploads:          r.uploads,
      playlists:        r.playlists,
      albums:           r.albums,
      engagement_score: r.engagement_score
    }));
  }

  // fetch report 3 (engagement)
  const fetchEngagementReport = async () => {
    setEngagementLoading(true);
    try {
      const params = new URLSearchParams();
      if (engagementStart) params.append('start', engagementStart);
      if (engagementEnd)   params.append('end',   engagementEnd);

      const res  = await fetch(`/admin/reports/engagement?${params}`);
      const json = await res.json();
      setEngagementData(normalizeEngagement(json.data || []));
    } catch {
      setEngagementData([]);
    } finally {
      setEngagementLoading(false);
    }
  };

  // clear filters for report 3
  const clearEngagementFilters = () => {
    setEngagementStart('');
    setEngagementEnd('');
    fetchEngagementReport();
  };

  // prepare chart data for report 3
  const lineData = {
    labels: engagementData.map(d => d.day),
    datasets: [{
      label: 'engagement score',
      data: engagementData.map(d => d.engagement_score),
      fill: false,
      tension: 0.1
    }]
  };

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
          onClick={() => { setCurrentReport('report3'); fetchEngagementReport(); }}
        >
          Engagement Report
        </button>

        </div>

        {/* report 1 */}
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
              <button className="secondary" onClick={clearGenreFilters}>
                Clear Filters
              </button>
            </div>

            {loading ? (
              <p>Loading reports…</p>
            ) : songs.length === 0 ? (
              <p>No songs fit this criteria.</p>
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

        {/* report 2 */}
        {currentReport === 'users' && (
          <>
            <h2>Users Report</h2>
            <div className="filters">
              <label>sort by:
                <select value={userSortBy} onChange={e => setUserSortBy(e.target.value)}>
                  <option value="views">total views</option>
                  <option value="likes">total likes</option>
                </select>
              </label>
              <label>order:
                <select value={userSortOrder} onChange={e => setUserSortOrder(e.target.value)}>
                  <option value="desc">most to least</option>
                  <option value="asc">least to most</option>
                </select>
              </label>

              {userSortBy === 'views'
                ? (
                  <>
                    <label>min views:
                      <input
                        type="number"
                        value={minUserViews}
                        onChange={e => setMinUserViews(e.target.value)}
                        placeholder="0"
                      />
                    </label>
                    <label>max views:
                      <input
                        type="number"
                        value={maxUserViews}
                        onChange={e => setMaxUserViews(e.target.value)}
                        placeholder="∞"
                      />
                    </label>
                  </>
                )
                : (
                  <>
                    <label>min likes:
                      <input
                        type="number"
                        value={minUserLikes}
                        onChange={e => setMinUserLikes(e.target.value)}
                        placeholder="0"
                      />
                    </label>
                    <label>max likes:
                      <input
                        type="number"
                        value={maxUserLikes}
                        onChange={e => setMaxUserLikes(e.target.value)}
                        placeholder="∞"
                      />
                    </label>
                  </>
                )
              }

              <label>limit:
                <input
                  type="number"
                  value={userLimit}
                  onChange={e => setUserLimit(e.target.value)}
                  placeholder="10"
                />
              </label>

              <button className="primary" onClick={fetchUsersReport}>
                fetch report
              </button>
              <button className="secondary" onClick={clearUsersFilters}>
                clear filters
              </button>
            </div>

            {usersLoading
              ? <p>loading users…</p>
              : usersData.length === 0
                ? <p>no users fit this criteria.</p>
                : (
                  <div className="table">
                    <h3>user details</h3>
                    <table>
                      <thead>
                        <tr>
                          <th>rank</th>
                          <th>name</th>
                          <th>total views</th>
                          <th>total likes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersData.map((u, idx) => (
                          <tr key={u.user_id}>
                            <td>{idx + 1}</td>
                            <td>{u.name}</td>
                            <td>{u.totalViews}</td>
                            <td>{u.totalLikes}</td>
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
        {currentReport === 'report3' && (
          <>
            <h2>
              Engagement Report
              {engagementStart && engagementEnd
                ? ` for ${engagementStart} to ${engagementEnd}`
                : ""}
            </h2>

            <div className="filters">
              <label>
                start date:
                <input
                  type="date"
                  value={engagementStart}
                  onChange={e => setEngagementStart(e.target.value)}
                />
              </label>
              <label>
                end date:
                <input
                  type="date"
                  value={engagementEnd}
                  onChange={e => setEngagementEnd(e.target.value)}
                />
              </label>
              <button className="primary" onClick={fetchEngagementReport}>
                fetch engagement
              </button>
              <button className="secondary" onClick={clearEngagementFilters}>
                clear filters
              </button>
            </div>

            {engagementLoading
              ? <p>loading engagement data…</p>
              : engagementData.length === 0
                ? <p>no data for this range.</p>
                : (
                  <>
                    <div className="chart">
                      <Line
                        data={lineData}
                        options={{
                          plugins: {
                            title: {
                              display: true,
                              text: engagementStart && engagementEnd
                                ? `Engagement from ${engagementStart} to ${engagementEnd}`
                                : 'Engagement over time'
                            },
                            tooltip: { mode: 'index', intersect: false }
                          },
                          scales: {
                            x: { title: { display: true, text: 'date' } },
                            y: { title: { display: true, text: 'score' } }
                          }
                        }}
                      />
                    </div>
                    <div className="table">
                      <h3>
                        Daily Engagement
                        {engagementStart && engagementEnd
                          ? ` from ${engagementStart} to ${engagementEnd}`
                          : ''}
                      </h3>
                      <table>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Song Views</th>
                            <th>Song Uploads</th>
                            <th>Playlist Uploads</th>
                            <th>Album Creations</th>
                            <th>Total Engagement Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {engagementData.map(d => (
                            <tr key={d.day}>
                              <td>{d.day}</td>
                              <td>{d.views}</td>
                              <td>{d.uploads}</td>
                              <td>{d.playlists}</td>
                              <td>{d.albums}</td>
                              <td>{d.engagement_score}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )
            }
          </>
        )}



      </div>
    </div>
  );
}
