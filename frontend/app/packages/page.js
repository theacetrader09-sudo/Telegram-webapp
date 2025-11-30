'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import DepositModal from '../../components/DepositModal';
import { getPackages, deposit } from '../../services/api';

export default function Packages() {
  const router = useRouter();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkAuth = () => {
      const storedToken = localStorage.getItem('authToken');
      if (!storedToken) {
        router.push('/');
        return;
      }
    };

    checkAuth();
    loadPackages();
  }, [router]);

  const loadPackages = async () => {
    try {
      const response = await getPackages();
      if (response.success) {
        setPackages(response.packages || []);
      } else {
        setError(response.error || 'Failed to load packages');
      }
    } catch (err) {
      setError('Failed to load packages');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (packageId, amount) => {
    const response = await deposit(packageId, amount);
    if (response.success) {
      alert('Deposit created successfully!');
      setSelectedPackage(null);
      // Optionally reload packages or redirect
    } else {
      throw new Error(response.error || 'Failed to create deposit');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <div style={{ marginLeft: '250px', padding: '20px', textAlign: 'center' }}>
          <p>Loading packages...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      
      <div style={{ 
        marginLeft: '250px',
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        width: 'calc(100% - 250px)'
      }}>
        <h1 style={{ marginTop: 0 }}>Investment Packages</h1>

        {error && (
          <div style={{
            padding: '12px',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          marginTop: '20px'
        }}>
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              style={{
                padding: '24px',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                backgroundColor: 'white',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
            >
              <h2 style={{ marginTop: 0, color: '#0088cc' }}>{pkg.name}</h2>
              
              <div style={{ marginTop: '16px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>Investment Range:</span>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>
                    ${pkg.minAmount.toLocaleString()} - ${pkg.maxAmount.toLocaleString()}
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>Daily ROI:</span>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                    {pkg.dailyROI}%
                  </div>
                </div>

                <div style={{ 
                  padding: '12px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '8px',
                  marginTop: '16px',
                  fontSize: '14px',
                  color: '#6b7280'
                }}>
                  <strong>Example:</strong> If you invest ${pkg.minAmount.toLocaleString()}, 
                  you'll earn ${(pkg.minAmount * pkg.dailyROI / 100).toFixed(2)} daily
                </div>
              </div>

              <button
                onClick={() => setSelectedPackage(pkg)}
                style={{
                  width: '100%',
                  marginTop: '20px',
                  padding: '12px',
                  backgroundColor: '#0088cc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '500'
                }}
              >
                Invest Now
              </button>
            </div>
          ))}
        </div>

        {packages.length === 0 && !error && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            <p>No packages available at the moment.</p>
          </div>
        )}

        {selectedPackage && (
          <DepositModal
            package={selectedPackage}
            onClose={() => setSelectedPackage(null)}
            onDeposit={handleDeposit}
          />
        )}
      </div>
    </div>
  );
}

