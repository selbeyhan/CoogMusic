// src/components/DataReports.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// ← import the portal stylesheet
import './AdminPortal.css';

export default function DataReports() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch('/admin/reports');
        const data = await res.json();
        setReports(data);
      } catch (err) {
        console.error('❌ Error loading reports:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  return (
    // ← use the same admin‑portal container
    <div className="admin-portal">
      <h1>Admin Portal: Data Reports</h1>

      {/* ← use the same button‑row and primary button styling */}
      <div className="button-row">
        <button className="primary" onClick={() => navigate('/adminportal')}>
          ← Back to Users
        </button>
      </div>

      {/* optionally reuse search‑container if you ever add filters */}
      
      {loading && <p>Loading reports…</p>}
      {!loading && !reports && <p>No report data available.</p>}
      {!loading && reports && (
        <pre style={{ 
           background: '#f7f7f7', 
           padding: '1rem', 
           fontSize: 'inherit',     /* inherit the portal’s font-size */
           lineHeight: '1.4' 
        }}>
          {JSON.stringify(reports, null, 2)}
        </pre>
      )}
    </div>
  );
}