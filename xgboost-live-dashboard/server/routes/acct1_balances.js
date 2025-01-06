const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const router = express.Router();

const acct1_key = process.env.acct1_key;
const acct1_secret = process.env.acct1_secret;

const acct1_init_balance = 1818.521;

// Helper function to sign a query
function signQuery(query) {
  return crypto.createHmac('sha256', acct1_secret).update(query).digest('hex');
}

// Function to get futures account details
async function getFuturesAccountDetails() {
  const endpoint = 'https://fapi.binance.com/fapi/v2/account';
  const timestamp = Date.now();

  // Create the query string with timestamp
  const params = new URLSearchParams({
    timestamp,
  });

  // Sign the query
  const signature = signQuery(params.toString());
  params.append('signature', signature);

  try {
    const response = await axios.get(`${endpoint}?${params.toString()}`, {
      headers: {
        'X-MBX-APIKEY': acct1_key,
      },
    });

    // Process response to get USDT balance and unrealized PnL
    const accountData = response.data;
    const usdtBalance = accountData.assets.find((asset) => asset.asset === 'USDT');
    const totalWalletBalance = parseFloat(accountData.totalWalletBalance).toFixed(2);
    const totalUnrealizedPnL = parseFloat(accountData.totalUnrealizedProfit).toFixed(2);
    const returnValue = (parseFloat((usdtBalance.marginBalance - acct1_init_balance)/acct1_init_balance)*100).toFixed(2);

    // Return relevant account details
    return {
      available: usdtBalance ? parseFloat(usdtBalance.availableBalance).toFixed(2) : '0',
      marginalBalance: usdtBalance ? parseFloat(usdtBalance.marginBalance).toFixed(2) : '0',
      totalWalletBalance,
      totalUnrealizedPnL,
      returnValue,
    };
  } catch (error) {
    console.error('Error fetching futures account details:', error.response?.data || error.message);
    throw new Error('Unable to fetch account details');
  }
}

// This function retrieves the balance data for acct1
async function acct1_balance_data() {
  const { available, marginalBalance, totalWalletBalance, totalUnrealizedPnL, returnValue } = await getFuturesAccountDetails();
  
  console.log(available, marginalBalance, totalWalletBalance, totalUnrealizedPnL, returnValue);
  
  // Return the account details as JSON
  return {
    available,
    marginalBalance,
    totalWalletBalance,
    totalUnrealizedPnL,
    returnValue,
  };
}

// Swagger Route Documentation
/**
 * @swagger
 * /api/acct1_balances:
 *   get:
 *     summary: Get total wallet balances for acct1
 *     tags: [Account Info]
 *     responses:
 *       200:
 *         description: Successfully retrieved wallet balances for acct1
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 available:
 *                   type: string
 *                   example: '0.0'
 *                 marginalBalance:
 *                   type: string
 *                   example: '0.0'
 *                 totalWalletBalance:
 *                   type: string
 *                   example: '0.0'
 *                 totalUnrealizedPnL:
 *                   type: string
 *                   example: '0.0'
 *       500:
 *         description: Error fetching wallet balances
 */

// Route handler for getting account details (HTTP route)
router.get('/', async (req, res) => {
  try {
    const { available, marginalBalance, totalWalletBalance, totalUnrealizedPnL, returnValue } = await acct1_balance_data();

    // Return the account details as JSON
    res.json({
      available,
      marginalBalance,
      totalWalletBalance,
      totalUnrealizedPnL,
      returnValue,
    });
  } catch (error) {
    // Handle errors and return appropriate response
    res.status(500).json({ error: error.message });
  }
});

// Exporting the function so it can be used elsewhere
module.exports = router; // For the route
module.exports.acct1_balance_data = acct1_balance_data; // For standalone function
















// // WebSocket server initialization
// const wss = new WebSocket.Server({ port: 8080 });

// wss.on('connection', (ws) => {
//   console.log('Client connected');

//   // Send futures account details periodically
//   const interval = setInterval(async () => {
//     try {
//       // Fetch account details
//       const { available, marginalBalance, totalWalletBalance, totalUnrealizedPnL } =
//         await getFuturesAccountDetails();

//       // Send the data to the client
//       ws.send(
//         JSON.stringify({
//           available,
//           marginalBalance,
//           totalWalletBalance,
//           totalUnrealizedPnL,
//         })
//       );
//     } catch (error) {
//       // Handle errors and notify the client
//       ws.send(JSON.stringify({ error: error.message }));
//     }
//   }, 5000); // Fetch every 5 seconds

//   // Clean up on client disconnect
//   ws.on('close', () => {
//     console.log('Client disconnected');
//     clearInterval(interval);
//   });

//   // Handle incoming messages if needed
//   ws.on('message', (message) => {
//     console.log(`Received message: ${message}`);
//   });
// });

// console.log('WebSocket server is running on ws://localhost:8080');

// module.exports = {router, acct1_balance_data};
