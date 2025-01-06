const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger'); // Adjust the path if needed
const acct1_balancesRoute = require('./routes/acct1_balances');
const acct1_positionsRoute = require('./routes/acct1_positions');
const acct2_balancesRoute = require('./routes/acct2_balances');
const acct2_positionsRoute = require('./routes/acct2_positions');
const acctX1_balancesRoute = require('./routes/acctX1_balances');
const acctX1_positionsRoute = require('./routes/acctX1_positions');
// const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());

// Serve Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/acct1_balances', acct1_balancesRoute);
app.use('/api/acct1_positions', acct1_positionsRoute);
app.use('/api/acct2_balances', acct2_balancesRoute);
app.use('/api/acct2_positions', acct2_positionsRoute);
app.use('/api/acctX1_balances', acctX1_balancesRoute);
app.use('/api/acctX1_positions', acctX1_positionsRoute);

// Start the HTTP server
const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = acct1_balancesRoute, acct1_positionsRoute, acct2_balancesRoute, acct2_positionsRoute, acctX1_balancesRoute, acctX1_positionsRoute;