require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { initMailer, verifyTransporter } = require('./lib/mailer');
const { initFirestore } = require('./lib/firestore');
const reportsRouter = require('./routes/reports');

const app = express();  // ✅ sabse pehle initialize karo
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(helmet());
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' ? process.env.CORS_ORIGIN : '*',
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' }));
app.use(morgan('dev'));

// --- Rate Limiting ---
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', apiLimiter);

// --- Routes ---
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
app.use('/api/reports', reportsRouter);  // ✅ ab safe hai (app initialized)

// --- 404 Handler ---
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found' });
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// --- Server Initialization ---
const startServer = async () => {
  try {
    initMailer();
    await verifyTransporter();
    initFirestore();

    const server = app.listen(PORT, () => {
      console.log(`✅ Server listening on port ${PORT}`);
    });

    const gracefulShutdown = (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(() => {
        console.log('✅ Server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
