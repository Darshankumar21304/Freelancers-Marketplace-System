require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Transaction = require('../src/models/Transaction');
const Contract = require('../src/models/Contract');

async function fixWallets() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas');

    // 1. Client user Heartware ID
    const clientId = '6a93c129bf6e36adc15ded5e';
    const clientUser = await User.findById(clientId);

    if (clientUser) {
      const oldWallet = clientUser.walletBalance || 0;
      // Deduct the 111111 project payment that wasn't deducted earlier
      const newWallet = Math.max(0, oldWallet - 111111);
      clientUser.walletBalance = newWallet;
      clientUser.escrowBalance = 0;
      await clientUser.save();
      console.log(`Updated Client ${clientUser.name} wallet: ${oldWallet} -> ${newWallet}`);

      // Record the Client Payment Transaction
      const existingPaymentTx = await Transaction.findOne({
        user_id: clientId,
        type: 'payment',
        amount: -111111
      });

      if (!existingPaymentTx) {
        const clientTx = new Transaction({
          user_id: clientUser._id,
          type: 'payment',
          title: 'Project Payment Released: Full Project Deliverable (Quiz Application)',
          amount: -111111,
          status: 'completed',
          paymentMethod: 'Project Approval'
        });
        await clientTx.save();
        console.log('Recorded Client Payment Transaction of -111111');
      }
    }

    await mongoose.disconnect();
    console.log('Database wallet sync completed!');
  } catch (err) {
    console.error('Error fixing wallets:', err);
  }
}

fixWallets();
