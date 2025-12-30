# Trading Components

This folder contains all components related to the Virtual Trading system.

## Components:

- **OrderPanel.tsx** - Buy/Sell order placement interface
- **Holdings.tsx** - User's current stock holdings display
- **PortfolioSummary.tsx** - Portfolio overview with total value, P&L
- **RealTimePnL.tsx** - Real-time profit & loss tracking
- **TradingViewChart.tsx** - Interactive candlestick chart with real-time data
- **TradingRoomChat.tsx** - Real-time chat for each trading symbol
- **TransactionHistory.tsx** - Historical trading transactions
- **Watchlist.tsx** - User's watchlist with stock prices
- **AIAssistant.tsx** - AI-powered trading education assistant

## Usage:

All components are used by the main `VirtualTrading.tsx` page located in `client/src/pages/`.

## Backend Integration:

These components connect to the trading backend services located in `server/services/trading/`.