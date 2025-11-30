'use client';

import { useROICountdown } from '../hooks/useROICountdown';

interface ROICountdownProps {
  className?: string;
  showLabel?: boolean;
}

/**
 * Component to display countdown to next ROI distribution (00:00 UTC)
 */
export default function ROICountdown({ className = '', showLabel = true }: ROICountdownProps) {
  const { formatted, hours, minutes, seconds } = useROICountdown();

  return (
    <div className={`roi-countdown ${className}`} style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      padding: '16px',
      backgroundColor: '#f0f9ff',
      borderRadius: '8px',
      border: '1px solid #0ea5e9'
    }}>
      {showLabel && (
        <p style={{
          margin: 0,
          fontSize: '14px',
          color: '#64748b',
          fontWeight: 500
        }}>
          Next ROI distribution in
        </p>
      )}
      <div style={{
        fontSize: '32px',
        fontWeight: 'bold',
        color: '#0ea5e9',
        fontFamily: 'monospace',
        letterSpacing: '2px'
      }}>
        {formatted}
      </div>
      <p style={{
        margin: 0,
        fontSize: '12px',
        color: '#94a3b8'
      }}>
        {hours}h {minutes}m {seconds}s
      </p>
    </div>
  );
}

