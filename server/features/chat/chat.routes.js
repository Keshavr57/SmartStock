import express from 'express';
import { authenticateToken } from '../auth/auth.routes.js';
import { forwardToAIService } from './chat.controller.js';

const router = express.Router();

// POST /api/chat/ai-chat — forwards to Python AI service
// No auth required - allow anonymous users to use AI advisor
router.post('/ai-chat', forwardToAIService);

// POST /api/chat/ai-chat/protected — requires authentication (for future use)
router.post('/ai-chat/protected', authenticateToken, forwardToAIService);

export default router;
