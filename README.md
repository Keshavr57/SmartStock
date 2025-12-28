# 📈 SmartStock - AI-Powered Stock Market Platform

A comprehensive stock market analysis platform with AI-powered insights, sentiment analysis, and educational tools for Indian and global markets.

## 🚀 Features

### 🤖 AI Advisor
- **Smart Risk Assessment**: AI-powered analysis with educational disclaimers
- **IPO Risk Analysis**: 🟢 Low Risk, 🟡 Medium Risk, 🔴 High Risk indicators
- **Educational Focus**: "This is an educational platform, not investment tips"
- **Interactive Q&A**: 200+ pre-built educational questions

### 📊 Stock Comparison
- **Comprehensive Analysis**: 50+ data points per stock
- **Real-time Data**: Price, volume, market cap, financial ratios
- **Technical Indicators**: RSI, MACD, moving averages
- **Financial Statements**: Income statement, balance sheet, cash flow

### 📰 Smart News System
- **AI Sentiment Analysis**: 🟢 Positive, 🔴 Negative, 🟡 Neutral classification
- **Market Impact Filtering**: High/Medium/Low impact news
- **Trusted Sources**: Economic Times, Reuters, Bloomberg, MoneyControl
- **Real-time Updates**: Multiple RSS feeds with priority scoring

### 🎯 IPO Calendar
- **2026 IPO Data**: Current and upcoming IPOs with risk assessment
- **Risk Factors**: Based on promoter holding, company age, profit history
- **Educational Warnings**: Clear disclaimers about investment risks
- **Detailed Information**: Price bands, lot sizes, listing dates

### 📚 Learning Center
- **19 Comprehensive Lessons**: Beginner to Expert levels
- **6 Categories**: Fundamentals, Technical Analysis, Risk Management, etc.
- **Interactive Content**: Quizzes, examples, practical applications
- **Progress Tracking**: Difficulty-based learning paths

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Shadcn/ui** components
- **Lucide React** icons

### Backend
- **Node.js** with Express
- **MongoDB** database
- **Axios** for API calls
- **RSS Parser** for news feeds
- **CORS** enabled

### AI Service
- **Python FastAPI**
- **LangChain** with Groq LLM
- **yfinance** for stock data
- **BeautifulSoup** for web scraping
- **Custom sentiment analysis**

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.8+
- MongoDB

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Keshavr57/SmartStock.git
cd SmartStock
```

2. **Install Frontend Dependencies**
```bash
cd client
npm install
```

3. **Install Backend Dependencies**
```bash
cd ../server
npm install
```

4. **Install AI Service Dependencies**
```bash
cd ../ai-service
pip install -r requirements.txt
```

5. **Environment Setup**

Create `.env` files in each directory:

**server/.env**
```env
MONGODB_URI=mongodb://localhost:27017/smartstock
PORT=5050
```

**ai-service/.env**
```env
GROQ_API_KEY=your_groq_api_key_here
```

### Running the Application

1. **Start MongoDB** (if running locally)

2. **Start Backend Server**
```bash
cd server
npm start
# Server runs on http://localhost:5050
```

3. **Start AI Service**
```bash
cd ai-service
python main.py
# AI service runs on http://localhost:8000
```

4. **Start Frontend**
```bash
cd client
npm run dev
# Frontend runs on http://localhost:3001
```

## 📱 Usage

### 🏠 Home Page
- View trending stocks with real-time data
- Quick access to all platform features
- Market overview and highlights

### 🤖 AI Advisor
- Ask educational questions about stocks and markets
- Get risk assessments for IPOs and investments
- Access 200+ pre-built educational questions
- Receive AI-powered analysis with disclaimers

### 📊 Compare Stocks
- Select multiple stocks for detailed comparison
- View 50+ data points including financials and technicals
- Analyze performance across different time periods
- Export comparison data

### 📰 News Section
- Filter news by sentiment (Positive/Negative/Neutral)
- Filter by market impact (High/Medium/Low)
- View analytics dashboard
- Access trusted financial news sources

### 🎯 IPO Calendar
- Browse current and upcoming 2026 IPOs
- View risk assessments with color-coded indicators
- Access detailed IPO information
- Educational content about IPO investing

### 📚 Learning Center
- Progress through 19 comprehensive lessons
- Choose difficulty level (Beginner to Expert)
- Learn fundamentals, technical analysis, and risk management
- Track your learning progress

## 🔧 API Endpoints

### Stock Data
- `GET /api/compare` - Compare multiple stocks
- `GET /api/market/landing-data` - Market highlights

### News
- `GET /api/news/trending` - All news with sentiment analysis
- `GET /api/news/sentiment/:sentiment` - Filter by sentiment
- `GET /api/news/impact/:impact` - Filter by market impact
- `GET /api/news/analytics` - News statistics

### IPO
- `GET /api/ipo/upcoming` - Current and upcoming IPOs

### Learning
- `GET /api/learning/list` - Available lessons
- `GET /api/learning/lesson/:id` - Specific lesson content

### AI Service
- `POST /process` - AI analysis and responses

## 🎯 Key Features Explained

### AI-Powered Risk Assessment
The platform uses advanced algorithms to assess investment risks:
- **IPO Risk Analysis**: Evaluates promoter holding, company age, and profit history
- **Sentiment Analysis**: Analyzes news sentiment using 100+ keywords
- **Market Impact**: Classifies news by potential market impact
- **Educational Focus**: Always includes disclaimers and educational content

### Smart News Filtering
- **Sentiment Keywords**: Positive (growth, profit, surge), Negative (crash, decline, loss)
- **Impact Analysis**: High (RBI, interest rates), Medium (earnings, IPO), Low (appointments)
- **Source Priority**: Trusted sources get higher priority in rankings
- **Real-time Updates**: Multiple RSS feeds updated continuously

### Comprehensive Stock Analysis
- **50+ Data Points**: Price, volume, ratios, financials, technicals
- **Real-time Data**: Live market data integration
- **Historical Analysis**: Multi-year performance tracking
- **Risk Metrics**: Volatility, beta, debt ratios

## 🔒 Educational Disclaimer

**This is an educational platform, not investment tips.** All analysis, recommendations, and content are for educational purposes only. Always:
- Do your own research
- Consult qualified financial advisors
- Consider your risk tolerance
- Never invest money you can't afford to lose

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Groq** for AI/LLM services
- **yfinance** for stock data
- **RSS feeds** from trusted financial news sources
- **Shadcn/ui** for beautiful UI components
- **Tailwind CSS** for styling

## 📞 Support

For support, email keshavrajput57@gmail.com or create an issue on GitHub.

---

**⚠️ Risk Warning**: Trading and investing in financial markets involves substantial risk of loss and is not suitable for all investors. Past performance does not guarantee future results.