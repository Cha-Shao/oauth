import { config } from 'dotenv';
config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

export const CREDENTIALS = process.env.CREDENTIALS === 'true';
export const ORIGIN = process.env.ORIGIN.split(',');
export const {
  NODE_ENV,
  // PORT
  PORT,
  HOST,
  // DATABASE
  DB_HOST,
  DB_PORT,
  DB_DATABASE,
  // TOKEN
  SECRET_KEY,
  // LOG
  LOG_FORMAT,
  LOG_DIR,
  // MAIL
  MAIL_HOST,
  MAIL_PORT,
  MAIL_SENDER,
  MAIL_PWD,
  MAIL_NAME,
} = process.env;
