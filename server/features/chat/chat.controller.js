// server/features/chat/chat.controller.js
import fetch from 'node-fetch';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

console.log('🤖 AI Service URL:', AI_SERVICE_URL);

export const forwardToAIService = async (req, res) => {
  try {
    const { messages, userContext } = req.body;

    console.log('📩 Request to AI service:', {
      url: `${AI_SERVICE_URL}/api/chat`,
      messagesCount: messages?.length,
      userContext
    });

    const response = await fetch(`${AI_SERVICE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages, userContext }),
      timeout: 60000, // 60 second timeout
    });

    console.log('📥 Response from AI service:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ AI service error:', response.status, errorText);
      try {
        const error = JSON.parse(errorText);
        return res.status(response.status).json({ error: error.detail || 'AI service error' });
      } catch {
        return res.status(response.status).json({ error: errorText || 'AI service error' });
      }
    }

    const data = await response.json();
    console.log('✅ AI response:', data.reply?.substring(0, 50) + '...');
    return res.json(data);

  } catch (error) {
    console.error('❌ Chat controller error:', error.message, error.stack);
    return res.status(500).json({
      error: 'Could not reach AI service',
      details: error.message,
      aiServiceUrl: AI_SERVICE_URL
    });
  }
};
