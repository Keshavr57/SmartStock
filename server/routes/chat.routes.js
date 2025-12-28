// server/routes/chat.routes.js
import express from 'express';
import { getAIChatResponse } from '../controllers/chat.controller.js';

const router = express.Router();

// This defines the endpoint: POST /api/chat/ai-chat
router.post('/ai-chat', getAIChatResponse);

export default router;