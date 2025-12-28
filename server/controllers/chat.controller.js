// server/controllers/chat.controller.js
import axios from 'axios';

export const getAIChatResponse = async (req, res) => {
    try {
        const { message, userId } = req.body;

        // Use the IP/URL where your FastAPI is running. 
        // Since both are on your laptop, localhost:8000 is correct.
        const response = await axios.post('http://localhost:8000/process', {
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