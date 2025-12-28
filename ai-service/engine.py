import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
import yfinance as yf
from nsepython import nse_get_fno_lot_sizes
import requests
from bs4 import BeautifulSoup
import re
from ipo_service import get_current_ipos, get_ipo_risk_assessment

# Load Environment Variables
load_dotenv()

# Enhanced Educational System Prompt
EDUCATIONAL_SYSTEM_PROMPT = """You are an Educational Financial Assistant specializing in Indian and global markets.

🎯 PRIMARY ROLE: Provide educational content and market analysis, NOT investment advice.

📚 EDUCATIONAL APPROACH:
- Explain concepts clearly with examples
- Provide market data and analysis when possible
- Teach users how to evaluate investments
- Share educational insights about market trends

⚠️ COMPLIANCE RULES:
1. NEVER give direct buy/sell/hold recommendations
2. ALWAYS include educational disclaimers
3. Focus on teaching analysis methods, not predictions
4. Explain risks and market dynamics
5. Encourage users to do their own research

� RESPONSE FDORMAT:
## 📊 Market Data & Analysis
[Present factual data and metrics when available]

## 📚 Educational Insights  
[Explain what the data means and how to interpret it]

## 🎓 Learning Points
[Key concepts users should understand]

## 🔍 How to Analyze This Yourself
[Teach users the methods and tools they can use]

## ⚠️ Important Disclaimer
This is educational content only. Always consult qualified financial advisors and do your own research before making investment decisions.

💡 TONE: Professional, educational, helpful but never directive about specific investment actions.

🇮🇳 CONTEXT: Focus on Indian market context when relevant, use ₹ for Indian stocks, $ for international.

IMPORTANT: When users ask about specific stocks or IPOs, explain how to analyze them rather than giving recommendations. Teach the process, not the conclusion."""

# Initialize the LLM
llm = ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=0.2,
    groq_api_key=os.getenv("GROQ_API_KEY")
)

def get_stock_data_for_education(symbol):
    """Get basic stock data for educational purposes"""
    try:
        # Convert common Indian stock symbols
        if symbol.upper() in ['RELIANCE', 'RIL']:
            symbol = 'RELIANCE.NS'
        elif symbol.upper() in ['TCS']:
            symbol = 'TCS.NS'
        elif symbol.upper() in ['HDFC', 'HDFCBANK']:
            symbol = 'HDFCBANK.NS'
        elif symbol.upper() in ['INFY', 'INFOSYS']:
            symbol = 'INFY.NS'
        elif not symbol.endswith('.NS') and not symbol.endswith('.BO') and '.' not in symbol:
            symbol = f"{symbol.upper()}.NS"
            
        stock = yf.Ticker(symbol)
        info = stock.info
        hist = stock.history(period="1y")
        
        if hist.empty:
            return None
            
        current_price = hist['Close'].iloc[-1]
        year_high = hist['High'].max()
        year_low = hist['Low'].min()
        
        return {
            'symbol': symbol,
            'name': info.get('longName', symbol),
            'current_price': round(current_price, 2),
            'year_high': round(year_high, 2),
            'year_low': round(year_low, 2),
            'market_cap': info.get('marketCap'),
            'pe_ratio': info.get('trailingPE'),
            'book_value': info.get('bookValue'),
            'roe': info.get('returnOnEquity'),
            'debt_to_equity': info.get('debtToEquity'),
            'dividend_yield': info.get('dividendYield'),
            'sector': info.get('sector'),
            'industry': info.get('industry')
        }
    except Exception as e:
        print(f"Error fetching stock data: {e}")
        return None

