# Using SmartStock

SmartStock is an educational paper-trading platform for the Indian stock market. No real money is involved and no orders reach an exchange.

## Your virtual account

- Every account starts with **₹1,00,000 of virtual cash**.
- You can buy and sell any NSE-listed stock (about 2,600 companies) at the live price.
- Each order is charged a flat **0.1%** of its value, approximating brokerage and statutory charges.
- Only **market orders for delivery** are supported today; limit orders are planned.
- Outside NSE hours (and on holidays) orders fill at the **last traded price**, so you can practise any time.
- **Reset account** on the Portfolio page clears holdings and orders and restores ₹1,00,000.

## How P&L is calculated

- **Unrealised P&L**: current value of holdings minus their average cost.
- **Realised P&L**: recorded on every sell, as proceeds after charges minus the average cost of the shares sold.
- **Day P&L**: for shares held overnight, the move since the previous close; for shares bought today, the move since your buy price. It is zero when NSE has not traded today (weekends and holidays).
- The average price is a weighted average across all buys of that stock.

## Pages

- **Dashboard**: account value, today's and total P&L, indices, holdings, top movers, news and IPOs.
- **Trade**: candlestick charts, watchlist, order ticket with charges preview, positions and orders. Keyboard: B to buy, S to sell, / to search, Enter to place.
- **Stock page**: price chart, returns from 1 month to 5 years, key statistics, analyst consensus, shareholding and recent news for any stock. Open one with ⌘K / Ctrl+K search.
- **Compare**: up to three stocks side by side with about 50 metrics and price charts.
- **IPOs**: open, upcoming and recently closed IPOs from NSE's official data.
- **News**: headlines tagged by sentiment and event type, with how similar news has moved prices historically.
- **Portfolio**: holdings, allocation by sector, order history, realised P&L.
- **Learn**: lessons on Indian markets.

## Data sources

- Prices, charts and fundamentals: NSE data via Yahoo Finance; quotes may be slightly delayed.
- Market status (open, closed, holiday) comes from the live NSE trading session.
- IPOs: NSE's public IPO APIs.
- News: Economic Times, Mint, Business Standard and Google News.

## News sentiment accuracy

SmartStock stores every headline and measures the stock's actual return relative to NIFTY afterwards. In its backtest on several thousand headlines, the sentiment tag matched the direction of the same-day move about 73% of the time against a roughly 52% baseline, but it showed no edge for predicting the next day's move. News is largely priced in within the same session.

## The AI Advisor

The AI Advisor (FinSage) can read your virtual portfolio, holdings, orders and watchlist; look up live quotes, fundamentals, price history, news and IPOs; analyse your portfolio's diversification and risk; search SmartStock's knowledge base; and remember your goals and preferences across conversations.

It can **propose** a trade, but it never places one: you review and confirm every order yourself. Its answers are educational and not investment advice. You can view and delete what it remembers about you.
