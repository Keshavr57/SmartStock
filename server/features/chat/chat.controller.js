// server/controllers/chat.controller.js
import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'https://smartstock-ai-service.onrender.com';

export const getAIChatResponse = async (req, res) => {
    try {
        const { message, userId } = req.body;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({
                status: "error",
                message: "Please ask a specific question about trading, investing, or market analysis."
            });
        }

        console.log(`💬 AI Query from ${userId}: ${message}`);
        console.log(`🤖 Calling AI service at: ${AI_SERVICE_URL}/process`);
        
        // Call AI service directly - NO FALLBACK
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/process`, {
            message: message,
            user_id: userId
        }, {
            timeout: 30000, // 30 second timeout for AI processing
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log(`✅ AI service response status: ${aiResponse.status}`);
        
        if (aiResponse.data && aiResponse.data.status === 'success' && aiResponse.data.answer) {
            console.log(`✅ AI service responded successfully`);
            return res.status(200).json({
                status: "success",
                answer: aiResponse.data.answer,
                source: "ai_service"
            });
        } else {
            console.error("❌ AI service returned invalid response:", aiResponse.data);
            return res.status(500).json({
                status: "error",
                message: "AI service returned invalid response"
            });
        }

    } catch (error) {
        console.error("❌ Chat Controller Error:", error.message);
        
        // Return error - NO FALLBACK
        return res.status(500).json({
            status: "error",
            message: `AI service connection failed: ${error.message}`,
            error: error.response?.data || error.message
        });
    }
};