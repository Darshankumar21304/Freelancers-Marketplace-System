import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../utils/api';
import { formatINR } from '../../utils/currency';
import { Layers, Trash2, Eye } from 'lucide-react';

export default function AdminListings() {
  const [activeTab, setActiveTab] = useState('projects');
  const [projects, setProjects] = useState([]);
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const data = await apiFetch('/admin/listings');
      setProjects(data.projects || []);
      setGigs(data.gigs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm('Delete this project listing?')) return;
    try {
      await apiFetch(`/admin/projects/${id}`, { method: 'DELETE' });
      setMsg('Project removed successfully');
      setTimeout(() => setMsg(null), 3000);
      fetchListings();
    } catch (err) {
      alert(err.message || 'Error removing project');
    }
  };

  return (
    <div>
      <div className="admin-header">
        <h1>Listings & Moderation</h1>
        <p>Review active client project postings and freelancer service listings (Gigs)</p>
      </div>

      {msg && (
        <div style={{ padding: '0.75rem 1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem' }}>
          {msg}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('projects')}
          className={`min-btn ${activeTab === 'projects' ? 'min-btn-primary' : ''}`}
        >
          Client Projects ({projects.length})
        </button>
        <button 
          onClick={() => setActiveTab('gigs')}
          className={`min-btn ${activeTab === 'gigs' ? 'min-btn-primary' : ''}`}
        >
          Freelancer Gigs ({gigs.length})
        </button>
      </div>

      {activeTab === 'projects' ? (
        <div className="min-table-container">
          <table className="min-table">
            <thead>
              <tr>
                <th>Project Title</th>
                <th>Client</th>
                <th>Category</th>
                <th>Budget</th>
                <th>Proposals</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading project listings...</td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No projects available.</td>
                </tr>
              ) : (
                projects.map((p) => (
                  <tr key={p._id}>
                    <td style={{ fontWeight: 600 }}>{p.title}</td>
                    <td>{p.client_id?.name || 'Client'}</td>
                    <td>{p.category || 'General'}</td>
                    <td style={{ fontWeight: 600 }}>{formatINR(p.budget || 0)}</td>
                    <td>{p.proposals?.length || 0} Bids</td>
                    <td>
                      <button onClick={() => handleDeleteProject(p._id)} className="min-btn min-btn-danger">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="min-table-container">
          <table className="min-table">
            <thead>
              <tr>
                <th>Gig Title</th>
                <th>Category</th>
                <th>Starting Price</th>
                <th>Rating</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {gigs.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No active gigs found.</td>
                </tr>
              ) : (
                gigs.map((g) => (
                  <tr key={g._id || g.id}>
                    <td style={{ fontWeight: 600 }}>{g.title}</td>
                    <td>{g.category || 'Development'}</td>
                    <td style={{ fontWeight: 600 }}>{formatINR(g.price || 5000)}</td>
                    <td>{g.rating || 5.0} ★</td>
                    <td>
                      <button className="min-btn min-btn-danger">Flag Listing</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
