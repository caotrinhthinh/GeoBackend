require('dotenv').config();
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const { apiLimiter } = require('./middleware/rateLimiter');
const requestLogger = require('./middleware/requestLogger');
const { sequelize } = require('./models');
const routes = require('./routes');

const app = express();

// Middlewares
app.use(express.json());
app.use(requestLogger);
app.use(apiLimiter);

// Swagger Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Routes
app.use('/api', routes);

// Global Error Handler
app.use((err, req, res, next) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({ status: 'error', message: err.message });
  }
  
  console.error('UNHANDLED ERROR 💥:', err);
  res.status(500).json({ status: 'error', message: 'Internal server error' });
});

// Start Server & Check DB
const PORT = process.env.PORT || 3000;

sequelize.authenticate()
  .then(() => {
    console.log('✅ PostgreSQL connected via Sequelize.');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📚 Swagger docs available at http://localhost:${PORT}/api/docs`);
    });
  })
  .catch(err => {
    console.error('❌ Unable to connect to the database:', err);
  });
