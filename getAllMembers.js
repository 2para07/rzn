import jwt from 'jsonwebtoken';
import pool from './db.js';

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

    // Check if admin or leader
    if (decoded.role !== 'admin' && decoded.role !== 'leader') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    let query;
    
    // Leader sees all members
    if (decoded.role === 'leader') {
      query = `
        SELECT id, username, email, role, created_at 
        FROM users 
        ORDER BY 
          CASE role 
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
        SELECT id, username, email, role, created_at 
        FROM users 
        WHERE role IN ('member', 'pending') 
        ORDER BY created_at DESC
      `;
    }

    const result = await pool.query(query);

    return res.status(200).json({ 
      success: true, 
      members: result.rows,
      currentRole: decoded.role
    });

  } catch (error) {
    console.error('Get all members error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
}
