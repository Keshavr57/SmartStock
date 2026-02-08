import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'https://smartstock-ai-service.onrender.com';

export const getAIChatResponse = async (req, res) => {
    try {
        const { message, userId } = req.body;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({
                status: "error",
                message: "Please ask a question about trading, investing, or market analysis."
            });
        }

        console.log(`💬 AI Query from ${userId}: ${message.substring(0, 50)}...`);
        console.log(`🤖 AI Service URL: ${AI_SERVICE_URL}`);
        
        // Call AI service with proper timeout and error handling
        const aiResponse = await axios.post(
            `${AI_SERVICE_URL}/process`,
            {
                message: message.trim(),
                user_id: userId || 'anonymous'
            },
            {
                timeout: 45000, // 45 seconds for AI processing
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log(`✅ AI Response Status: ${aiResponse.status}`);
        
        if (aiResponse.data && aiResponse.data.status === 'success' && aiResponse.data.answer) {
            return res.status(200).json({
                status: "success",
                answer: aiResponse.data.answer
            });
        } else {
            console.error("❌ Invalid AI response:", aiResponse.data);
            return res.status(500).json({
                status: "error",
                message: "AI service returned invalid response. Please try again."
            });
        }

    } catch (error) {
        console.error("❌ Chat Controller Error:", error.message);
        
        // Specific error messages
        let errorMessage = "AI service is temporarily unavailable. Please try again in a moment.";
        
        if (error.code === 'ECONNABORTED') {
            errorMessage = "Request timeout. The AI service is taking too long to respond.";
        } else if (error.code === 'ECONNREFUSED') {
            errorMessage = "Cannot connect to AI service. It may be starting up.";
        } else if (error.response) {
            errorMessage = `AI service error: ${error.response.data?.detail || error.response.statusText}`;
        }
        
        return res.status(503).json({
            status: "error",
            message: errorMessage
        });
    }
};
