'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  verifyAdmin,
  getPendingDepositsAdmin,
  approveDepositAdmin,
  rejectDepositAdmin
} from '../../../services/api';
import { showToast } from '../../../components/Toast';

export default function AdminDeposits() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [deposits, setDeposits] = useState([]);
  const [selectedDeposit, setSelectedDeposit] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    checkAuth();
    loadDeposits();
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

  const loadDeposits = async () => {
    setLoading(true);
    try {
      const response = await getPendingDepositsAdmin();
      if (response.success) {
        setDeposits(response.deposits || []);
      } else {
        showToast(response.error || 'Failed to load deposits', 'error');
      }
    } catch (err) {
      showToast('Failed to load deposits', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!confirm('Are you sure you want to approve this deposit? The funds will be credited to the user\'s wallet.')) return;

    try {
      const response = await approveDepositAdmin(id);
      if (response.success) {
        showToast('Deposit approved successfully', 'success');
        loadDeposits();
      } else {
        showToast(response.error || 'Failed to approve deposit', 'error');
      }
    } catch (err) {
      showToast('Failed to approve deposit', 'error');
    }
  };

  const handleReject = async () => {
    if (!selectedDeposit) return;

    try {
      const response = await rejectDepositAdmin(selectedDeposit.id, rejectReason);
      if (response.success) {
        showToast('Deposit rejected', 'success');
        setShowRejectModal(false);
        setSelectedDeposit(null);
        setRejectReason('');
        loadDeposits();
      } else {
        showToast(response.error || 'Failed to reject deposit', 'error');
      }
    } catch (err) {
      showToast('Failed to reject deposit', 'error');
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
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
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
              Pending Deposits
            </h1>
          </div>
        </div>

        {/* Deposits List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
            <p>Loading deposits...</p>
          </div>
        ) : deposits.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '12px',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            No pending deposits
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gap: '16px'
          }}>
            {deposits.map((deposit) => (
              <div
                key={deposit.id}
                style={{
                  backgroundColor: 'white',
                  padding: '20px',
                  borderRadius: '12px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  border: '1px solid #e5e7eb'
                }}
              >
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                  marginBottom: '16px'
                }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                      User
                    </div>
                    <div style={{ fontWeight: '500' }}>
                      {deposit.user?.firstName || deposit.user?.username || 'N/A'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      ID: {deposit.user?.telegramId || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                      Amount
                    </div>
                    <div style={{ fontWeight: '600', fontSize: '18px', color: '#10b981' }}>
                      ${deposit.amount.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                      Transaction Hash
                    </div>
                    <div style={{
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      wordBreak: 'break-all',
                      color: '#374151'
                    }}>
                      {deposit.depositAddress || deposit.transactionProof || 'Not provided'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                      Requested Date
                    </div>
                    <div style={{ fontSize: '14px' }}>
                      {formatDate(deposit.createdAt)}
                    </div>
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  flexWrap: 'wrap'
                }}>
                  <button
                    onClick={() => handleApprove(deposit.id)}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDeposit(deposit);
                      setShowRejectModal(true);
                    }}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    ✗ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedDeposit && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }} onClick={() => {
          setShowRejectModal(false);
          setSelectedDeposit(null);
          setRejectReason('');
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '100%',
            maxWidth: '500px'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0, marginBottom: '20px' }}>
              Reject Deposit
            </h2>
            <div style={{ marginBottom: '20px' }}>
              <p><strong>Amount:</strong> ${selectedDeposit.amount.toFixed(2)}</p>
              <p><strong>User:</strong> {selectedDeposit.user?.firstName || selectedDeposit.user?.username || 'N/A'}</p>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Reason (Optional)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason"
                rows="4"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedDeposit(null);
                  setRejectReason('');
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#e5e7eb',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

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