def create_educational_response(user_query, stock_data=None, ipo_data=None):
    """Create a comprehensive educational response"""
    
    # Check if user is asking about a specific stock
    stock_mentioned = None
    ipo_mentioned = None
    query_lower = user_query.lower()
    
    # Check for IPO queries
    if 'ipo' in query_lower:
        # Look for specific IPO names
        ipo_keywords = [
            'bajaj housing', 'ntpc green', 'hyundai motor', 'ola electric',
            'zomato hyperpure', 'paytm insurance', 'nykaa fashion', 'zerodha',
            'swiggy', 'paytm', 'nykaa', 'zomato'
        ]
        
        for keyword in ipo_keywords:
            if keyword in query_lower:
                ipo_mentioned = keyword
                ipo_data = get_ipo_risk_assessment(keyword)
                break
        
        # If no specific IPO mentioned, get general IPO list
        if not ipo_mentioned:
            current_ipos = get_current_ipos()
            ipo_data = {'general_ipos': current_ipos[:5]}  # Top 5 current IPOs
    
    # Check for stock queries
    stock_keywords = {
        'reliance': 'RELIANCE.NS',
        'ril': 'RELIANCE.NS', 
        'tcs': 'TCS.NS',
        'hdfc': 'HDFCBANK.NS',
        'infosys': 'INFY.NS',
        'infy': 'INFY.NS'
    }
    
    for keyword, symbol in stock_keywords.items():
        if keyword in query_lower:
            stock_mentioned = symbol
            stock_data = get_stock_data_for_education(symbol)
            break
    
    # Create context for the LLM
    context = f"""
    User Query: {user_query}
    
    """
    
    if stock_data:
        context += f"""
        Stock Data Available for {stock_data['symbol']}:
        - Company: {stock_data['name']}
        - Current Price: ₹{stock_data['current_price']}
        - 52-Week High: ₹{stock_data['year_high']}
        - 52-Week Low: ₹{stock_data['year_low']}
        - P/E Ratio: {stock_data['pe_ratio'] if stock_data['pe_ratio'] else 'N/A'}
        - Market Cap: {stock_data['market_cap'] if stock_data['market_cap'] else 'N/A'}
        - Sector: {stock_data['sector'] if stock_data['sector'] else 'N/A'}
        
        """
    
    if ipo_data and 'assessment' in ipo_data:
        # Specific IPO risk assessment
        return ipo_data['assessment']
    elif ipo_data and 'general_ipos' in ipo_data:
        # General IPO information
        context += f"""
        Current IPOs Available:
        """
        for ipo in ipo_data['general_ipos']:
            context += f"- {ipo['name']}: {ipo['open']} to {ipo['close']} ({ipo['type']})\n"
        
        context += """
        Please provide educational content about IPO analysis and evaluation methods.
        """
    
    context += """
    Please provide a comprehensive educational response that:
    1. Uses the stock/IPO data above (if available) to teach analysis concepts
    2. Explains how to evaluate the metrics mentioned
    3. Teaches the user what to look for and how to research
    4. Avoids giving direct buy/sell recommendations
    5. Focuses on education and learning
    6. Includes practical steps the user can take to analyze themselves
    7. Always includes the disclaimer: "This is an educational platform, not investment tips"
    """
    
    return context

