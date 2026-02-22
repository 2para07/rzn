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
    // Verify token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');

    // Check if leader
    if (decoded.role !== 'leader') {
      return res.status(403).json({ success: false, message: 'Leader access required' });
    }

    const { member_id } = req.body;

    if (!member_id) {
      return res.status(400).json({ success: false, message: 'Member ID required' });
    }

    // Prevent leader from deleting themselves
    if (member_id == decoded.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }

    // Get username before deleting
    const userResult = await pool.query('SELECT username FROM users WHERE id = $1', [member_id]);
    const username = userResult.rows[0]?.username || 'Unknown';

    // Delete member
    await pool.query('DELETE FROM users WHERE id = $1', [member_id]);

    // Log activity
    await pool.query(
      'INSERT INTO activity_log (user_id, action, details) VALUES ($1, $2, $3)',
      [decoded.id, 'delete_member', `Deleted member: ${username}`]
    );

    return res.status(200).json({ 
      success: true, 
      message: 'Member deleted successfully' 
    });

  } catch (error) {
    console.error('Delete member error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
}
