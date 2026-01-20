# AI Portfolio Optimizer - Phase 1 Implementation
import yfinance as yf
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple
from datetime import datetime, timedelta

class AIPortfolioOptimizer:
    def __init__(self):
        self.risk_free_rate = 0.06  # 6% risk-free rate for India
        self.market_benchmark = "^NSEI"  # Nifty 50
        
    def analyze_portfolio(self, holdings: List[Dict]) -> Dict:
        """
        Analyze current portfolio and provide optimization suggestions
        holdings: [{"symbol": "RELIANCE.NS", "quantity": 10, "avg_price": 2500}]
        """
        try:
            portfolio_data = self._get_portfolio_data(holdings)
            analysis = {
                "current_allocation": self._calculate_allocation(portfolio_data),
                "risk_metrics": self._calculate_risk_metrics(portfolio_data),
                "diversification_score": self._calculate_diversification_score(portfolio_data),
                "optimization_suggestions": self._generate_suggestions(portfolio_data),
                "rebalancing_plan": self._create_rebalancing_plan(portfolio_data)
            }
            return analysis
        except Exception as e:
            return {"error": f"Portfolio analysis failed: {str(e)}"}
    
    def _get_portfolio_data(self, holdings: List[Dict]) -> pd.DataFrame:
        """Fetch current market data for portfolio holdings"""
        portfolio_data = []
        
        for holding in holdings:
            try:
                symbol = holding["symbol"]
                if not symbol.endswith(('.NS', '.BO')):
                    symbol += '.NS'
                
                stock = yf.Ticker(symbol)
                info = stock.info
                hist = stock.history(period="1y")
                
                if not hist.empty:
                    current_price = hist['Close'].iloc[-1]
                    returns = hist['Close'].pct_change().dropna()
                    
                    portfolio_data.append({
                        'symbol': symbol,
                        'name': info.get('longName', symbol.split('.')[0]),
                        'sector': info.get('sector', 'Unknown'),
                        'quantity': holding['quantity'],
                        'avg_price': holding['avg_price'],
                        'current_price': current_price,
                        'market_value': current_price * holding['quantity'],
                        'gain_loss': (current_price - holding['avg_price']) * holding['quantity'],
                        'gain_loss_pct': ((current_price - holding['avg_price']) / holding['avg_price']) * 100,
                        'pe_ratio': info.get('trailingPE'),
                        'pb_ratio': info.get('priceToBook'),
                        'market_cap': info.get('marketCap'),
                        'volatility': returns.std() * np.sqrt(252),  # Annualized volatility
                        'beta': self._calculate_beta(returns)
                    })
            except Exception as e:
                print(f"Error processing {holding['symbol']}: {e}")
                continue
        
        return pd.DataFrame(portfolio_data)
    
    def _calculate_beta(self, stock_returns: pd.Series) -> float:
        """Calculate beta against Nifty 50"""
        try:
            nifty = yf.Ticker(self.market_benchmark)
            nifty_hist = nifty.history(period="1y")
            nifty_returns = nifty_hist['Close'].pct_change().dropna()
            
            # Align dates
            common_dates = stock_returns.index.intersection(nifty_returns.index)
            if len(common_dates) > 50:  # Need sufficient data
                stock_aligned = stock_returns.loc[common_dates]
                nifty_aligned = nifty_returns.loc[common_dates]
                
                covariance = np.cov(stock_aligned, nifty_aligned)[0][1]
                market_variance = np.var(nifty_aligned)
                
                return covariance / market_variance if market_variance != 0 else 1.0
        except:
            pass
        return 1.0  # Default beta
    
    def _calculate_allocation(self, df: pd.DataFrame) -> Dict:
        """Calculate current portfolio allocation"""
        if df.empty:
            return {}
        
        total_value = df['market_value'].sum()
        
        # By stock
        stock_allocation = (df['market_value'] / total_value * 100).round(2)
        
        # By sector
        sector_allocation = df.groupby('sector')['market_value'].sum()
        sector_allocation = (sector_allocation / total_value * 100).round(2)
        
        # By market cap
        def categorize_market_cap(market_cap):
            if pd.isna(market_cap):
                return 'Unknown'
            elif market_cap > 200000000000:  # 2 lakh crore
                return 'Large Cap'
            elif market_cap > 50000000000:   # 50k crore
                return 'Mid Cap'
            else:
                return 'Small Cap'
        
        df['cap_category'] = df['market_cap'].apply(categorize_market_cap)
        cap_allocation = df.groupby('cap_category')['market_value'].sum()
        cap_allocation = (cap_allocation / total_value * 100).round(2)
        
        return {
            'by_stock': dict(zip(df['name'], stock_allocation)),
            'by_sector': sector_allocation.to_dict(),
            'by_market_cap': cap_allocation.to_dict(),
            'total_value': total_value
        }
    
    def _calculate_risk_metrics(self, df: pd.DataFrame) -> Dict:
        """Calculate portfolio risk metrics"""
        if df.empty:
            return {}
        
        total_value = df['market_value'].sum()
        weights = df['market_value'] / total_value
        
        # Portfolio volatility (weighted average)
        portfolio_volatility = (weights * df['volatility']).sum()
        
        # Portfolio beta (weighted average)
        portfolio_beta = (weights * df['beta']).sum()
        
        # Concentration risk (Herfindahl Index)
        concentration_risk = (weights ** 2).sum()
        
        return {
            'portfolio_volatility': round(portfolio_volatility * 100, 2),
            'portfolio_beta': round(portfolio_beta, 2),
            'concentration_risk': round(concentration_risk, 3),
            'risk_level': self._categorize_risk(portfolio_volatility, concentration_risk)
        }
    
    def _categorize_risk(self, volatility: float, concentration: float) -> str:
        """Categorize overall portfolio risk"""
        if volatility > 0.25 or concentration > 0.3:
            return "High Risk"
        elif volatility > 0.18 or concentration > 0.2:
            return "Medium Risk"
        else:
            return "Low Risk"
    
    def _calculate_diversification_score(self, df: pd.DataFrame) -> Dict:
        """Calculate diversification score and suggestions"""
        if df.empty:
            return {"score": 0, "level": "Poor"}
        
        score = 0
        feedback = []
        
        # Number of stocks (max 25 points)
        num_stocks = len(df)
        if num_stocks >= 15:
            score += 25
        elif num_stocks >= 10:
            score += 20
            feedback.append("Consider adding 5-10 more stocks for better diversification")
        else:
            score += num_stocks * 1.5
            feedback.append(f"Add {15 - num_stocks} more stocks for optimal diversification")
        
        # Sector diversification (max 25 points)
        sectors = df['sector'].nunique()
        if sectors >= 8:
            score += 25
        elif sectors >= 5:
            score += 20
            feedback.append("Good sector spread, consider adding 2-3 more sectors")
        else:
            score += sectors * 3
            feedback.append("Diversify across more sectors (Banking, IT, Pharma, FMCG, etc.)")
        
        # Market cap diversification (max 25 points)
        cap_categories = df['cap_category'].nunique()
        if cap_categories >= 3:
            score += 25
        else:
            score += cap_categories * 8
            feedback.append("Include Large, Mid, and Small cap stocks")
        
        # Concentration check (max 25 points)
        max_holding = (df['market_value'] / df['market_value'].sum()).max()
        if max_holding <= 0.1:  # 10%
            score += 25
        elif max_holding <= 0.15:  # 15%
            score += 20
            feedback.append("Some positions are getting large, consider rebalancing")
        else:
            score += 10
            feedback.append("Reduce concentration - no single stock should exceed 10-15%")
        
        level = "Excellent" if score >= 90 else "Good" if score >= 75 else "Average" if score >= 60 else "Poor"
        
        return {
            "score": round(score),
            "level": level,
            "feedback": feedback
        }
    
    def _generate_suggestions(self, df: pd.DataFrame) -> List[str]:
        """Generate AI-powered optimization suggestions"""
        suggestions = []
        
        if df.empty:
            return ["Start building your portfolio with quality large-cap stocks"]
        
        total_value = df['market_value'].sum()
        allocation = df['market_value'] / total_value
        
        # Check for over-concentration
        over_concentrated = df[allocation > 0.15]
        if not over_concentrated.empty:
            for _, stock in over_concentrated.iterrows():
                pct = allocation[stock.name] * 100
                suggestions.append(f"Consider reducing {stock['name']} position (currently {pct:.1f}% of portfolio)")
        
        # Sector concentration
        sector_allocation = df.groupby('sector')['market_value'].sum() / total_value
        over_sectors = sector_allocation[sector_allocation > 0.25]
        if not over_sectors.empty:
            for sector in over_sectors.index:
                pct = over_sectors[sector] * 100
                suggestions.append(f"Reduce {sector} exposure (currently {pct:.1f}%) - diversify across sectors")
        
        # Underweight sectors
        current_sectors = set(df['sector'].unique())
        recommended_sectors = {'Technology', 'Financial Services', 'Healthcare', 'Consumer Goods', 'Energy'}
        missing_sectors = recommended_sectors - current_sectors
        if missing_sectors:
            suggestions.append(f"Consider adding exposure to: {', '.join(missing_sectors)}")
        
        # Market cap balance
        cap_allocation = df.groupby('cap_category')['market_value'].sum() / total_value
        if 'Large Cap' not in cap_allocation or cap_allocation.get('Large Cap', 0) < 0.5:
            suggestions.append("Increase Large Cap allocation to 50-60% for stability")
        
        if len(df) < 15:
            suggestions.append(f"Add {15 - len(df)} more quality stocks for better diversification")
        
        return suggestions[:5]  # Limit to top 5 suggestions
    
    def _create_rebalancing_plan(self, df: pd.DataFrame) -> Dict:
        """Create specific rebalancing recommendations"""
        if df.empty:
            return {}
        
        total_value = df['market_value'].sum()
        current_allocation = df['market_value'] / total_value
        
        # Target allocation (simplified)
        target_allocation = {}
        for i, row in df.iterrows():
            if current_allocation.iloc[i] > 0.12:  # If > 12%, reduce to 10%
                target_allocation[row['name']] = 0.10
            elif current_allocation.iloc[i] < 0.03:  # If < 3%, increase to 5%
                target_allocation[row['name']] = 0.05
            else:
                target_allocation[row['name']] = current_allocation.iloc[i]
        
        # Normalize to 100%
        total_target = sum(target_allocation.values())
        target_allocation = {k: v/total_target for k, v in target_allocation.items()}
        
        rebalancing_actions = []
        for i, row in df.iterrows():
            current_pct = current_allocation.iloc[i]
            target_pct = target_allocation[row['name']]
            
            if abs(current_pct - target_pct) > 0.02:  # 2% threshold
                action = "Buy" if target_pct > current_pct else "Sell"
                amount = abs(target_pct - current_pct) * total_value
                rebalancing_actions.append({
                    'stock': row['name'],
                    'action': action,
                    'amount': round(amount),
                    'current_pct': round(current_pct * 100, 1),
                    'target_pct': round(target_pct * 100, 1)
                })
        
        return {
            'actions_needed': len(rebalancing_actions) > 0,
            'actions': rebalancing_actions
        }