def process_query(user_input: str):
    """Process user query with enhanced educational focus"""
    try:
        # Create educational context
        educational_context = create_educational_response(user_input)
        
        # If it's a direct IPO risk assessment, return it
        if isinstance(educational_context, str) and '## 🎯 IPO Risk Assessment' in educational_context:
            return educational_context
        
        # Get response from LLM
        messages = [
            {"role": "system", "content": EDUCATIONAL_SYSTEM_PROMPT},
            {"role": "user", "content": educational_context}
        ]
        
        response = llm.invoke(messages)
        
        # Clean and format the response
        cleaned_response = response.content.strip()
        
        # Add educational disclaimer
        final_response = add_educational_disclaimer(cleaned_response)
        
        return final_response
        
    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg:
            return """⚠️ **AI Advisor Temporarily Unavailable**

The AI service is currently experiencing high demand. Please try again in a few minutes.

In the meantime, you can:
- Explore our comprehensive Learning section
- Use the Compare tool for stock analysis
- Check the latest market news

**Educational Tip:** While waiting, consider learning about fundamental analysis in our Learning section to better understand how to evaluate stocks yourself!

**This is an educational platform, not investment tips**"""
        
        return f"""**Educational Response Available**

I understand you're asking about investment analysis. Here's how you can approach this educationally:

## 📚 Key Analysis Methods

**Fundamental Analysis:**
- P/E Ratio: Compare with industry average
- ROE: Look for consistent 15%+ returns
- Debt-to-Equity: Lower is generally better
- Revenue Growth: Check 3-5 year trends

**Technical Analysis:**
- Support/Resistance levels
- Moving averages (50-day, 200-day)
- Volume patterns
- RSI and MACD indicators

**Risk Assessment:**
- Sector diversification
- Company-specific risks
- Market conditions
- Your risk tolerance

## 🔍 How to Research

1. **Company Annual Reports**: Read the management discussion
2. **Financial Websites**: Use screeners and comparison tools
3. **Industry Analysis**: Understand sector trends
4. **News and Updates**: Stay informed about developments

## ⚠️ Important Disclaimer
**This is an educational platform, not investment tips.** Always consult qualified financial advisors and do your own research before making investment decisions.

*Note: Technical issue occurred, but educational guidance provided above.*"""

def add_educational_disclaimer(response_text):
    """Add educational disclaimer to responses"""
    disclaimer = """

---
**📚 Educational Disclaimer:** This is an educational platform, not investment tips. This analysis is for educational purposes only and should not be considered as financial advice. Always conduct your own research and consult with qualified financial advisors before making investment decisions. Past performance does not guarantee future results."""
    
    return response_text + disclaimer


def get_ui_landing_stocks():
    try:
        from nsepython import nse_get_top_gainers
        df = nse_get_top_gainers()
        stock_data = []
        
        if not df.empty:
            # Take top 4
            for _, row in df.head(4).iterrows():
                symbol = row['symbol']
                company_name = row.get('meta', {}).get('companyName', symbol)
                stock_data.append({
                    "name": company_name,
                    "symbol": symbol,
                    "price": round(float(row['lastPrice']), 2),
                    "change": round(float(row['pChange']), 2),
                    "vol": str(round(float(row['totalTradedVolume'])/1000000, 1)) + "M"
                })
            return stock_data
    except Exception as e:
        print(f"NSE Python Error: {e}")

    # Fallback to yfinance if NSE fails
    tickers = ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS"]
    stock_data = []
    
    for symbol in tickers:
        try:
            stock = yf.Ticker(symbol)
            hist = stock.history(period="2d")
            if not hist.empty and len(hist) >= 2:
                current_price = hist['Close'].iloc[-1]
                prev_price = hist['Close'].iloc[-2]
                change_pct = ((current_price - prev_price) / prev_price) * 100
                
                stock_data.append({
                    "name": stock.info.get('longName', symbol.split('.')[0]),
                    "symbol": symbol.split('.')[0],
                    "price": round(current_price, 2),
                    "change": round(change_pct, 2),
                    "vol": "12.5M"
                })
        except:
            continue
    return stock_data


def get_live_ipo_data():
    # Primary URL for 2025/2026 listings
    url = "https://www.chittorgarh.com/report/ipo-in-india-list-main-board-sme/82/all/?year=2025"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9"
    }

    try:
        response = requests.get(url, headers=headers, timeout=15)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Look for the specific table ID often used by Chittorgarh
        table = soup.find('table', {'class': 'table-striped'}) or soup.find('table')
        
        if not table:
            raise ValueError("Table not found")

        ipos = []
        rows = table.find_all('tr')[1:8] # Get the most recent 7 entries
        
        for row in rows:
            cols = row.find_all('td')
            if len(cols) >= 3:
                ipos.append({
                    "name": cols[0].text.strip().replace(" IPO", ""),
                    "open": cols[1].text.strip(),
                    "close": cols[2].text.strip(),
                    "type": "SME" if "SME" in cols[0].text else "Mainboard",
                    "status": "Closing Soon" if "Dec 26" in cols[2].text else "Upcoming"
                })
        return ipos

    except Exception:
        # FALLBACK DATA: Current Market Status as of Dec 28, 2025
        return [
            {"name": "Modern Diagnostic", "open": "Dec 31, 2025", "close": "Jan 02, 2026", "type": "SME", "status": "Opening Soon"},
            {"name": "E to E Transportation", "open": "Dec 26, 2025", "close": "Dec 30, 2025", "type": "SME", "status": "Open"},
            {"name": "Bharat Coking Coal", "open": "Jan 2026", "close": "TBA", "type": "Mainboard", "status": "Upcoming"},
            {"name": "Reliance Jio", "open": "H1 2026", "close": "TBA", "type": "Mainboard", "status": "Planned"}
        ]

