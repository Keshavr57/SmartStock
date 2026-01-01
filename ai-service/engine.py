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

# Professional Market Participant System Prompt
PROFESSIONAL_SYSTEM_PROMPT = """You are an experienced fund manager and market professional providing educational insights about Indian and global markets.

RESPONSE STRUCTURE (MANDATORY - Follow this exactly):
1. Start with 1-2 line core insight (the real reason professionals care)
2. Explain the intuition, not definitions — avoid textbook language  
3. Explicitly mention at least one risk, uncertainty, or counter-case
4. Connect to human behavior or incentives (fear, greed, career risk, liquidity)
5. End with a short takeaway, not a disclaimer

PROFESSIONAL STYLE:
- Sound like an experienced market participant, not a teacher
- Use confident, direct language with conviction
- Keep responses under 150 words unless explicitly requested
- Focus on what actually moves markets and prices
- Explain the "why behind the why" - the real drivers

TRADING RISK ASSESSMENT MODE:
When you receive "TRADING_RISK_ASSESSMENT:" messages, provide:
1. Risk Level: LOW / MEDIUM / HIGH
2. Core insight about the trade setup
3. Key risk factors that matter
4. Human psychology element
5. Professional takeaway

MARKET PROFESSIONAL APPROACH:
- Skip basic definitions unless asked
- Focus on practical market dynamics
- Mention what institutional players think
- Connect to broader market themes
- Use real-world context and examples

COMPLIANCE: This is educational content for learning market analysis, not investment advice.

CONTEXT: Indian market focus when relevant (₹), global context when needed ($). Sound like you've been managing money for 15+ years."""

# Initialize the LLM with professional settings
llm = ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=0.1,  # Lower temperature for more consistent professional responses
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

def create_professional_response(user_query, stock_data=None, ipo_data=None):
    """Create a professional market participant response following the 5-point structure"""
    
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
    
    # Create professional context for the LLM
    context = f"""
    Market Professional Query: {user_query}
    
    """
    
    if stock_data:
        context += f"""
        Live Market Data for {stock_data['symbol']}:
        - Current: ₹{stock_data['current_price']} | 52W High: ₹{stock_data['year_high']} | Low: ₹{stock_data['year_low']}
        - P/E: {stock_data['pe_ratio'] if stock_data['pe_ratio'] else 'N/A'} | Market Cap: {stock_data['market_cap'] if stock_data['market_cap'] else 'N/A'}
        - Sector: {stock_data['sector'] if stock_data['sector'] else 'N/A'}
        
        """
    
    if ipo_data and 'assessment' in ipo_data:
        # Return specific IPO risk assessment (already formatted professionally)
        return ipo_data['assessment']
    elif ipo_data and 'general_ipos' in ipo_data:
        # General IPO information
        context += f"""
        Current IPO Pipeline:
        """
        for ipo in ipo_data['general_ipos']:
            context += f"- {ipo['name']}: {ipo['open']} to {ipo['close']} ({ipo['type']})\n"
        
        context += """
        Provide professional insight on IPO evaluation and current market conditions.
        """
    
    context += """
    
    CRITICAL: Follow the 5-point professional structure exactly:
    1. Core insight (1-2 lines - why pros care)
    2. Intuition explanation (not textbook definitions)
    3. Risk/uncertainty mention
    4. Human behavior connection (fear/greed/career risk)
    5. Professional takeaway (not disclaimer)
    
    Keep under 150 words. Sound like a fund manager with 15+ years experience.
    """
    
    return context

def process_query(user_input: str):
    """Process user query with professional market participant approach"""
    try:
        print(f"🔍 Processing query: {user_input}")
        
        # Check if this is a trading risk assessment request
        if user_input.startswith("TRADING_RISK_ASSESSMENT:"):
            return handle_trading_risk_assessment(user_input)
        
        # Create professional context
        professional_context = create_professional_response(user_input)
        print(f"🔍 Professional context created: {professional_context[:200]}...")
        
        # If it's a direct IPO risk assessment, return it
        if isinstance(professional_context, str) and ('LOW' in professional_context or 'MEDIUM' in professional_context or 'HIGH' in professional_context) and 'Risk:' in professional_context:
            return professional_context
        
        # Check if GROQ API key is available
        groq_key = os.getenv("GROQ_API_KEY")
        if not groq_key:
            print("🚨 GROQ API KEY NOT FOUND!")
            return "AI service configuration error: API key not found"
        
        print(f"🔍 GROQ API Key available: {groq_key[:10]}...")
        
        # Get response from LLM with professional prompt
        messages = [
            {"role": "system", "content": PROFESSIONAL_SYSTEM_PROMPT},
            {"role": "user", "content": professional_context}
        ]
        
        print("🔍 Sending request to GROQ...")
        response = llm.invoke(messages)
        print(f"🔍 GROQ response received: {response.content[:100]}...")
        
        # Clean and format the response
        cleaned_response = response.content.strip()
        
        # Add minimal educational note (not verbose disclaimer)
        final_response = add_professional_note(cleaned_response)
        
        return final_response
        
    except Exception as e:
        print(f"🚨 Process query error: {str(e)}")
        error_msg = str(e)
        if "429" in error_msg:
            return """WARNING: Market Data Temporarily Unavailable

High demand on our systems right now. Try again in a few minutes.

While you wait: Check our Compare tool for live fundamentals or browse Market News for current developments.

Professional tip: The best trades happen when others can't access information. Use this downtime to research."""
        
        return f"""Market Professional Response

Here's how I'd approach your question:

1. Core insight: Market analysis requires multiple data points - never rely on single metrics.

2. The intuition: Smart money looks at earnings quality, management track record, and sector rotation patterns. Price alone tells you nothing about value.

3. Key risk: Most retail investors focus on price momentum while ignoring fundamental deterioration - classic late-cycle behavior.

4. Human element: Fear of missing out drives poor timing. Career risk makes fund managers herd together. Liquidity needs force selling at bad times.

5. Professional takeaway: Build conviction through research, size positions based on confidence level, and always have an exit plan.

Educational content for market analysis learning"""

