#!/bin/bash

# Auto-commit and push changes to GitHub
git add .
git commit -m "Auto: Update code at $(date '+%Y-%m-%d %H:%M:%S')"
git push origin main

echo "✅ Changes pushed to GitHub! Vercel will auto-deploy..."
