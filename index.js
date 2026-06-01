import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(join(dirname(fileURLToPath(import.meta.url)), 'public')));

// Import route handlers
import loginHandler from './login.js';
import registerHandler from './register.js';
import getMembersHandler from './getMembers.js';
import getLeadersHandler from './getLeaders.js';
import getPendingHandler from './getPending.js';
import getAllMembersHandler from './getAllMembers.js';
import approveHandler from './approve.js';
import declineHandler from './decline.js';
import deleteMemberHandler from './deleteMember.js';
import updateProfileHandler from './updateProfile.js';
import likeMemberHandler from './likeMember.js';
import dbTestHandler from './api/db-test.js';

// API Routes
app.post('/api/login', loginHandler);
app.post('/api/register', registerHandler);
app.get('/api/getMembers', getMembersHandler);
app.get('/api/getLeaders', getLeadersHandler);
app.get('/api/getPending', getPendingHandler);
app.get('/api/getAllMembers', getAllMembersHandler);
app.post('/api/approve', approveHandler);
app.post('/api/decline', declineHandler);
app.post('/api/deleteMember', deleteMemberHandler);
app.post('/api/updateProfile', updateProfileHandler);
app.post('/api/likeMember', likeMemberHandler);
app.get('/api/db-test', dbTestHandler);

// Serve index.html
app.get('*', (req, res) => {
  res.sendFile(join(dirname(fileURLToPath(import.meta.url)), 'public', 'index.html'));
});

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 RZN Risen server running on http://localhost:${PORT}`);
  });
}

export default app;
