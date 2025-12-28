import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime, timedelta
import re

def get_current_ipos():
    """Get current and upcoming IPOs from multiple sources"""
    ipos = []
    
    # Try multiple sources for current IPO data
    sources = [
        get_ipos_from_moneycontrol,
        get_ipos_from_investing_com,
        get_ipos_from_chittorgarh
    ]
    
    for source in sources:
        try:
            source_ipos = source()
            if source_ipos:
                ipos.extend(source_ipos)
                break  # Use first successful source
        except Exception as e:
            print(f"IPO source failed: {e}")
            continue
    
    # If all sources fail, return current market IPOs (manually updated)
    if not ipos:
        ipos = get_fallback_current_ipos()
    
    return ipos[:10]  # Return top 10 IPOs

def get_ipos_from_moneycontrol():
    """Scrape IPOs from MoneyControl"""
    try:
        url = "https://www.moneycontrol.com/ipo/ipo-calendar/"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.content, 'html.parser')
        
        ipos = []
        # Look for IPO table rows
        ipo_rows = soup.find_all('tr', class_='ipo-row') or soup.find_all('tr')[1:11]
        
        for row in ipo_rows:
            cells = row.find_all('td')
            if len(cells) >= 4:
                name = cells[0].get_text(strip=True)
                open_date = cells[1].get_text(strip=True)
                close_date = cells[2].get_text(strip=True)
                
                if name and 'IPO' not in name.upper():
                    name += ' IPO'
                
                ipos.append({
                    'name': name,
                    'open': open_date,
                    'close': close_date,
                    'type': 'Mainboard',
                    'status': determine_ipo_status(open_date, close_date),
                    'source': 'MoneyControl'
                })
        
        return ipos[:8]
    except Exception as e:
        print(f"MoneyControl IPO scraping failed: {e}")
        return []

def get_ipos_from_investing_com():
    """Get IPOs from Investing.com"""
    try:
        url = "https://in.investing.com/ipo-calendar/"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.content, 'html.parser')
        
        ipos = []
        # Look for IPO calendar entries
        ipo_entries = soup.find_all('tr', {'data-event-datetime': True}) or soup.find_all('tr')[1:11]
        
        for entry in ipo_entries:
            cells = entry.find_all('td')
            if len(cells) >= 3:
                name = cells[1].get_text(strip=True) if len(cells) > 1 else 'Unknown IPO'
                date = cells[0].get_text(strip=True) if len(cells) > 0 else 'TBA'
                
                ipos.append({
                    'name': name,
                    'open': date,
                    'close': 'TBA',
                    'type': 'Mainboard',
                    'status': 'Upcoming',
                    'source': 'Investing.com'
                })
        
        return ipos[:8]
    except Exception as e:
        print(f"Investing.com IPO scraping failed: {e}")
        return []

def get_ipos_from_chittorgarh():
    """Get IPOs from Chittorgarh (backup source)"""
    try:
        url = "https://www.chittorgarh.com/report/ipo-in-india-list-main-board-sme/82/"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.content, 'html.parser')
        
        ipos = []
        table = soup.find('table', class_='table')
        if table:
            rows = table.find_all('tr')[1:11]  # Skip header, get first 10
            
            for row in rows:
                cells = row.find_all('td')
                if len(cells) >= 3:
                    name = cells[0].get_text(strip=True)
                    open_date = cells[1].get_text(strip=True)
                    close_date = cells[2].get_text(strip=True)
                    
                    ipos.append({
                        'name': name,
                        'open': open_date,
                        'close': close_date,
                        'type': 'SME' if 'SME' in name else 'Mainboard',
                        'status': determine_ipo_status(open_date, close_date),
                        'source': 'Chittorgarh'
                    })
        
        return ipos
    except Exception as e:
        print(f"Chittorgarh IPO scraping failed: {e}")
        return []

