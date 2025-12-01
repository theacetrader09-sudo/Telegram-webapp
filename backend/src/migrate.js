import { execSync } from 'child_process';

console.log('🔄 Syncing database schema...');
try {
  // Use db push for production - it syncs schema without migration files
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
  console.log('✅ Database schema synced successfully');
  
  // Seed default packages
  console.log('🔄 Seeding default packages...');
  try {
    execSync('node src/scripts/seedPackages.js', { stdio: 'inherit' });
  } catch (seedError) {
    console.log('⚠️  Package seeding skipped (may already exist)');
  }
} catch (error) {
  console.error('❌ Schema sync error:', error.message);
  // Don't exit - let the app start anyway (schema might already be synced)
  console.log('⚠️  Continuing startup...');
}

