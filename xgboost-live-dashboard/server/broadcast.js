const express = require('express');
const WebSocket = require('ws');

const app = express();
const PORT = 8080;

// WebSocket server initialization
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');

  const accounts = [
    { name: 'acct1', balanceFn: require('./routes/acct1_balances').acct1_balance_data, positionFn: require('./routes/acct1_positions').acct1_position_data },
    { name: 'acct2', balanceFn: require('./routes/acct2_balances').acct2_balance_data, positionFn: require('./routes/acct2_positions').acct2_position_data },
    { name: 'acct4', balanceFn: require('./routes/acctX1_balances').acct4_balance_data, positionFn: require('./routes/acctX1_positions').acct4_position_data },
    { name: 'acct', balanceFn: require('./routes/acctX4_balances').acct_balance_data, positionFn: require('./routes/acctX4_positions').acct_position_data },
    { name: 'acct', balanceFn: require('./routes/acctX5_balances').acct_balance_data, positionFn: require('./routes/acctX5_positions').acct_position_data },
  ];

  const balanceIntervals = [];
  const positionIntervals = [];

  // Set intervals for fetching data
  accounts.forEach(({ name, balanceFn, positionFn }) => {
    // Balance data
    const balanceInterval = setInterval(async () => {
      try {
        const { available, marginalBalance, totalWalletBalance, totalUnrealizedPnL, returnValue } = await balanceFn();
        ws.send(
          JSON.stringify({
            account: name,
            available,
            marginalBalance,
            totalWalletBalance,
            totalUnrealizedPnL,
            returnValue,
          })
        );
      } catch (error) {
        ws.send(JSON.stringify({ account: name, error: error.message }));
      }
    }, 5000);
    balanceIntervals.push(balanceInterval);

    // Position data
    const positionInterval = setInterval(async () => {
      try {
        const openPositions = await positionFn();
        ws.send(
          JSON.stringify({
            account: name,
            type: 'positions',
            positions: openPositions,
          })
        );
      } catch (error) {
        ws.send(JSON.stringify({ account: name, error: error.message }));
      }
    }, 5000);
    positionIntervals.push(positionInterval);
  });

  // Clean up on client disconnect
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    balanceIntervals.forEach(clearInterval);
    positionIntervals.forEach(clearInterval);
  });
});
