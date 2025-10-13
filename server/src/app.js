const express = require('express');
const cors = require('cors');
const routes = require('./api/routes');
const { errorHandler, notFoundHandler } = require('./api/middlewares/error.middleware');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;


