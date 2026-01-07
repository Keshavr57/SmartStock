// server/controllers/chat.controller.js
import axios from 'axios';

export const getAIChatResponse = async (req, res) => {
    try {
        const { message, userId } = req.body;

        // Use the deployed AI service URL
        const aiServiceUrl = process.env.AI_SERVICE_URL || 'https://smartstock-ai-service.onrender.com';
        
        // Add timeout and faster response
        const response = await axios.post(`${aiServiceUrl}/process`, {
            message: message,
            user_id: userId || "guest_user"
        }, {
            timeout: 15000, // 15 second timeout
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Send the AI's answer back to your frontend
        res.status(200).json(response.data);

    } catch (error) {
        console.error("AI Service Error:", error.message);
        
        // Provide a quick fallback response instead of error
        const fallbackResponse = {
            status: "success",
            answer: `Quick Market Insight: ${req.body.message}

I'm currently experiencing high load. Here's a quick educational note:

**Key Market Principles:**
• Research before investing
• Diversification reduces risk
• Market timing is challenging
• Focus on long-term goals

**Professional Tip:** The best investment strategy is education. Consider learning fundamental analysis to evaluate stocks independently.

📚 Educational content - Try asking again in a moment for detailed analysis.`
        };
        
        res.status(200).json(fallbackResponse);
    }
};