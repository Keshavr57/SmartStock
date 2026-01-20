# Smart Market Analysis - Advanced Gen AI Feature
import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import requests
from bs4 import BeautifulSoup

class SmartMarketAnalyzer:
    def __init__(self):
        self.indices = {
            '^NSEI': 'Nifty 50',
            '^BSESN': 'Sensex',
            '^NSEBANK': 'Bank Nifty',
            '^NSEIT': 'Nifty IT'
        }
        
        self.sector_etfs = {
            'banking': 'BANKBEES.NS',
            'it': 'ITBEES.NS', 
            'pharma': 'PHARMABEES.NS',
            'fmcg': 'FMCGBEES.NS'
        }
    
    def analyze_market_sentiment(self) -> Dict:
        """Analyze overall market sentiment and trends"""
        try:
            market_data = {}
            
            # Get major indices data
            for symbol, name in self.indices.items():
                try:
                    ticker = yf.Ticker(symbol)
                    hist = ticker.history(period="30d")
                    
                    if not hist.empty:
                        current_price = hist['Close'].iloc[-1]
                        prev_price = hist['Close'].iloc[-2]
                        change_pct = ((current_price - prev_price) / prev_price) * 100
                        
                        # Calculate volatility
                        returns = hist['Close'].pct_change().dropna()
                        volatility = returns.std() * np.sqrt(252) * 100
                        
                        # Calculate trend (20-day moving average)
                        ma_20 = hist['Close'].rolling(20).mean().iloc[-1]
                        trend = "Bullish" if current_price > ma_20 else "Bearish"
                        
                        market_data[name] = {
                            'current_price': round(current_price, 2),
                            'change_pct': round(change_pct, 2),
                            'volatility': round(volatility, 2),
                            'trend': trend,
                            'ma_20': round(ma_20, 2)
                        }
                except Exception as e:
                    print(f"Error getting data for {symbol}: {e}")
                    continue
            
            return market_data
            
        except Exception as e:
            print(f"Market analysis error: {e}")
            return {}
    
    def analyze_sector_performance(self) -> Dict:
        """Analyze sector-wise performance"""
        sector_data = {}
        
        for sector, symbol in self.sector_etfs.items():
            try:
                ticker = yf.Ticker(symbol)
                hist = ticker.history(period="30d")
                
                if not hist.empty:
                    current_price = hist['Close'].iloc[-1]
                    month_ago_price = hist['Close'].iloc[0]
                    monthly_return = ((current_price - month_ago_price) / month_ago_price) * 100
                    
                    # Calculate relative strength vs Nifty
                    nifty = yf.Ticker('^NSEI')
                    nifty_hist = nifty.history(period="30d")
                    nifty_return = ((nifty_hist['Close'].iloc[-1] - nifty_hist['Close'].iloc[0]) / nifty_hist['Close'].iloc[0]) * 100
                    
                    relative_strength = monthly_return - nifty_return
                    
                    sector_data[sector.upper()] = {
                        'monthly_return': round(monthly_return, 2),
                        'relative_strength': round(relative_strength, 2),
                        'performance': "Outperforming" if relative_strength > 0 else "Underperforming"
                    }
            except Exception as e:
                print(f"Error analyzing sector {sector}: {e}")
                continue
        
        return sector_data
    
    def get_market_levels(self) -> Dict:
        """Get key support and resistance levels"""
        try:
            nifty = yf.Ticker('^NSEI')
            hist = nifty.history(period="90d")  # 3 months data
            
            if hist.empty:
                return {}
            
            current_price = hist['Close'].iloc[-1]
            high_52w = hist['High'].max()
            low_52w = hist['Low'].min()
            
            # Calculate support and resistance levels
            recent_highs = hist['High'].rolling(10).max().dropna()
            recent_lows = hist['Low'].rolling(10).min().dropna()
            
            resistance = recent_highs.quantile(0.8)
            support = recent_lows.quantile(0.2)
            
            return {
                'current_level': round(current_price, 2),
                'resistance': round(resistance, 2),
                'support': round(support, 2),
                '52w_high': round(high_52w, 2),
                '52w_low': round(low_52w, 2),
                'distance_from_high': round(((high_52w - current_price) / high_52w) * 100, 2),
                'distance_from_low': round(((current_price - low_52w) / low_52w) * 100, 2)
            }
            
        except Exception as e:
            print(f"Error calculating market levels: {e}")
            return {}
    
    def analyze_specific_stock_impact(self, stock_symbol: str, news_context: str = "") -> str:
        """Analyze why a specific stock is moving"""
        try:
            if not stock_symbol.endswith(('.NS', '.BO')):
                stock_symbol += '.NS'
            
            stock = yf.Ticker(stock_symbol)
            hist = stock.history(period="5d")
            info = stock.info
            
            if hist.empty:
                return f"Unable to analyze {stock_symbol} - no data available."
            
            current_price = hist['Close'].iloc[-1]
            prev_price = hist['Close'].iloc[-2] if len(hist) > 1 else current_price
            change_pct = ((current_price - prev_price) / prev_price) * 100
            
            volume_today = hist['Volume'].iloc[-1]
            avg_volume = hist['Volume'].mean()
            volume_spike = volume_today / avg_volume if avg_volume > 0 else 1
            
            # Get company name
            company_name = info.get('longName', stock_symbol.replace('.NS', ''))
            sector = info.get('sector', 'Unknown')
            
            analysis = f"📊 **{company_name} Analysis**\n\n"
            analysis += f"**Current Movement**: {change_pct:+.2f}% (₹{current_price:.2f})\n"
            analysis += f"**Volume**: {volume_spike:.1f}x average volume\n"
            analysis += f"**Sector**: {sector}\n\n"
            
            # Analyze the movement
            if abs(change_pct) > 5:
                analysis += "**Significant Movement Detected**\n"
                if change_pct > 5:
                    analysis += "• Strong buying interest\n"
                    analysis += "• Possible positive news or results\n"
                    analysis += "• Check for earnings, announcements, or sector news\n"
                else:
                    analysis += "• Heavy selling pressure\n"
                    analysis += "• Possible negative news or concerns\n"
                    analysis += "• Monitor for support levels\n"
            
            if volume_spike > 2:
                analysis += f"\n**High Volume Alert** ({volume_spike:.1f}x normal)\n"
                analysis += "• Institutional activity likely\n"
                analysis += "• Significant news or events driving interest\n"
            
            # Add fundamental context
            pe_ratio = info.get('trailingPE')
            if pe_ratio:
                analysis += f"\n**Valuation**: P/E Ratio {pe_ratio:.1f}\n"
                if pe_ratio < 15:
                    analysis += "• Relatively undervalued\n"
                elif pe_ratio > 25:
                    analysis += "• Premium valuation\n"
            
            analysis += "\n**Recommendation**: Monitor closely and check latest news for specific triggers."
            
            return analysis
            
        except Exception as e:
            return f"Unable to analyze {stock_symbol}: {str(e)}"
    
    def generate_market_analysis_response(self, query: str) -> str:
        """Generate comprehensive market analysis response"""
        query_lower = query.lower()
        
        # Check if asking about specific stock
        if any(stock in query_lower for stock in ['reliance', 'tcs', 'hdfc', 'infosys', 'sbi']):
            stock_map = {
                'reliance': 'RELIANCE.NS',
                'tcs': 'TCS.NS', 
                'hdfc': 'HDFCBANK.NS',
                'infosys': 'INFY.NS',
                'sbi': 'SBIN.NS'
            }
            
            for stock_name, symbol in stock_map.items():
                if stock_name in query_lower:
                    return self.analyze_specific_stock_impact(symbol)
        
        # General market analysis
        try:
            market_data = self.analyze_market_sentiment()
            sector_data = self.analyze_sector_performance()
            levels_data = self.get_market_levels()
            
            if not market_data:
                return "I'm having trouble accessing market data right now. Please try again in a moment."
            
            response = "📈 **Market Analysis Summary**\n\n"
            
            # Market indices overview
            response += "**Major Indices:**\n"
            for index_name, data in market_data.items():
                trend_emoji = "🟢" if data['change_pct'] > 0 else "🔴"
                response += f"{trend_emoji} **{index_name}**: {data['current_price']} ({data['change_pct']:+.2f}%)\n"
                response += f"   Trend: {data['trend']} | Volatility: {data['volatility']:.1f}%\n"
            
            # Market levels (Nifty)
            if levels_data:
                response += f"\n**Nifty 50 Levels:**\n"
                response += f"• Current: {levels_data['current_level']}\n"
                response += f"• Support: {levels_data['support']}\n" 
                response += f"• Resistance: {levels_data['resistance']}\n"
                response += f"• 52W Range: {levels_data['52w_low']} - {levels_data['52w_high']}\n"
            
            # Sector performance
            if sector_data:
                response += "\n**Sector Performance (30 days):**\n"
                sorted_sectors = sorted(sector_data.items(), key=lambda x: x[1]['monthly_return'], reverse=True)
                
                for sector, data in sorted_sectors:
                    perf_emoji = "🟢" if data['monthly_return'] > 0 else "🔴"
                    response += f"{perf_emoji} **{sector}**: {data['monthly_return']:+.2f}% ({data['performance']})\n"
            
            # Market sentiment
            response += "\n**Market Sentiment:**\n"
            nifty_change = market_data.get('Nifty 50', {}).get('change_pct', 0)
            if nifty_change > 1:
                response += "🟢 **Bullish** - Strong buying interest across indices\n"
            elif nifty_change < -1:
                response += "🔴 **Bearish** - Selling pressure evident\n"
            else:
                response += "🟡 **Neutral** - Consolidation phase\n"
            
            response += "\n**Key Insights:**\n"
            
            # Add specific insights based on data
            if sector_data:
                best_sector = max(sector_data.items(), key=lambda x: x[1]['monthly_return'])
                worst_sector = min(sector_data.items(), key=lambda x: x[1]['monthly_return'])
                
                response += f"• {best_sector[0]} leading with {best_sector[1]['monthly_return']:+.2f}% returns\n"
                response += f"• {worst_sector[0]} lagging with {worst_sector[1]['monthly_return']:+.2f}% returns\n"
            
            if levels_data:
                if levels_data['distance_from_high'] < 5:
                    response += "• Market near 52-week highs - watch for resistance\n"
                elif levels_data['distance_from_low'] < 10:
                    response += "• Market near recent lows - potential support zone\n"
            
            response += "\n📚 Analysis for educational purposes. Markets are subject to various factors and risks."
            
            return response
            
        except Exception as e:
            return f"I'm having trouble analyzing the market right now. Please try asking about specific stocks or sectors, or try again later."

def process_market_analysis_query(query: str) -> str:
    """Main function to process market analysis queries"""
    analyzer = SmartMarketAnalyzer()
    return analyzer.generate_market_analysis_response(query)