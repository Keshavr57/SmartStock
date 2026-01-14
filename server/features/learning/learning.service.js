import axios from 'axios';
import { COMPREHENSIVE_LESSONS, LEARNING_CATEGORIES, DIFFICULTY_LEVELS } from './lessons.data.js';

// Simple config - no class
const config = {
    aiServiceUrl: process.env.AI_SERVICE_URL || 'https://smartstock-ai-service.onrender.com'
};

// Get all lessons organized by difficulty
function getAllLessons() {
    return {
        beginner: COMPREHENSIVE_LESSONS.beginner,
        intermediate: COMPREHENSIVE_LESSONS.intermediate,
        advanced: COMPREHENSIVE_LESSONS.advanced,
        expert: COMPREHENSIVE_LESSONS.expert
    };
}

// Get lessons by difficulty level
function getLessonsByDifficulty(difficulty) {
    return COMPREHENSIVE_LESSONS[difficulty] || [];
}

// Get lessons by category
function getLessonsByCategory(category) {
    const allLessons = [
        ...COMPREHENSIVE_LESSONS.beginner,
        ...COMPREHENSIVE_LESSONS.intermediate,
        ...COMPREHENSIVE_LESSONS.advanced,
        ...COMPREHENSIVE_LESSONS.expert
    ];
    
    return allLessons.filter(lesson => 
        lesson.category.toLowerCase().includes(category.toLowerCase())
    );
}

// Get learning path for a user based on their level
function getLearningPath(userLevel = 'beginner') {
    const paths = {
        beginner: [
            'what-are-stocks', 'stock-exchanges', 'types-of-stocks',
            'how-to-buy-stocks', 'reading-stock-prices'
        ],
        intermediate: [
            'fundamental-analysis', 'technical-analysis-intro', 'portfolio-diversification',
            'dividend-investing', 'market-orders-types'
        ],
        advanced: [
            'options-basics', 'futures-trading', 'sector-analysis',
            'risk-management', 'ipo-analysis'
        ],
        expert: [
            'algorithmic-trading', 'global-markets', 'alternative-investments', 'tax-optimization'
        ]
    };

    return paths[userLevel] || paths.beginner;
}

// Get detailed lesson content with AI enhancement
async function getLessonContent(lessonId) {
    const lesson = findLessonById(lessonId);
    if (!lesson) {
        throw new Error("Lesson not found");
    }

    try {
        // Try to get AI-enhanced content
        const response = await axios.post(`${config.aiServiceUrl}/process`, {
            message: `${lesson.prompt} 

            Structure your response as follows:
            1. Brief introduction (2-3 sentences)
            2. Main concepts with examples
            3. Practical tips for Indian investors
            4. Common mistakes to avoid
            
            Keep it engaging and under 300 words. Use bullet points where appropriate.`,
            user_id: "comprehensive_learning"
        }, { timeout: 8000 });

        return {
            id: lesson.id,
            title: lesson.title,
            difficulty: lesson.difficulty,
            duration: lesson.duration,
            category: lesson.category,
            description: lesson.description,
            content: response.data.answer,
            keyPoints: lesson.keyPoints,
            isAiGenerated: true,
            nextLessons: getNextLessons(lessonId),
            relatedLessons: getRelatedLessons(lessonId)
        };

    } catch (error) {
        console.warn(`⚠️ AI Service unavailable for lesson ${lessonId}. Using fallback content.`);
        
        return {
            id: lesson.id,
            title: lesson.title,
            difficulty: lesson.difficulty,
            duration: lesson.duration,
            category: lesson.category,
            description: lesson.description,
            content: generateGenericContent(lesson),
            keyPoints: lesson.keyPoints,
            isAiGenerated: false,
            nextLessons: getNextLessons(lessonId),
            relatedLessons: getRelatedLessons(lessonId)
        };
    }
}

// Find lesson by ID across all difficulty levels
function findLessonById(lessonId) {
    const allLessons = [
        ...COMPREHENSIVE_LESSONS.beginner,
        ...COMPREHENSIVE_LESSONS.intermediate,
        ...COMPREHENSIVE_LESSONS.advanced,
        ...COMPREHENSIVE_LESSONS.expert
    ];
    
    return allLessons.find(lesson => lesson.id === lessonId);
}

