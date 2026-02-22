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

    // Check if admin or leader
    if (decoded.role !== 'admin' && decoded.role !== 'leader') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { member_id } = req.body;

    if (!member_id) {
      return res.status(400).json({ success: false, message: 'Member ID required' });
    }

    // Update user to member
    await pool.query(`
      UPDATE users 
      SET role = 'member', approved_by = $1, approved_at = NOW() 
      WHERE id = $2
    `, [decoded.id, member_id]);

    // Log activity
    await pool.query(
      'INSERT INTO activity_log (user_id, action, details) VALUES ($1, $2, $3)',
      [decoded.id, 'approve_member', `Approved member ID: ${member_id}`]
    );

    return res.status(200).json({ 
      success: true, 
      message: 'Member approved successfully' 
    });

  } catch (error) {
    console.error('Approve error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
}
