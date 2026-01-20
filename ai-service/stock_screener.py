# Natural Language Stock Screener - Advanced Gen AI Feature
import yfinance as yf
import pandas as pd
import re
from typing import Dict, List, Optional
from datetime import datetime, timedelta

class NaturalLanguageStockScreener:
    def __init__(self):
        # Indian stock universe (top 200 stocks)
        self.indian_stocks = {
            # Large Cap
            'RELIANCE.NS': 'Reliance Industries',
            'TCS.NS': 'Tata Consultancy Services', 
            'HDFCBANK.NS': 'HDFC Bank',
            'INFY.NS': 'Infosys',
            'HINDUNILVR.NS': 'Hindustan Unilever',
            'ICICIBANK.NS': 'ICICI Bank',
            'SBIN.NS': 'State Bank of India',
            'BHARTIARTL.NS': 'Bharti Airtel',
            'ITC.NS': 'ITC',
            'KOTAKBANK.NS': 'Kotak Mahindra Bank',
            'LT.NS': 'Larsen & Toubro',
            'ASIANPAINT.NS': 'Asian Paints',
            'MARUTI.NS': 'Maruti Suzuki',
            'AXISBANK.NS': 'Axis Bank',
            'TITAN.NS': 'Titan Company',
            'SUNPHARMA.NS': 'Sun Pharmaceutical',
            'ULTRACEMCO.NS': 'UltraTech Cement',
            'NESTLEIND.NS': 'Nestle India',
            'WIPRO.NS': 'Wipro',
            'NTPC.NS': 'NTPC',
            'POWERGRID.NS': 'Power Grid Corporation',
            'TECHM.NS': 'Tech Mahindra',
            'HCLTECH.NS': 'HCL Technologies',
            'DRREDDY.NS': 'Dr. Reddy\'s Laboratories',
            'JSWSTEEL.NS': 'JSW Steel',
            'TATASTEEL.NS': 'Tata Steel',
            'INDUSINDBK.NS': 'IndusInd Bank',
            'BAJFINANCE.NS': 'Bajaj Finance',
            'BAJAJFINSV.NS': 'Bajaj Finserv',
            'ONGC.NS': 'Oil & Natural Gas Corporation',
            'COALINDIA.NS': 'Coal India',
            'GRASIM.NS': 'Grasim Industries',
            'BRITANNIA.NS': 'Britannia Industries',
            'CIPLA.NS': 'Cipla',
            'DIVISLAB.NS': 'Divi\'s Laboratories',
            'EICHERMOT.NS': 'Eicher Motors',
            'HEROMOTOCO.NS': 'Hero MotoCorp',
            'HINDALCO.NS': 'Hindalco Industries',
            'SHREECEM.NS': 'Shree Cement',
            'TATAMOTORS.NS': 'Tata Motors',
            'ADANIPORTS.NS': 'Adani Ports',
            'APOLLOHOSP.NS': 'Apollo Hospitals',
            'BPCL.NS': 'Bharat Petroleum',
            'IOC.NS': 'Indian Oil Corporation',
            'M&M.NS': 'Mahindra & Mahindra',
            'TATACONSUM.NS': 'Tata Consumer Products'
        }
        
        self.sector_mapping = {
            'technology': ['TCS.NS', 'INFY.NS', 'WIPRO.NS', 'HCLTECH.NS', 'TECHM.NS'],
            'banking': ['HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'KOTAKBANK.NS', 'AXISBANK.NS', 'INDUSINDBK.NS'],
            'finance': ['BAJFINANCE.NS', 'BAJAJFINSV.NS', 'HDFCBANK.NS', 'ICICIBANK.NS'],
            'fmcg': ['HINDUNILVR.NS', 'ITC.NS', 'NESTLEIND.NS', 'BRITANNIA.NS', 'TATACONSUM.NS'],
            'pharma': ['SUNPHARMA.NS', 'DRREDDY.NS', 'CIPLA.NS', 'DIVISLAB.NS', 'APOLLOHOSP.NS'],
            'auto': ['MARUTI.NS', 'TATAMOTORS.NS', 'EICHERMOT.NS', 'HEROMOTOCO.NS', 'M&M.NS'],
            'cement': ['ULTRACEMCO.NS', 'SHREECEM.NS', 'GRASIM.NS'],
            'steel': ['JSWSTEEL.NS', 'TATASTEEL.NS', 'HINDALCO.NS'],
            'oil': ['RELIANCE.NS', 'ONGC.NS', 'BPCL.NS', 'IOC.NS'],
            'telecom': ['BHARTIARTL.NS'],
            'power': ['NTPC.NS', 'POWERGRID.NS', 'COALINDIA.NS']
        }
    
    def parse_natural_query(self, query: str) -> Dict:
        """Parse natural language query into screening criteria"""
        query_lower = query.lower()
        criteria = {}
        
        # Extract P/E ratio criteria
        pe_match = re.search(r'p[/\-\s]*e\s*[<>=]+\s*(\d+(?:\.\d+)?)', query_lower)
        if pe_match:
            pe_value = float(pe_match.group(1))
            if '<' in pe_match.group(0):
                criteria['pe_max'] = pe_value
            elif '>' in pe_match.group(0):
                criteria['pe_min'] = pe_value
        
        # Extract ROE criteria
        roe_match = re.search(r'roe\s*[<>=]+\s*(\d+(?:\.\d+)?)', query_lower)
        if roe_match:
            roe_value = float(roe_match.group(1))
            if '<' in roe_match.group(0):
                criteria['roe_max'] = roe_value
            elif '>' in roe_match.group(0):
                criteria['roe_min'] = roe_value
        
        # Extract debt-to-equity criteria
        de_match = re.search(r'debt[/\-\s]*equity\s*[<>=]+\s*(\d+(?:\.\d+)?)', query_lower)
        if de_match:
            de_value = float(de_match.group(1))
            if '<' in de_match.group(0):
                criteria['debt_equity_max'] = de_value
            elif '>' in de_match.group(0):
                criteria['debt_equity_min'] = de_value
        
        # Extract market cap criteria
        if 'large cap' in query_lower or 'largecap' in query_lower:
            criteria['market_cap_min'] = 200000000000  # 2 lakh crore
        elif 'mid cap' in query_lower or 'midcap' in query_lower:
            criteria['market_cap_min'] = 50000000000   # 50k crore
            criteria['market_cap_max'] = 200000000000  # 2 lakh crore
        elif 'small cap' in query_lower or 'smallcap' in query_lower:
            criteria['market_cap_max'] = 50000000000   # 50k crore
        
        # Extract sector criteria
        for sector, stocks in self.sector_mapping.items():
            if sector in query_lower:
                criteria['sector'] = sector
                criteria['stocks_filter'] = stocks
                break
        
        # Extract growth criteria
        if 'growth' in query_lower:
            criteria['growth_focus'] = True
        
        if 'undervalued' in query_lower or 'cheap' in query_lower:
            criteria['value_focus'] = True
        
        # Extract dividend criteria
        if 'dividend' in query_lower:
            criteria['dividend_min'] = 1.0  # Minimum 1% dividend yield
        
        return criteria
    
    def screen_stocks(self, criteria: Dict) -> List[Dict]:
        """Screen stocks based on parsed criteria"""
        results = []
        stocks_to_check = criteria.get('stocks_filter', list(self.indian_stocks.keys()))
        
        for symbol in stocks_to_check[:20]:  # Limit to 20 stocks for performance
            try:
                stock_data = self._get_stock_fundamentals(symbol)
                if stock_data and self._meets_criteria(stock_data, criteria):
                    results.append(stock_data)
            except Exception as e:
                print(f"Error screening {symbol}: {e}")
                continue
        
        # Sort results by score (if available) or market cap
        results.sort(key=lambda x: x.get('score', x.get('market_cap', 0)), reverse=True)
        return results[:10]  # Return top 10 matches
    
    def _get_stock_fundamentals(self, symbol: str) -> Optional[Dict]:
        """Get fundamental data for a stock"""
        try:
            stock = yf.Ticker(symbol)
            info = stock.info
            hist = stock.history(period="1y")
            
            if hist.empty:
                return None
            
            current_price = hist['Close'].iloc[-1]
            
            # Calculate additional metrics
            returns = hist['Close'].pct_change().dropna()
            volatility = returns.std() * (252 ** 0.5)  # Annualized
            
            return {
                'symbol': symbol,
                'name': self.indian_stocks.get(symbol, info.get('longName', symbol)),
                'current_price': round(current_price, 2),
                'market_cap': info.get('marketCap'),
                'pe_ratio': info.get('trailingPE'),
                'pb_ratio': info.get('priceToBook'),
                'roe': info.get('returnOnEquity'),
                'debt_equity': info.get('debtToEquity'),
                'dividend_yield': info.get('dividendYield', 0) * 100 if info.get('dividendYield') else 0,
                'sector': info.get('sector', 'Unknown'),
                'volatility': round(volatility * 100, 2),
                'revenue_growth': info.get('revenueGrowth'),
                'profit_margins': info.get('profitMargins'),
                'book_value': info.get('bookValue'),
                'eps': info.get('trailingEps')
            }
        except Exception as e:
            print(f"Error getting data for {symbol}: {e}")
            return None
    
    def _meets_criteria(self, stock_data: Dict, criteria: Dict) -> bool:
        """Check if stock meets screening criteria"""
        # P/E ratio checks
        pe = stock_data.get('pe_ratio')
        if pe:
            if criteria.get('pe_max') and pe > criteria['pe_max']:
                return False
            if criteria.get('pe_min') and pe < criteria['pe_min']:
                return False
        
        # ROE checks
        roe = stock_data.get('roe')
        if roe:
            roe_pct = roe * 100  # Convert to percentage
            if criteria.get('roe_max') and roe_pct > criteria['roe_max']:
                return False
            if criteria.get('roe_min') and roe_pct < criteria['roe_min']:
                return False
        
        # Market cap checks
        market_cap = stock_data.get('market_cap')
        if market_cap:
            if criteria.get('market_cap_max') and market_cap > criteria['market_cap_max']:
                return False
            if criteria.get('market_cap_min') and market_cap < criteria['market_cap_min']:
                return False
        
        # Debt-to-equity checks
        debt_equity = stock_data.get('debt_equity')
        if debt_equity:
            if criteria.get('debt_equity_max') and debt_equity > criteria['debt_equity_max']:
                return False
            if criteria.get('debt_equity_min') and debt_equity < criteria['debt_equity_min']:
                return False
        
        # Dividend yield checks
        dividend_yield = stock_data.get('dividend_yield', 0)
        if criteria.get('dividend_min') and dividend_yield < criteria['dividend_min']:
            return False
        
        # Growth focus
        if criteria.get('growth_focus'):
            revenue_growth = stock_data.get('revenue_growth')
            if not revenue_growth or revenue_growth < 0.1:  # 10% growth
                return False
        
        # Value focus
        if criteria.get('value_focus'):
            pe = stock_data.get('pe_ratio')
            pb = stock_data.get('pb_ratio')
            if not pe or pe > 20:  # P/E should be reasonable for value
                return False
            if not pb or pb > 3:   # P/B should be reasonable for value
                return False
        
        return True
    
    def generate_screening_response(self, query: str) -> str:
        """Generate natural language response for stock screening"""
        try:
            criteria = self.parse_natural_query(query)
            
            if not criteria:
                return """I can help you screen stocks using natural language! Try queries like:

• "Find undervalued banking stocks with P/E < 15 and ROE > 18%"
• "Show me growth stocks in IT sector with revenue growth > 15%"
• "Large cap stocks with dividend yield > 2% and debt/equity < 0.5"
• "Mid cap pharma companies with P/E < 20"

I'll analyze fundamentals and find stocks matching your criteria. What type of stocks are you looking for?"""
            
            results = self.screen_stocks(criteria)
            
            if not results:
                return f"""No stocks found matching your criteria: {query}

Try adjusting your filters:
• Increase P/E ratio limits
• Lower ROE requirements  
• Expand to different sectors
• Consider different market cap categories

Would you like me to suggest some alternative screening criteria?"""
            
            # Build response
            response_parts = []
            response_parts.append(f"🔍 **Stock Screening Results** for: \"{query}\"")
            response_parts.append(f"Found {len(results)} stocks matching your criteria:\n")
            
            for i, stock in enumerate(results, 1):
                pe = f"P/E: {stock['pe_ratio']:.1f}" if stock['pe_ratio'] else "P/E: N/A"
                roe = f"ROE: {stock['roe']*100:.1f}%" if stock['roe'] else "ROE: N/A"
                market_cap_cr = stock['market_cap'] / 10000000000 if stock['market_cap'] else 0
                
                response_parts.append(f"**{i}. {stock['name']}** (₹{stock['current_price']})")
                response_parts.append(f"   {pe} | {roe} | Cap: ₹{market_cap_cr:.0f}k Cr | Sector: {stock['sector']}")
                
                if stock.get('dividend_yield', 0) > 0:
                    response_parts.append(f"   Dividend: {stock['dividend_yield']:.1f}%")
                
                response_parts.append("")  # Empty line
            
            response_parts.append("💡 **Next Steps:**")
            response_parts.append("• Research these companies further")
            response_parts.append("• Check recent quarterly results")
            response_parts.append("• Compare with industry peers")
            response_parts.append("• Consider your risk tolerance")
            
            response_parts.append("\n📚 This screening is for educational purposes. Always do detailed research before investing.")
            
            return "\n".join(response_parts)
            
        except Exception as e:
            return f"I had trouble processing your screening request. Please try a simpler query like 'Find banking stocks with P/E < 15' or ask me for screening examples."

def process_stock_screening_query(query: str) -> str:
    """Main function to process stock screening queries"""
    screener = NaturalLanguageStockScreener()
    return screener.generate_screening_response(query)