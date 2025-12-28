import requests
from datetime import datetime, timedelta

class IPOService:
    def __init__(self):
        self.ipo_database = {
            "swiggy": {
                "name": "Swiggy Limited",
                "price_band": "₹371-390",
                "issue_size": "₹11,327 Cr",
                "lot_size": "38 shares",
                "minimum_investment": "₹14,820",
                "listing_date": "Expected Jan 2025",
                "business_model": "Food delivery and quick commerce platform",
                "financials": {
                    "revenue_fy24": "₹8,265 Cr",
                    "revenue_growth": "18% CAGR (FY22-24)",
                    "market_share": "50% in food delivery",
                    "profitability": "Path to profitability by FY26",
                    "cash_burn": "₹1,200 Cr annually"
                },
                "competitive_analysis": {
                    "main_competitor": "Zomato",
                    "advantages": ["Market leader", "Diversified into Instamart", "Strong brand recall"],
                    "disadvantages": ["High cash burn", "Intense competition", "Regulatory risks"]
                },
                "valuation": {
                    "pre_ipo_valuation": "$10.7 billion",
                    "pe_ratio": "Not profitable yet",
                    "price_to_sales": "4.2x"
                },
                "recommendation": {
                    "rating": "SUBSCRIBE",
                    "confidence": "4/5",
                    "reasoning": "Strong market position with diversification into quick commerce. Path to profitability visible.",
                    "target_price": "₹420-450 post listing",
                    "risk_level": "Medium-High"
                }
            },
            "ntpc green": {
                "name": "NTPC Green Energy Limited",
                "price_band": "₹102-108",
                "issue_size": "₹10,000 Cr",
                "lot_size": "138 shares",
                "minimum_investment": "₹14,904",
                "listing_date": "Expected Jan 2025",
                "business_model": "Renewable energy generation and development",
                "financials": {
                    "revenue_fy24": "₹2,845 Cr",
                    "revenue_growth": "35% CAGR",
                    "profit_margin": "12%",
                    "debt_equity": "0.8x"
                },
                "competitive_analysis": {
                    "advantages": ["Government backing", "Green energy focus", "Strong pipeline"],
                    "disadvantages": ["Policy dependency", "Execution risks"]
                },
                "recommendation": {
                    "rating": "SUBSCRIBE",
                    "confidence": "4.5/5",
                    "reasoning": "Government-backed renewable energy play with strong fundamentals",
                    "target_price": "₹125-140 post listing",
                    "risk_level": "Medium"
                }
            },
            "hyundai": {
                "name": "Hyundai Motor India Limited",
                "price_band": "₹1,865-1,960",
                "issue_size": "₹27,870 Cr",
                "lot_size": "7 shares",
                "minimum_investment": "₹13,720",
                "listing_date": "Expected Feb 2025",
                "business_model": "Automobile manufacturing and sales",
                "financials": {
                    "revenue_fy24": "₹60,000 Cr",
                    "market_share": "15% in Indian auto market",
                    "profit_margin": "8%"
                },
                "recommendation": {
                    "rating": "SUBSCRIBE",
                    "confidence": "4/5",
                    "reasoning": "Strong brand with established market presence",
                    "risk_level": "Medium"
                }
            }
        }
    
    def get_ipo_analysis(self, company_name):
        """Get detailed IPO analysis for a company"""
        company_key = company_name.lower().strip()
        
        for key, data in self.ipo_database.items():
            if key in company_key or company_key in key:
                return data
        
        return None
    
    def get_all_upcoming_ipos(self):
        """Get list of all upcoming IPOs"""
        return list(self.ipo_database.values())
    
    def calculate_investment_requirement(self, company_name, lots=1):
        """Calculate investment requirement for IPO"""
        ipo_data = self.get_ipo_analysis(company_name)
        if not ipo_data:
            return None
        
        try:
            # Extract price from price_band (take upper limit)
            price_band = ipo_data.get('price_band', '₹0-0')
            upper_price = int(price_band.split('-')[1].replace('₹', '').replace(',', ''))
            lot_size = int(ipo_data.get('lot_size', '0').split()[0])
            
            investment_required = upper_price * lot_size * lots
            
            return {
                "company": ipo_data['name'],
                "lots_applied": lots,
                "shares_per_lot": lot_size,
                "total_shares": lot_size * lots,
                "price_per_share": upper_price,
                "total_investment": investment_required,
                "formatted_investment": f"₹{investment_required:,}"
            }
        except:
            return None

# Global instance
ipo_service = IPOService()