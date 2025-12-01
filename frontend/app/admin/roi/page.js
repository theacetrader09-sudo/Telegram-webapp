'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { verifyAdmin, runROIAdmin, getROILogsAdmin } from '../../../services/api';
import { showToast } from '../../../components/Toast';

export default function AdminROI() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    checkAuth();
    loadLogs();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    const verify = await verifyAdmin();
    if (!verify.success) {
      localStorage.removeItem('adminToken');
      router.push('/admin/login');
    }
  };

  const loadLogs = async () => {
    setLoading(true);
    try {
      const response = await getROILogsAdmin();
      if (response.success) {
        setLogs(response.logs || []);
      } else {
        showToast(response.error || 'Failed to load logs', 'error');
      }
    } catch (err) {
      showToast('Failed to load logs', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunROI = async (forAllUsers = true) => {
    if (!forAllUsers && !userId.trim()) {
      showToast('Please enter a user ID', 'error');
      return;
    }

    if (!confirm(`Are you sure you want to run ROI calculation ${forAllUsers ? 'for all users' : 'for user ' + userId}?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await runROIAdmin(forAllUsers ? null : userId);
      if (response.success) {
        showToast('ROI calculation completed successfully', 'success');
        loadLogs();
      } else {
        showToast(response.error || 'Failed to run ROI', 'error');
      }
    } catch (err) {
      showToast('Failed to run ROI', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      padding: '20px',
      paddingBottom: '40px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <Link href="/admin/dashboard" style={{
              textDecoration: 'none',
              color: '#6b7280',
              fontSize: '14px',
              marginBottom: '8px',
              display: 'inline-block'
            }}>
              ← Back to Dashboard
            </Link>
            <h1 style={{
              margin: '8px 0 0 0',
              fontSize: 'clamp(24px, 5vw, 32px)',
              fontWeight: 'bold',
              color: '#111827'
            }}>
              ROI Management
            </h1>
          </div>
        </div>

        {/* Run ROI Controls */}
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '24px'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '20px' }}>
            Manual ROI Calculation
          </h2>
          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            alignItems: 'flex-end'
          }}>
            <button
              onClick={() => handleRunROI(true)}
              disabled={loading}
              style={{
                padding: '12px 24px',
                backgroundColor: loading ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Running...' : 'Run ROI for All Users'}
            </button>
            <div style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '300px' }}>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter User ID for single user"
                style={{
                  flex: 1,
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
              <button
                onClick={() => handleRunROI(false)}
                disabled={loading || !userId.trim()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: loading || !userId.trim() ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading || !userId.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  opacity: loading || !userId.trim() ? 0.7 : 1
                }}
              >
                Run for User
              </button>
            </div>
          </div>
        </div>

        {/* ROI Logs */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '20px',
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb'
          }}>
            <h2 style={{ margin: 0, fontSize: '18px' }}>
              ROI Calculation Logs
            </h2>
          </div>
          {loading && logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div className="spinner" style={{ margin: '0 auto' }}></div>
              <p>Loading logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
              No logs found
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Action</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Details</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px', fontSize: '14px' }}>
                        {log.action}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: log.status === 'SUCCESS' ? '#d1fae5' : '#fee2e2',
                          color: log.status === 'SUCCESS' ? '#065f46' : '#991b1b'
                        }}>
                          {log.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '12px', color: '#6b7280' }}>
                        {log.details ? JSON.stringify(log.details).substring(0, 100) + '...' : 'N/A'}
                      </td>
                      <td style={{ padding: '12px', fontSize: '12px', color: '#6b7280' }}>
                        {formatDate(log.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .spinner {
          border: 4px solid rgba(0, 0, 0, 0.1);
          border-left-color: #0088cc;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

