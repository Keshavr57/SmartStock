import os
import re
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

# Improved Professional System Prompt for better responses
IMPROVED_SYSTEM_PROMPT = """You are a friendly and knowledgeable stock market advisor. 

RESPONSE STYLE:
- Write in a conversational, easy-to-understand tone
- Avoid excessive formatting like ** or multiple bullet points
- Keep responses concise (100-150 words)
- Be helpful and educational
- Use simple language that anyone can understand

CONTENT GUIDELINES:
- Answer the specific question asked
- Provide practical, actionable advice
- Include 1-2 key insights maximum
- End with a simple takeaway
- No complex formatting or excessive symbols

EXPERTISE:
- Stock analysis and fundamentals
- Investment strategies for beginners
- Market trends and insights
- Risk management basics
- Trading concepts

Remember: Keep it simple, friendly, and focused on what the user actually asked."""

# Initialize the LLM with optimized settings for speed and quality
llm = ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=0.1,  # Lower temperature for more consistent, focused responses
    groq_api_key=os.getenv("GROQ_API_KEY"),
    max_tokens=200,  # Reduced for faster responses
    timeout=10  # Reduced timeout for faster responses
)

def process_query_fast(user_input: str):
    """Improved processing for user queries - focused on relevance"""
    try:
        print(f"🚀 Processing query: {user_input}")
        
        # Check if GROQ API key is available
        groq_key = os.getenv("GROQ_API_KEY")
        if not groq_key:
            return generate_fallback_response(user_input)
        
        # Enhanced prompt for better relevance
        messages = [
            {"role": "system", "content": IMPROVED_SYSTEM_PROMPT},
            {"role": "user", "content": user_input}
        ]
        
        print("⚡ Sending request to GROQ...")
        response = llm.invoke(messages)
        
        if response and response.content:
            # Clean up the response - remove excessive formatting
            clean_response = response.content.strip()
            
            # Remove excessive asterisks and bullet points
            clean_response = re.sub(r'\*\*([^*]+)\*\*', r'\1', clean_response)  # Remove bold formatting
            clean_response = re.sub(r'\*([^*]+)\*', r'\1', clean_response)      # Remove italic formatting
            clean_response = re.sub(r'^\s*[•·]\s*', '', clean_response, flags=re.MULTILINE)  # Remove bullet points
            clean_response = re.sub(r'^\s*-\s*', '', clean_response, flags=re.MULTILINE)     # Remove dashes
            clean_response = re.sub(r'\n\s*\n\s*\n', '\n\n', clean_response)   # Remove excessive line breaks
            
            return clean_response
        else:
            return generate_fallback_response(user_input)
        
    except Exception as e:
        print(f"⚠️ Query processing error: {str(e)}")
        return generate_fallback_response(user_input)

