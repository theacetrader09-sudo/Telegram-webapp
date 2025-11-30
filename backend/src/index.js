import dotenv from 'dotenv';
import app from './app.js';
import { startDailyROIJob } from './jobs/dailyROI.job.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  
  // Start daily ROI job
  startDailyROIJob();
});

