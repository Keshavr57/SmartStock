from langchain_core.tools import tool
import yfinance as yf
import pandas as pd
import requests
import os
from datetime import datetime, timedelta

@tool
def stock_price_tool(ticker: str):
    """Fetch real-time stock price. Use '.NS' for NSE or '.BO' for BSE tickers."""
    try:
        data = yf.Ticker(ticker)
        # 1. Try history first (more reliable for Indian stocks)
        hist = data.history(period="1d")
        if not hist.empty:
            price = hist['Close'].iloc[-1]
            currency = "INR" if ticker.endswith((".NS", ".BO")) else "USD"
            return {"price": round(float(price), 2), "currency": currency}
        
        # 2. Fallback to info
        price = data.info.get("currentPrice") or data.info.get("regularMarketPrice")
        if price:
            return {"price": price, "currency": data.info.get("currency", "Unknown")}
            
        return "Error: Data currently unavailable from Yahoo Finance for this ticker."
    except Exception as e:
        return f"Error: {str(e)}"

@tool
def crypto_price_tool(crypto_symbol: str):
    """Fetch real-time cryptocurrency prices. Use symbols like BTC, ETH, ADA, SOL, etc."""
    try:
        # Map common symbols to CoinGecko IDs
        symbol_map = {
            'BTC': 'bitcoin',
            'ETH': 'ethereum', 
            'ADA': 'cardano',
            'SOL': 'solana',
            'DOT': 'polkadot',
            'MATIC': 'polygon',
            'POL': 'polygon-ecosystem',
            'BNB': 'binancecoin',
            'XRP': 'ripple',
            'DOGE': 'dogecoin',
            'SHIB': 'shiba-inu',
            'AVAX': 'avalanche-2',
            'LINK': 'chainlink',
            'UNI': 'uniswap'
        }
        
        crypto_id = symbol_map.get(crypto_symbol.upper(), crypto_symbol.lower())
        
        response = requests.get(
            f"https://api.coingecko.com/api/v3/simple/price",
            params={
                'ids': crypto_id,
                'vs_currencies': 'usd,inr',
                'include_24hr_change': 'true',
                'include_market_cap': 'true'
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if crypto_id in data:
                crypto_data = data[crypto_id]
                return {
                    "symbol": crypto_symbol.upper(),
                    "price_usd": crypto_data.get('usd'),
                    "price_inr": crypto_data.get('inr'),
                    "change_24h": round(crypto_data.get('usd_24h_change', 0), 2),
                    "market_cap": crypto_data.get('usd_market_cap')
                }
        
        return f"Could not fetch price for {crypto_symbol}. Try BTC, ETH, ADA, SOL, etc."
    except Exception as e:
        return f"Crypto price error: {str(e)}"

@tool
def ipo_analysis_tool(company_name: str):
    """Analyze IPO prospects and provide investment recommendations for upcoming or recent IPOs."""
    try:
        # Mock IPO database with real analysis
        ipo_database = {
            "swiggy": {
                "name": "Swiggy Limited",
                "price_band": "₹371-390",
                "issue_size": "₹11,327 Cr",
                "lot_size": "38 shares",
                "listing_date": "Expected Jan 2025",
                "business": "Food delivery and quick commerce platform",
                "financials": {
                    "revenue_growth": "18% CAGR",
                    "market_share": "50% in food delivery",
                    "profitability": "Path to profitability by FY26"
                },
                "risks": ["High competition from Zomato", "Regulatory changes", "High cash burn"],
                "positives": ["Market leader", "Diversified into Instamart", "Strong brand"],
                "recommendation": "SUBSCRIBE - Strong fundamentals with growth potential",
                "rating": "4/5"
            },
            "ntpc green": {
                "name": "NTPC Green Energy",
                "price_band": "₹102-108", 
                "issue_size": "₹10,000 Cr",
                "business": "Renewable energy generation",
                "recommendation": "SUBSCRIBE - Government backing and green energy focus",
                "rating": "4.5/5"
            },
            "hyundai": {
                "name": "Hyundai Motor India",
                "price_band": "₹1,865-1,960",
                "issue_size": "₹27,870 Cr",
                "business": "Automobile manufacturing",
                "recommendation": "SUBSCRIBE - Strong brand and market position",
                "rating": "4/5"
            }
        }
        
        company_key = company_name.lower().strip()
        for key, data in ipo_database.items():
            if key in company_key or company_key in key:
                return data
        
        return f"IPO analysis not available for {company_name}. Try Swiggy, NTPC Green, or Hyundai."
    except Exception as e:
        return f"IPO analysis error: {str(e)}"

@tool
def market_news_tool(ticker: str):
    """Search for the latest news. Note: news is often limited for Indian stocks."""
    try:
        data = yf.Ticker(ticker)
        news = data.news
        if not news:
            # Indian stocks often lack news on Yahoo. Provide a graceful fallback.
            return f"No direct news articles found for {ticker} on Yahoo Finance."

        return [{"title": n.get('title'), "link": n.get('link')} for n in news[:3]]
    except Exception as e:
        return f"Error fetching news: {e}"

@tool
def technical_analysis_tool(ticker: str):
    """Calculates RSI (Relative Strength Index) to see if a stock is overbought (>70) or oversold (<30)."""
    try:
        # Download last 1 month of data
        df = yf.download(ticker, period="1mo", interval="1d")
        if df.empty:
            return "Could not fetch historical data for RSI."

        # RSI Calculation logic
        delta = df['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        current_rsi = float(rsi.iloc[-1])
        
        status = "Overbought (Consider Selling)" if current_rsi > 70 else "Oversold (Good Buy Zone)" if current_rsi < 30 else "Neutral"
        
        return {
            "rsi": round(current_rsi, 2),
            "signal": status,
            "interpretation": f"The RSI is {round(current_rsi, 2)}, which is {status}."
        }
    except Exception as e:
        return f"Technical analysis error: {str(e)}"

@tool
def financial_calculator_tool(calculation_type: str, **kwargs):
    """Perform financial calculations like SIP returns, compound interest, etc."""
    try:
        if calculation_type.lower() == "sip":
            monthly_amount = kwargs.get('monthly_amount', 5000)
            years = kwargs.get('years', 10)
            annual_return = kwargs.get('annual_return', 12) / 100
            
            months = years * 12
            monthly_return = annual_return / 12
            
            # SIP Future Value calculation
            future_value = monthly_amount * (((1 + monthly_return) ** months - 1) / monthly_return) * (1 + monthly_return)
            total_invested = monthly_amount * months
            returns = future_value - total_invested
            
            return {
                "monthly_investment": monthly_amount,
                "years": years,
                "total_invested": round(total_invested, 2),
                "future_value": round(future_value, 2),
                "returns": round(returns, 2),
                "return_percentage": round((returns / total_invested) * 100, 2)
            }
        
        elif calculation_type.lower() == "compound":
            principal = kwargs.get('principal', 100000)
            rate = kwargs.get('rate', 10) / 100
            years = kwargs.get('years', 5)
            
            amount = principal * (1 + rate) ** years
            interest = amount - principal
            
            return {
                "principal": principal,
                "rate_percent": kwargs.get('rate', 10),
                "years": years,
                "final_amount": round(amount, 2),
                "interest_earned": round(interest, 2)
            }
        
        return "Supported calculations: 'sip' and 'compound'"
    except Exception as e:
        return f"Calculation error: {str(e)}"

@tool
def market_sentiment_tool(query: str):
    """Get general market sentiment and trends for Indian and global markets."""
    try:
        # Fetch major indices
        indices = {
            "NIFTY": "^NSEI",
            "SENSEX": "^BSESN", 
            "S&P 500": "^GSPC",
            "NASDAQ": "^IXIC"
        }
        
        sentiment_data = {}
        for name, symbol in indices.items():
            try:
                ticker = yf.Ticker(symbol)
                hist = ticker.history(period="2d")
                if len(hist) >= 2:
                    current = hist['Close'].iloc[-1]
                    previous = hist['Close'].iloc[-2]
                    change = ((current - previous) / previous) * 100
                    sentiment_data[name] = {
                        "current": round(current, 2),
                        "change": round(change, 2),
                        "trend": "Bullish" if change > 0 else "Bearish"
                    }
            except:
                continue
        
        return sentiment_data
    except Exception as e:
        return f"Market sentiment error: {str(e)}"