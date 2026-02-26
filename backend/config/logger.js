const winston = require('winston');
const path = require('path');
const config = require('./config');

const logsDir = path.join(__dirname, '../logs');

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.printf((info) => {
        const { timestamp, level, message, ...args } = info;
        return `[${timestamp}] ${level}: ${message} ${Object.keys(args).length ? JSON.stringify(args, null, 2) : ''}`;
      })
    )
  }),
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    format
  }),
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    format
  })
];

const logger = winston.createLogger({
  level: config.logging.level || 'info',
  levels,
  format,
  transports
});

module.exports = logger;
