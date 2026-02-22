import pg from 'pg';
import jwt from 'jsonwebtoken';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Verify token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');

    const { avatar, facebook_url, youtube_url, tiktok_url } = req.body;

    // Update profile
    await pool.query(`
      UPDATE users 
      SET avatar = $1, facebook_url = $2, youtube_url = $3, tiktok_url = $4, updated_at = NOW()
      WHERE id = $5
    `, [avatar, facebook_url, youtube_url, tiktok_url, decoded.id]);

    // Log activity
    await pool.query(
      'INSERT INTO activity_log (user_id, action) VALUES ($1, $2)',
      [decoded.id, 'update_profile']
    );

    return res.status(200).json({ 
      success: true, 
      message: 'Profile updated successfully' 
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
}
