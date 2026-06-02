import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
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
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password are required' 
      });
    }

    // Add RZN. prefix if not present
    let finalUsername = username;
    if (!username.startsWith('RZN.')) {
      finalUsername = 'RZN.' + username;
    }

    // Get user
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [finalUsername]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid username or password' 
      });
    }

    const user = result.rows[0];
    const role = String(user.role || '').toLowerCase();

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid username or password' 
      });
    }

    if (role === 'pending') {
      return res.status(403).json({ 
        success: false, 
        message: 'Your account is pending approval by administrators' 
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role 
      },
      process.env.JWT_SECRET || 'your-secret-key-change-this',
      { expiresIn: '7d' }
    );

    // Log activity
    await pool.query(
      'INSERT INTO activity_log (user_id, action, ip_address) VALUES ($1, $2, $3)',
      [user.id, 'login', req.headers['x-forwarded-for'] || 'unknown']
    );

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role,
        avatar: user.avatar,
        cover_url: user.cover_url,
        facebook_url: user.facebook_url,
        youtube_url: user.youtube_url,
        tiktok_url: user.tiktok_url,
        likes: user.likes || 0
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
}
