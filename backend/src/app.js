const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const env = require('./config/env');
const logger = require('./config/logger');
const { initSocket } = require('./config/socket');
const { registerJobs } = require('./jobs');

const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const { globalLimiter, authLimiter } = require('./middleware/rateLimiter');

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGINS, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(globalLimiter);

// Health
app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// API v1
const v1 = express.Router();
v1.use('/auth', authLimiter, require('./routes/auth'));
v1.use('/users', require('./routes/users'));
v1.use('/players', require('./routes/players'));
v1.use('/squad', require('./routes/squad'));
v1.use('/matches', require('./routes/matches'));
v1.use('/predictions', require('./routes/predictions'));
v1.use('/leaderboard', require('./routes/leaderboard'));
v1.use('/admin', require('./routes/admin'));
app.use('/api/v1', v1);

app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);
initSocket(server);
registerJobs();

if (require.main === module) {
  server.listen(env.PORT, () => {
    logger.info(`Qadsiah backend listening on :${env.PORT} (${env.NODE_ENV})`);
  });
}

process.on('unhandledRejection', (err) => logger.error({ err }, 'unhandledRejection'));
process.on('uncaughtException', (err) => logger.error({ err }, 'uncaughtException'));

module.exports = { app, server };