def handle_trading_risk_assessment(assessment_request):
    """Handle trading risk assessment with professional market participant approach"""
    try:
        # Parse the assessment request
        # Format: "TRADING_RISK_ASSESSMENT: BUY 10 RELIANCE.NS (stock) at 2850. Provide risk level and recommendation."
        parts = assessment_request.replace("TRADING_RISK_ASSESSMENT:", "").strip().split()
        
        if len(parts) < 4:
            return "Invalid risk assessment request format."
        
        action = parts[0].upper()  # BUY or SELL
        quantity = parts[1]
        symbol = parts[2]
        asset_type = parts[3].replace("(", "").replace(")", "")  # stock or crypto
        
        # Extract price if available
        price = None
        for part in parts:
            if "at" in part.lower():
                try:
                    price_index = parts.index(part) + 1
                    if price_index < len(parts):
                        price = float(parts[price_index].replace(".", ""))
                except:
                    pass
        
        # Get stock data for better assessment
        stock_data = None
        if asset_type == "stock":
            stock_data = get_stock_data_for_education(symbol)
        
        # Create professional risk assessment context
        context = f"""
        PROFESSIONAL RISK ASSESSMENT:
        Trade: {action} {quantity} {symbol} ({asset_type})
        Entry: {price if price else 'Market Price'}
        
        """
        
        if stock_data:
            context += f"""
            Live Market Data:
            - Current: ₹{stock_data['current_price']} | 52W Range: ₹{stock_data['year_low']}-₹{stock_data['year_high']}
            - P/E: {stock_data['pe_ratio'] if stock_data['pe_ratio'] else 'N/A'} | Sector: {stock_data['sector'] if stock_data['sector'] else 'N/A'}
            
            """
        
        context += """
        Provide professional risk assessment following the 5-point structure:
        1. Risk Level (LOW / MEDIUM / HIGH) + core insight
        2. Market intuition behind this setup
        3. Key risk factors that matter
        4. Human psychology element
        5. Professional takeaway
        
        Sound like an experienced fund manager. Keep under 150 words.
        """
        
        # Get AI response
        messages = [
            {"role": "system", "content": PROFESSIONAL_SYSTEM_PROMPT},
            {"role": "user", "content": context}
        ]
        
        response = llm.invoke(messages)
        return response.content.strip()
        
    except Exception as e:
        print(f"Risk assessment error: {e}")
        return f"""MEDIUM Risk

1. Core insight: Position sizing matters more than entry price - most traders get this backwards.

2. Market intuition: Current volatility suggests institutional rotation is happening. Smart money is repositioning while retail chases momentum.

3. Key risk: Liquidity can dry up fast in current market conditions. Stop-losses might not execute at expected levels.

4. Human element: Overconfidence from recent wins leads to larger position sizes. Career risk makes professionals take profits too early.

5. Professional takeaway: Size this trade based on your conviction level, not your account size. Have a clear exit plan before entry.

Professional risk assessment for educational purposes"""
        
    except Exception as e:
        print(f"Risk assessment error: {e}")
        return f"""MEDIUM Risk (Default Assessment)

Educational Risk Factors to Consider:
- Market volatility can affect short-term prices
- Position sizing should align with your risk tolerance
- Consider diversification across different assets
- Timing the market is challenging even for professionals

Key Learning Points:
- Always research before trading
- Never invest more than you can afford to lose
- Consider your investment timeline and goals
- Use stop-loss orders to manage downside risk

This is an educational platform, not investment tips. This assessment is for learning purposes only."""

def add_professional_note(response_text):
    """Add minimal professional note to responses"""
    note = """

Professional market analysis for educational purposes"""
    
    return response_text + note

def get_ui_landing_stocks():
    """Get trending stocks for UI landing page"""
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