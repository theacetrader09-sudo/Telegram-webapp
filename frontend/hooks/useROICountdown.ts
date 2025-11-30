'use client';

import { useState, useEffect } from 'react';

interface CountdownTime {
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
}

/**
 * Hook to calculate countdown to next 00:00 UTC
 * Updates every second
 */
export const useROICountdown = (): CountdownTime => {
  const [timeLeft, setTimeLeft] = useState<CountdownTime>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    formatted: '00:00:00'
  });

  useEffect(() => {
    const calculateTimeLeft = (): CountdownTime => {
      const now = new Date();
      const nextRun = new Date();
      
      // Set next run to 00:00 UTC
      nextRun.setUTCHours(0, 0, 0, 0);
      
      // If already past 00:00 UTC today, schedule for tomorrow
      if (nextRun <= now) {
        nextRun.setUTCDate(nextRun.getUTCDate() + 1);
      }
      
      const diff = nextRun.getTime() - now.getTime();
      
      if (diff <= 0) {
        return {
          hours: 0,
          minutes: 0,
          seconds: 0,
          formatted: '00:00:00'
        };
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      
      return { hours, minutes, seconds, formatted };
    };

    // Calculate immediately
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return timeLeft;
};

