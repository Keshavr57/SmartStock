import axios from 'axios';
import { LESSONS } from '../data/lessons.js';

const FALLBACK_CONTENT = {
    "intro-stocks": "A stock represents partial ownership in a company. Think of a company as a large Pizza; when you buy a stock, you're essentially buying a 'slice'.\n\n- **Ownership:** You own a piece of the company's assets and earnings.\n- **Dividends:** Some companies share their profits with shareholders.\n- **Risk & Reward:** If the company does well, your slice becomes more valuable. If not, it may lose value.\n\nIn India, stocks are traded on exchanges like the NSE and BSE.",
    "pe-ratio": "The P/E (Price-to-Earnings) ratio tells you how much investors are willing to pay for every ₹1 of profit the company makes.\n\n- **Formula:** Current Stock Price / Earnings Per Share (EPS).\n- **High P/E:** Might mean the stock is overvalued, or investors expect high future growth.\n- **Low P/E:** Could indicate the stock is undervalued, or the company is in trouble.\n\nExample: If a Kirana store makes ₹10,000 profit a year and is selling for ₹1,00,000, its P/E is 10.",
    "ipo-basics": "An IPO (Initial Public Offering) is when a private company sells its shares to the public for the first time to raise capital.\n\n- **Primary Market:** This is where the IPO happens.\n- **Listing:** After the IPO, the stock starts trading on the stock exchange (Secondary Market).\n- **GMP (Grey Market Premium):** An unofficial indicator of the stock's demand before it officially lists.\n\nMany Indian investors look for 'Listing Gains' in popular IPOs."
};

class LearningService {
    // 1. Get all lesson titles for the list view
    getAllModules() {
        return LESSONS.map(({ id, title, difficulty }) => ({ id, title, difficulty }));
    }

    // 2. Get AI-powered explanation for a specific lesson
    async getLessonContent(lessonId) {
        const lesson = LESSONS.find(l => l.id === lessonId);
        if (!lesson) throw new Error("Lesson not found");

        try {
            const response = await axios.post('http://127.0.0.1:8000/process', {
                message: lesson.prompt + " Keep it under 150 words and use bullet points.",
                user_id: "learning_section"
            }, { timeout: 5000 });

            return {
                title: lesson.title,
                content: response.data.answer,
                difficulty: lesson.difficulty
            };
        } catch (error) {
            console.warn("⚠️ AI Service unavailable or rate-limited. Using fallback for:", lessonId);
            return {
                title: lesson.title,
                content: FALLBACK_CONTENT[lessonId] || "Investment knowledge is power. This lesson covers the fundamentals of market dynamics.",
                difficulty: lesson.difficulty,
                is_fallback: true
            };
        }
    }
}
export default new LearningService();