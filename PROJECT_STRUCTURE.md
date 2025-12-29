# 📁 SmartStock Project Structure

## 🏗️ Architecture Overview
```
SmartStock/
├── 🖥️  client/          # React Frontend (Clean & Optimized)
├── 🔧  server/          # Node.js Backend (Streamlined)
├── 🤖  ai-service/      # Python AI Service (Efficient)
└── 📚  README.md        # Documentation
```

## 🖥️ Frontend (client/)
**Tech Stack:** React 18 + TypeScript + Vite + Tailwind CSS

### Key Files:
- `src/App.tsx` - Main app component with routing
- `src/pages/` - All page components (6 pages)
  - `Home.tsx` - Landing page with market data
  - `Compare.tsx` - Stock comparison tool
  - `ComprehensiveLearn.tsx` - Learning center
  - `AIAdvisor.tsx` - AI chat interface
  - `News.tsx` - Smart news with sentiment analysis
  - `IPOs.tsx` - IPO calendar with risk assessment
- `src/components/` - Reusable UI components (7 components)
- `src/lib/api.ts` - API calls to backend
- `src/lib/utils.ts` - Utility functions

### Features:
- 📊 Real-time stock comparison
- 🤖 AI-powered educational advisor
- 📰 Smart news filtering
- 🎯 IPO risk assessment
- 📚 Interactive learning modules

## 🔧 Backend (server/)
**Tech Stack:** Node.js + Express + MongoDB

### Key Files:
- `server.js` - Main server file (cleaned, uses shared DB config)
- `config/db.js` - Database connection
- `controllers/` - Request handlers (5 controllers)
- `routes/` - API endpoints (6 route files)
- `services/` - Business logic (9 services, all used)
- `data/comprehensiveLessons.js` - Learning content

### API Endpoints:
- `/api/compare` - Stock comparison data
- `/api/news/trending` - News with sentiment analysis
- `/api/ipo/upcoming` - IPO data with risk factors
- `/api/learning/list` - Educational content
- `/api/market/landing-data` - Market highlights
- `/api/chat` - AI advisor communication

## 🤖 AI Service (ai-service/)
**Tech Stack:** Python + FastAPI + LangChain + Groq LLM

### Key Files:
- `main.py` - FastAPI server (clean endpoints)
- `engine.py` - AI processing logic (optimized)
- `ipo_service.py` - IPO risk assessment (comprehensive)
- `requirements.txt` - Python dependencies (minimal set)

### Features:
- 🎓 Educational AI responses
- 🎯 IPO risk analysis with 🟢🟡🔴 indicators
- 📊 Stock data integration
- ⚠️ Educational disclaimers

## 🚀 How to Run

### 1. Backend Server
```bash
cd server
npm install
npm start
# Runs on http://localhost:5050
```

### 2. AI Service
```bash
cd ai-service
pip install -r requirements.txt
python main.py
# Runs on http://localhost:8000
```

### 3. Frontend
```bash
cd client
npm install
npm run dev
# Runs on http://localhost:3001
```

## 🧹 Code Cleanup Completed

### ✅ Removed:
- Duplicate `connectDB` function in server.js
- Unused variables in comprehensiveStockService.js
- Unused `getFinancials` method
- Unused react.svg asset
- Unused FMP_API_KEY environment variable
- All unused imports and variables

### ✅ Optimized:
- Server.js now uses shared DB config from config/db.js
- All services are actively used and necessary
- Clean import statements throughout
- Proper error handling maintained
- All components and pages are utilized

### ✅ Dependencies:
- **Server:** 7 production dependencies (all used)
- **Client:** 10 production dependencies (all used)
- **AI Service:** 9 Python packages (all required)

## 🎯 Key Features for Presentation

### 1. AI-Powered Education
- Smart Q&A system with 200+ educational questions
- Risk assessment for IPOs with color-coded indicators
- Always includes "This is an educational platform, not investment tips"

### 2. Smart News Analysis
- AI sentiment analysis (🟢 Positive, 🔴 Negative, 🟡 Neutral)
- Market impact filtering (High/Medium/Low)
- Real-time RSS feed processing

### 3. Comprehensive Stock Analysis
- 50+ data points per stock comparison
- Real-time market data integration
- Technical and fundamental analysis

### 4. Interactive Learning
- 19 lessons across 4 difficulty levels
- 6 categories: Fundamentals, Technical Analysis, etc.
- Progress tracking and quizzes

## 🔒 Educational Focus
- No direct investment advice
- Educational disclaimers throughout
- Focus on teaching analysis methods
- Risk awareness and financial literacy

## 📊 Data Sources
- **Stock Data:** Yahoo Finance, NSE Python
- **News:** RSS feeds from Economic Times, Reuters, etc.
- **IPO Data:** Custom database with 2026 IPOs
- **AI:** Groq LLM with educational prompts

## 💡 Internship Presentation Points
1. **Clean Architecture:** Clear separation of frontend, backend, and AI service
2. **Modern Tech Stack:** React 18, Node.js, Python FastAPI
3. **Educational Focus:** No investment advice, only educational content
4. **Real-time Data:** Live market data and news integration
5. **AI Integration:** Smart risk assessment and educational responses
6. **Scalable Design:** Modular services, clean code structure

This clean, optimized structure makes it easy to explain each component and demonstrate the full-stack capabilities of the platform!