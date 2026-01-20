import os
import re
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
import yfinance as yf
import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime, timedelta
from ipo_service import get_current_ipos, get_ipo_risk_assessment

# Load Environment Variables
load_dotenv()

# Enhanced Financial Knowledge Base for RAG
FINANCIAL_KNOWLEDGE_BASE = {
    "stock_analysis": {
        "pe_ratio": "P/E ratio shows how much investors pay for each rupee of earnings. Compare with industry peers. Low P/E (<15) might indicate undervaluation, high P/E (>25) suggests growth expectations.",
        "pb_ratio": "Price-to-Book ratio compares stock price to book value. Below 1 might indicate undervaluation, but check if assets are actually valuable.",
        "debt_equity": "Debt-to-Equity ratio shows financial leverage. Lower is generally better. Above 1 means more debt than equity.",
        "roe": "Return on Equity measures profitability. Above 15% is good, above 20% is excellent for most industries.",
        "revenue_growth": "Consistent revenue growth over 3-5 years indicates healthy business expansion.",
        "profit_margins": "Net profit margin above 10% is good for most industries. Compare with competitors."
    },
    "investment_strategies": {
        "sip": "Systematic Investment Plan helps average out market volatility. Invest fixed amount regularly regardless of market conditions.",
        "diversification": "Spread investments across 15-20 stocks, different sectors, and market caps to reduce risk.",
        "value_investing": "Buy undervalued stocks with strong fundamentals and hold long-term. Focus on P/E, P/B, and debt ratios.",
        "growth_investing": "Invest in companies with high growth potential. Look for revenue growth, expanding markets, innovation.",
        "index_funds": "Passive investment in market indices. Low cost, instant diversification, matches market returns."
    },
    "risk_management": {
        "position_sizing": "Never invest more than 5-10% in single stock. Limit sector exposure to 20-25%.",
        "stop_loss": "Set stop-loss at 7-10% below purchase price to limit losses. Stick to it emotionally.",
        "asset_allocation": "Typical allocation: 60% large-cap, 25% mid-cap, 15% small-cap for balanced risk.",
        "emergency_fund": "Keep 6 months expenses in liquid funds before investing in stocks.",
        "rebalancing": "Review and rebalance portfolio quarterly to maintain target allocation."
    },
    "market_concepts": {
        "bull_market": "Rising market with investor optimism. Good time to hold quality stocks, avoid speculation.",
        "bear_market": "Falling market with pessimism. Opportunity to buy quality stocks at discount.",
        "volatility": "Price fluctuations are normal. Focus on fundamentals, not daily price movements.",
        "market_cap": "Large-cap (>₹20,000 cr) stable, mid-cap (₹5,000-20,000 cr) growth, small-cap (<₹5,000 cr) high risk-reward."
    }
}

# Enhanced System Prompt with RAG capabilities
ENHANCED_SYSTEM_PROMPT = """You are an expert Indian stock market advisor with deep knowledge of NSE, BSE, and Indian financial markets.

PERSONALITY:
- Friendly, conversational, and educational
- Use simple language that beginners can understand
- Be specific to Indian markets (NSE, BSE, Indian companies)
- Provide actionable advice with clear reasoning

RESPONSE GUIDELINES:
- Keep responses 150-200 words maximum
- Use Indian examples (Reliance, TCS, HDFC Bank, etc.)
- Include specific numbers and ratios when relevant
- End with a practical takeaway or next step
- Use Indian currency (₹) and Indian market context

EXPERTISE AREAS:
- Fundamental analysis (P/E, P/B, ROE, Debt/Equity)
- Indian stock recommendations and analysis
- SIP and mutual fund strategies
- Risk management for Indian investors
- IPO analysis and recommendations
- Market timing and technical analysis
- Tax implications (LTCG, STCG)

IMPORTANT:
- Always mention this is for educational purposes
- Encourage users to do their own research
- Focus on long-term wealth creation
- Emphasize risk management

Current date: {current_date}
Indian market context: Focus on NSE/BSE listed companies, Indian regulations, and INR currency."""

# Initialize enhanced LLM
llm = ChatGroq(
    model="llama-3.1-8b-instant",  # Using supported model
    temperature=0.3,  # Balanced creativity and consistency
    groq_api_key=os.getenv("GROQ_API_KEY"),
    max_tokens=300,
    timeout=15
)

def get_relevant_knowledge(user_query):
    """RAG: Retrieve relevant knowledge from knowledge base"""
    query_lower = user_query.lower()
    relevant_info = []
    
    # Search through knowledge base
    for category, items in FINANCIAL_KNOWLEDGE_BASE.items():
        for key, value in items.items():
            # Check if query contains relevant keywords
            keywords = key.replace('_', ' ').split()
            if any(keyword in query_lower for keyword in keywords):
                relevant_info.append(f"{key.replace('_', ' ').title()}: {value}")
    
    # Add current market context
    if any(word in query_lower for word in ['market', 'nifty', 'sensex', 'index']):
        relevant_info.append("Current Market Context: Indian markets (Nifty 50, Sensex) have shown resilience. Focus on quality stocks with strong fundamentals.")
    
    return relevant_info[:3]  # Limit to top 3 most relevant pieces

