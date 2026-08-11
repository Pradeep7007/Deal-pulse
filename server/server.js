// Main entry point for Microsoft Rewards Gift Card Availability Notifier

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB } from './config/db.js';
import apiRoutes from './routes/api.js';
import {
  initScheduler,
  stopScheduler,
} from './services/schedulerService.js';
import { logger } from './utils/logger.js';

// --------------------------------------------------
// Environment variables
// --------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// server/.env or project-root .env
dotenv.config({
  path: path.resolve(__dirname, '../.env'),
});

const app = express();

const PORT = Number(process.env.PORT) || 5000;

// --------------------------------------------------
// Middleware
// --------------------------------------------------

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Morgan → Winston
const morganStream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

app.use(
  morgan('combined', {
    stream: morganStream,
  })
);

// --------------------------------------------------
// Health check
// --------------------------------------------------

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Rewards server is running',
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// --------------------------------------------------
// API routes
// --------------------------------------------------

app.use('/api', apiRoutes);

// --------------------------------------------------
// Production static files
// --------------------------------------------------

const clientDistPath = path.resolve(__dirname, '../client/dist');

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(clientDistPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// --------------------------------------------------
// 404 handler for API routes
// --------------------------------------------------

app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`,
  });
});

// --------------------------------------------------
// Global error handler
// --------------------------------------------------

app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.stack || err.message}`);

  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
  });
});

// --------------------------------------------------
// Start server
// --------------------------------------------------

let server;

const startServer = async () => {
  try {
    logger.info('Starting Rewards server...');

    // Connect to MongoDB
    await connectDB();
    logger.info('Database connection established.');

    // Start scheduler
    try {
      await initScheduler();
      logger.info('Scheduler initialized.');
    } catch (schedulerError) {
      logger.error(
        `Scheduler initialization failed: ${schedulerError.message}`
      );

      // Don't prevent the API server from starting
      logger.warn(
        'Server will continue running without the scheduler.'
      );
    }

    // IMPORTANT:
    // Start HTTP server even if scheduler initialization fails
    server = app.listen(PORT, () => {
      logger.info(
        `Server running on http://localhost:${PORT} in ${
          process.env.NODE_ENV || 'development'
        } mode.`
      );
    });
  } catch (error) {
    logger.error(
      `Critical error starting server: ${error.stack || error.message}`
    );

    process.exit(1);
  }
};

// --------------------------------------------------
// Graceful shutdown
// --------------------------------------------------

const shutdown = async (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);

  try {
    if (server) {
      await new Promise((resolve) => {
        server.close(() => {
          logger.info('HTTP server closed.');
          resolve();
        });
      });
    }

    try {
      await stopScheduler();
      logger.info('Scheduler stopped.');
    } catch (error) {
      logger.error(
        `Error stopping scheduler: ${error.message}`
      );
    }

    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      logger.info('Database connection closed.');
    }

    process.exit(0);
  } catch (error) {
    logger.error(
      `Error during shutdown: ${error.message}`
    );

    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// --------------------------------------------------
// Start application
// --------------------------------------------------

startServer();