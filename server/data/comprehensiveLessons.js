export const COMPREHENSIVE_LESSONS = {
  // BEGINNER LEVEL
  beginner: [
    {
      id: "what-are-stocks",
      title: "What are Stocks?",
      difficulty: "Beginner",
      duration: "5 min",
      category: "Basics",
      description: "Learn the fundamentals of stock ownership and how companies raise capital",
      prompt: "Explain what stocks are using simple analogies. Cover ownership, dividends, and basic risks. Use Indian examples like Reliance, TCS.",
      keyPoints: [
        "Stocks represent ownership in a company",
        "Share in company profits through dividends",
        "Value can go up or down based on company performance"
      ]
    },
    {
      id: "stock-exchanges",
      title: "Indian Stock Exchanges",
      difficulty: "Beginner", 
      duration: "4 min",
      category: "Basics",
      description: "Understanding NSE, BSE and how stock trading works in India",
      prompt: "Explain NSE and BSE, trading hours, and how orders are matched. Include SEBI's role.",
      keyPoints: [
        "NSE and BSE are India's main stock exchanges",
        "Trading happens Monday to Friday, 9:15 AM to 3:30 PM",
        "SEBI regulates the Indian stock market"
      ]
    },
    {
      id: "types-of-stocks",
      title: "Types of Stocks",
      difficulty: "Beginner",
      duration: "6 min", 
      category: "Basics",
      description: "Learn about equity shares, preference shares, and different stock categories",
      prompt: "Explain different types of stocks: equity vs preference shares, large-cap vs mid-cap vs small-cap. Use Indian examples.",
      keyPoints: [
        "Equity shares give voting rights, preference shares get priority in dividends",
        "Large-cap stocks are safer, small-cap stocks are riskier but offer higher growth",
        "Sectoral classification helps in diversification"
      ]
    },
    {
      id: "how-to-buy-stocks",
      title: "How to Buy Your First Stock",
      difficulty: "Beginner",
      duration: "8 min",
      category: "Getting Started",
      description: "Step-by-step guide to opening a demat account and placing your first order",
      prompt: "Explain the process of buying stocks in India: demat account, trading account, KYC, placing orders. Mention popular brokers.",
      keyPoints: [
        "Need demat and trading account to buy stocks",
        "Complete KYC process with valid documents",
        "Start with small amounts and blue-chip stocks"
      ]
    },
    {
      id: "reading-stock-prices",
      title: "Reading Stock Prices & Charts",
      difficulty: "Beginner",
      duration: "7 min",
      category: "Basics",
      description: "Understand bid-ask spread, volume, and basic price movements",
      prompt: "Explain how to read stock prices, bid-ask spread, volume, 52-week high/low. Keep it simple for beginners.",
      keyPoints: [
        "Bid is buying price, ask is selling price",
        "Volume shows how actively a stock is traded",
        "52-week range shows stock's yearly performance"
      ]
    }
  ],

  // INTERMEDIATE LEVEL
  intermediate: [
    {
      id: "fundamental-analysis",
      title: "Fundamental Analysis Basics",
      difficulty: "Intermediate",
      duration: "12 min",
      category: "Analysis",
      description: "Learn to evaluate companies using financial ratios and statements",
      prompt: "Explain fundamental analysis: P/E ratio, ROE, debt-to-equity, revenue growth. Use examples of Indian companies like TCS, Infosys.",
      keyPoints: [
        "P/E ratio shows if stock is expensive or cheap",
        "ROE indicates how efficiently company uses shareholders' money",
        "Debt-to-equity ratio shows financial health"
      ]
    },
    {
      id: "technical-analysis-intro",
      title: "Introduction to Technical Analysis",
      difficulty: "Intermediate", 
      duration: "10 min",
      category: "Analysis",
      description: "Understanding charts, trends, and basic technical indicators",
      prompt: "Introduce technical analysis: support/resistance, moving averages, RSI, MACD. Explain when to use vs fundamental analysis.",
      keyPoints: [
        "Technical analysis studies price patterns and trends",
        "Support and resistance levels help identify entry/exit points",
        "Moving averages smooth out price fluctuations"
      ]
    },
    {
      id: "portfolio-diversification",
      title: "Building a Diversified Portfolio",
      difficulty: "Intermediate",
      duration: "9 min",
      category: "Portfolio Management",
      description: "Learn asset allocation and risk management strategies",
      prompt: "Explain portfolio diversification: sector allocation, market cap distribution, asset classes. Include Indian context with mutual funds, bonds.",
      keyPoints: [
        "Don't put all eggs in one basket - spread across sectors",
        "Mix of large-cap, mid-cap, and small-cap stocks",
        "Consider bonds, gold, and international exposure"
      ]
    },
    {
      id: "dividend-investing",
      title: "Dividend Investing Strategy",
      difficulty: "Intermediate",
      duration: "8 min",
      category: "Investment Strategies",
      description: "Understanding dividend yields, payout ratios, and dividend growth stocks",
      prompt: "Explain dividend investing: dividend yield, payout ratio, ex-dividend date. Mention Indian dividend aristocrats and tax implications.",
      keyPoints: [
        "Dividend yield = Annual dividend / Stock price",
        "Look for consistent dividend-paying companies",
        "Dividends are taxed in the hands of investors"
      ]
    },
    {
      id: "market-orders-types",
      title: "Types of Market Orders",
      difficulty: "Intermediate",
      duration: "7 min",
      category: "Trading",
      description: "Market orders, limit orders, stop-loss, and advanced order types",
      prompt: "Explain different order types: market, limit, stop-loss, bracket orders. Include when to use each type with examples.",
      keyPoints: [
        "Market orders execute immediately at current price",
        "Limit orders execute only at specified price or better",
        "Stop-loss orders help limit losses"
      ]
    }
  ],

  // ADVANCED LEVEL
  advanced: [
    {
      id: "options-basics",
      title: "Introduction to Options Trading",
      difficulty: "Advanced",
      duration: "15 min",
      category: "Derivatives",
      description: "Understanding calls, puts, and basic options strategies",
      prompt: "Explain options trading: calls vs puts, strike price, expiry, premium. Cover basic strategies like covered calls. Include NSE options.",
      keyPoints: [
        "Options give right but not obligation to buy/sell",
        "Call options profit when stock price rises",
        "Put options profit when stock price falls"
      ]
    },
    {
      id: "futures-trading",
      title: "Futures Trading Fundamentals",
      difficulty: "Advanced",
      duration: "12 min",
      category: "Derivatives", 
      description: "Learn about futures contracts, margin requirements, and hedging",
      prompt: "Explain futures trading: contract specifications, margin requirements, mark-to-market. Include Nifty futures and stock futures examples.",
      keyPoints: [
        "Futures are binding contracts to buy/sell at future date",
        "Require margin money, not full contract value",
        "Used for hedging and speculation"
      ]
    },
    {
      id: "sector-analysis",
      title: "Sector Analysis & Rotation",
      difficulty: "Advanced",
      duration: "11 min",
      category: "Analysis",
      description: "Understanding economic cycles and sector performance patterns",
      prompt: "Explain sector analysis: cyclical vs defensive sectors, economic cycles, sector rotation. Use Indian sectors like IT, pharma, banking.",
      keyPoints: [
        "Different sectors perform well in different economic phases",
        "IT sector benefits from rupee depreciation",
        "Banking sector is sensitive to interest rate changes"
      ]
    },
    {
      id: "risk-management",
      title: "Advanced Risk Management",
      difficulty: "Advanced",
      duration: "13 min",
      category: "Risk Management",
      description: "Position sizing, correlation analysis, and portfolio risk metrics",
      prompt: "Explain advanced risk management: position sizing, correlation, VaR, maximum drawdown. Include practical examples for Indian markets.",
      keyPoints: [
        "Never risk more than 2% of portfolio on single trade",
        "Understand correlation between holdings",
        "Monitor portfolio beta and volatility"
      ]
    },
    {
      id: "ipo-analysis",
      title: "IPO Analysis & Evaluation",
      difficulty: "Advanced",
      duration: "10 min",
      category: "IPO",
      description: "How to analyze IPO prospectus, pricing, and post-listing performance",
      prompt: "Explain IPO analysis: reading DRHP, peer comparison, GMP analysis, listing gains vs long-term investment. Use recent Indian IPO examples.",
      keyPoints: [
        "Read the company's business model and financials carefully",
        "Compare valuation with listed peers",
        "Consider long-term prospects, not just listing gains"
      ]
    }
  ],

  // EXPERT LEVEL
  expert: [
    {
      id: "algorithmic-trading",
      title: "Introduction to Algorithmic Trading",
      difficulty: "Expert",
      duration: "18 min",
      category: "Advanced Trading",
      description: "Understanding automated trading systems and quantitative strategies",
      prompt: "Explain algorithmic trading: systematic strategies, backtesting, risk controls. Cover regulatory aspects in India and popular platforms.",
      keyPoints: [
        "Algorithms execute trades based on predefined rules",
        "Backtesting validates strategy performance",
        "Requires strong risk management and monitoring"
      ]
    },
    {
      id: "global-markets",
      title: "Global Markets & Currency Impact",
      difficulty: "Expert",
      duration: "14 min",
      category: "Global Investing",
      description: "How international markets affect Indian stocks and currency hedging",
      prompt: "Explain global market interconnections: how US markets affect India, currency impact on different sectors, international diversification through mutual funds.",
      keyPoints: [
        "US market movements often influence Indian markets",
        "Rupee depreciation benefits IT and pharma exports",
        "Global diversification reduces country-specific risks"
      ]
    },
    {
      id: "alternative-investments",
      title: "Alternative Investment Options",
      difficulty: "Expert",
      duration: "16 min",
      category: "Alternative Investments",
      description: "REITs, InvITs, commodities, and other alternative asset classes",
      prompt: "Explain alternative investments available in India: REITs, InvITs, gold ETFs, commodity trading. Compare with traditional equity investments.",
      keyPoints: [
        "REITs provide exposure to real estate without direct ownership",
        "InvITs invest in infrastructure projects",
        "Commodities can hedge against inflation"
      ]
    },
    {
      id: "tax-optimization",
      title: "Tax-Efficient Investing Strategies",
      difficulty: "Expert",
      duration: "12 min",
      category: "Tax Planning",
      description: "LTCG, STCG, tax-loss harvesting, and investment structures",
      prompt: "Explain tax-efficient investing: LTCG vs STCG rates, tax-loss harvesting, ELSS, tax-efficient mutual funds. Include recent tax changes.",
      keyPoints: [
        "Hold stocks for >1 year to get LTCG tax benefits",
        "Tax-loss harvesting can offset capital gains",
        "ELSS mutual funds offer tax deduction under 80C"
      ]
    }
  ]
};

export const LEARNING_CATEGORIES = [
  { id: "basics", name: "Market Basics", icon: "📚", color: "blue" },
  { id: "analysis", name: "Analysis", icon: "📊", color: "green" },
  { id: "trading", name: "Trading", icon: "💹", color: "purple" },
  { id: "portfolio", name: "Portfolio Management", icon: "💼", color: "orange" },
  { id: "derivatives", name: "Derivatives", icon: "🔄", color: "red" },
  { id: "advanced", name: "Advanced Topics", icon: "🎯", color: "indigo" }
];

export const DIFFICULTY_LEVELS = [
  { id: "beginner", name: "Beginner", description: "New to investing", color: "green" },
  { id: "intermediate", name: "Intermediate", description: "Some experience", color: "yellow" },
  { id: "advanced", name: "Advanced", description: "Experienced investor", color: "orange" },
  { id: "expert", name: "Expert", description: "Professional level", color: "red" }
];