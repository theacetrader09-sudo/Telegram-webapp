'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  verifyAdmin,
  getPendingWithdrawalsAdmin,
  getAllWithdrawalsAdmin,
  approveWithdrawalAdmin,
  rejectWithdrawalAdmin,
  completeWithdrawalAdmin
} from '../../../services/api';
import { showToast } from '../../../components/Toast';

export default function AdminWithdrawals() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [withdrawals, setWithdrawals] = useState([]);
  const [filter, setFilter] = useState('all'); // all, pending, approved, completed, rejected
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    checkAuth();
    loadWithdrawals();
  }, [filter]);

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

  const loadWithdrawals = async () => {
    setLoading(true);
    try {
      const status = filter === 'all' ? null : filter.toUpperCase();
      const response = await getAllWithdrawalsAdmin(status);
      if (response.success) {
        setWithdrawals(response.withdrawals || []);
      } else {
        showToast(response.error || 'Failed to load withdrawals', 'error');
      }
    } catch (err) {
      showToast('Failed to load withdrawals', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!confirm('Are you sure you want to approve this withdrawal?')) return;

    try {
      const response = await approveWithdrawalAdmin(id);
      if (response.success) {
        showToast('Withdrawal approved successfully', 'success');
        loadWithdrawals();
      } else {
        showToast(response.error || 'Failed to approve withdrawal', 'error');
      }
    } catch (err) {
      showToast('Failed to approve withdrawal', 'error');
    }
  };

  const handleReject = async () => {
    if (!selectedWithdrawal) return;

    try {
      const response = await rejectWithdrawalAdmin(selectedWithdrawal.id, rejectReason);
      if (response.success) {
        showToast('Withdrawal rejected', 'success');
        setShowRejectModal(false);
        setSelectedWithdrawal(null);
        setRejectReason('');
        loadWithdrawals();
      } else {
        showToast(response.error || 'Failed to reject withdrawal', 'error');
      }
    } catch (err) {
      showToast('Failed to reject withdrawal', 'error');
    }
  };

  const handleComplete = async () => {
    if (!selectedWithdrawal || !transactionHash.trim()) {
      showToast('Please enter transaction hash', 'error');
      return;
    }

    try {
      const response = await completeWithdrawalAdmin(selectedWithdrawal.id, transactionHash.trim());
      if (response.success) {
        showToast('Withdrawal marked as completed', 'success');
        setShowCompleteModal(false);
        setSelectedWithdrawal(null);
        setTransactionHash('');
        loadWithdrawals();
      } else {
        showToast(response.error || 'Failed to complete withdrawal', 'error');
      }
    } catch (err) {
      showToast('Failed to complete withdrawal', 'error');
    }
  };

  const copyAddress = (address) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(address);
      showToast('Address copied to clipboard!', 'success');
    } else {
      showToast('Failed to copy address', 'error');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: { bg: '#fef3c7', color: '#92400e' },
      APPROVED: { bg: '#dbeafe', color: '#1e40af' },
      COMPLETED: { bg: '#d1fae5', color: '#065f46' },
      REJECTED: { bg: '#fee2e2', color: '#991b1b' }
    };

    const style = styles[status] || styles.PENDING;

    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500',
        backgroundColor: style.bg,
        color: style.color
      }}>
        {status}
      </span>
    );
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
              Manage Withdrawals
            </h1>
          </div>
        </div>

        {/* Filter */}
        <div style={{
          marginBottom: '24px',
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          {['all', 'pending', 'approved', 'completed', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              style={{
                padding: '8px 16px',
                backgroundColor: filter === status ? '#0088cc' : 'white',
                color: filter === status ? 'white' : '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: filter === status ? '600' : '400',
                textTransform: 'capitalize'
              }}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Withdrawals Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
            <p>Loading withdrawals...</p>
          </div>
        ) : withdrawals.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '12px',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            No withdrawals found
          </div>
        ) : (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>User</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Amount</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Address</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Network</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Date</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px', fontSize: '14px' }}>
                        <div>
                          <div style={{ fontWeight: '500' }}>
                            {withdrawal.user?.firstName || withdrawal.user?.username || 'N/A'}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            ID: {withdrawal.user?.telegramId || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', fontWeight: '500' }}>
                        ${withdrawal.amount.toFixed(2)}
                      </td>
                      <td style={{ padding: '12px', fontSize: '12px', fontFamily: 'monospace' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            maxWidth: '150px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {withdrawal.cryptoAddress || 'N/A'}
                          </span>
                          {withdrawal.cryptoAddress && (
                            <button
                              onClick={() => copyAddress(withdrawal.cryptoAddress)}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: '#f3f4f6',
                                border: '1px solid #d1d5db',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '11px'
                              }}
                              title="Copy address"
                            >
                              📋
                            </button>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px' }}>
                        {withdrawal.network || 'N/A'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {getStatusBadge(withdrawal.status)}
                      </td>
                      <td style={{ padding: '12px', fontSize: '12px', color: '#6b7280' }}>
                        {formatDate(withdrawal.createdAt)}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {withdrawal.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleApprove(withdrawal.id)}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: '#10b981',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: '500'
                                }}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedWithdrawal(withdrawal);
                                  setShowRejectModal(true);
                                }}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: '500'
                                }}
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {withdrawal.status === 'APPROVED' && (
                            <button
                              onClick={() => {
                                setSelectedWithdrawal(withdrawal);
                                setShowCompleteModal(true);
                              }}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '500'
                              }}
                            >
                              Complete
                            </button>
                          )}
                          {withdrawal.transactionHash && (
                            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                              Hash: {withdrawal.transactionHash.substring(0, 10)}...
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Complete Modal */}
      {showCompleteModal && selectedWithdrawal && (
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
          setShowCompleteModal(false);
          setSelectedWithdrawal(null);
          setTransactionHash('');
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0, marginBottom: '20px' }}>
              Complete Withdrawal
            </h2>
            <div style={{ marginBottom: '16px' }}>
              <p><strong>Amount:</strong> ${selectedWithdrawal.amount.toFixed(2)}</p>
              <p><strong>Address:</strong> {selectedWithdrawal.cryptoAddress}</p>
              <p><strong>Network:</strong> {selectedWithdrawal.network}</p>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Transaction Hash
              </label>
              <input
                type="text"
                value={transactionHash}
                onChange={(e) => setTransactionHash(e.target.value)}
                placeholder="Enter transaction hash"
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
                  setShowCompleteModal(false);
                  setSelectedWithdrawal(null);
                  setTransactionHash('');
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
                onClick={handleComplete}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedWithdrawal && (
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
          setSelectedWithdrawal(null);
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
              Reject Withdrawal
            </h2>
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
                  setSelectedWithdrawal(null);
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

