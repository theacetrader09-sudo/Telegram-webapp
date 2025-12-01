import prisma from '../lib/prisma.js';

/**
 * Backfill ROI for all active deposits
 * Calculates ROI for each day since deposit was activated
 */
async function backfillROI() {
  console.log('🔄 Starting ROI backfill...');

  try {
    // Get all active deposits
    const activeDeposits = await prisma.deposit.findMany({
      where: { status: 'ACTIVE' },
      include: {
        package: true,
        user: {
          include: {
            wallet: true
          }
        }
      }
    });

    console.log(`📦 Found ${activeDeposits.length} active deposits`);

    if (activeDeposits.length === 0) {
      console.log('⚠️ No active deposits found. Nothing to backfill.');
      return {
        processed: 0,
        totalROI: 0,
        message: 'No active deposits found'
      };
    }

    let totalProcessed = 0;
    let totalROI = 0;
    const errors = [];

    for (const deposit of activeDeposits) {
      if (!deposit.package) {
        console.warn(`⚠️ Deposit ${deposit.id} has no package - skipping`);
        errors.push({
          depositId: deposit.id,
          error: 'No package assigned'
        });
        continue;
      }

      // Calculate days since deposit was created or last ROI date
      const startDate = deposit.lastROIDate 
        ? new Date(deposit.lastROIDate)
        : new Date(deposit.createdAt);
      
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      startDate.setUTCHours(0, 0, 0, 0);

      const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));

      if (daysDiff <= 0) {
        console.log(`⏭️ Deposit ${deposit.id} already up to date`);
        continue;
      }

      console.log(`💰 Processing deposit ${deposit.id}: ${daysDiff} days to backfill`);

      // Process ROI for each missing day
      for (let day = 1; day <= daysDiff; day++) {
        const processDate = new Date(startDate);
        processDate.setUTCDate(processDate.getUTCDate() + day);
        processDate.setUTCHours(0, 0, 0, 0);

        try {
          // Check if ROI already exists for this date
          const existingROI = await prisma.rOIRecord.findFirst({
            where: {
              userId: deposit.userId,
              depositId: deposit.id,
              type: 'SELF',
              createdAt: {
                gte: new Date(processDate),
                lt: new Date(processDate.getTime() + 24 * 60 * 60 * 1000)
              }
            }
          });

          if (existingROI) {
            console.log(`⏭️ ROI already exists for deposit ${deposit.id} on ${processDate.toISOString()}`);
            continue;
          }

          // Manually create ROI record for this date
          const dailyROI = deposit.amount * (deposit.package.dailyROI / 100);

          await prisma.$transaction(async (tx) => {
            // Ensure wallet exists
            let wallet = await tx.wallet.findUnique({
              where: { userId: deposit.userId }
            });

            if (!wallet) {
              wallet = await tx.wallet.create({
                data: { userId: deposit.userId, balance: 0 }
              });
            }

            // Create ROI record with specific date
            await tx.rOIRecord.create({
              data: {
                userId: deposit.userId,
                depositId: deposit.id,
                amount: dailyROI,
                type: 'SELF',
                createdAt: processDate
              }
            });

            // Update wallet balance
            await tx.wallet.update({
              where: { userId: deposit.userId },
              data: {
                balance: { increment: dailyROI }
              }
            });

            // Update deposit lastROIDate
            await tx.deposit.update({
              where: { id: deposit.id },
              data: {
                lastROIDate: processDate
              }
            });
          });

          totalProcessed++;
          totalROI += dailyROI;
          console.log(`✅ Backfilled ROI for deposit ${deposit.id}: $${dailyROI.toFixed(2)} on ${processDate.toISOString()}`);
        } catch (error) {
          console.error(`❌ Error backfilling deposit ${deposit.id} for date ${processDate.toISOString()}:`, error);
          errors.push({
            depositId: deposit.id,
            date: processDate.toISOString(),
            error: error.message
          });
        }
      }
    }

    console.log(`✅ Backfill completed: ${totalProcessed} ROI records created, Total: $${totalROI.toFixed(2)}`);
    
    return {
      processed: totalProcessed,
      totalROI,
      errors: errors.length > 0 ? errors : undefined,
      message: `Backfilled ${totalProcessed} ROI records totaling $${totalROI.toFixed(2)}`
    };
  } catch (error) {
    console.error('❌ Backfill error:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  backfillROI()
    .then((result) => {
      console.log('✅ Backfill script completed:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Backfill script failed:', error);
      process.exit(1);
    });
}

export default backfillROI;

