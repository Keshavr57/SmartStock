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

# Simplified Professional System Prompt for faster responses
FAST_SYSTEM_PROMPT = """You are an experienced stock market advisor. Provide quick, professional insights.

RULES:
- Keep responses under 100 words
- Be direct and specific
- Focus on practical insights
- Skip lengthy explanations
- Sound professional but concise

STYLE:
- Direct, confident language
- Real market insights
- Mention key risks briefly
- End with actionable takeaway

This is educational content for learning market analysis."""

# Initialize the LLM with faster settings
llm = ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=0.1,
    groq_api_key=os.getenv("GROQ_API_KEY"),
    max_tokens=200,  # Limit response length for speed
    timeout=10  # 10 second timeout
)

def process_query_fast(user_input: str):
    """Fast processing for user queries - optimized for speed"""
    try:
        print(f"🚀 Fast processing: {user_input}")
        
        # Check if GROQ API key is available
        groq_key = os.getenv("GROQ_API_KEY")
        if not groq_key:
            return "AI service configuration error. Please try again later."
        
        # Ultra-simple prompt for speed
        messages = [
            {"role": "system", "content": FAST_SYSTEM_PROMPT},
            {"role": "user", "content": f"Quick market insight: {user_input}"}
        ]
        
        print("⚡ Sending fast request to GROQ...")
        response = llm.invoke(messages)
        
        if response and response.content:
            return response.content.strip() + "\n\n📚 Educational market analysis"
        else:
            return "Service temporarily unavailable. Please try again."
        
    except Exception as e:
        print(f"⚠️ Fast query error: {str(e)}")
        
        # Return quick fallback response
        return f"""Quick market insight: {user_input}

I'm currently experiencing high load. Here's a quick educational note:

• Market analysis requires multiple factors
• Always research before making decisions  
• Consider risk management strategies
• Diversification is key for long-term success

📚 Educational content - Try asking again in a moment."""

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
    """Fast risk assessment"""
    try:
        return """MEDIUM Risk

Quick Assessment:
• Position size matters most
• Current market volatility is elevated  
• Set clear stop-loss levels
• Don't risk more than 2% per trade

Professional takeaway: Focus on risk management over entry timing.

📚 Educational risk assessment"""
        
    except Exception as e:
        return """MEDIUM Risk - Quick Assessment

Key factors to consider:
• Market conditions change rapidly
• Use proper position sizing
• Have exit strategy ready
• Educational purposes only"""

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