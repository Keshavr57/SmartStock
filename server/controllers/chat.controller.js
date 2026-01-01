// server/controllers/chat.controller.js
import axios from 'axios';

export const getAIChatResponse = async (req, res) => {
    try {
        const { message, userId } = req.body;

        // Use the deployed AI service URL
        const aiServiceUrl = process.env.AI_SERVICE_URL || 'https://smartstock-ai-service.onrender.com';
        const response = await axios.post(`${aiServiceUrl}/process`, {
            message: message,
            user_id: userId || "guest_user" // fallback if userId is missing
        });

        // Send the AI's answer back to your frontend
        res.status(200).json(response.data);

    } catch (error) {
        console.error("Error communicating with FastAPI:", error.message);
        res.status(500).json({
            success: false,
            error: "AI Service is currently unreachable. Make sure FastAPI is running on port 8000."
        });
    }
};