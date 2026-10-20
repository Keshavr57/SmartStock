# Order Types and Products

## The order book, bid and ask

Every stock has an order book of buy orders (bids) and sell orders (asks). The highest bid and lowest ask form the **spread**. Liquid large caps usually have a spread of a few paise; illiquid small caps can have wide spreads, so a market order may fill far from the last traded price.

## Order types

- **Market order**: buy or sell immediately at the best available price. Fast and almost always filled, but the price is not guaranteed (slippage), especially in illiquid stocks or volatile moments.
- **Limit order**: buy at or below, or sell at or above, a price you set. The price is guaranteed but the fill is not.
- **Stop-loss limit (SL)**: becomes a limit order when the trigger price is hit. Used to cap losses; may not fill in a fast fall if the price gaps through the limit.
- **Stop-loss market (SL-M)**: becomes a market order at the trigger. More likely to fill, at an uncertain price. Many brokers have restricted SL-M orders in the cash segment.
- **After-market order (AMO)**: placed outside market hours and sent to the exchange at the next open.
- **GTT (good till triggered)**: a broker feature that keeps a trigger alive for up to a year and places a limit order when the trigger is hit.

## Products

- **CNC (cash and carry / delivery)**: you pay the full amount and shares are delivered to your demat account. Suitable for investing.
- **MIS (intraday)**: positions are squared off the same day; brokers offer margin (leverage), which magnifies both gains and losses.
- **NRML**: carry-forward positions in futures and options.

## Choosing an order type

- For long-term investing in liquid stocks, a limit order slightly above the ask (or a market order) is usually fine.
- For small or illiquid stocks, use limit orders to avoid paying through a wide spread.
- A stop-loss protects against large losses but can be triggered by normal volatility if placed too tight. Placing it below a recent support level or using a percentage of the position is common practice.

## In SmartStock

SmartStock currently supports **market orders for delivery (CNC)** only. Orders fill at the live price from NSE; outside market hours they fill at the last traded price. Each order is charged a flat 0.1% to approximate brokerage and statutory charges. Limit orders are planned.