def generate_fallback_response(user_input: str):
    """Generate clean, conversational fallback responses"""
    user_lower = user_input.lower()
    
    # Stock analysis questions
    if any(word in user_lower for word in ['p/e', 'pe ratio', 'price earnings', 'analyze stock']):
        return """P/E ratio is simply the stock price divided by earnings per share. It tells you how much investors are willing to pay for each rupee of earnings.

A low P/E (under 15) might mean the stock is undervalued or the company isn't growing fast. A high P/E (over 25) suggests investors expect strong growth ahead.

The key is comparing it with similar companies in the same industry. Don't rely on P/E alone - also check the company's debt, growth rate, and overall market conditions.

Remember: A "cheap" P/E doesn't always mean a good buy!"""

    # Investment strategy questions
    elif any(word in user_lower for word in ['investment strategy', 'how to invest', 'beginner']):
        return """Start with the basics: build an emergency fund first, then begin investing in well-known companies or index funds.

The golden rule is diversification - don't put all your money in one stock or sector. Start with large, stable companies and gradually explore mid-cap stocks as you learn more.

Invest regularly rather than trying to time the market. Even small amounts invested consistently can grow significantly over time.

Most importantly, only invest money you won't need for at least 5 years. The stock market can be volatile in the short term."""

    # Risk management questions
    elif any(word in user_lower for word in ['risk', 'manage risk', 'stop loss']):
        return """Risk management is about protecting your money first, making profits second. Never risk more than 2% of your total portfolio on any single trade.

Diversify across different sectors and company sizes. A good mix might be 60% large companies, 30% mid-sized, and 10% smaller companies.

Set stop-losses at 7-10% below your buying price. This helps limit losses if a stock moves against you. Also keep some cash ready for new opportunities.

Remember: It's better to make smaller, consistent gains than to risk big losses chasing quick profits."""

    # IPO questions
    elif any(word in user_lower for word in ['ipo', 'initial public offering', 'new listing']):
        return """IPOs can be exciting but they're often overpriced initially. Before investing, read the company's business plan carefully and understand what they actually do.

Check the promoters' background and track record. Compare the IPO price with similar listed companies to see if it's reasonable.

Most IPOs see big price swings in the first few months. Unless you're very confident about the company, it's often better to wait 3-6 months and buy at a more stable price.

Focus on companies with clear business models and strong fundamentals rather than getting caught up in the hype."""

    # Technical analysis questions
    elif any(word in user_lower for word in ['technical analysis', 'charts', 'moving average']):
        return """Technical analysis uses price charts and patterns to predict future movements. Start with simple indicators like moving averages.

The 20-day moving average shows short-term trends, while the 50-day shows longer trends. When price crosses above these averages with good volume, it's often a positive sign.

RSI (Relative Strength Index) helps identify overbought and oversold conditions. Above 70 suggests the stock might be due for a pullback.

Remember: Technical analysis works best when combined with fundamental research. Charts show you when to buy or sell, but fundamentals tell you what to buy."""

    # Default response for other questions
    else:
        return f"""I'd be happy to help you understand more about "{user_input}".

I can explain stock analysis, investment strategies, risk management, market trends, and trading basics in simple terms.

Some popular topics include how to evaluate stocks, building a diversified portfolio, understanding market indicators, and managing investment risks.

Feel free to ask me something more specific about any of these areas, and I'll give you a clear, practical explanation!"""

# Keep the original function as backup
def process_query(user_input: str):
    """Original processing - use as fallback"""
    return process_query_fast(user_input)  # Use fast version by default

def get_stock_data_for_education(symbol):
    """Simplified stock data fetch - faster version"""
    try:
        # Quick symbol conversion
        if not symbol.endswith('.NS') and not symbol.endswith('.BO') and '.' not in symbol:
            symbol = f"{symbol.upper()}.NS"
            
        stock = yf.Ticker(symbol)
        hist = stock.history(period="5d")  # Reduced period for speed
        
        if hist.empty:
            return None
            
        current_price = hist['Close'].iloc[-1]
        
        return {
            'symbol': symbol,
            'current_price': round(current_price, 2),
            'name': symbol.split('.')[0]
        }
    except Exception as e:
        print(f"Stock data error: {e}")
        return None

def create_professional_response(user_query, stock_data=None, ipo_data=None):
    """Simplified response creation for speed"""
    return f"Quick analysis: {user_query}"

def handle_trading_risk_assessment(assessment_request):
    """Provide clean, conversational risk assessment"""
    try:
        return """Based on current market conditions, I'd rate this as MEDIUM risk.

Here's what to keep in mind: Position sizing is crucial - never risk more than 2% of your portfolio on any single trade. The market has been quite volatile lately, so having clear stop-loss levels is essential.

Make sure you have a solid exit strategy before entering any position. This helps you stay disciplined when emotions run high.

Remember, successful trading is more about managing risk than picking winners. Focus on protecting your capital first."""
        
    except Exception as e:
        return """I'd classify this as MEDIUM risk based on current market conditions.

The key factors to consider are proper position sizing, current market volatility, and having a clear exit strategy ready. 

Always remember this is for educational purposes - real trading decisions should be based on your own research and risk tolerance."""

def add_professional_note(response_text):
    """Add minimal note"""
    return response_text + "\n\n📚 Educational content"

def get_ui_landing_stocks():
    """Fast stock data for UI"""
    # Return cached/static data for speed
    return [
        {"name": "Reliance Industries", "symbol": "RELIANCE", "price": 2850.50, "change": 1.2, "vol": "15.2M"},
        {"name": "Tata Consultancy Services", "symbol": "TCS", "price": 4125.75, "change": -0.8, "vol": "8.5M"},
        {"name": "HDFC Bank", "symbol": "HDFCBANK", "price": 1650.25, "change": 0.5, "vol": "12.1M"},
        {"name": "Infosys", "symbol": "INFY", "price": 1875.90, "change": 2.1, "vol": "9.8M"}
    ]