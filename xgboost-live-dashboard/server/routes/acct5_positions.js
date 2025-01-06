// routes/positions.js
const express = require('express');
const Binance = require('binance-api-node').default;
const WebSocket = require('ws');

const router = express.Router();
const client = Binance({
  apiKey: process.env.acctX5_key,
  apiSecret: process.env.acctX5_secret,
});

async function acct_position_data() {
  try {
    // Fetch positions from Binance API
    const positions = await client.futuresPositionRisk();

    // Filter open positions (where positionAmt is not 0)
    const openPositions = positions
      .filter(position => parseFloat(position.positionAmt) !== 0)
      .map(position => {
        // Parse necessary values
        const positionAmt = parseFloat(position.positionAmt);
        const entryPrice = parseFloat(position.entryPrice);
        const markPrice = parseFloat(position.markPrice);
        const unrealizedProfit = parseFloat(position.unRealizedProfit);
        const leverage = parseFloat(position.leverage);
        const positionSide = position.positionSide;

        // Determine if the position is short or long
        const positionType = positionAmt > 0 ? 'long' : 'short';

        // Convert position amount to USDT value (no rounding)
        const positionValueUSDT = positionAmt * markPrice;

        // Calculate ROI percentage (no rounding)
        const roiPercentage = entryPrice !== 0 && positionAmt !== 0
          ? (unrealizedProfit / (entryPrice * Math.abs(positionAmt))) * 100
          : 0;

        console.log(position.symbol, positionAmt, positionValueUSDT, entryPrice, markPrice, unrealizedProfit, leverage, roiPercentage, positionSide, positionType);

        // Return the transformed position
        return {
          symbol: position.symbol,
          positionAmt: positionAmt,
          positionValueUSDT: positionValueUSDT, // USDT
          entryPrice: entryPrice,
          markPrice: markPrice,
          pnl: unrealizedProfit,
          leverage: leverage,
          roiPercentage: roiPercentage, // ROI without rounding
          positionSide: positionSide,
          positionType: positionType // Short/long info
        };
      });
    return openPositions;
  } catch (error) {
    console.error("Error fetching positions:", error.message || error);
    return []; // Return an empty array in case of error
  }
}

acct_position_data()


// Swagger Route Documentation
/**
 * @swagger
 * /api/acct1_positions:
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

router.get('/', async (req, res) => {
  try {
    // Call the acct_position_data function to get the data
    const openPositions = await acct_position_data();

    // If there are no open positions, return an empty array
    if (!openPositions || openPositions.length === 0) {
      return res.json([]);
    }

    // If there are open positions, send the response
    res.json(openPositions);
  } catch (error) {
    console.error("Error fetching position data:", error);
    res.status(500).json({ error: "Unable to fetch position data" });
  }
});
module.exports = router;
module.exports.acct_position_data = acct_position_data; // For standalone function




// // WebSocket server initialization
// const wss = new WebSocket.Server({ port: 8081 });

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

// module.exports = router;
