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

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const result = await pool.query(`
      SELECT id, username, avatar, cover_url, facebook_url, youtube_url, tiktok_url, role, COALESCE(likes, 0) AS likes 
      FROM users 
      WHERE LOWER(role) IN ('leader', 'admin') 
      ORDER BY 
        CASE LOWER(role) 
          WHEN 'leader' THEN 1 
          WHEN 'admin' THEN 2 
        END, 
        id ASC
    `);

    return res.status(200).json({ 
      success: true, 
      leaders: result.rows || [] 
    });

  } catch (error) {
    console.error('Get leaders error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
}
