const Joi = require('joi');
require('dotenv').config();

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
    PORT: Joi.number().default(5000),
    DB_HOST: Joi.string().required().description('Database host'),
    DB_PORT: Joi.number().default(3306).description('Database port'),
    DB_USER: Joi.string().required().description('Database user'),
    DB_PASSWORD: Joi.string().required().description('Database password'),
    DB_NAME: Joi.string().required().description('Database name'),
    JWT_SECRET: Joi.string().required().description('JWT secret key'),
    JWT_EXPIRE: Joi.string().default('30d'),
    JWT_COOKIE_EXPIRE: Joi.number().default(30),
    FRONTEND_URL: Joi.string().uri().default('http://localhost:3000'),
    EMAIL_SERVICE: Joi.string().default('gmail'),
    CORS_ORIGIN: Joi.string().default('*'),
    LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
    RATE_LIMIT_WINDOW_MS: Joi.number().default(15 * 60 * 1000),
    RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
    RATE_LIMIT_AUTH_MAX: Joi.number().default(5),
    EMAIL_USER: Joi.string().default('noreply@quizzy.local').description('Email service user'),
    EMAIL_PASSWORD: Joi.string().default('dummy-password').description('Email service password')
  })
  .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  database: {
    host: envVars.DB_HOST,
    port: envVars.DB_PORT,
    user: envVars.DB_USER,
    password: envVars.DB_PASSWORD,
    name: envVars.DB_NAME
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    expiresIn: envVars.JWT_EXPIRE,
    cookieExpiresIn: envVars.JWT_COOKIE_EXPIRE
  },
  frontend: {
    url: envVars.FRONTEND_URL
  },
  email: {
    service: envVars.EMAIL_SERVICE,
    user: envVars.EMAIL_USER,
    password: envVars.EMAIL_PASSWORD
  },
  cors: {
    origin: envVars.CORS_ORIGIN
  },
  logging: {
    level: envVars.LOG_LEVEL
  },
  rateLimit: {
    windowMs: envVars.RATE_LIMIT_WINDOW_MS,
    maxRequests: envVars.RATE_LIMIT_MAX_REQUESTS,
    authMax: envVars.RATE_LIMIT_AUTH_MAX
  }
};
