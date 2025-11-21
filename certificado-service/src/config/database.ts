import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '8371'),
  database: process.env.DB_NAME || 'eventos_db',
  user: process.env.DB_USER || 'eventos_user',
  password: process.env.DB_PASSWORD || 'secret',
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});





