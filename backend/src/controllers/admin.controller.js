// Add this new endpoint after the runROI function
/**
 * Test wallet update directly
 * POST /admin/test-wallet-update
 */
export const testWalletUpdate = async (req, res) => {
  try {
    const { userId, amount } = req.body;
    const adminId = req.admin?.id || 'system';

    if (!userId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'userId and amount are required'
      });
    }

    console.log(`🧪 Testing wallet update for user ${userId}: Adding $${amount}`);

    // Get wallet before
    const walletBefore = await prisma.wallet.findUnique({
      where: { userId }
    });

    if (!walletBefore) {
      // Create wallet if doesn't exist
      const newWallet = await prisma.wallet.create({
        data: { userId, balance: 0 }
      });
      console.log(`✅ Created wallet for user ${userId}`);
    }

    const balanceBefore = walletBefore?.balance || 0;

    // Update wallet using increment
    const walletAfter = await prisma.wallet.update({
      where: { userId },
      data: {
        balance: {
          increment: parseFloat(amount)
        }
      }
    });

    console.log(`💰 Wallet update test: Before = $${balanceBefore.toFixed(2)}, Added = $${amount}, After = $${walletAfter.balance.toFixed(2)}`);

    // Verify
    const verifiedWallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    return res.json({
      success: true,
      before: balanceBefore,
      added: parseFloat(amount),
      after: walletAfter.balance,
      verified: verifiedWallet.balance,
      match: Math.abs(walletAfter.balance - verifiedWallet.balance) < 0.01
    });
  } catch (error) {
    console.error('Test wallet update error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to test wallet update',
      message: error.message
    });
  }
};