def get_stock_context(user_query):
    """Get real stock data if specific stocks mentioned"""
    indian_stocks = {
        'reliance': 'RELIANCE.NS',
        'tcs': 'TCS.NS', 
        'hdfc': 'HDFCBANK.NS',
        'infosys': 'INFY.NS',
        'sbi': 'SBIN.NS',
        'icici': 'ICICIBANK.NS',
        'bharti': 'BHARTIARTL.NS',
        'itc': 'ITC.NS'
    }
    
    query_lower = user_query.lower()
    stock_data = []
    
    for stock_name, symbol in indian_stocks.items():
        if stock_name in query_lower:
            try:
                stock = yf.Ticker(symbol)
                info = stock.info
                hist = stock.history(period="5d")
                
                if not hist.empty:
                    current_price = hist['Close'].iloc[-1]
                    pe_ratio = info.get('trailingPE', 'N/A')
                    market_cap = info.get('marketCap', 'N/A')
                    
                    stock_data.append(f"{stock_name.upper()}: ₹{current_price:.2f}, P/E: {pe_ratio}, Market Cap: {market_cap}")
            except:
                continue
                
    return stock_data

def process_query_with_rag(user_input: str):
    """Enhanced query processing with RAG and conversation memory"""
    try:
        print(f"🚀 Processing RAG query: {user_input}")
        
        # Check GROQ API key
        groq_key = os.getenv("GROQ_API_KEY")
        if not groq_key:
            return generate_enhanced_fallback(user_input)
        
        # Get relevant knowledge from RAG
        relevant_knowledge = get_relevant_knowledge(user_input)
        stock_context = get_stock_context(user_input)
        
        # Build enhanced context
        context_parts = []
        if relevant_knowledge:
            context_parts.append("Relevant Information:\n" + "\n".join(relevant_knowledge))
        if stock_context:
            context_parts.append("Current Stock Data:\n" + "\n".join(stock_context))
            
        context = "\n\n".join(context_parts) if context_parts else ""
        
        # Create enhanced prompt
        current_date = datetime.now().strftime("%Y-%m-%d")
        system_prompt = ENHANCED_SYSTEM_PROMPT.format(current_date=current_date)
        
        if context:
            enhanced_query = f"Context: {context}\n\nUser Question: {user_input}\n\nProvide a helpful response using the context above."
        else:
            enhanced_query = user_input
        
        # Create conversation with messages
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=enhanced_query)
        ]
        
        print("⚡ Sending enhanced request to GROQ...")
        response = llm.invoke(messages)
        
        if response and response.content:
            # Clean and format response
            clean_response = clean_ai_response(response.content)
            
            # Add educational disclaimer
            clean_response += "\n\n📚 This is for educational purposes. Always do your own research before investing."
            
            return clean_response
        else:
            return generate_enhanced_fallback(user_input)
        
    except Exception as e:
        print(f"⚠️ RAG processing error: {str(e)}")
        return generate_enhanced_fallback(user_input)

def clean_ai_response(response_text):
    """Clean and format AI response"""
    # Remove excessive formatting
    clean_text = re.sub(r'\*\*([^*]+)\*\*', r'\1', response_text)
    clean_text = re.sub(r'\*([^*]+)\*', r'\1', clean_text)
    clean_text = re.sub(r'^\s*[•·-]\s*', '', clean_text, flags=re.MULTILINE)
    clean_text = re.sub(r'\n\s*\n\s*\n', '\n\n', clean_text)
    
    return clean_text.strip()

