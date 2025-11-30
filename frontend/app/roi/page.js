'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import { getROI } from '../../services/api';

export default function ROI() {
  const router = useRouter();
  const [roiData, setRoiData] = useState(null);
  const [loading, setLoading] = useState(true);
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
    loadROI();
  }, [router]);

  const loadROI = async () => {
    try {
      const response = await getROI();
      if (response.success) {
        setRoiData(response);
      } else {
        setError(response.error || 'Failed to load ROI data');
      }
    } catch (err) {
      setError('Failed to load ROI data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <div style={{ marginLeft: '250px', padding: '20px', textAlign: 'center' }}>
          <p>Loading ROI data...</p>
        </div>
      </div>
    );
  }

  const totalROI = roiData?.totalROI || 0;
  const totalReferrals = roiData?.totalReferrals || 0;
  const todayROI = roiData?.todayROI || 0;
  const thisMonthROI = roiData?.thisMonthROI || 0;
  const records = roiData?.records || [];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      
      <div style={{ 
        marginLeft: '250px',
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        width: 'calc(100% - 250px)'
      }}>
        <h1 style={{ marginTop: 0 }}>ROI Earnings</h1>

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

        {/* ROI Summary Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginTop: '20px'
        }}>
          <div style={{
            padding: '20px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Total ROI</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#166534' }}>
              ${totalROI.toFixed(2)}
            </div>
          </div>

          <div style={{
            padding: '20px',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Today's ROI</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e40af' }}>
              ${todayROI.toFixed(2)}
            </div>
          </div>

          <div style={{
            padding: '20px',
            backgroundColor: '#fef3c7',
            border: '1px solid #fde68a',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>This Month</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#92400e' }}>
              ${thisMonthROI.toFixed(2)}
            </div>
          </div>

          <div style={{
            padding: '20px',
            backgroundColor: '#fce7f3',
            border: '1px solid #fbcfe8',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Referral Income</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#9f1239' }}>
              ${totalReferrals.toFixed(2)}
            </div>
          </div>
        </div>

        {/* ROI Records Table */}
        <div style={{ marginTop: '30px' }}>
          <h2>ROI History</h2>
          
          {records.length > 0 ? (
            <div style={{
              marginTop: '16px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Date</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Amount</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record, index) => (
                    <tr key={record.id || index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px' }}>
                        {new Date(record.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px', fontWeight: '500', color: '#10b981' }}>
                        ${record.amount.toFixed(2)}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          backgroundColor: record.type === 'SELF' ? '#dbeafe' : '#fef3c7',
                          color: record.type === 'SELF' ? '#1e40af' : '#92400e'
                        }}>
                          {record.type === 'SELF' ? 'Own ROI' : record.type.replace('REFERRAL_', 'Level ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              color: '#6b7280',
              marginTop: '20px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}>
              <p>No ROI records yet. Start investing to earn daily ROI!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

