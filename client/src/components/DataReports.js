/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminPortal.css';
import './DataReports.css';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, BarElement } from 'chart.js';
import { Pie, Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  BarElement
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

  // report 1 state (genre)
  const [genreCounts, setGenreCounts]       = useState({});
  const [songs, setSongs]                   = useState([]);
  const [startDate, setStartDate]           = useState('');
  const [endDate, setEndDate]               = useState('');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [minViews, setMinViews]             = useState('');
  const [maxViews, setMaxViews]             = useState('');
  const [loading, setLoading]               = useState(false);
  const [songRepSortBy, setSongRepSortBy] = useState('views');
  const [songRepSortOrder, setSongRepSortOrder] = useState('desc');


  // report 2 state
  const [usersData, setUsersData]         = useState([]);
  const [usersLoading, setUsersLoading]   = useState(false);
  const [minUserLikes, setMinUserLikes]   = useState('');
  const [maxUserLikes, setMaxUserLikes]   = useState('');
  const [userLimit, setUserLimit]         = useState('');
  const [userSortBy, setUserSortBy]       = useState('likes');
  const [userSortOrder, setUserSortOrder] = useState('desc');
  const [userStartDate, setUserStartDate] = useState(''); 
  const [userEndDate, setUserEndDate]     = useState('');
  const [userVisualType, setUserVisualType] = useState('table');
  const [userTimeGrouping, setUserTimeGrouping] = useState('month');



  // toggle a genre checkbox
  function toggleGenre(g) {
    setSelectedGenres(prev =>
      prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
    );
  }

  // normalize raw users from backend into our shape
  function normalizeUsers(raw = []) {
    return raw.map(u => ({
      user_id: u.user_id,
      name: u.name,
      totalLikes: u.total_likes ?? 0,
      registrationDate: u.registration_date ? new Date(u.registration_date) : null,
      accountType: u.account_type || 'Unknown',
    }));
  }

  // Group users by registration date for the line chart
  function prepareRegistrationTimelineData(users) {
    // Filter users with valid registration dates
    const usersWithDates = users.filter(u => u.registrationDate);
    
    // Sort users by registration date
    const sortedUsers = [...usersWithDates].sort((a, b) => 
      a.registrationDate.getTime() - b.registrationDate.getTime()
    );
    
    // Group by month or appropriate time period
    const groupedData = {};
    
    sortedUsers.forEach(user => {
      let dateKey;
      
      if (userTimeGrouping === 'day') {
        dateKey = user.registrationDate.toISOString().split('T')[0]; // YYYY-MM-DD
      } else if (userTimeGrouping === 'month') {
        const month = user.registrationDate.getMonth() + 1;
        const year = user.registrationDate.getFullYear();
        dateKey = `${year}-${month.toString().padStart(2, '0')}`;
      } else {
        dateKey = user.registrationDate.getFullYear().toString();
      }
      
      if (!groupedData[dateKey]) {
        groupedData[dateKey] = {
          musicians: 0,
          listeners: 0,
          totalLikes: 0
        };
      }
      
      if (user.accountType === 'Musician') {
        groupedData[dateKey].musicians++;
      } else {
        groupedData[dateKey].listeners++;
      }
      
      groupedData[dateKey].totalLikes += user.totalLikes;
    });
    
    // Convert to arrays for charting
    const dates = Object.keys(groupedData).sort();
    const musicianCounts = dates.map(date => groupedData[date].musicians);
    const listenerCounts = dates.map(date => groupedData[date].listeners);
    const likeCounts = dates.map(date => groupedData[date].totalLikes);
    
    // Format date labels for display
    const formattedDates = dates.map(date => {
      if (userTimeGrouping === 'day') {
        return new Date(date).toLocaleDateString();
      } else if (userTimeGrouping === 'month') {
        const [year, month] = date.split('-');
        return `${month}/${year}`;
      } else {
        return date; // Year is already formatted properly
      }
    });
    
    return {
      labels: formattedDates,
      musicians: musicianCounts,
      listeners: listenerCounts,
      totalLikes: likeCounts,
      cumulativeTotal: musicianCounts.reduce((acc, count, i) => {
        const prevTotal = i > 0 ? acc[i - 1] : 0;
        return [...acc, prevTotal + count + listenerCounts[i]];
      }, [])
    };
  }

  // Prepare top users data for visualization
  function prepareTopUsersData(users) {
    // Sort users by likes
    const topUsers = [...users]
      .sort((a, b) => b.totalLikes - a.totalLikes)
      .slice(0, Math.min(10, users.length));
    
    return {
      labels: topUsers.map(user => user.name),
      likes: topUsers.map(user => user.totalLikes),
      accountTypes: topUsers.map(user => user.accountType),
      registrationDates: topUsers.map(user => 
        user.registrationDate ? user.registrationDate.toLocaleDateString() : 'Unknown'
      ),
      ids: topUsers.map(user => user.user_id)
    };
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
      params.append('sortBy', userSortBy);
      params.append('sortOrder', userSortOrder);

      // only append the relevant min/max pair for likes
      if (minUserLikes) params.append('minLikes', minUserLikes);
      if (maxUserLikes) params.append('maxLikes', maxUserLikes);

      if (userLimit) params.append('limit', userLimit);

      // Add date range parameters
      if (userStartDate) params.append('startDate', userStartDate);
      if (userEndDate) params.append('endDate', userEndDate);

      const res = await fetch(`/admin/reports/users?${params}`);
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
    setMinUserLikes('');
    setMaxUserLikes('');
    setUserLimit('');
    setUserSortBy('likes');
    setUserSortOrder('desc');
    setUserStartDate(''); 
    setUserEndDate(''); 

    setUsersLoading(true);
    fetch('/admin/reports/users')
      .then(res => res.json())
      .then(json => setUsersData(normalizeUsers(json.users || [])))
      .catch(() => setUsersData([]))
      .finally(() => setUsersLoading(false));
  };

  // prepare chart data for report 1
  const labels = Object.keys(genreCounts);
  const values = Object.values(genreCounts);
  const backgroundColor = labels.map(l => genreColors[l] || '#ccc');
  const chartData = { labels, datasets: [{ data: values, backgroundColor }] };

  // Prepare chart data for user registrations over time
  const timelineData = prepareRegistrationTimelineData(usersData);
  const registrationChartData = {
    labels: timelineData.labels,
    datasets: [
      {
        label: 'Musicians',
        data: timelineData.musicians,
        borderColor: '#FF6384',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        fill: true
      },
      {
        label: 'Listeners',
        data: timelineData.listeners,
        borderColor: '#36A2EB',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        fill: true
      }
    ]
  };

  // Prepare chart data for top users by likes
  const topUsersData = prepareTopUsersData(usersData);
  const topUsersChartData = {
    labels: topUsersData.labels,
    datasets: [
      {
        label: 'Likes',
        data: topUsersData.likes,
        backgroundColor: topUsersData.accountTypes.map(type => 
          type === 'Musician' ? '#FF6384' : '#36A2EB'
        ),
        borderColor: topUsersData.accountTypes.map(type => 
          type === 'Musician' ? '#FF3366' : '#2299DD'
        ),
        borderWidth: 1
      }
    ]
  };

  // Prepare account type distribution chart data
  const accountTypeData = {
    labels: ['Musicians', 'Listeners'],
    datasets: [
      {
        data: [
          usersData.filter(u => u.accountType === 'Musician').length,
          usersData.filter(u => u.accountType !== 'Musician').length
        ],
        backgroundColor: ['#FF6384', '#36A2EB'],
        borderColor: ['#FF3366', '#2299DD']
      }
    ]
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
            Songs Report
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
            Report 3
          </button>
        </div>

        {/* report 1 - genre report */}
        {currentReport === 'genre' && (
          <>
            <h2>Songs by Genre</h2>
            <div className="filters">
              <label>from:
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
              </label>
              <label>to:
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
              </label>
              <div className="genre-selection">
                <label>genres:</label>
                <div className="genre-checkboxes">
                  {Object.keys(genreColors).map(g => (
                    <label key={g} className="genre-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedGenres.includes(g)}
                        onChange={() => toggleGenre(g)}
                      />
                      <span>{g}</span>
                    </label>
                  ))}
                </div>
              </div>
              <label>min views:
                <input
                  type="number"
                  value={minViews}
                  onChange={e => setMinViews(e.target.value)}
                  placeholder="0"
                />
              </label>
              <label>max views:
                <input
                  type="number"
                  value={maxViews}
                  onChange={e => setMaxViews(e.target.value)}
                  placeholder="∞"
                />
              </label>
              <button className="primary" onClick={fetchReport}>
                fetch report
              </button>
              <button className="secondary" onClick={clearGenreFilters}>
                clear filters
              </button>
            </div>

            {loading
              ? <p>loading…</p>
              : Object.keys(genreCounts).length === 0
                ? <p>no songs fit this criteria</p>
                : (
                  <>
                    <div className="chart">
                      <Pie data={chartData} />
                    </div>
                    <div className="table genre-table">
                      {/* Sort controls */}
                      <div className="table-sorting-controls" style={{ marginBottom: '10px' }}>
                        <label style={{ marginRight: '10px' }}>
                          Sort By:
                          <select value={songRepSortBy} onChange={e => setSongRepSortBy(e.target.value)} style={{ marginLeft: '5px' }}>
                            <option value="views">Views</option>
                            <option value="upload_date">Upload Date</option>
                          </select>
                        </label>
                        <label>
                          Order:
                          <select value={songRepSortOrder} onChange={e => setSongRepSortOrder(e.target.value)} style={{ marginLeft: '5px' }}>
                            <option value="asc">Ascending</option>
                            <option value="desc">Descending</option>
                          </select>
                        </label>
                      </div>

                      {/* Dynamic Header Title */}
                      <h3>
                        song details
                        {startDate && ` from ${startDate}`}
                        {endDate && ` to ${endDate}`}
                        {selectedGenres.length > 0 && ` | genres: ${selectedGenres.join(', ')}`}
                        {(minViews || maxViews) && ` | views: ${minViews || 0} - ${maxViews || '∞'}`}
                      </h3>

                      <table>
                        <thead>
                          <tr>
                            <th>title</th>
                            <th>artist</th>
                            <th>genre</th>
                            <th>views</th>
                            <th>upload date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...songs]
                            .sort((a, b) => {
                              if (songRepSortBy === 'views') {
                                return songRepSortOrder === 'asc'
                                  ? a.views - b.views
                                  : b.views - a.views;
                              } else {
                                return songRepSortOrder === 'asc'
                                  ? new Date(a.upload_date) - new Date(b.upload_date)
                                  : new Date(b.upload_date) - new Date(a.upload_date);
                              }
                            })
                            .map(s => (
                              <tr key={s.song_id}>
                                <td>{s.title}</td>
                                <td>{s.artist_name}</td>
                                <td>{s.genre}</td>
                                <td>{s.views}</td>
                                <td>{new Date(s.upload_date).toLocaleDateString()}</td>
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


        {/* report 2 - users report */}
        {currentReport === 'users' && (
          <>
            <h2>Users Report</h2>
            <div className="filters">
              <label>sort by:
                <select value={userSortBy} onChange={e => setUserSortBy(e.target.value)}>
                  <option value="likes">total likes</option>
                  <option value="date">signup date</option>
                </select>
              </label>
              <label>order:
                <select value={userSortOrder} onChange={e => setUserSortOrder(e.target.value)}>
                  <option value="desc">most to least</option>
                  <option value="asc">least to most</option>
                </select>
              </label>

              {/* Date range filters */}
              <label>signup from:
                <input
                  type="date"
                  value={userStartDate}
                  onChange={e => setUserStartDate(e.target.value)}
                />
              </label>
              <label>signup to:
                <input
                  type="date"
                  value={userEndDate}
                  onChange={e => setUserEndDate(e.target.value)}
                />
              </label>

              {/* Likes filters */}
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

              <label>limit:
                <input
                  type="number"
                  value={userLimit}
                  onChange={e => setUserLimit(e.target.value)}
                  placeholder="10"
                />
              </label>

              <label>view as:
                <select value={userVisualType} onChange={e => setUserVisualType(e.target.value)}>
                  <option value="table">Table</option>
                  <option value="visualizations">Visualizations</option>
                </select>
              </label>

              {userVisualType === 'visualizations' && (
                <label>group by:
                  <select value={userTimeGrouping} onChange={e => setUserTimeGrouping(e.target.value)}>
                    <option value="day">Day</option>
                    <option value="month">Month</option>
                    <option value="year">Year</option>
                  </select>
                </label>
              )}

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
                  <>
                    {userVisualType === 'visualizations' && (
                      <div className="visualizations-container">
                        {/* User Registration Timeline Chart */}
                        <div className="chart-container">
                          <h3>User Signups Over Time</h3>
                          <div className="chart">
                            <Line 
                              data={registrationChartData}
                              options={{
                                responsive: true,
                                plugins: {
                                  legend: {
                                    position: 'top',
                                  },
                                  title: {
                                    display: false
                                  },
                                  tooltip: {
                                    callbacks: {
                                      title: function(tooltipItems) {
                                        return `Date: ${tooltipItems[0].label}`;
                                      }
                                    }
                                  }
                                },
                                scales: {
                                  y: {
                                    stacked: true,
                                    title: {
                                      display: true,
                                      text: 'Number of Users'
                                    }
                                  },
                                  x: {
                                    title: {
                                      display: true,
                                      text: userTimeGrouping === 'day' ? 'Date' : 
                                            userTimeGrouping === 'month' ? 'Month' : 'Year'
                                    }
                                  }
                                }
                              }}
                            />
                          </div>
                        </div>
                        
                        {/* Top Users Chart */}
                        <div className="chart-container">
                          <h3>Top Users by Likes</h3>
                          <div className="chart">
                            <Bar
                              data={topUsersChartData}
                              options={{
                                indexAxis: 'y',
                                responsive: true,
                                plugins: {
                                  legend: {
                                    display: false
                                  },
                                  tooltip: {
                                    callbacks: {
                                      title: function(tooltipItems) {
                                        return `User: ${tooltipItems[0].label}`;
                                      },
                                      label: function(tooltipItem) {
                                        return `Likes: ${tooltipItem.raw}`;
                                      },
                                      footer: function(tooltipItems) {
                                        const idx = tooltipItems[0].dataIndex;
                                        return `Type: ${topUsersData.accountTypes[idx]}\nRegistered: ${topUsersData.registrationDates[idx]}`;
                                      }
                                    }
                                  }
                                },
                                scales: {
                                  x: {
                                    title: {
                                      display: true,
                                      text: 'Total Likes'
                                    }
                                  },
                                  y: {
                                    title: {
                                      display: true,
                                      text: 'Username'
                                    }
                                  }
                                }
                              }}
                            />
                          </div>
                        </div>

                        {/* Account Type Distribution */}
                        <div className="chart-container">
                          <h3>Account Type Distribution</h3>
                          <div className="chart">
                            <Pie 
                              data={accountTypeData}
                              options={{
                                responsive: true,
                                plugins: {
                                  legend: {
                                    position: 'top',
                                  },
                                  tooltip: {
                                    callbacks: {
                                      label: function(tooltipItem) {
                                        const label = tooltipItem.label;
                                        const value = tooltipItem.raw;
                                        const total = accountTypeData.datasets[0].data.reduce((a, b) => a + b, 0);
                                        const percentage = Math.round((value / total) * 100);
                                        return `${label}: ${value} (${percentage}%)`;
                                      }
                                    }
                                  }
                                }
                              }}
                            />
                          </div>
                        </div>

                        {/* User Data Table */}
                        <div className="chart-container full-width">
                          <h3>Complete User Data</h3>
                          <div className="table users-table">
                            <table>
                              <thead>
                                <tr>
                                  <th>rank</th>
                                  <th>name</th>
                                  <th>signup date</th>
                                  <th>account type</th>
                                  <th>total likes</th>
                                </tr>
                              </thead>
                              <tbody>
                                {usersData.map((u, idx) => (
                                  <tr key={u.user_id}>
                                    <td>{idx + 1}</td>
                                    <td>{u.name}</td>
                                    <td>{u.registrationDate ? u.registrationDate.toLocaleDateString() : 'Unknown'}</td>
                                    <td>{u.accountType}</td>
                                    <td>{u.totalLikes}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div className="users-distribution-legend">
                          <div className="legend-item">
                            <span className="legend-color" style={{backgroundColor: '#FF6384'}}></span>
                            <span>Musician</span>
                          </div>
                          <div className="legend-item">
                            <span className="legend-color" style={{backgroundColor: '#36A2EB'}}></span>
                            <span>Listener</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {userVisualType === 'table' && (
                      <div className="table users-table">
                        <h3>user details</h3>
                        <table>
                          <thead>
                            <tr>
                              <th>rank</th>
                              <th>name</th>
                              <th>signup date</th>
                              <th>account type</th>
                              <th>total likes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {usersData.map((u, idx) => (
                              <tr key={u.user_id}>
                                <td>{idx + 1}</td>
                                <td>{u.name}</td>
                                <td>{u.registrationDate ? u.registrationDate.toLocaleDateString() : 'Unknown'}</td>
                                <td>{u.accountType}</td>
                                <td>{u.totalLikes}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Summary statistics */}
                    <div className="user-stats-summary">
                      <h4>Summary Statistics</h4>
                      <div className="stats-grid">
                        <div className="stat-box">
                          <p className="stat-label">Total Users</p>
                          <p className="stat-value">{usersData.length}</p>
                        </div>
                        <div className="stat-box">
                          <p className="stat-label">Musicians</p>
                          <p className="stat-value">
                            {usersData.filter(u => u.accountType === 'Musician').length}
                          </p>
                        </div>
                        <div className="stat-box">
                          <p className="stat-label">Listeners</p>
                          <p className="stat-value">
                            {usersData.filter(u => u.accountType !== 'Musician').length}
                          </p>
                        </div>
                        <div className="stat-box">
                          <p className="stat-label">Total Likes</p>
                          <p className="stat-value">
                            {usersData.reduce((sum, u) => sum + (u.totalLikes || 0), 0).toLocaleString()}
                          </p>
                        </div>
                        <div className="stat-box">
                          <p className="stat-label">Most Recent User</p>
                          <p className="stat-value">
                            {usersData.length > 0 && usersData.some(u => u.registrationDate) ? 
                              [...usersData]
                                .filter(u => u.registrationDate)
                                .sort((a, b) => b.registrationDate - a.registrationDate)[0]
                                .registrationDate.toLocaleDateString() : 
                              'N/A'}
                          </p>
                        </div>
                        <div className="stat-box">
                          <p className="stat-label">Oldest User</p>
                          <p className="stat-value">
                            {usersData.length > 0 && usersData.some(u => u.registrationDate) ? 
                              [...usersData]
                                .filter(u => u.registrationDate)
                                .sort((a, b) => a.registrationDate - b.registrationDate)[0]
                                .registrationDate.toLocaleDateString() : 
                              'N/A'}
                          </p>
                        </div>
                        <div className="stat-box">
                          <p className="stat-label">Avg. Likes per Musician</p>
                          <p className="stat-value">
                            {usersData.some(u => u.accountType === 'Musician') ? 
                              (usersData.filter(u => u.accountType === 'Musician')
                                .reduce((sum, u) => sum + (u.totalLikes || 0), 0) / 
                               Math.max(1, usersData.filter(u => u.accountType === 'Musician').length))
                                .toLocaleString(undefined, {maximumFractionDigits: 1}) : 
                              '0'}
                          </p>
                        </div>
                        <div className="stat-box">
                          <p className="stat-label">Most Liked User</p>
                          <p className="stat-value">
                            {usersData.length > 0 ? 
                              [...usersData]
                                .sort((a, b) => b.totalLikes - a.totalLikes)[0]
                                .name : 
                              'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )
            }
          </>
        )}

        {/* report 3 */}
        {currentReport === 'report3' && <p>report 3 coming soon…</p>}
      </div>
    </div>
  );
}