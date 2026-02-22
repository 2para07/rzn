import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

// Create database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    // Add RZN. prefix if not present
    let finalUsername = username;
    if (!username.startsWith('RZN.')) {
      finalUsername = 'RZN.' + username;
    }

    // Check if user exists
    const checkUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [finalUsername, email]
    );

    if (checkUser.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username or email already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4)',
      [finalUsername, email, hashedPassword, 'pending']
    );

    return res.status(200).json({ 
      success: true, 
      message: 'Registration successful! Please wait for admin approval.' 
    });

  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
}
