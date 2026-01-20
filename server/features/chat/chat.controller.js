// server/controllers/chat.controller.js
import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'https://smartstock-ai-service.onrender.com';

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

        // Try AI service first
        try {
            console.log(`🤖 Calling AI service at: ${AI_SERVICE_URL}/process`);
            
            const aiResponse = await axios.post(`${AI_SERVICE_URL}/process`, {
                message: message,
                user_id: userId
            }, {
                timeout: 15000, // 15 second timeout
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (aiResponse.data && aiResponse.data.status === 'success' && aiResponse.data.answer) {
                console.log(`✅ AI service responded successfully`);
                return res.status(200).json({
                    status: "success",
                    answer: aiResponse.data.answer,
                    source: "ai_service"
                });
            }
        } catch (aiError) {
            console.error("AI Service Error:", aiError.message);
            // Fall back to contextual response if AI service fails
        }

        // Fallback to contextual response
        console.log(`🔄 Using fallback response for: ${message}`);
        const fallbackResponse = generateContextualFallback(message);
        
        res.status(200).json({
            status: "success",
            answer: fallbackResponse,
            source: "fallback"
        });

    } catch (error) {
        console.error("Chat Controller Error:", error.message);
        
        res.status(200).json({
            status: "success",
            answer: "I'm here to help! Ask me about stocks, investing, IPOs, or market analysis.",
            source: "error_fallback"
        });
    }
};

