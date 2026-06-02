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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
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

    const role = String(decoded.role || '').toLowerCase();

    // Check if admin or leader
    if (role !== 'admin' && role !== 'leader') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    let query;
    
    // Leader sees all members
    if (role === 'leader') {
      query = `
        SELECT id, username, email, avatar, cover_url, role, created_at, COALESCE(likes, 0) AS likes 
        FROM users 
        ORDER BY 
          CASE LOWER(role) 
            WHEN 'leader' THEN 1 
            WHEN 'admin' THEN 2 
            WHEN 'member' THEN 3 
            WHEN 'pending' THEN 4 
          END, 
          created_at DESC
      `;
    } else {
      // Admin only sees members and pending
      query = `
        SELECT id, username, email, avatar, cover_url, role, created_at 
        FROM users 
        WHERE LOWER(role) IN ('member', 'pending') 
        ORDER BY created_at DESC
      `;
    }

    const result = await pool.query(query);

    return res.status(200).json({ 
      success: true, 
      members: result.rows,
      currentRole: role
    });

  } catch (error) {
    console.error('Get all members error:', error);

    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Authentication required. Please login again.' });
    }

    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
}
