# 📈 SmartStock - Virtual Trading Platform

> **A comprehensive virtual trading platform for learning stock market investing with real Indian market data**

[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Latest-brightgreen.svg)](https://mongodb.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://typescriptlang.org/)

## 🎯 What is SmartStock?

SmartStock is an **educational virtual trading platform** where users can learn stock market investing using **₹1 Lakh virtual money** and **real NSE/BSE market data**. Perfect for beginners to practice trading without financial risk.

## ✨ Key Features

### 💰 **Virtual Trading System**
- Start with ₹1,00,000 virtual money
- Real-time NSE/BSE stock prices
- Complete portfolio tracking with P&L
- Indian market hours (9:15 AM - 3:30 PM IST)

### 🤖 **AI-Powered Advisor**
- Financial questions only (stocks, trading, investing)
- Fast responses using Groq LLaMA 3.1
- Indian market focus (NSE, BSE)
- Educational disclaimers on all advice

### 📊 **Market Analysis**
- Live Indian stock data and charts
- Stock comparison with 50+ data points
- Real-time market news and updates
- Portfolio performance tracking

### 🎓 **Educational Platform**
- Learn trading concepts safely
- Comprehensive lessons and tutorials
- Risk-free environment for beginners
- Indian market focused content

## 🚀 Quick Demo

```bash
# Clone and setup
git clone https://github.com/yourusername/SmartStock.git
cd SmartStock

# Install dependencies
npm install
cd client && npm install
cd ../server && npm install
cd ../ai-service && pip install -r requirements.txt

# Setup environment (IMPORTANT!)
cp server/.env.example server/.env
cp client/.env.example client/.env
# Edit .env files with your credentials

# Start all services
npm run dev
```

**Access**: http://localhost:5173

## 🛠️ Tech Stack

| Frontend | Backend | AI Service | Database |
|----------|---------|------------|----------|
| React 18 + TypeScript | Node.js + Express | Python FastAPI | MongoDB |
| Tailwind CSS | JWT Authentication | Groq LLaMA 3.1 | Mongoose ODM |
| Vite + ShadcnUI | Google OAuth | Financial Advisor | Real-time Data |

## 📱 Platform Screenshots

### Virtual Trading Dashboard
- **Portfolio Overview**: Total value, P&L, available balance
- **Live Trading**: Buy/sell with real market prices
- **Holdings Tracker**: Monitor all investments

### AI Advisor Interface
- **Smart Insights**: Educational investment guidance
- **Risk Analysis**: IPO and stock risk assessment
- **Learning Focus**: Conversational, easy-to-understand responses

### Market Analysis Tools
- **Stock Comparison**: Side-by-side analysis
- **Live Charts**: Real-time price movements
- **News Integration**: Market updates and analysis

## 🔐 Security & Best Practices

✅ **Production Ready Security**
- No hardcoded secrets (JWT, OAuth)
- Environment variable configuration
- Input validation on all endpoints
- Memory leak fixes applied
- Secure authentication system

✅ **Code Quality**
- TypeScript for type safety
- Comprehensive error handling
- Clean component architecture
- Responsive design
- Performance optimized

## 🎯 Why SmartStock?

### For **Beginners**
- Learn trading without financial risk
- Start with virtual ₹1 Lakh
- Educational AI guidance
- Real market experience

### For **Developers**
- Full-stack TypeScript/JavaScript
- Modern React patterns
- Secure authentication
- Real-time data integration
- AI service integration

### For **Interviewers**
- Production-ready codebase
- Security best practices
- Comprehensive documentation
- Real-world application
- Educational impact

## 📊 Project Highlights

| Feature | Implementation | Impact |
|---------|---------------|---------|
| **Virtual Trading** | Real NSE/BSE data integration | Risk-free learning environment |
| **AI Advisor** | Groq LLaMA 3.1 (Financial only) | Fast, reliable financial guidance |
| **Security** | JWT + OAuth + Input validation | Production-ready security |
| **Performance** | Optimized API calls | Smooth user experience |
| **Education** | Indian market focus | Practical learning platform |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.8+
- MongoDB

### Environment Setup
```bash
# Generate secure JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Configure Google OAuth
# 1. Create Google Cloud Console project
# 2. Enable Google+ API
# 3. Create OAuth credentials
# 4. Add to environment variables
```

### Run Application
```bash
# Start all services concurrently
npm run dev

# Or individually:
# Backend: cd server && npm start
# AI Service: cd ai-service && python main.py  
# Frontend: cd client && npm run dev
```

## 📈 API Overview

```javascript
// Authentication
POST /api/auth/register
POST /api/auth/login
POST /api/auth/google

// Virtual Trading
GET  /api/virtual/portfolio/:userId
POST /api/virtual/order
GET  /api/virtual/holdings/:userId

// Market Data
GET  /api/market/charts
GET  /api/market/search/:query
POST /ai/process  // AI advisor
```

## 🎓 Educational Impact

**SmartStock teaches:**
- Stock market fundamentals
- Risk management principles
- Portfolio diversification
- Indian market regulations
- Trading psychology

**Without financial risk:**
- Virtual money environment
- Real market data
- Practical experience
- Safe learning space

## 🏆 Project Achievements

- ✅ **Full-stack application** with modern tech stack
- ✅ **Real-time data integration** with Indian markets
- ✅ **AI-powered features** for educational guidance
- ✅ **Production-ready security** implementation
- ✅ **Responsive design** for all devices
- ✅ **Educational focus** with practical application

## 📞 Contact & Support

**Developer**: Your Name  
**Email**: your.email@example.com  
**LinkedIn**: [Your LinkedIn Profile]  
**GitHub**: [Your GitHub Profile]

---

### 🎯 **Perfect for Internship/Job Interviews**

This project demonstrates:
- **Full-stack development skills**
- **Real-world application building**
- **Security best practices**
- **Educational technology impact**
- **Modern development practices**

**⚠️ Educational Disclaimer**: This is a virtual trading platform for educational purposes only. No real money is involved.