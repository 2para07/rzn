import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const poolOptions = {
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
};

// Reuse pool instance across serverless invocations
if (!global.__pgPool) {
  global.__pgPool = new Pool(poolOptions);
}

export default global.__pgPool;
