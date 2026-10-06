const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const authenticateToken = require('../middleware/authMiddleware');

// All wallet routes require token authentication
router.use(authenticateToken);

// Wallet Balance & History
router.get('/', walletController.getWalletDetails);

// Deposit Funds (Razorpay Payment Gateway Mock)
router.post('/deposit/create-order', walletController.createDepositOrder);
router.post('/deposit/verify', walletController.verifyDepositPayment);

// Bank & UPI Details
router.post('/bank-details', walletController.updateBankDetails);

// Freelancer Payout Withdrawal
router.post('/withdraw', walletController.requestWithdrawal);

module.exports = router;
