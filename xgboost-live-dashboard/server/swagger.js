// swagger.js
const swaggerJsDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Binance API',
      version: '1.0.0',
      description: 'API documentation for Binance data fetching',
    },
    servers: [
      {
        url: 'http://localhost:3001', // Base URL for your API
      },
    ],
  },
  apis: ['./routes/*.js'], // Adjust the path to include your route files
};

const swaggerSpec = swaggerJsDoc(options);

module.exports = swaggerSpec;
