import pg from 'pg';
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');

    const { member_id } = req.body;
    if (!member_id) {
      return res.status(400).json({ success: false, message: 'Member ID is required' });
    }

    const memberResult = await pool.query('SELECT id, likes FROM users WHERE id = $1', [member_id]);
    if (memberResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    const { likes } = memberResult.rows[0];
    const updatedLikes = (likes || 0) + 1;

    await pool.query('UPDATE users SET likes = $1 WHERE id = $2', [updatedLikes, member_id]);
    await pool.query(
      'INSERT INTO activity_log (user_id, action, ip_address) VALUES ($1, $2, $3)',
      [decoded.id, `like_member_${member_id}`, req.headers['x-forwarded-for'] || 'unknown']
    );

    return res.status(200).json({
      success: true,
      message: 'Member liked successfully',
      member_id,
      likes: updatedLikes
    });
  } catch (error) {
    console.error('Like member error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}