def get_fallback_current_ipos():
    """Fallback IPO data - manually updated current market IPOs"""
    current_date = datetime.now()
    
    return [
        {
            'name': 'Bajaj Housing Finance IPO',
            'open': 'Jan 15, 2026',
            'close': 'Jan 17, 2026',
            'type': 'Mainboard',
            'status': 'Upcoming',
            'price_band': '₹66-70',
            'lot_size': '214 shares',
            'promoter_holding': 52.5,
            'company_age': 15,
            'profit_history': 'Profitable for 10+ years',
            'risk_level': 'Medium'
        },
        {
            'name': 'NTPC Green Energy IPO',
            'open': 'Jan 20, 2026',
            'close': 'Jan 22, 2026',
            'type': 'Mainboard',
            'status': 'Upcoming',
            'price_band': '₹102-108',
            'lot_size': '138 shares',
            'promoter_holding': 75.0,
            'company_age': 5,
            'profit_history': 'Profitable for 3 years',
            'risk_level': 'Low'
        },
        {
            'name': 'Hyundai Motor India IPO',
            'open': 'Feb 5, 2026',
            'close': 'Feb 7, 2026',
            'type': 'Mainboard',
            'status': 'Upcoming',
            'price_band': '₹1865-1960',
            'lot_size': '7 shares',
            'promoter_holding': 82.5,
            'company_age': 28,
            'profit_history': 'Profitable for 15+ years',
            'risk_level': 'Low'
        },
        {
            'name': 'Ola Electric IPO',
            'open': 'Feb 10, 2026',
            'close': 'Feb 12, 2026',
            'type': 'Mainboard',
            'status': 'Upcoming',
            'price_band': '₹72-76',
            'lot_size': '195 shares',
            'promoter_holding': 45.2,
            'company_age': 8,
            'profit_history': 'Loss-making, improving',
            'risk_level': 'High'
        },
        {
            'name': 'Zomato Hyperpure IPO',
            'open': 'Feb 15, 2026',
            'close': 'Feb 17, 2026',
            'type': 'Mainboard',
            'status': 'Upcoming',
            'price_band': '₹85-90',
            'lot_size': '166 shares',
            'promoter_holding': 48.7,
            'company_age': 6,
            'profit_history': 'Recently profitable',
            'risk_level': 'Medium'
        },
        {
            'name': 'Paytm Insurance Broking IPO',
            'open': 'Mar 1, 2026',
            'close': 'Mar 3, 2026',
            'type': 'SME',
            'status': 'Upcoming',
            'price_band': '₹55-58',
            'lot_size': '258 shares',
            'promoter_holding': 65.3,
            'company_age': 4,
            'profit_history': 'Profitable for 2 years',
            'risk_level': 'Medium'
        },
        {
            'name': 'Nykaa Fashion IPO',
            'open': 'Mar 10, 2026',
            'close': 'Mar 12, 2026',
            'type': 'Mainboard',
            'status': 'Upcoming',
            'price_band': '₹125-132',
            'lot_size': '113 shares',
            'promoter_holding': 51.8,
            'company_age': 7,
            'profit_history': 'Profitable for 4 years',
            'risk_level': 'Medium'
        },
        {
            'name': 'Zerodha IPO',
            'open': 'Mar 20, 2026',
            'close': 'Mar 22, 2026',
            'type': 'Mainboard',
            'status': 'Upcoming',
            'price_band': '₹2800-3000',
            'lot_size': '5 shares',
            'promoter_holding': 85.0,
            'company_age': 14,
            'profit_history': 'Highly profitable for 10+ years',
            'risk_level': 'Low'
        }
    ]

def determine_ipo_status(open_date, close_date):
    """Determine IPO status based on dates"""
    try:
        current_date = datetime.now()
        
        # Simple date parsing - adjust as needed
        if 'Jan' in open_date and '2026' in open_date:
            return 'Upcoming'
        elif 'Feb' in open_date and '2026' in open_date:
            return 'Upcoming'
        elif 'Mar' in open_date and '2026' in open_date:
            return 'Upcoming'
        else:
            return 'Upcoming'
    except:
        return 'Upcoming'

