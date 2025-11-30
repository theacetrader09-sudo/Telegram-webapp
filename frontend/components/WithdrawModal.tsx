'use client';

import { useState } from 'react';

interface WithdrawModalProps {
  balance: number;
  onClose: () => void;
  onWithdraw: (amount: number) => Promise<void>;
}

export default function WithdrawModal({ balance, onClose, onWithdraw }: WithdrawModalProps) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const withdrawAmount = parseFloat(amount);

    if (!amount || isNaN(withdrawAmount) || withdrawAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (withdrawAmount > balance) {
      setError(`Insufficient balance. Available: $${balance.toFixed(2)}`);
      return;
    }

    if (withdrawAmount < 10) {
      setError('Minimum withdrawal amount is $10');
      return;
    }

    setLoading(true);
    try {
      await onWithdraw(withdrawAmount);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to request withdrawal');
    } finally {
      setLoading(false);
    }
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
      zIndex: 1000
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        width: '90%',
        maxWidth: '400px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
      }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginTop: 0, marginBottom: '16px' }}>Request Withdrawal</h2>
        
        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
          <p style={{ margin: '4px 0', fontSize: '14px' }}>
            <strong>Available Balance:</strong> ${balance.toFixed(2)}
          </p>
          <p style={{ margin: '4px 0', fontSize: '12px', color: '#6b7280' }}>
            Minimum withdrawal: $10
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Withdrawal Amount ($)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="10"
              max={balance}
              step="0.01"
              placeholder="Enter amount"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>

          {error && (
            <div style={{
              padding: '10px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              borderRadius: '6px',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#e5e7eb',
                color: '#374151',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: loading ? '#9ca3af' : '#0088cc',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              {loading ? 'Processing...' : 'Request Withdrawal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

