const express = require('express');
const cors = require('cors');
const routes = require('./api/routes');
const { errorHandler, notFoundHandler } = require('./api/middlewares/error.middleware');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  console.log('[Health] Backend ping received - server is awake');
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Backend is running'
  });
});

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;


