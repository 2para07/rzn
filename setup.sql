-- RZN Risen Database Setup Script
-- Run this directly in Supabase SQL Editor

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'member',
  avatar TEXT,
  facebook_url TEXT,
  youtube_url TEXT,
  tiktok_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create activity_log table
CREATE TABLE IF NOT EXISTS activity_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  ip_address VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Insert default admin user
-- Username: RZN.admin
-- Password: admin123
INSERT INTO users (username, email, password, role, created_at, updated_at)
VALUES (
  'RZN.admin',
  'admin@rzn-risen.com',
  '$2a$10$TzxRi87CWomZ9WrYrsQ3h.bltWo68mJc/9njtzJFCOTXZxOCKnHsy',
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (username) DO NOTHING;

-- Verify tables were created
SELECT 'Setup Complete!' as status;

