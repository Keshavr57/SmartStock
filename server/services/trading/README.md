# Trading Services

This folder contains all backend services related to the Virtual Trading system.

## Services:

- **virtualTrading.service.js** - Core virtual trading logic (buy/sell orders, portfolio management)
- **nseWebSocket.service.js** - Real-time Indian stock price feeds via WebSocket
- **yahooWebSocket.service.js** - Real-time international stock price feeds via WebSocket

## Routes:

Trading routes are located in `server/routes/trading/virtualTradingRoutes.js`

## Database Models:

- VirtualPortfolio - Stores user portfolios, holdings, transactions
- Uses robustStockService for real stock data integration

## Features:

- Real-time price updates via WebSocket
- Virtual trading with ₹1,00,000 starting balance
- P&L tracking and portfolio analytics
- Support for Indian stocks and cryptocurrencies

## AI Advisor:

AI-powered market analysis is handled by the separate Python service in `ai-service/` directory.