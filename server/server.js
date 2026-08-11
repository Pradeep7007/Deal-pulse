import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import apiRoutes from './routes/api.js';
import { initScheduler, stopScheduler } from './services/schedulerService.js';
import { logger } from './utils/logger.js';

// Load environment variables
dotenv.config({ path: path.join(path.resolve(), '../.env') }); // Look in root

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Parse JSON request body
app.use(express.json());

// Set up morgan to stream logs to winston
const morganStream = {
  write: (message) => logger.info(message.trim())
};
app.use(morgan('combined', { stream: morganStream }));

// API Routes
app.use('/api', apiRoutes);

// Serve Static Files in Production
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

// For SPA routing, direct all unmatched paths to client index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Start Server and Database Connection
const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDB();
    
    // 2. Initialize Scheduler (starts cron if enabled in DB settings)
    await initScheduler();
    
    // 3. Listen on port
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
    });
    
    // 4. Graceful Shutdown handlers
    const shutdown = async () => {
      logger.info('Shutting down server gracefully...');
      server.close(async () => {
        logger.info('HTTP server closed.');
        await stopScheduler();
        // Close Mongoose connection
        await mongoose.connection.close();
        logger.info('Database connection closed.');
        process.exit(0);
      });
    };
    
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    
  } catch (error) {
    logger.error(`Critical error starting server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
