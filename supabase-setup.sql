-- RZN Risen Database Setup with Existing Members
-- PostgreSQL/Supabase Compatible
-- Run this in Supabase SQL Editor

-- Drop tables if they exist (optional, comment out if you want to keep existing data)
-- DROP TABLE IF EXISTS activity_log CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'member',
  avatar TEXT,
  cover_url TEXT,
  facebook_url TEXT,
  youtube_url TEXT,
  tiktok_url TEXT,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Backfill likes on existing user table if missing
ALTER TABLE users ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;

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
CREATE INDEX IF NOT EXISTS idx_activity_user_id ON activity_log(user_id);

-- Insert existing members from your old database
-- Users: J3em (Leader), Neilla (Admin), Wthelly (Admin), A2p (Member)

INSERT INTO users (id, username, email, password, role, avatar, cover_url, facebook_url, youtube_url, tiktok_url, created_at, updated_at)
VALUES
  (1, 'RZN.J3em', 'j3em@rzn.org', '$2y$10$8W69VY4UrOZoMSxeJpoMA.hjgHXp3cZFleptmPGu5Hrgbr/cMO8Re', 'leader', 'https://scontent.fmnl17-5.fna.fbcdn.net/v/t1.15752-9/619584193_1092902789579609_6578067640433061207_n.jpg?_nc_cat=102&ccb=1-7&_nc_sid=9f807c&_nc_ohc=v5CQsnSPDk0Q7kNvwE2jvl0&_nc_oc=AdnCzkWPkQ9QHwmLvZ7OTNVbFQm0t2lbKCOElNya0Vs0GNfzDTqki3vgI53Pczv_umA&_nc_zt=23&_nc_ht=scontent.fmnl17-5.fna&oh=03_Q7cD4QHqa5_ZgEKHV87MMbNJzxXeJqbTLgmQCnCQ4EwFZqdZCQ&oe=69987C57', NULL, NULL, NULL, 'https://www.tiktok.com/@lanceelott.hok?is_from_webapp=1&sender_device=pc', '2026-01-22 23:27:32', '2026-01-23 09:52:37'),
  (2, 'RZN.Neilla', 'neilla@rzn.org', '$2y$10$8W69VY4UrOZoMSxeJpoMA.hjgHXp3cZFleptmPGu5Hrgbr/cMO8Re', 'admin', 'https://scontent.fmnl17-7.fna.fbcdn.net/v/t1.15752-9/598761425_1432042678450263_8767213411664956858_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=9f807c&_nc_ohc=-mor5q-EcDEQ7kNvwECTCa9&_nc_oc=AdlXB3ECYgU2l6O0GNqJ0Bd8u7kZSQTJSuooppm3OnQrNS_znbVPYccF3rm3bldfZSk&_nc_zt=23&_nc_ht=scontent.fmnl17-7.fna&oh=03_Q7cD4QHYBe2I3fELJDtjxZPDrNFIw6c4x1QY8FQ_SomOKJNkew&oe=69987B17', NULL, NULL, NULL, 'https://www.tiktok.com/@its.neilla?is_from_webapp=1&sender_device=pc', '2026-01-22 23:27:32', '2026-01-23 09:41:56'),
  (3, 'RZN.Wthelly', 'wthelly@rzn.org', '$2y$10$8W69VY4UrOZoMSxeJpoMA.hjgHXp3cZFleptmPGu5Hrgbr/cMO8Re', 'admin', 'https://scontent.fmnl17-3.fna.fbcdn.net/v/t1.15752-9/617336174_917828464001012_4117700473544784078_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=9f807c&_nc_ohc=roBaKqPrRq0Q7kNvwFC4Uq3&_nc_oc=AdlzeIA8hfsRxJoNMmcIzHV8IOF2iCDfpoQRvS03hioLD2NjOSjVPzZ3kw7klXaHR-M&_nc_zt=23&_nc_ht=scontent.fmnl17-3.fna&oh=03_Q7cD4QGsCxYeOORLWj7LnRIJzsg8AXh86IPayPgBhKLL5wtJ0g&oe=69987B3F', NULL, NULL, NULL, 'https://www.tiktok.com/@damnpeej?is_from_webapp=1&sender_device=pc', '2026-01-22 23:27:32', '2026-01-23 09:41:56'),
  (10, 'RZN.A2p', 'QWERY123.Org', '$2y$10$iiFRGPr/sFWmLhMK/lLF2OS6hs0r8eaWaf445NlStriqdN8bZmEwy', 'member', 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCANBA0EDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDx', NULL, NULL, NULL, '2026-01-23 12:23:22', '2026-01-23 12:23:56')
ON CONFLICT (username) DO NOTHING;

-- Insert activity log data
INSERT INTO activity_log (id, user_id, action, created_at)
VALUES
  (1, 1, 'login', '2026-01-23 09:42:28'),
  (2, 1, 'approve_member', '2026-01-23 09:42:42'),
  (3, 1, 'logout', '2026-01-23 09:43:16'),
  (7, 1, 'login', '2026-01-23 09:45:46'),
  (8, 1, 'logout', '2026-01-23 09:55:54'),
  (9, 1, 'login', '2026-01-23 09:56:04'),
  (10, 1, 'logout', '2026-01-23 09:56:38'),
  (11, 1, 'login', '2026-01-23 09:57:43'),
  (12, 1, 'logout', '2026-01-23 09:57:50'),
  (16, 1, 'login', '2026-01-23 10:01:47'),
  (17, 1, 'logout', '2026-01-23 10:07:50'),
  (18, 1, 'login', '2026-01-23 10:08:14'),
  (19, 1, 'logout', '2026-01-23 10:08:35'),
  (20, 2, 'login', '2026-01-23 10:09:24'),
  (21, 2, 'logout', '2026-01-23 11:12:20'),
  (22, 1, 'login', '2026-01-23 11:12:34'),
  (23, 1, 'logout', '2026-01-23 11:13:13'),
  (24, 1, 'login', '2026-01-23 11:17:04'),
  (25, 1, 'delete_member', '2026-01-23 11:17:37'),
  (26, 1, 'logout', '2026-01-23 11:17:53'),
  (27, 1, 'login', '2026-01-23 11:23:18'),
  (28, 1, 'approve_member', '2026-01-23 11:24:38'),
  (29, 1, 'logout', '2026-01-23 12:03:24'),
  (30, 1, 'login', '2026-01-23 12:04:06'),
  (31, 1, 'delete_member', '2026-01-23 12:04:17'),
  (32, 1, 'decline_member', '2026-01-23 12:04:22'),
  (33, 1, 'logout', '2026-01-23 12:22:58'),
  (34, 1, 'login', '2026-01-23 12:23:33'),
  (35, 1, 'approve_member', '2026-01-23 12:23:37'),
  (36, 1, 'logout', '2026-01-23 12:23:40'),
  (37, 10, 'login', '2026-01-23 12:23:47'),
  (38, 10, 'update_profile', '2026-01-23 12:23:56'),
  (39, 10, 'logout', '2026-01-23 12:24:18'),
  (40, 1, 'login', '2026-01-23 12:24:25'),
  (41, 1, 'logout', '2026-01-23 12:24:51'),
  (42, 2, 'login', '2026-01-23 12:24:57'),
  (43, 2, 'logout', '2026-01-23 12:25:04')
ON CONFLICT (id) DO NOTHING;

-- Normalize role values to lowercase so the front-end and API filters match correctly
UPDATE users
SET role = LOWER(role)
WHERE role != LOWER(role);

-- Verify data was inserted
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as activity_count FROM activity_log;
SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY role;
SELECT 'Setup Complete with all existing members!' as status;