def generate_portfolio_analysis_response(holdings: List[Dict]) -> str:
    """Generate natural language response for portfolio analysis"""
    optimizer = AIPortfolioOptimizer()
    analysis = optimizer.analyze_portfolio(holdings)
    
    if 'error' in analysis:
        return f"I couldn't analyze your portfolio right now: {analysis['error']}. Please try again later."
    
    # Build response
    response_parts = []
    
    # Portfolio overview
    total_value = analysis['current_allocation'].get('total_value', 0)
    response_parts.append(f"📊 **Portfolio Analysis** (Total Value: ₹{total_value:,.0f})")
    
    # Diversification score
    div_score = analysis['diversification_score']
    response_parts.append(f"🎯 **Diversification Score**: {div_score['score']}/100 ({div_score['level']})")
    
    # Risk assessment
    risk_metrics = analysis['risk_metrics']
    response_parts.append(f"⚠️ **Risk Level**: {risk_metrics['risk_level']} (Volatility: {risk_metrics['portfolio_volatility']}%)")
    
    # Top suggestions
    suggestions = analysis['optimization_suggestions']
    if suggestions:
        response_parts.append("💡 **Key Recommendations**:")
        for i, suggestion in enumerate(suggestions[:3], 1):
            response_parts.append(f"{i}. {suggestion}")
    
    # Rebalancing
    rebalancing = analysis['rebalancing_plan']
    if rebalancing.get('actions_needed'):
        response_parts.append(f"🔄 **Rebalancing**: {len(rebalancing['actions'])} actions recommended")
    
    response_parts.append("\n📚 This analysis is for educational purposes. Consider your risk tolerance and investment goals.")
    
    return "\n\n".join(response_parts)