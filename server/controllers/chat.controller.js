// server/controllers/chat.controller.js
import axios from 'axios';

export const getAIChatResponse = async (req, res) => {
    try {
        const { message, userId } = req.body;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({
                status: "error",
                answer: "Please ask a specific question about trading, investing, or market analysis."
            });
        }

        console.log(`💬 AI Query from ${userId}: ${message}`);

        // Use the deployed AI service URL
        const aiServiceUrl = process.env.AI_SERVICE_URL || 'https://smartstock-ai-service.onrender.com';
        
        // Add timeout and better error handling
        const response = await axios.post(`${aiServiceUrl}/process`, {
            message: message.trim(),
            user_id: userId || "guest_user"
        }, {
            timeout: 20000, // 20 second timeout
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log(`✅ AI Response received for: ${message.substring(0, 50)}...`);

        // Send the AI's answer back to your frontend
        res.status(200).json(response.data);

    } catch (error) {
        console.error("AI Service Error:", error.message);
        
        // Generate contextual fallback response based on the question
        const message = req.body.message || "";
        const fallbackResponse = generateContextualFallback(message);
        
        res.status(200).json({
            status: "success",
            answer: fallbackResponse
        });
    }
};

function generateContextualFallback(userMessage) {
    const msg = userMessage.toLowerCase();
    
    // Stock analysis questions
    if (msg.includes('p/e') || msg.includes('analyze') || msg.includes('stock')) {
        return `**Stock Analysis Guide:**

To analyze "${userMessage}", consider these key factors:

• **P/E Ratio:** Compare with industry average
• **Revenue Growth:** Look for consistent growth
• **Debt Levels:** Lower debt is generally better
• **Market Position:** Strong competitive advantage

**Quick tip:** Never rely on just one metric. Always look at the complete picture.

📚 Educational analysis - Try asking again for detailed insights.`;
    }
    
    // Investment strategy questions
    if (msg.includes('invest') || msg.includes('strategy') || msg.includes('beginner')) {
        return `**Investment Strategy for: "${userMessage}"**

**Key principles:**
• Start with emergency fund (3-6 months expenses)
• Diversify across different sectors
• Invest regularly, not in lump sum
• Focus on long-term goals (5+ years)

**Beginner-friendly approach:**
• 70% large-cap stocks
• 20% mid-cap stocks  
• 10% bonds or FDs

📚 Educational guidance - Ask specific questions for detailed strategies.`;
    }
    
    // Risk management questions
    if (msg.includes('risk') || msg.includes('loss') || msg.includes('manage')) {
        return `**Risk Management for: "${userMessage}"**

**Essential rules:**
• Never invest more than you can afford to lose
• Set stop-loss at 7-10% below entry price
• Diversify across 15-20 different stocks
• Keep 10-20% cash for opportunities

**Position sizing:** Risk only 1-2% of total portfolio per trade.

📚 Educational risk guidance - Ask for specific risk scenarios.`;
    }
    
    // Default contextual response
    return `**About: "${userMessage}"**

I'm currently experiencing high load but here are key insights:

**General market principles:**
• Research thoroughly before any investment
• Diversification is your best protection
• Time in market beats timing the market
• Education is the best investment

**I can help with:**
• Stock analysis and valuation
• Investment strategies and planning
• Risk management techniques
• Market trends and insights

Try asking a more specific question about any of these topics!

📚 Educational content - Please try again for detailed analysis.`;
}