// Get next recommended lessons
function getNextLessons(currentLessonId) {
    const lesson = findLessonById(currentLessonId);
    if (!lesson) return [];

    const sameDifficultyLessons = COMPREHENSIVE_LESSONS[lesson.difficulty.toLowerCase()];
    const currentIndex = sameDifficultyLessons.findIndex(l => l.id === currentLessonId);
    
    const nextInSameLevel = sameDifficultyLessons.slice(currentIndex + 1, currentIndex + 3);
    return nextInSameLevel;
}

// Get learning statistics
function getLearningStats() {
    const stats = {
        totalLessons: 0,
        byDifficulty: {},
        byCategory: {}
    };

    Object.keys(COMPREHENSIVE_LESSONS).forEach(difficulty => {
        const lessons = COMPREHENSIVE_LESSONS[difficulty];
        stats.totalLessons += lessons.length;
        stats.byDifficulty[difficulty] = lessons.length;

        lessons.forEach(lesson => {
            const category = lesson.category;
            stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
        });
    });

    return stats;
}

// Get all categories
function getCategories() {
    return Object.keys(LEARNING_CATEGORIES);
}

// Get all difficulty levels
function getDifficultyLevels() {
    return Object.keys(DIFFICULTY_LEVELS);
}

// Search lessons by title, description, or keywords
function searchLessons(query) {
    const allLessons = [
        ...COMPREHENSIVE_LESSONS.beginner,
        ...COMPREHENSIVE_LESSONS.intermediate,
        ...COMPREHENSIVE_LESSONS.advanced,
        ...COMPREHENSIVE_LESSONS.expert
    ];

    const searchTerm = query.toLowerCase();
    
    return allLessons.filter(lesson => 
        lesson.title.toLowerCase().includes(searchTerm) ||
        lesson.description.toLowerCase().includes(searchTerm) ||
        lesson.category.toLowerCase().includes(searchTerm) ||
        lesson.keyPoints.some(point => point.toLowerCase().includes(searchTerm))
    );
}

// Get related lessons based on category and difficulty
function getRelatedLessons(lessonId) {
    const lesson = findLessonById(lessonId);
    if (!lesson) return [];

    const allLessons = [
        ...COMPREHENSIVE_LESSONS.beginner,
        ...COMPREHENSIVE_LESSONS.intermediate,
        ...COMPREHENSIVE_LESSONS.advanced,
        ...COMPREHENSIVE_LESSONS.expert
    ];

    return allLessons
        .filter(l => 
            l.id !== lessonId && 
            (l.category === lesson.category || l.difficulty === lesson.difficulty)
        )
        .slice(0, 3);
}

