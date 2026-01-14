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
    
    // Stock-specific questions
    if (msg.includes('reliance') || msg.includes('tcs') || msg.includes('infosys') || msg.includes('hdfc')) {
        const stockName = msg.includes('reliance') ? 'Reliance Industries' :
                         msg.includes('tcs') ? 'TCS' :
                         msg.includes('infosys') ? 'Infosys' :
                         msg.includes('hdfc') ? 'HDFC Bank' : 'this stock';
        
        return `I'd be happy to help you understand ${stockName} better.

${stockName} is one of India's leading companies with a strong market presence. When evaluating any stock, I recommend looking at several key factors:

First, examine the company's financial health. Look at their revenue growth over the past 3-5 years. Consistent growth is a positive sign. Check their profit margins - are they improving or declining? This tells you about operational efficiency.

Second, consider the valuation. The P/E ratio (Price to Earnings) helps you understand if the stock is fairly priced compared to its earnings. Compare it with industry peers. A lower P/E might indicate undervaluation, but context matters.

Third, analyze the business fundamentals. What's their competitive advantage? Do they have a strong moat? How's the management quality? These qualitative factors are just as important as numbers.

For ${stockName} specifically, I'd suggest:
- Review their latest quarterly results
- Check analyst ratings and target prices
- Understand their growth strategy
- Look at their debt-to-equity ratio
- Monitor industry trends affecting them

Remember, investing is a long-term game. Don't make decisions based on short-term price movements. Do your research, understand what you're buying, and invest only what you can afford to lose.

Would you like me to explain any specific aspect of stock analysis in more detail?`;
    }
    
    // P/E ratio and valuation questions
    if (msg.includes('p/e') || msg.includes('valuation') || msg.includes('overvalued') || msg.includes('undervalued')) {
        return `Great question about valuation! Let me explain P/E ratio and how to use it effectively.

The Price-to-Earnings (P/E) ratio is one of the most commonly used valuation metrics. It tells you how much investors are willing to pay for each rupee of earnings. Here's how to interpret it:

Understanding P/E Ratio:
A P/E ratio of 20 means investors are paying ₹20 for every ₹1 of annual earnings. But is that good or bad? It depends on context.

High P/E (above 25-30):
- Could indicate the stock is overvalued
- Or investors expect high future growth
- Common in tech and growth stocks
- Example: Many IT companies trade at high P/E because of growth expectations

Low P/E (below 15):
- Might suggest undervaluation
- Or the company faces challenges
- Common in mature, slow-growth industries
- Could be a value opportunity or a value trap

How to use P/E effectively:
1. Compare with industry average - A bank's P/E should be compared with other banks, not with IT companies
2. Look at historical P/E - Is the current P/E higher or lower than the company's 5-year average?
3. Consider growth rate - Use PEG ratio (P/E divided by growth rate) for growing companies
4. Check earnings quality - Are earnings sustainable or one-time gains?

Other important valuation metrics:
- Price-to-Book (P/B) ratio - Good for asset-heavy companies
- Price-to-Sales (P/S) ratio - Useful for loss-making but growing companies
- EV/EBITDA - Better for comparing companies with different debt levels
- Dividend Yield - Important for income investors

Remember: No single metric tells the complete story. Always use multiple metrics together and understand the business context.

Would you like me to explain any other valuation metric in detail?`;
    }
    
    // Investment strategy questions
    if (msg.includes('invest') || msg.includes('strategy') || msg.includes('beginner') || msg.includes('start')) {
        return `I'm glad you're thinking about investing! Let me share a comprehensive strategy that works for most beginners.

Step 1: Build Your Foundation
Before investing in stocks, ensure you have:
- Emergency fund covering 6 months of expenses
- Health and term insurance
- No high-interest debt (credit cards, personal loans)

Step 2: Understand Your Goals
Ask yourself:
- What's your investment timeline? (Short-term: <3 years, Long-term: >5 years)
- What's your risk tolerance? (Conservative, Moderate, Aggressive)
- What are you investing for? (Retirement, house, child's education)

Step 3: Asset Allocation
This is crucial. Here's a simple framework:

For Beginners (Conservative):
- 60% Large-cap stocks (stable, established companies)
- 20% Mid-cap stocks (moderate growth potential)
- 10% Small-cap stocks (higher risk, higher reward)
- 10% Debt funds or FDs (stability)

For Moderate Risk-takers:
- 50% Large-cap stocks
- 30% Mid-cap stocks
- 15% Small-cap stocks
- 5% Debt instruments

For Aggressive Investors:
- 40% Large-cap stocks
- 35% Mid-cap stocks
- 25% Small-cap stocks

Step 4: Investment Approach
Choose between:

Active Investing:
- Research and pick individual stocks
- Requires time and knowledge
- Potentially higher returns
- Higher risk

Passive Investing:
- Invest in index funds or ETFs
- Less time-consuming
- Lower fees
- Market-matching returns

I recommend starting with passive investing through index funds, then gradually learning about individual stocks.

Step 5: Systematic Investment
- Use SIP (Systematic Investment Plan) approach
- Invest fixed amount monthly, regardless of market conditions
- This averages out your purchase price
- Removes emotion from investing

Step 6: Diversification Rules
- Don't put all money in one stock
- Aim for 15-20 different stocks across sectors
- Include different market caps
- Consider different industries

Step 7: Regular Review
- Review portfolio quarterly
- Rebalance if needed
- Don't panic during market falls
- Stay invested for long term

Common Mistakes to Avoid:
- Trying to time the market
- Following tips blindly
- Investing borrowed money
- Panic selling during corrections
- Not doing research
- Over-diversification (too many stocks)

Remember: Investing is a marathon, not a sprint. Start small, learn continuously, and gradually increase your investments as you gain confidence.

What specific aspect of investing would you like to explore further?`;
    }
    
    // Risk management questions
    if (msg.includes('risk') || msg.includes('loss') || msg.includes('manage') || msg.includes('stop loss')) {
        return `Excellent question! Risk management is what separates successful investors from gamblers. Let me explain comprehensive risk management strategies.

Understanding Risk:
Risk in investing isn't just about losing money. It's about uncertainty. Even a "safe" investment has risks - inflation risk, opportunity cost, etc.

Types of Investment Risks:
1. Market Risk - Overall market decline
2. Company-specific Risk - Individual company problems
3. Liquidity Risk - Difficulty selling when needed
4. Inflation Risk - Returns not beating inflation
5. Currency Risk - For international investments

Risk Management Strategies:

1. Position Sizing (Most Important!)
Never invest more than 5-10% of your portfolio in a single stock. If you have ₹1 lakh, don't put more than ₹5,000-10,000 in one stock.

Why? If that stock falls 50%, you lose only 2.5-5% of total portfolio, not 50%.

2. Stop-Loss Orders
Set a stop-loss at 7-10% below your purchase price. If stock falls to that level, sell automatically.

Example: Buy at ₹100, set stop-loss at ₹92. If it falls to ₹92, you exit with 8% loss instead of potentially 30-40% loss.

3. Diversification
The only free lunch in investing! Spread investments across:
- Different sectors (IT, Banking, Pharma, FMCG, etc.)
- Different market caps (Large, Mid, Small)
- Different asset classes (Stocks, Bonds, Gold)

Aim for 15-20 stocks minimum. More than 30 becomes hard to track.

4. Asset Allocation
Don't put everything in stocks. A balanced portfolio might be:
- 70% Stocks
- 20% Bonds/Debt funds
- 10% Gold/Cash

Adjust based on age: (100 - your age) = % in stocks

5. Regular Portfolio Review
- Review quarterly, not daily
- Rebalance if any stock becomes >15% of portfolio
- Cut losses on fundamentally weak stocks
- Let winners run (don't sell just because it went up)

6. Emergency Cash Reserve
Always keep 10-20% of portfolio in cash or liquid funds. This helps you:
- Buy during market crashes
- Handle emergencies without selling stocks at loss
- Sleep peacefully during volatility

7. Avoid Leverage
Never invest borrowed money in stocks. The pressure to repay can force you to sell at the worst time.

8. Emotional Discipline
- Don't check portfolio daily
- Ignore short-term noise
- Have a plan and stick to it
- Don't panic sell during corrections
- Don't get greedy during rallies

9. Hedging Strategies (Advanced)
- Use put options to protect downside
- Invest in negatively correlated assets
- Consider inverse ETFs during uncertain times

10. Know When to Exit
Exit if:
- Company fundamentals deteriorate
- Better opportunities emerge
- Stock reaches your target price
- Your investment thesis is proven wrong

Don't exit just because:
- Stock fell 10-20% (normal volatility)
- Market is down
- Someone gave a negative tip

Real-World Example:
Portfolio: ₹5 lakhs
- Stock A: ₹25,000 (5%) - Stop-loss at ₹22,500
- Stock B: ₹25,000 (5%) - Stop-loss at ₹22,500
- ... (15 more stocks)
- Cash: ₹50,000 (10%)

If Stock A hits stop-loss, you lose ₹2,500 (0.5% of portfolio). Manageable!

Remember: You can't eliminate risk, but you can manage it. The goal isn't to avoid all losses - that's impossible. The goal is to ensure no single loss destroys your portfolio.

Would you like me to explain any specific risk management technique in more detail?`;
    }
    
    // Market timing questions
    if (msg.includes('when to buy') || msg.includes('when to sell') || msg.includes('timing') || msg.includes('crash')) {
        return `This is one of the most common questions, and I'm glad you asked! Let me share some insights about market timing.

The Hard Truth About Market Timing:
Even professional fund managers with teams of analysts can't consistently time the market. Studies show that 80-90% of active fund managers underperform the index over 10 years.

Why Timing is Difficult:
1. Markets are unpredictable in short term
2. Emotions cloud judgment
3. News is often already priced in
4. Missing best days hurts returns significantly

The Cost of Missing Best Days:
If you invested ₹10 lakhs in Nifty 50 from 2000-2020:
- Staying fully invested: ₹45 lakhs
- Missing 10 best days: ₹23 lakhs
- Missing 20 best days: ₹15 lakhs
- Missing 30 best days: ₹10 lakhs

You can't predict which days will be best, so stay invested!

Better Approach: Time IN the Market
Instead of timing the market, focus on time in the market. Here's how:

1. Systematic Investment (SIP)
Invest fixed amount monthly regardless of market level:
- Market high? You buy fewer units
- Market low? You buy more units
- Average cost over time (Rupee Cost Averaging)

Example:
Month 1: Market at 18,000 - Invest ₹10,000 - Get 0.55 units
Month 2: Market at 17,000 - Invest ₹10,000 - Get 0.58 units
Month 3: Market at 19,000 - Invest ₹10,000 - Get 0.52 units
Average cost: ₹18,000 (better than buying all at 19,000!)

2. Value Averaging
Invest more when markets fall, less when they rise:
- Market down 10%? Invest extra
- Market up 10%? Invest less or skip
- Requires discipline and cash reserve

3. Lump Sum + SIP Hybrid
Have ₹5 lakhs to invest?
- Invest ₹1 lakh immediately
- SIP remaining ₹4 lakhs over 8 months
- Balances immediate exposure with averaging

When to Actually Buy More:
Look for these opportunities:
- Market corrections (10-15% fall)
- Sector-specific crashes (if fundamentals intact)
- Company-specific bad news (if temporary)
- General panic (best time!)

Warren Buffett: "Be fearful when others are greedy, greedy when others are fearful"

When to Consider Selling:
Sell when:
- Company fundamentals deteriorate permanently
- Better opportunities emerge
- Stock reaches fair value (not just because it went up)
- Your investment thesis is proven wrong
- You need money for planned goal

Don't sell when:
- Market is down (that's when you should buy!)
- Stock fell 10-20% (normal volatility)
- Someone gave a tip
- You're feeling anxious

Market Crash Strategy:
If market crashes 20-30%:
1. Don't panic sell
2. Review your holdings
3. If fundamentals intact, hold or buy more
4. Use emergency cash to buy quality stocks cheap
5. This is wealth-building opportunity!

Historical Perspective:
Every major crash recovered:
- 2008 Financial Crisis: Recovered in 3 years
- 2020 COVID Crash: Recovered in 6 months
- 2000 Dot-com Bubble: Recovered in 5 years

Those who stayed invested made money. Those who sold at bottom lost.

Practical Advice:
1. Invest regularly through SIP
2. Keep 10-20% cash for opportunities
3. Buy more during corrections
4. Don't try to catch exact bottom
5. Focus on good companies at reasonable prices
6. Think 5-10 years, not 5-10 days

Remember: "Time in the market beats timing the market" - This isn't just a saying, it's backed by decades of data.

What specific aspect of market timing would you like to understand better?`;
    }
    
    // Default comprehensive response
    return `Thank you for your question about "${userMessage}". I'm here to help you understand investing and trading better.

While I'm currently experiencing some connectivity issues with my main AI service, I can still provide you with valuable insights based on established investment principles.

Here are some key concepts that might help:

Understanding the Stock Market:
The stock market is where shares of publicly traded companies are bought and sold. When you buy a stock, you're buying a small piece of ownership in that company. Your returns come from two sources: price appreciation (stock price going up) and dividends (company sharing profits).

Key Principles for Success:

1. Education First
Before investing real money, learn the basics. Understand financial statements, valuation metrics, and market dynamics. Knowledge is your best investment.

2. Start Small
Begin with small amounts you can afford to lose. As you gain experience and confidence, gradually increase your investments.

3. Long-term Perspective
The stock market rewards patience. Short-term trading is difficult and risky. Long-term investing (5+ years) has historically provided good returns.

4. Diversification
Don't put all eggs in one basket. Spread investments across different sectors and companies to reduce risk.

5. Regular Investment
Use SIP (Systematic Investment Plan) to invest regularly. This removes emotion and averages your purchase cost.

6. Risk Management
Always use stop-losses, never invest borrowed money, and keep an emergency fund separate from investments.

7. Continuous Learning
Markets evolve. Keep learning about new companies, sectors, and investment strategies.

Common Mistakes to Avoid:
- Following tips blindly without research
- Trying to get rich quick
- Panic selling during market falls
- Investing without understanding
- Ignoring risk management
- Checking portfolio too frequently

Resources for Learning:
- Read annual reports of companies
- Follow reputable financial news sources
- Learn from successful investors like Warren Buffett
- Practice with virtual trading first
- Join investment communities

Remember: Investing is a journey, not a destination. Focus on continuous learning and improvement rather than quick profits.

I'm here to help you with specific questions about:
- Stock analysis and valuation
- Investment strategies
- Risk management
- Portfolio building
- Market trends
- Company fundamentals

Feel free to ask me anything specific, and I'll provide detailed, helpful answers!

What would you like to know more about?`;
}