def generate_enhanced_fallback(user_input):
    """Enhanced fallback with more specific responses"""
    user_lower = user_input.lower()
    
    # Specific stock queries
    if 'reliance' in user_lower:
        return """Reliance Industries (RIL) is India's largest private sector company with interests in oil refining, petrochemicals, and retail.

Key strengths: Strong cash flows, diversified business model, and growing digital (Jio) and retail segments. The company has been reducing debt and improving margins.

Investment perspective: RIL trades at reasonable valuations compared to its historical averages. The retail and digital businesses are showing strong growth potential.

Consider: Check latest quarterly results, oil price trends, and retail expansion plans before investing. RIL is suitable for long-term investors seeking exposure to India's consumption story."""

    elif any(word in user_lower for word in ['tcs', 'infosys', 'it stocks']):
        return """Indian IT stocks like TCS and Infosys are global leaders in software services with strong fundamentals.

Key advantages: Consistent revenue growth, high profit margins (20%+), strong balance sheets, and regular dividends. They benefit from digital transformation globally.

Current scenario: IT stocks have corrected from highs, making valuations more attractive. Dollar strength also helps their revenues.

Investment approach: These are quality stocks suitable for long-term portfolios. Consider buying on dips and holding for 3-5 years. TCS has better margins, while Infosys offers higher growth potential."""

    elif any(word in user_lower for word in ['hdfc', 'banking', 'bank stocks']):
        return """HDFC Bank is India's largest private sector bank with excellent asset quality and consistent performance.

Strengths: Strong deposit franchise, superior technology, low NPAs, and consistent ROE above 17%. The bank has weathered multiple economic cycles well.

Recent developments: Merger with HDFC Ltd completed, creating India's largest mortgage lender. This brings scale but also integration challenges.

Investment view: HDFC Bank is a core holding for long-term investors. Current valuations are reasonable after recent corrections. Suitable for SIP investments over 5+ years."""

    elif any(word in user_lower for word in ['sip', 'systematic investment']):
        return """SIP (Systematic Investment Plan) is the best way for regular investors to build wealth in Indian markets.

How it works: Invest fixed amount monthly in mutual funds or stocks. This averages out market volatility and reduces timing risk.

Recommended approach: Start with Nifty 50 index funds (₹5,000-10,000 monthly), then add mid-cap funds as you gain experience.

Key benefits: Rupee cost averaging, disciplined investing, and power of compounding. Even ₹5,000 monthly can grow to ₹50+ lakhs in 15 years at 12% returns.

Start today: Don't wait for market corrections. Time in market beats timing the market."""

    elif any(word in user_lower for word in ['ipo', 'new listing']):
        return """IPO investing requires careful analysis of company fundamentals and valuation.

Key checks: Read the DRHP document, understand the business model, check promoter background, and compare valuations with listed peers.

Red flags: Avoid IPOs where promoters are selling large stakes, unclear business models, or excessive valuations compared to competitors.

Strategy: Most IPOs are overpriced initially. Consider waiting 3-6 months post-listing for price stabilization unless you're very confident about the company.

Current IPOs: Check our IPO section for detailed analysis of upcoming and current offerings with risk assessments."""

    else:
        return """I'm your AI advisor for Indian stock markets and investments!

I can help you with:
• Stock analysis (Reliance, TCS, HDFC Bank, etc.)
• Investment strategies (SIP, value investing, growth stocks)
• Risk management and portfolio building
• IPO analysis and recommendations
• Market insights and timing

Popular topics: "Analyze Reliance stock", "Best SIP strategy", "How to evaluate IPOs", "Banking stocks outlook"

Ask me anything specific about Indian stocks, mutual funds, or investment strategies. I'll provide practical, actionable advice tailored to Indian markets!"""

# Update main process_query function to use RAG
def process_query(user_input: str):
    """Main query processing function with RAG"""
    return process_query_with_rag(user_input)

# Keep existing functions for backward compatibility
def get_stock_data_for_education(symbol):
    """Get stock data for educational purposes"""
    try:
        if not symbol.endswith('.NS') and not symbol.endswith('.BO') and '.' not in symbol:
            symbol = f"{symbol.upper()}.NS"
            
        stock = yf.Ticker(symbol)
        hist = stock.history(period="5d")
        
        if hist.empty:
            return None
            
        current_price = hist['Close'].iloc[-1]
        info = stock.info
        
        return {
            'symbol': symbol,
            'current_price': round(current_price, 2),
            'name': info.get('longName', symbol.split('.')[0]),
            'pe_ratio': info.get('trailingPE'),
            'market_cap': info.get('marketCap')
        }
    except Exception as e:
        print(f"Stock data error: {e}")
        return None

def get_ui_landing_stocks():
    """Get stock data for UI landing page"""
    stocks = ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS']
    stock_data = []
    
    for symbol in stocks:
        try:
            stock = yf.Ticker(symbol)
            hist = stock.history(period="2d")
            
            if len(hist) >= 2:
                current_price = hist['Close'].iloc[-1]
                prev_price = hist['Close'].iloc[-2]
                change_pct = ((current_price - prev_price) / prev_price) * 100
                
                stock_data.append({
                    "name": symbol.replace('.NS', ''),
                    "symbol": symbol.replace('.NS', ''),
                    "price": round(current_price, 2),
                    "change": round(change_pct, 2),
                    "vol": f"{hist['Volume'].iloc[-1]/1000000:.1f}M"
                })
        except:
            continue
    
    return stock_data if stock_data else [
        {"name": "Reliance Industries", "symbol": "RELIANCE", "price": 2850.50, "change": 1.2, "vol": "15.2M"},
        {"name": "Tata Consultancy Services", "symbol": "TCS", "price": 4125.75, "change": -0.8, "vol": "8.5M"},
        {"name": "HDFC Bank", "symbol": "HDFCBANK", "price": 1650.25, "change": 0.5, "vol": "12.1M"},
        {"name": "Infosys", "symbol": "INFY", "price": 1875.90, "change": 2.1, "vol": "9.8M"}
    ]