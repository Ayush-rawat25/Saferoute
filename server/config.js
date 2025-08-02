require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI ,
  openRouteApiKey: process.env.OPENROUTE_API_KEY,
  nodeEnv: process.env.NODE_ENV || 'development'
}; 