// Generate generic content for lessons when AI is unavailable
function generateGenericContent(lesson) {
    // Generate comprehensive, detailed content based on lesson ID
    const contentMap = {
        'what-are-stocks': `
# Understanding Stocks: Your Gateway to Wealth Creation

## What Exactly Are Stocks?

Imagine you and three friends want to start a chai shop. You each contribute ₹25,000, making the total investment ₹1 lakh. Each of you now owns 25% of the business. If the shop makes ₹40,000 profit, each friend gets ₹10,000. This is exactly how stocks work!

When you buy a stock, you're buying a small piece of ownership in a company. If the company does well, your piece becomes more valuable. If it struggles, your piece loses value.

## Real Example: Reliance Industries

Let's say Reliance Industries has 6,00,00,00,000 (6 billion) shares. If you buy 100 shares, you own a tiny piece of this massive company. When Reliance makes profits, you benefit in two ways:

1. **Stock Price Increase**: If more people want to buy Reliance shares (because the company is doing well), the price goes up. You can sell your shares for more than you paid.

2. **Dividends**: Reliance might share some profits directly with shareholders. If they declare ₹10 dividend per share and you own 100 shares, you get ₹1,000!

## Why Do Companies Issue Stocks?

Companies need money to grow. They have three options:
- Take a bank loan (but have to pay interest)
- Borrow from friends/family (limited money)
- Sell shares to public (get lots of money, no interest!)

When TCS wanted to expand globally, they raised money by selling shares. Investors got ownership, TCS got capital. Win-win!

## Types of Returns from Stocks

**Capital Appreciation**: You buy at ₹100, sell at ₹150. Profit = ₹50 per share.

**Dividends**: Company shares profits. If you own 1,000 shares and company gives ₹5 per share, you get ₹5,000.

**Bonus Shares**: Company gives free shares! Own 100 shares, get 50 more free (1:2 bonus).

**Stock Splits**: One ₹1,000 share becomes two ₹500 shares. You own more shares, same total value.

## The Risks You Should Know

**Market Risk**: Overall market falls, your stock falls too (even if company is good).

**Company Risk**: Company performs badly, stock price drops.

**Liquidity Risk**: Can't sell quickly if not many buyers.

**Example**: During COVID-19 crash (March 2020), even good companies like HDFC Bank fell 30-40%. But those who held on recovered fully by December 2020.

## How Stock Prices Move

Stock prices change based on:
- Company's quarterly results (profits up = price up)
- Industry trends (IT sector doing well = IT stocks up)
- Economic conditions (interest rates, inflation)
- Global events (war, pandemic, oil prices)
- Investor sentiment (fear or greed)

## Getting Started: Your First Steps

1. **Learn Before You Invest**: Understand basics (you're doing this now!)
2. **Start Small**: Begin with ₹5,000-10,000, not your life savings
3. **Choose Quality**: Start with well-known companies (Reliance, TCS, HDFC Bank)
4. **Think Long-term**: Stock market rewards patience, not quick trading
5. **Diversify**: Don't put all money in one stock

## Common Beginner Mistakes

❌ Buying based on tips from friends
❌ Expecting to double money in weeks
❌ Selling in panic when price drops
❌ Investing money needed for emergencies
❌ Not doing any research

✅ Research before buying
✅ Invest for 3-5 years minimum
✅ Stay calm during market falls
✅ Invest only surplus money
✅ Learn continuously

## Real Success Story

Rakesh Jhunjhunwala started with ₹5,000 in 1985. By 2022, his portfolio was worth ₹35,000 crores! How? He:
- Invested in good companies
- Held for long term (10-20 years)
- Didn't panic during crashes
- Kept learning and improving

You don't need to become a billionaire. Even growing ₹1 lakh to ₹10 lakhs over 10-15 years is excellent!

## Key Takeaways

• Stocks = Ownership in companies
• Returns come from price increase + dividends
• Higher returns = Higher risk
• Long-term investing works better than trading
• Start small, learn continuously, stay patient

## Your Next Steps

1. Open a demat account (we'll cover this in next lesson)
2. Start following 5-10 companies you understand
3. Read their quarterly results
4. Practice with virtual trading first
5. Invest real money only when confident

Remember: Every successful investor started exactly where you are now. The key is to start learning and stay consistent!`,

        'stock-exchanges': `
# Indian Stock Exchanges: Where the Magic Happens

## What is a Stock Exchange?

Think of a stock exchange like a vegetable market, but instead of buying vegetables, people buy and sell company shares. Just like you need to go to a market to buy vegetables (can't buy from anywhere), you need a stock exchange to buy/sell shares.

## India's Two Main Exchanges

### 1. NSE (National Stock Exchange)
- Started in 1994
- Located in Mumbai
- More modern, fully electronic
- Nifty 50 is its main index
- Most trading happens here

### 2. BSE (Bombay Stock Exchange)
- Started in 1875 (Asia's oldest!)
- Also in Mumbai
- Sensex is its main index
- 5,000+ companies listed

**Fun Fact**: You can buy the same stock (like Reliance) on both NSE and BSE. Prices are almost identical due to arbitrage.

## How Does Trading Actually Work?

### Step-by-Step Process:

**9:00 AM - 9:15 AM**: Pre-opening session
- Orders are collected but not executed
- Opening price is determined

**9:15 AM - 3:30 PM**: Normal trading
- Buy and sell orders are matched
- Prices change every second
- This is when you can trade

**3:30 PM - 4:00 PM**: Post-closing session
- For institutional investors
- Retail investors usually don't trade here

### Real Example of Order Matching:

You want to buy Reliance at ₹2,500:
1. You place "buy order" through your broker
2. Order reaches NSE computer
3. NSE matches with someone selling at ₹2,500
4. Trade executed in milliseconds!
5. Shares credited to your demat account in 2 days (T+2)

## Understanding Market Indices

### Sensex (BSE)
- Tracks 30 largest companies
- Started in 1986 at 100 points
- Now at 70,000+ points!
- Represents overall market health

### Nifty 50 (NSE)
- Tracks 50 largest companies
- Started in 1996 at 1,000 points
- Now at 21,000+ points
- More diversified than Sensex

**What it means**: If Nifty is up 2%, it means on average, the top 50 companies' stocks went up 2%.

## SEBI: The Market Watchdog

SEBI (Securities and Exchange Board of India) is like a police officer for the stock market. They:

✅ Protect investor interests
✅ Prevent fraud and manipulation
✅ Regulate brokers and companies
✅ Ensure fair trading practices
✅ Punish rule-breakers

**Example**: If a company gives false information, SEBI can fine them crores and ban promoters from markets.

## Types of Market Segments

### 1. Cash/Equity Market
- Buy shares, pay full amount
- Delivery to your demat account
- This is what beginners should use

### 2. Derivatives Market (F&O)
- Futures and Options
- High risk, high reward
- Not for beginners!
- Need minimum ₹1-2 lakhs

### 3. Debt Market
- Government and corporate bonds
- Lower risk than stocks
- Fixed returns

## Circuit Breakers: Safety Mechanism

If market falls too fast, trading stops temporarily:
- 10% fall = 45-minute halt
- 15% fall = Another 45-minute halt
- 20% fall = Market closes for the day

**Why?** Prevents panic selling. Gives investors time to think calmly.

**Example**: On March 23, 2020 (COVID crash), circuit breakers triggered multiple times.

## Trading Holidays

Markets are closed on:
- Weekends (Saturday & Sunday)
- National holidays (Republic Day, Independence Day, etc.)
- Festival holidays (Diwali, Holi, Eid, etc.)

**Pro Tip**: Check NSE/BSE website for holiday calendar before planning trades.

## How Brokers Fit In

You can't directly trade on NSE/BSE. You need a broker (like Zerodha, Groww, Upstox):

**Broker's Role**:
1. Provides trading platform (app/website)
2. Executes your orders on exchange
3. Maintains your demat account
4. Charges brokerage fees

**Brokerage Fees**:
- Discount brokers: ₹0-20 per trade
- Full-service brokers: 0.1-0.5% of trade value

## Market Timings - Important!

**Regular Trading**: 9:15 AM - 3:30 PM (Monday-Friday)

**Best Times to Trade**:
- 9:15-10:00 AM: High volatility (avoid if beginner)
- 10:00 AM-3:00 PM: Stable trading
- 3:00-3:30 PM: High volatility again

**Worst Time**: First and last 15 minutes (too volatile for beginners)

## Settlement Cycle: T+2

When you buy shares:
- **T (Trade Day)**: You buy on Monday
- **T+1**: Tuesday (processing)
- **T+2**: Wednesday (shares in your demat account)

You can sell only after shares reach your demat account!

## Real-Life Trading Example

**Monday 10:00 AM**: You buy 10 Infosys shares at ₹1,500 each
- Total cost: ₹15,000
- Brokerage: ₹20
- Taxes: ~₹30
- **Total paid**: ₹15,050

**Wednesday**: Shares appear in your demat account

**Friday**: Infosys price is ₹1,600. You decide to sell.
- Selling value: ₹16,000
- Brokerage: ₹20
- Taxes: ~₹50
- **You receive**: ₹15,930
- **Profit**: ₹880 (5.8% in 5 days!)

## Common Questions Answered

**Q: Can I trade 24/7 like crypto?**
A: No, only 9:15 AM - 3:30 PM on weekdays.

**Q: What if I place order at 8:00 PM?**
A: Order queued, executed next trading day at 9:15 AM.

**Q: Can I buy shares of any company?**
A: Only companies listed on NSE/BSE. Private companies can't be bought.

**Q: What if exchange computer crashes?**
A: Rare, but trading halts until systems restore. Your money is safe.

## Key Takeaways

• NSE and BSE are India's main stock exchanges
• Trading hours: 9:15 AM - 3:30 PM, Monday-Friday
• SEBI regulates and protects investors
• Need a broker to trade (can't trade directly)
• Shares credited in T+2 days
• Sensex and Nifty show overall market health

## Your Action Steps

1. Download NSE/BSE mobile app to track markets
2. Watch Sensex/Nifty movement for a week
3. Note market timings in your calendar
4. Choose a broker (compare fees and features)
5. Understand T+2 settlement before trading

Remember: Understanding how exchanges work gives you confidence. You're not gambling; you're participating in a well-regulated system!`,

        // Add more lesson content here...
        'default': `
# ${lesson.title}

## Introduction

Welcome to this comprehensive lesson on ${lesson.title}. This ${lesson.difficulty.toLowerCase()}-level content will help you understand this important concept in detail.

## What You'll Learn

${lesson.description}

In this lesson, we'll cover everything you need to know about this topic, with practical examples from the Indian stock market and actionable insights you can use immediately.

## Key Concepts

${lesson.keyPoints.map((point, index) => `
### ${index + 1}. ${point}

This is a crucial aspect of ${lesson.title}. Let me explain with a real-world example:

When investing in the Indian stock market, understanding this concept helps you make better decisions. For instance, successful investors like Rakesh Jhunjhunwala always emphasized the importance of ${point.toLowerCase()}.

**Practical Application:**
- Research companies thoroughly before investing
- Look at historical data and trends
- Consider both short-term and long-term implications
- Always have a clear strategy

**Common Mistakes to Avoid:**
- Don't ignore this fundamental principle
- Avoid making decisions based on emotions
- Never skip proper research and analysis
`).join('\n')}

## Real-World Examples

Let's look at how this applies to actual Indian companies:

**Example 1: Large-Cap Stocks**
Companies like Reliance Industries, TCS, and HDFC Bank demonstrate these principles clearly. When you analyze their performance over the years, you'll notice patterns that align with what we're learning here.

**Example 2: Mid-Cap Opportunities**
Mid-cap companies offer different dynamics. Understanding ${lesson.title} helps you identify which mid-caps have potential and which ones to avoid.

## Step-by-Step Implementation

Here's how to apply this knowledge:

**Step 1: Research and Analysis**
Start by gathering information about the companies or concepts you're interested in. Use reliable sources like company annual reports, SEBI filings, and reputable financial news.

**Step 2: Practical Application**
Apply what you've learned to real scenarios. Start with small amounts if you're investing, or practice with virtual trading platforms.

**Step 3: Monitor and Adjust**
Keep track of your decisions and their outcomes. Learn from both successes and mistakes.

**Step 4: Continuous Learning**
The market evolves constantly. Stay updated with latest trends, regulations, and best practices.

## Common Pitfalls and How to Avoid Them

**Pitfall 1: Rushing Without Understanding**
Many beginners jump into investing without fully grasping the concepts. Take your time to learn thoroughly.

**Pitfall 2: Following Tips Blindly**
Don't invest based on tips from friends or social media. Do your own research.

**Pitfall 3: Emotional Decision Making**
Fear and greed are investors' worst enemies. Stick to your strategy and remain rational.

## Advanced Insights

For those ready to go deeper:

- Consider how macroeconomic factors affect this concept
- Understand the regulatory framework around this topic
- Learn how institutional investors approach this differently
- Explore international perspectives and comparisons

## Practical Tips for Indian Investors

1. **Start Small**: Begin with amounts you can afford to lose while learning
2. **Use Indian Examples**: Focus on NSE/BSE listed companies you understand
3. **Consider Tax Implications**: Understand LTCG, STCG, and their tax rates
4. **Stay Informed**: Follow SEBI guidelines and market regulations
5. **Build Gradually**: Increase investments as your knowledge grows

## Resources for Further Learning

- SEBI Investor Education Portal
- NSE and BSE educational resources
- Company annual reports and investor presentations
- Reputable financial news sources
- Books by successful Indian investors

## Summary and Key Takeaways

${lesson.keyPoints.map(point => `✓ ${point}`).join('\n')}

Understanding ${lesson.title} is essential for your investing journey. This ${lesson.difficulty.toLowerCase()}-level knowledge forms the foundation for more advanced concepts.

## Your Next Steps

1. Review the key points above
2. Practice with real examples from Indian markets
3. Start applying this knowledge in your investment decisions
4. Move on to related lessons to build comprehensive understanding
5. Join investor communities to discuss and learn more

## Duration and Difficulty

This lesson typically takes ${lesson.duration} to complete thoroughly. As a ${lesson.difficulty} level topic, it's designed for investors with ${lesson.difficulty === 'Beginner' ? 'little to no prior experience' : lesson.difficulty === 'Intermediate' ? 'basic understanding of markets' : lesson.difficulty === 'Advanced' ? 'solid foundation in investing' : 'extensive market knowledge'}.

## Final Thoughts

Remember, successful investing is a journey, not a destination. Every expert was once a beginner. The key is consistent learning and practical application.

Take your time with this material. Re-read sections that aren't clear. Practice with virtual trading before using real money. And most importantly, never stop learning!

---

*This comprehensive content is designed to give you deep understanding of ${lesson.title}. For personalized guidance, consider consulting with a SEBI-registered investment advisor.*
`
    };

    return contentMap[lesson.id] || contentMap['default'];
}

// Export simple object with functions
export default {
    getAllLessons,
    getLessonsByDifficulty,
    getLessonsByCategory,
    getLearningPath,
    getLessonContent,
    getLearningStats,
    getCategories,
    getDifficultyLevels,
    searchLessons
};
