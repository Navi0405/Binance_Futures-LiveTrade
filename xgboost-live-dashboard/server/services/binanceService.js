// services/binanceService.js
const Binance = require('binance-api-node').default;

// Initialize Binance client
const client = Binance({
  apiKey: process.env.acct2_key,
  apiSecret: process.env.acct2_secret,
});

// Function to get total wallet balance
async function getTotalWalletBalance() {
  try {
    const accountInfo = await client.accountInfo();
    let totalBalance = accountInfo.balances.reduce((total, asset) => {
      return total + parseFloat(asset.free) + parseFloat(asset.locked);
    }, 0);
    return totalBalance;
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    throw new Error('Failed to fetch wallet balance');
  }
}

// Function to get open positions
async function getPositions() {
  try {
    const positions = await client.futuresPositionRisk();
    return positions
      .filter(position => parseFloat(position.positionAmt) !== 0)
      .map(position => ({
        symbol: position.symbol,
        positionAmt: position.positionAmt,
        entryPrice: position.entryPrice,
        markPrice: position.markPrice,
        pnl: position.unRealizedProfit,
        leverage: position.leverage,
        roiPercentage: ((parseFloat(position.unRealizedProfit) / (parseFloat(position.entryPrice) * parseFloat(position.positionAmt))) * 100).toFixed(2),
      }));
  } catch (error) {
    console.error('Error fetching positions:', error);
    throw new Error('Failed to fetch positions');
  }
}

module.exports = {
  getTotalWalletBalance,
  getPositions,
};
