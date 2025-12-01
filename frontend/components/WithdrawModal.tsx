'use client';

import { useState } from 'react';

interface WithdrawModalProps {
  balance: number;
  onClose: () => void;
  onWithdraw: (amount: number, cryptoAddress: string, network: string) => Promise<void>;
}

export default function WithdrawModal({ balance, onClose, onWithdraw }: WithdrawModalProps) {
  const [amount, setAmount] = useState('');
  const [cryptoAddress, setCryptoAddress] = useState('');
  const [network, setNetwork] = useState('BEP20');
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

    if (!cryptoAddress || cryptoAddress.trim() === '') {
      setError('Please enter your crypto wallet address');
      return;
    }

    // Basic validation for Ethereum-style addresses (0x...)
    if (cryptoAddress.startsWith('0x') && cryptoAddress.length !== 42) {
      setError('Invalid crypto address format. Please check your address.');
      return;
    }

    setLoading(true);
    try {
      await onWithdraw(withdrawAmount, cryptoAddress.trim(), network);
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
        borderRadius: '16px',
        padding: '24px',
        width: '90%',
        maxWidth: '450px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
        margin: '20px'
      }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ 
          marginTop: 0, 
          marginBottom: '20px',
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#111827'
        }}>
          Request Withdrawal
        </h2>
        
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

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Network
            </label>
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px',
                boxSizing: 'border-box',
                backgroundColor: 'white'
              }}
              required
            >
              <option value="BEP20">BEP20 (Binance Smart Chain)</option>
              <option value="ERC20">ERC20 (Ethereum)</option>
              <option value="TRC20">TRC20 (Tron)</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Crypto Wallet Address
            </label>
            <input
              type="text"
              value={cryptoAddress}
              onChange={(e) => setCryptoAddress(e.target.value)}
              placeholder="Enter your crypto wallet address"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px',
                boxSizing: 'border-box',
                fontFamily: 'monospace'
              }}
              required
            />
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
              Make sure to use the correct network address. Funds sent to the wrong network will be lost.
            </p>
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
                padding: '14px',
                background: loading 
                  ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' 
                  : 'linear-gradient(135deg, #0088cc 0%, #0066aa 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                boxShadow: loading ? 'none' : '0 4px 6px rgba(0, 0, 0, 0.1)',
                transition: 'transform 0.2s',
                opacity: loading ? 0.7 : 1
              }}
              onMouseDown={(e) => !loading && (e.currentTarget.style.transform = 'scale(0.98)')}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {loading ? 'Processing...' : 'Request Withdrawal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

