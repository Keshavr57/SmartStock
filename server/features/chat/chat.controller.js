// server/features/chat/chat.controller.js
import fetch from 'node-fetch';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const forwardToAIService = async (req, res) => {
  try {
    const { messages, userContext } = req.body;

    const response = await fetch(`${AI_SERVICE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, userContext }),
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({ error: error.detail || 'AI service error' });
    }

    const data = await response.json();
    return res.json(data);

  } catch (error) {
    console.error('Chat controller error:', error);
    return res.status(500).json({ error: 'Could not reach AI service' });
  }
};