function generateContextualFallback(userMessage) {
    const msg = userMessage.toLowerCase();
    
    // Stock-specific questions
    if (msg.includes('reliance') || msg.includes('tcs') || msg.includes('infosys') || msg.includes('hdfc') || msg.includes('sbi') || msg.includes('stock')) {
        const stockName = msg.includes('reliance') ? 'Reliance Industries' :
                         msg.includes('tcs') ? 'TCS' :
                         msg.includes('infosys') ? 'Infosys' :
                         msg.includes('hdfc') ? 'HDFC Bank' :
                         msg.includes('sbi') ? 'SBI' : 'this stock';
        
        return `I can help you analyze ${stockName}. Here's what you should look at:

**Financial Health**: Check their quarterly results and revenue growth. ${stockName} is a well-established company, so look for consistent performance over the past 3-5 years.

**Valuation**: Compare the P/E ratio with industry peers. A lower P/E might indicate good value, but always consider the growth prospects.

**Key Metrics to Watch**:
- Revenue and profit growth trends
- Debt-to-equity ratio (lower is better)
- Return on Equity (ROE) - aim for >15%
- Dividend yield if you're looking for income

**Current Market Context**: Check recent news, quarterly earnings, and analyst ratings. Use the Compare section to see how it stacks up against competitors.

Would you like me to explain any specific metric in detail?`;
    }
    
    // P/E ratio and valuation questions
    if (msg.includes('p/e') || msg.includes('valuation') || msg.includes('overvalued') || msg.includes('undervalued') || msg.includes('price')) {
        return `Great question about valuation! Let me break down P/E ratio simply:

**What is P/E Ratio?**
Price-to-Earnings ratio shows how much you're paying for each rupee of profit. A P/E of 20 means you pay ₹20 for every ₹1 the company earns annually.

**How to Interpret**:
- **High P/E (>25)**: Market expects strong growth, or stock might be overvalued
- **Low P/E (<15)**: Could be undervalued, or company faces challenges
- **Industry Average**: Always compare with similar companies

**Quick Tips**:
1. Compare with competitors in the same sector
2. Check the company's historical P/E range
3. Use PEG ratio (P/E ÷ Growth Rate) for growing companies
4. Look at other metrics too: P/B ratio, EV/EBITDA, Dividend Yield

**Example**: If TCS has P/E of 25 and Infosys has 22, and both have similar growth, Infosys might be better value.

Want me to explain any other valuation metric?`;
    }
    
    // Investment strategy questions
    if (msg.includes('invest') || msg.includes('strategy') || msg.includes('beginner') || msg.includes('start') || msg.includes('how to')) {
        return `Perfect timing to start investing! Here's a simple roadmap:

**Before You Start**:
✓ Emergency fund (6 months expenses)
✓ Health & term insurance
✓ Clear high-interest debts

**Step 1: Set Your Goals**
- Short-term (<3 years): Debt funds, FDs
- Long-term (>5 years): Equity/stocks

**Step 2: Start with Index Funds**
Begin with Nifty 50 or Sensex index funds through SIP. This gives you:
- Instant diversification
- Low fees
- Market-matching returns
- Less stress

**Step 3: Learn & Grow**
As you learn more, gradually add individual stocks. Start with large-cap companies you understand.

**Golden Rules**:
- Invest regularly (SIP) - don't try to time the market
- Diversify across 15-20 stocks minimum
- Never invest borrowed money
- Think long-term (5+ years)
- Don't panic during market falls

**Simple Portfolio for Beginners**:
- 60% Large-cap stocks (stable companies)
- 25% Mid-cap stocks (growth potential)
- 15% Small-cap stocks (higher risk/reward)

Start small, learn continuously, and increase gradually. What specific aspect would you like to explore?`;
    }
    
    // Risk management questions
    if (msg.includes('risk') || msg.includes('loss') || msg.includes('manage') || msg.includes('stop loss') || msg.includes('safe')) {
        return `Risk management is crucial! Here's how to protect your portfolio:

**Rule #1: Position Sizing**
Never put more than 5-10% in a single stock. If you have ₹1 lakh, max ₹5,000-10,000 per stock. This way, even if one stock crashes 50%, you lose only 2.5-5% of your portfolio.

**Rule #2: Stop-Loss**
Set stop-loss at 7-10% below purchase price. Buy at ₹100? Set stop-loss at ₹92. Exit with small loss instead of big disaster.

**Rule #3: Diversification**
Spread across:
- Different sectors (IT, Banking, Pharma, FMCG)
- Different market caps (Large, Mid, Small)
- 15-20 stocks minimum

**Rule #4: Keep Cash Reserve**
Always have 10-20% in cash or liquid funds. This helps you buy during crashes and sleep peacefully during volatility.

**Rule #5: Emotional Discipline**
- Don't check portfolio daily
- Don't panic sell during corrections
- Stick to your plan
- Review quarterly, not daily

**When to Exit**:
✓ Company fundamentals deteriorate
✓ Better opportunities emerge
✓ Your thesis is proven wrong

**Don't Exit Just Because**:
✗ Stock fell 10-20% (normal volatility)
✗ Market is down
✗ Someone gave a negative tip

Remember: You can't eliminate risk, but you can manage it. The goal is ensuring no single loss destroys your portfolio.

Need help with any specific risk strategy?`;
    }
    
    // Market timing questions
    if (msg.includes('when to buy') || msg.includes('when to sell') || msg.includes('timing') || msg.includes('crash') || msg.includes('market down')) {
        return `Here's the truth about market timing:

**The Hard Reality**: Even professionals can't consistently time the market. Studies show 80-90% of fund managers underperform the index over 10 years.

**Why Timing Fails**:
- Markets are unpredictable short-term
- Emotions cloud judgment
- Missing best days kills returns

**The Cost of Missing Best Days**:
₹10 lakhs invested in Nifty 50 (2000-2020):
- Fully invested: ₹45 lakhs
- Missing 10 best days: ₹23 lakhs
- Missing 20 best days: ₹15 lakhs

You can't predict which days will be best, so stay invested!

**Better Strategy: SIP (Systematic Investment)**
Invest fixed amount monthly regardless of market:
- Market high? Buy fewer units
- Market low? Buy more units
- Average cost over time

**When to Actually Buy More**:
- Market corrections (10-15% fall)
- General panic (best time!)
- Company-specific bad news (if temporary)

**When to Sell**:
✓ Fundamentals deteriorate permanently
✓ Better opportunities emerge
✓ Investment thesis proven wrong

**Don't Sell When**:
✗ Market is down (buy more instead!)
✗ Stock fell 10-20% (normal)
✗ Feeling anxious

**Market Crash Strategy**:
1. Don't panic sell
2. Review holdings
3. If fundamentals intact, hold or buy more
4. Use cash reserve to buy quality stocks cheap

Remember: "Time IN the market beats timing THE market"

What specific scenario would you like to discuss?`;
    }
    
    // IPO questions
    if (msg.includes('ipo') || msg.includes('new listing') || msg.includes('should i apply')) {
        return `IPO investing requires careful analysis. Here's what to check:

**Before Applying**:
1. **Company Fundamentals**: Read the DRHP (prospectus). Check revenue growth, profitability, and business model.

2. **Valuation**: Compare P/E with listed peers. Is it fairly priced or overvalued?

3. **Promoter Quality**: Check promoter background and track record.

4. **Use of Funds**: Where will your money go? Expansion (good) or promoter exit (red flag)?

5. **Grey Market Premium**: Indicates demand, but not always accurate.

**Red Flags**:
- Promoters selling large stake
- Unclear business model
- Heavy debt
- Negative cash flows
- Overvaluation vs peers

**Post-Listing Strategy**:
- Listing gains? Consider booking partial profits
- Long-term potential? Hold and monitor
- Set stop-loss at 10-15% below listing price

Check our IPO section for current offerings with detailed analysis!

Which IPO are you interested in?`;
    }
    
    // Default response - short and helpful
    return `I'm here to help with your investing questions!

I can assist you with:
- **Stock Analysis**: Valuation, fundamentals, technical analysis
- **Investment Strategy**: Portfolio building, asset allocation
- **Risk Management**: Stop-loss, diversification, position sizing
- **Market Insights**: When to buy/sell, market trends
- **IPO Analysis**: Should you apply, what to check

**Quick Tips**:
- Start with index funds if you're a beginner
- Use SIP for regular investing
- Diversify across 15-20 stocks
- Think long-term (5+ years)
- Never invest borrowed money

What specific topic would you like to explore? Ask me anything about stocks, investing, or market analysis!`;
}