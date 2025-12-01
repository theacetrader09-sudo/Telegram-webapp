'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { verifyAdmin, getAllUsersAdmin, getUserByIdAdmin } from '../../../services/api';
import { showToast } from '../../../components/Toast';

export default function AdminUsers() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [userDetail, setUserDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    checkAuth();
    loadUsers();
  }, [pagination.page, search]);

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

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await getAllUsersAdmin(pagination.page, pagination.limit, search);
      if (response.success) {
        setUsers(response.users || []);
        setPagination(response.pagination || pagination);
      } else {
        showToast(response.error || 'Failed to load users', 'error');
      }
    } catch (err) {
      showToast('Failed to load users', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    loadUsers();
  };

  const loadUserDetail = async (userId) => {
    setLoadingDetail(true);
    try {
      const response = await getUserByIdAdmin(userId);
      if (response.success) {
        setUserDetail(response.user);
        setShowUserDetail(true);
      } else {
        showToast(response.error || 'Failed to load user details', 'error');
      }
    } catch (err) {
      showToast('Failed to load user details', 'error');
    } finally {
      setLoadingDetail(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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
              User Management
            </h1>
          </div>
        </div>

        {/* Search */}
        <div style={{
          marginBottom: '24px',
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Telegram ID, username, or name..."
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                backgroundColor: '#0088cc',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Search
            </button>
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Clear
              </button>
            )}
          </form>
        </div>

        {/* Users Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
            <p>Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '12px',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            No users found
          </div>
        ) : (
          <>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              marginBottom: '20px'
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>User</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Telegram ID</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Wallet</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Deposits</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Referrals</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Joined</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '12px', fontSize: '14px' }}>
                          <div>
                            <div style={{ fontWeight: '500' }}>
                              {user.firstName || user.username || 'N/A'} {user.lastName || ''}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                              @{user.username || 'no-username'}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px', fontSize: '12px', fontFamily: 'monospace', color: '#6b7280' }}>
                          {user.telegramId}
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px', fontWeight: '500', color: '#10b981' }}>
                          {formatCurrency(user.walletBalance)}
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px' }}>
                          <div>{formatCurrency(user.totalDeposits)}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {user.depositCount} deposit{user.depositCount !== 1 ? 's' : ''}
                          </div>
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px' }}>
                          <div style={{ fontWeight: '500' }}>{user.referralCount || 0}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {user.activeDeposits || 0} active
                          </div>
                        </td>
                        <td style={{ padding: '12px', fontSize: '12px', color: '#6b7280' }}>
                          {formatDate(user.createdAt)}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <button
                            onClick={() => loadUserDetail(user.id)}
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
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '10px',
                marginTop: '20px'
              }}>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: pagination.page === 1 ? '#e5e7eb' : '#0088cc',
                    color: pagination.page === 1 ? '#9ca3af' : 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: pagination.page === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Previous
                </button>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.totalPages}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: pagination.page === pagination.totalPages ? '#e5e7eb' : '#0088cc',
                    color: pagination.page === pagination.totalPages ? '#9ca3af' : 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: pagination.page === pagination.totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* User Detail Modal */}
      {showUserDetail && userDetail && (
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
          padding: '20px',
          overflowY: 'auto'
        }} onClick={() => {
          setShowUserDetail(false);
          setUserDetail(null);
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '100%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            {loadingDetail ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div className="spinner" style={{ margin: '0 auto' }}></div>
                <p>Loading user details...</p>
              </div>
            ) : (
              <>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px'
                }}>
                  <h2 style={{ margin: 0, fontSize: '24px' }}>User Details</h2>
                  <button
                    onClick={() => {
                      setShowUserDetail(false);
                      setUserDetail(null);
                    }}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#e5e7eb',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Close
                  </button>
                </div>

                {/* User Info */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ marginBottom: '12px', fontSize: '18px' }}>Basic Information</h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                    padding: '16px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px'
                  }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Name</div>
                      <div style={{ fontWeight: '500' }}>
                        {userDetail.firstName || 'N/A'} {userDetail.lastName || ''}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Username</div>
                      <div style={{ fontWeight: '500' }}>@{userDetail.username || 'no-username'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Telegram ID</div>
                      <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>{userDetail.telegramId}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Wallet Balance</div>
                      <div style={{ fontWeight: '600', color: '#10b981' }}>
                        {formatCurrency(userDetail.wallet?.balance || 0)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Joined</div>
                      <div style={{ fontSize: '14px' }}>{formatDate(userDetail.createdAt)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Referrer</div>
                      <div style={{ fontSize: '14px' }}>
                        {userDetail.referrer ? `@${userDetail.referrer.username || userDetail.referrer.telegramId}` : 'None'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                {userDetail.stats && (
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ marginBottom: '12px', fontSize: '18px' }}>Statistics</h3>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: '12px'
                    }}>
                      <div style={{ padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Total Deposits</div>
                        <div style={{ fontSize: '20px', fontWeight: '600', color: '#10b981' }}>
                          {formatCurrency(userDetail.stats.totalDeposits)}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {userDetail.stats.depositCount} deposit{userDetail.stats.depositCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div style={{ padding: '16px', backgroundColor: '#fef3c7', borderRadius: '8px' }}>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Active Deposits</div>
                        <div style={{ fontSize: '20px', fontWeight: '600', color: '#f59e0b' }}>
                          {userDetail.stats.activeDeposits}
                        </div>
                      </div>
                      <div style={{ padding: '16px', backgroundColor: '#fee2e2', borderRadius: '8px' }}>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Total Withdrawals</div>
                        <div style={{ fontSize: '20px', fontWeight: '600', color: '#ef4444' }}>
                          {formatCurrency(userDetail.stats.totalWithdrawals)}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {userDetail.stats.withdrawalCount} withdrawal{userDetail.stats.withdrawalCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div style={{ padding: '16px', backgroundColor: '#dbeafe', borderRadius: '8px' }}>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Referrals</div>
                        <div style={{ fontSize: '20px', fontWeight: '600', color: '#3b82f6' }}>
                          {userDetail.stats.referralCount}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Deposits */}
                {userDetail.deposits && userDetail.deposits.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ marginBottom: '12px', fontSize: '18px' }}>Recent Deposits</h3>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f9fafb' }}>
                            <th style={{ padding: '8px', textAlign: 'left' }}>Amount</th>
                            <th style={{ padding: '8px', textAlign: 'left' }}>Status</th>
                            <th style={{ padding: '8px', textAlign: 'left' }}>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userDetail.deposits.map((deposit) => (
                            <tr key={deposit.id}>
                              <td style={{ padding: '8px' }}>{formatCurrency(deposit.amount)}</td>
                              <td style={{ padding: '8px' }}>
                                <span style={{
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  backgroundColor: deposit.status === 'ACTIVE' ? '#d1fae5' : '#fef3c7',
                                  color: deposit.status === 'ACTIVE' ? '#065f46' : '#92400e'
                                }}>
                                  {deposit.status}
                                </span>
                              </td>
                              <td style={{ padding: '8px', fontSize: '12px', color: '#6b7280' }}>
                                {formatDate(deposit.createdAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Recent Withdrawals */}
                {userDetail.withdrawals && userDetail.withdrawals.length > 0 && (
                  <div>
                    <h3 style={{ marginBottom: '12px', fontSize: '18px' }}>Recent Withdrawals</h3>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f9fafb' }}>
                            <th style={{ padding: '8px', textAlign: 'left' }}>Amount</th>
                            <th style={{ padding: '8px', textAlign: 'left' }}>Status</th>
                            <th style={{ padding: '8px', textAlign: 'left' }}>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userDetail.withdrawals.map((withdrawal) => (
                            <tr key={withdrawal.id}>
                              <td style={{ padding: '8px' }}>{formatCurrency(withdrawal.amount)}</td>
                              <td style={{ padding: '8px' }}>
                                <span style={{
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  backgroundColor: withdrawal.status === 'COMPLETED' ? '#d1fae5' : '#fef3c7',
                                  color: withdrawal.status === 'COMPLETED' ? '#065f46' : '#92400e'
                                }}>
                                  {withdrawal.status}
                                </span>
                              </td>
                              <td style={{ padding: '8px', fontSize: '12px', color: '#6b7280' }}>
                                {formatDate(withdrawal.createdAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
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

