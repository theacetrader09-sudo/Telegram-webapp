'use client';

import { useEffect, useState } from 'react';

export default function ROITransactionModal({ 
  isOpen, 
  onClose, 
  title, 
  transactions, 
  type = 'SELF' // 'SELF' or 'REFERRAL'
}) {
  const [filteredTransactions, setFilteredTransactions] = useState([]);

  useEffect(() => {
    if (isOpen && transactions) {
      if (type === 'SELF') {
        setFilteredTransactions(transactions.filter(t => t.type === 'SELF'));
      } else {
        setFilteredTransactions(transactions.filter(t => t.type.startsWith('REFERRAL')));
      }
    }
  }, [isOpen, transactions, type]);

  if (!isOpen) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
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
      zIndex: 2000,
      padding: '20px'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '24px',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)'
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '8px 12px',
              backgroundColor: '#e5e7eb',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            ✕ Close
          </button>
        </div>

        {filteredTransactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            <p>No transactions found</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                    Date
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                    Amount
                  </th>
                  {type === 'SELF' && (
                    <>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                        Package
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                        ROI %
                      </th>
                    </>
                  )}
                  {type === 'REFERRAL' && (
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                      Level
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction, index) => (
                  <tr key={transaction.id || index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px', fontSize: '13px', color: '#6b7280' }}>
                      {formatDate(transaction.createdAt)}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600', color: '#10b981' }}>
                      ${transaction.amount.toFixed(2)}
                    </td>
                    {type === 'SELF' && (
                      <>
                        <td style={{ padding: '12px', fontSize: '13px', color: '#111827' }}>
                          {transaction.package?.name || 'N/A'}
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px', color: '#6b7280' }}>
                          {transaction.package?.dailyROI ? `${transaction.package.dailyROI}%` : 'N/A'}
                        </td>
                      </>
                    )}
                    {type === 'REFERRAL' && (
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '500',
                          backgroundColor: '#fef3c7',
                          color: '#92400e'
                        }}>
                          {transaction.type.replace('REFERRAL_LEVEL_', 'L')}
                        </span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

