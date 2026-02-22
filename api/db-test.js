import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const result = {
    success: false,
    databaseUrl: process.env.DATABASE_URL ? 'Set (hidden)' : 'NOT SET',
    checks: []
  };

  try {
    // Check 1: Database connection
    result.checks.push({ name: 'Database Connection', status: 'Testing...' });
    const connectionTest = await pool.query('SELECT NOW()');
    result.checks.push({ name: 'Database Connection', status: '✅ Connected', details: connectionTest.rows[0] });

    // Check 2: Users table exists
    result.checks.push({ name: 'Users Table', status: 'Testing...' });
    const usersTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'users'
      )
    `);
    result.checks.push({ name: 'Users Table', status: usersTable.rows[0].exists ? '✅ Exists' : '❌ Missing' });

    // Check 3: Activity_log table exists
    result.checks.push({ name: 'Activity Log Table', status: 'Testing...' });
    const activityTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'activity_log'
      )
    `);
    result.checks.push({ name: 'Activity Log Table', status: activityTable.rows[0].exists ? '✅ Exists' : '❌ Missing' });

    // Check 4: Count users
    if (usersTable.rows[0].exists) {
      result.checks.push({ name: 'User Count', status: 'Testing...' });
      const userCount = await pool.query('SELECT COUNT(*) FROM users');
      result.checks.push({ name: 'User Count', status: `✅ ${userCount.rows[0].count} users` });
    }

    result.success = true;

  } catch (error) {
    result.error = error.message;
    result.checks.push({ name: 'Error', status: '❌ ' + error.message });
  }

  return res.status(200).json(result);
}
