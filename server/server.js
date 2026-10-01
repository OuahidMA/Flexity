const path = require('node:path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const mongoUri = process.env.MONGO_URI;
const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const exerciseRoutes = require('./routes/exerciseRoutes');
const app = express();

if (!mongoUri) {
  throw new Error('MONGO_URI must be configured in server/.env');
}

let connectionPromise;

function connectToDatabase() {
  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(mongoUri, { serverSelectionTimeoutMS: 10000 })
      .catch((error) => {
        connectionPromise = undefined;
        throw error;
      });
  }
  return connectionPromise;
}

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
  })
);

app.get('/', (_req, res) => {
  res.type('html').send(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Flexboard Backend</title>
  </head>
  <body>
    <p>Flexboard backend server is running...</p>
  </body>
</html>
`);
});

app.use('/api/exercises', async (_req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    error.status = 503;
    next(error);
  }
}, exerciseRoutes);

app.use((error, _req, res, next) => {
  console.error(error);
  if (res.headersSent) {
    next(error);
    return;
  }
  const status = error.status || 500;
  res.status(status).json({
    message: status === 503 ? 'Database unavailable' : 'Server error',
  });
});

if (process.env.NODE_ENV !== 'production') {
  const port = Number(process.env.PORT || 5000);
  connectToDatabase()
    .then(() => {
      app.listen(port, () => {
        console.log(`Server running locally at http://localhost:${port}`);
      });
    })
    .catch((error) => {
      console.error('Unable to start server:', error.message);
      process.exit(1);
    });
}

module.exports = app;