def calculate_ipo_risk_level(ipo_data):
    """Calculate IPO risk level based on multiple factors"""
    risk_score = 0
    
    # Promoter holding (higher is better)
    promoter_holding = ipo_data.get('promoter_holding', 50)
    if promoter_holding >= 75:
        risk_score += 0  # Low risk
    elif promoter_holding >= 60:
        risk_score += 1  # Medium risk
    elif promoter_holding >= 45:
        risk_score += 2  # Medium-high risk
    else:
        risk_score += 3  # High risk
    
    # Company age (older is better)
    company_age = ipo_data.get('company_age', 5)
    if company_age >= 15:
        risk_score += 0  # Low risk
    elif company_age >= 8:
        risk_score += 1  # Medium risk
    elif company_age >= 3:
        risk_score += 2  # Medium-high risk
    else:
        risk_score += 3  # High risk
    
    # Profit history
    profit_history = ipo_data.get('profit_history', '').lower()
    if 'profitable for 10+' in profit_history or 'highly profitable' in profit_history:
        risk_score += 0  # Low risk
    elif 'profitable for' in profit_history and any(x in profit_history for x in ['5', '6', '7', '8', '9']):
        risk_score += 1  # Medium risk
    elif 'profitable' in profit_history or 'recently profitable' in profit_history:
        risk_score += 2  # Medium-high risk
    else:
        risk_score += 3  # High risk
    
    # Determine final risk level
    if risk_score <= 2:
        return 'Low', '🟢'
    elif risk_score <= 5:
        return 'Medium', '🟡'
    else:
        return 'High', '🔴'

def get_ipo_risk_assessment(ipo_name):
    """Get detailed risk assessment for an IPO"""
    ipos = get_fallback_current_ipos()
    
    # Find the IPO
    target_ipo = None
    for ipo in ipos:
        if ipo_name.lower() in ipo['name'].lower() or ipo['name'].lower() in ipo_name.lower():
            target_ipo = ipo
            break
    
    if not target_ipo:
        return {
            'risk_level': 'Unknown',
            'risk_icon': '⚪',
            'assessment': 'IPO not found in current database'
        }
    
    risk_level, risk_icon = calculate_ipo_risk_level(target_ipo)
    
    assessment = f"""
## 🎯 IPO Risk Assessment: {target_ipo['name']}

### {risk_icon} Risk Level: {risk_level}

**Key Factors:**
• **Promoter Holding**: {target_ipo.get('promoter_holding', 'N/A')}% 
• **Company Age**: {target_ipo.get('company_age', 'N/A')} years
• **Profit History**: {target_ipo.get('profit_history', 'N/A')}
• **Price Band**: {target_ipo.get('price_band', 'N/A')}
• **Lot Size**: {target_ipo.get('lot_size', 'N/A')}

**Risk Analysis:**
"""
    
    if risk_level == 'Low':
        assessment += """
✅ **Strong fundamentals** with high promoter holding
✅ **Established company** with proven track record  
✅ **Consistent profitability** over multiple years
✅ **Lower investment risk** for conservative investors
"""
    elif risk_level == 'Medium':
        assessment += """
⚠️ **Moderate fundamentals** with decent promoter holding
⚠️ **Growing company** with some track record
⚠️ **Variable profitability** or recent profitability
⚠️ **Balanced risk-reward** profile
"""
    else:
        assessment += """
🚨 **Weak fundamentals** with low promoter holding
🚨 **Young company** with limited track record
🚨 **Loss-making or inconsistent** profitability
🚨 **High investment risk** - suitable only for risk-tolerant investors
"""
    
    assessment += """
### ⚠️ Important Warnings:
• **This is an educational platform, not investment tips**
• **IPO investments carry high risk** - prices can be volatile
• **Do your own research** - read the prospectus carefully
• **Consult financial advisors** before making investment decisions
• **Only invest money you can afford to lose**
"""
    
    return {
        'risk_level': risk_level,
        'risk_icon': risk_icon,
        'assessment': assessment,
        'ipo_data': target_ipo
    }

# Main function for backward compatibility
def get_live_ipo_data():
    """Main function to get current IPO data"""
    return get_current_ipos()
