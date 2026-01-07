// server/routes/chat.routes.js
import express from 'express';
import { getAIChatResponse } from '../controllers/chat.controller.js';
import { authenticateToken } from './authRoutes.js';

const router = express.Router();

// This defines the endpoint: POST /api/chat/ai-chat (with authentication)
router.post('/ai-chat', authenticateToken, getAIChatResponse);

export default router;