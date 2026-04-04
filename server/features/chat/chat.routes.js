import express from 'express';
import { authenticateToken } from '../auth/auth.routes.js';
import { forwardToAIService } from './chat.controller.js';

const router = express.Router();

// POST /api/chat/ai-chat — forwards to Python AI service
router.post('/ai-chat', authenticateToken, forwardToAIService);

export default router;