def get_ui_landing_stocks():
    try:
        from nsepython import nse_get_top_gainers
        df = nse_get_top_gainers()
        stock_data = []
        
        if not df.empty:
            # Take top 4
            for _, row in df.head(4).iterrows():
                symbol = row['symbol']
                company_name = row.get('meta', {}).get('companyName', symbol)
                stock_data.append({
                    "name": company_name,
                    "symbol": symbol,
                    "price": round(float(row['lastPrice']), 2),
                    "change": round(float(row['pChange']), 2),
                    "vol": str(round(float(row['totalTradedVolume'])/1000000, 1)) + "M"
                })
            return stock_data
    except Exception as e:
        print(f"NSE Python Error: {e}")

    # Fallback to yfinance if NSE fails
    tickers = ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS"]
    stock_data = []
    
    for symbol in tickers:
        try:
            stock = yf.Ticker(symbol)
            hist = stock.history(period="2d")
            if not hist.empty and len(hist) >= 2:
                current_price = hist['Close'].iloc[-1]
                prev_price = hist['Close'].iloc[-2]
                change_pct = ((current_price - prev_price) / prev_price) * 100
                
                stock_data.append({
                    "name": stock.info.get('longName', symbol.split('.')[0]),
                    "symbol": symbol.split('.')[0],
                    "price": round(current_price, 2),
                    "change": round(change_pct, 2),
                    "vol": "12.5M"
                })
        except:
            continue
    return stock_data


def get_live_ipo_data():
    # Primary URL for 2025/2026 listings
    url = "https://www.chittorgarh.com/report/ipo-in-india-list-main-board-sme/82/all/?year=2025"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9"
    }

    try:
        response = requests.get(url, headers=headers, timeout=15)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Look for the specific table ID often used by Chittorgarh
        table = soup.find('table', {'class': 'table-striped'}) or soup.find('table')
        
        if not table:
            raise ValueError("Table not found")

        ipos = []
        rows = table.find_all('tr')[1:8] # Get the most recent 7 entries
        
        for row in rows:
            cols = row.find_all('td')
            if len(cols) >= 3:
                ipos.append({
                    "name": cols[0].text.strip().replace(" IPO", ""),
                    "open": cols[1].text.strip(),
                    "close": cols[2].text.strip(),
                    "type": "SME" if "SME" in cols[0].text else "Mainboard",
                    "status": "Closing Soon" if "Dec 26" in cols[2].text else "Upcoming"
                })
        return ipos

    except Exception:
        # FALLBACK DATA: Current Market Status as of Dec 28, 2025
        return [
            {"name": "Modern Diagnostic", "open": "Dec 31, 2025", "close": "Jan 02, 2026", "type": "SME", "status": "Opening Soon"},
            {"name": "E to E Transportation", "open": "Dec 26, 2025", "close": "Dec 30, 2025", "type": "SME", "status": "Open"},
            {"name": "Bharat Coking Coal", "open": "Jan 2026", "close": "TBA", "type": "Mainboard", "status": "Upcoming"},
            {"name": "Reliance Jio", "open": "H1 2026", "close": "TBA", "type": "Mainboard", "status": "Planned"}
        ]