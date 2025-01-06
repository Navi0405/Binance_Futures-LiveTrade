// routes/positions.js
const { PositionSide } = require('binance-api-node');
const express = require('express');
const Binance = require('binance-api-node').default;
const WebSocket = require('ws');

const router = express.Router();
const client = Binance({
  apiKey: process.env.acctX1_key,
  apiSecret: process.env.acctX1_secret,
});

async function acct4_position_data() {
  try {
    // Fetch positions from Binance API
    const positions = await client.futuresPositionRisk();
    const openOrders = await client.futuresOpenOrders(); // Fetch open orders

    // Filter open positions (where positionAmt is not 0)
    const openPositions = positions
      .filter(position => parseFloat(position.positionAmt) !== 0)
      .map(position => {
        const positionAmt = parseFloat(position.positionAmt);
        const entryPrice = parseFloat(position.entryPrice);
        const markPrice = parseFloat(position.markPrice);
        const unrealizedProfit = parseFloat(position.unRealizedProfit);
        const leverage = parseFloat(position.leverage);
        const positionSide = position.positionSide;

        const positionKind = positionAmt > 0 ? 'long' : 'short';
        const positionType = positionKind.toUpperCase();
        const positionValueCalc = positionAmt * markPrice;
        const positionValueUSDT = positionValueCalc.toFixed(2);

        const roiPercentage = entryPrice !== 0 && positionAmt !== 0
          ? (unrealizedProfit / (entryPrice * Math.abs(positionAmt))) * 100
          : 0;

        // Assign the ROI to 2 decimal places
        const roiDecimal = roiPercentage.toFixed(2);

        // Assign the unrealizedPnl to 2 decimal places
        const unrealizedDecimal = parseFloat(unrealizedProfit.toFixed(2));

        // Assign the entry price and mark price to 2 decimal places
        const entryPriceDecimal = parseFloat(entryPrice.toFixed(2));
        const markPriceDecimal = parseFloat(markPrice.toFixed(2));

        // Filter orders for this symbol
        const symbolOrders = openOrders.filter(order => order.symbol === position.symbol);

        // Extract TP and SL
        const tpOrder = symbolOrders.find(order =>
          (positionKind === 'long' && order.side === 'SELL' && parseFloat(order.price) > markPrice) ||
          (positionKind === 'short' && order.side === 'BUY' && parseFloat(order.price) < markPrice)
        );

        const slOrder = symbolOrders.find(order =>
          order.type.includes('STOP') &&
          ((positionKind === 'long' && order.side === 'SELL') ||
            (positionKind === 'short' && order.side === 'BUY'))
        );

        // Calculate TP and SL in terms of symbol's price (asset value), not USDT
        const takeProfitPriceInSymbol = tpOrder ? parseFloat(tpOrder.price) : null;
        const stopLossPriceInSymbol = slOrder ? parseFloat(slOrder.stopPrice) : null;

        // Round TP and SL values to 2 decimal places
        const takeProfitAsset = takeProfitPriceInSymbol ? parseFloat(((takeProfitPriceInSymbol - entryPriceDecimal) * positionAmt).toFixed(2)) : null;
        const stopLossAsset = stopLossPriceInSymbol ? parseFloat(((entryPriceDecimal - stopLossPriceInSymbol) * positionAmt).toFixed(2)) : null;

        // Logging for debugging
        console.log(
          position.symbol,
          positionAmt,
          positionValueUSDT,
          entryPriceDecimal,
          markPriceDecimal,
          unrealizedDecimal,
          leverage,
          roiDecimal,
          positionSide,
          positionType,
          takeProfitAsset, // TP in asset value
          stopLossAsset    // SL in asset value
        );

        // Return the transformed position with TP and SL in asset value
        return {
          symbol: position.symbol,
          positionAmt: positionAmt,
          positionValueUSDT: positionValueUSDT,
          entryPrice: entryPriceDecimal,
          markPrice: markPriceDecimal,
          pnl: unrealizedDecimal,
          leverage: leverage,
          roiPercentage: roiDecimal,
          positionSide: positionSide,
          positionType: positionType,
          takeProfit: takeProfitAsset,  // Converted to asset value
          stopLoss: stopLossAsset      // Converted to asset value
        };
      });
    return openPositions;
  } catch (error) {
    console.error("Error fetching positions:", error.message || error);
    return []; // Return an empty array in case of error
  }
}

acct4_position_data()


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
    // Call the acct4_position_data function to get the data
    const openPositions = await acct4_position_data();

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
module.exports.acct4_position_data = acct4_position_data; // For standalone function




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
