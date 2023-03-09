import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';
config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

export const CREDENTIALS = process.env.CREDENTIALS === 'true';
export const {
  NODE_ENV,
  // PORT
  PORT,
  HOST,
  // DATABASE
  DB_HOST,
  DB_PORT,
  DB_DATABASE,
  DB_USER,
  DB_PASS,
  // TOKEN
  SECRET_KEY,
  // LOG
  LOG_FORMAT,
  LOG_DIR,
  // CORS
  ORIGIN,
  // MAIL
  MAIL_HOST,
  MAIL_PORT,
  MAIL_SENDER,
  MAIL_PWD,
  MAIL_NAME,
} = process.env;
