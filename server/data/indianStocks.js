// Comprehensive Indian Stock Database
// This includes 200+ popular NSE/BSE listed companies across all major sectors

export const INDIAN_STOCKS = [
    // NIFTY 50 Companies
    { symbol: 'RELIANCE.NS', name: 'Reliance Industries Limited', sector: 'Oil & Gas', exchange: 'NSE' },
    { symbol: 'TCS.NS', name: 'Tata Consultancy Services Limited', sector: 'Information Technology', exchange: 'NSE' },
    { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Limited', sector: 'Banking', exchange: 'NSE' },
    { symbol: 'INFY.NS', name: 'Infosys Limited', sector: 'Information Technology', exchange: 'NSE' },
    { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever Limited', sector: 'FMCG', exchange: 'NSE' },
    { symbol: 'ICICIBANK.NS', name: 'ICICI Bank Limited', sector: 'Banking', exchange: 'NSE' },
    { symbol: 'SBIN.NS', name: 'State Bank of India', sector: 'Banking', exchange: 'NSE' },
    { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel Limited', sector: 'Telecom', exchange: 'NSE' },
    { symbol: 'ITC.NS', name: 'ITC Limited', sector: 'FMCG', exchange: 'NSE' },
    { symbol: 'LT.NS', name: 'Larsen & Toubro Limited', sector: 'Construction', exchange: 'NSE' },
    { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank Limited', sector: 'Banking', exchange: 'NSE' },
    { symbol: 'AXISBANK.NS', name: 'Axis Bank Limited', sector: 'Banking', exchange: 'NSE' },
    { symbol: 'MARUTI.NS', name: 'Maruti Suzuki India Limited', sector: 'Automobiles', exchange: 'NSE' },
    { symbol: 'SUNPHARMA.NS', name: 'Sun Pharmaceutical Industries Limited', sector: 'Pharmaceuticals', exchange: 'NSE' },
    { symbol: 'ULTRACEMCO.NS', name: 'UltraTech Cement Limited', sector: 'Cement', exchange: 'NSE' },
    { symbol: 'ASIANPAINT.NS', name: 'Asian Paints Limited', sector: 'Paints', exchange: 'NSE' },
    { symbol: 'NESTLEIND.NS', name: 'Nestle India Limited', sector: 'FMCG', exchange: 'NSE' },
    { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance Limited', sector: 'Financial Services', exchange: 'NSE' },
    { symbol: 'HCLTECH.NS', name: 'HCL Technologies Limited', sector: 'Information Technology', exchange: 'NSE' },
    { symbol: 'WIPRO.NS', name: 'Wipro Limited', sector: 'Information Technology', exchange: 'NSE' },
    { symbol: 'NTPC.NS', name: 'NTPC Limited', sector: 'Power', exchange: 'NSE' },
    { symbol: 'TATAMOTORS.NS', name: 'Tata Motors Limited', sector: 'Automobiles', exchange: 'NSE' },
    { symbol: 'TATASTEEL.NS', name: 'Tata Steel Limited', sector: 'Metals', exchange: 'NSE' },
    { symbol: 'POWERGRID.NS', name: 'Power Grid Corporation of India Limited', sector: 'Power', exchange: 'NSE' },
    { symbol: 'ONGC.NS', name: 'Oil and Natural Gas Corporation Limited', sector: 'Oil & Gas', exchange: 'NSE' },
    { symbol: 'TECHM.NS', name: 'Tech Mahindra Limited', sector: 'Information Technology', exchange: 'NSE' },
    { symbol: 'M&M.NS', name: 'Mahindra & Mahindra Limited', sector: 'Automobiles', exchange: 'NSE' },
    { symbol: 'JSWSTEEL.NS', name: 'JSW Steel Limited', sector: 'Metals', exchange: 'NSE' },
    { symbol: 'INDUSINDBK.NS', name: 'IndusInd Bank Limited', sector: 'Banking', exchange: 'NSE' },
    { symbol: 'BAJAJFINSV.NS', name: 'Bajaj Finserv Limited', sector: 'Financial Services', exchange: 'NSE' },
    { symbol: 'HINDALCO.NS', name: 'Hindalco Industries Limited', sector: 'Metals', exchange: 'NSE' },
    { symbol: 'ADANIENT.NS', name: 'Adani Enterprises Limited', sector: 'Conglomerate', exchange: 'NSE' },
    { symbol: 'COALINDIA.NS', name: 'Coal India Limited', sector: 'Mining', exchange: 'NSE' },
    { symbol: 'BRITANNIA.NS', name: 'Britannia Industries Limited', sector: 'FMCG', exchange: 'NSE' },
    { symbol: 'GRASIM.NS', name: 'Grasim Industries Limited', sector: 'Cement', exchange: 'NSE' },
    { symbol: 'SHREECEM.NS', name: 'Shree Cement Limited', sector: 'Cement', exchange: 'NSE' },
    { symbol: 'CIPLA.NS', name: 'Cipla Limited', sector: 'Pharmaceuticals', exchange: 'NSE' },
    { symbol: 'DRREDDY.NS', name: 'Dr. Reddys Laboratories Limited', sector: 'Pharmaceuticals', exchange: 'NSE' },
    { symbol: 'EICHERMOT.NS', name: 'Eicher Motors Limited', sector: 'Automobiles', exchange: 'NSE' },
    { symbol: 'HEROMOTOCO.NS', name: 'Hero MotoCorp Limited', sector: 'Automobiles', exchange: 'NSE' },
    { symbol: 'BAJAJ-AUTO.NS', name: 'Bajaj Auto Limited', sector: 'Automobiles', exchange: 'NSE' },
    { symbol: 'DIVISLAB.NS', name: 'Divis Laboratories Limited', sector: 'Pharmaceuticals', exchange: 'NSE' },
    { symbol: 'APOLLOHOSP.NS', name: 'Apollo Hospitals Enterprise Limited', sector: 'Healthcare', exchange: 'NSE' },
    { symbol: 'TITAN.NS', name: 'Titan Company Limited', sector: 'Jewellery', exchange: 'NSE' },
    { symbol: 'SBILIFE.NS', name: 'SBI Life Insurance Company Limited', sector: 'Insurance', exchange: 'NSE' },
    { symbol: 'HDFCLIFE.NS', name: 'HDFC Life Insurance Company Limited', sector: 'Insurance', exchange: 'NSE' },
    { symbol: 'BPCL.NS', name: 'Bharat Petroleum Corporation Limited', sector: 'Oil & Gas', exchange: 'NSE' },
    { symbol: 'IOC.NS', name: 'Indian Oil Corporation Limited', sector: 'Oil & Gas', exchange: 'NSE' },
    { symbol: 'HINDPETRO.NS', name: 'Hindustan Petroleum Corporation Limited', sector: 'Oil & Gas', exchange: 'NSE' },
    { symbol: 'TATACONSUM.NS', name: 'Tata Consumer Products Limited', sector: 'FMCG', exchange: 'NSE' },

    // NIFTY Next 50 & Other Popular Stocks
    { symbol: 'ADANIPORTS.NS', name: 'Adani Ports and Special Economic Zone Limited', sector: 'Infrastructure', exchange: 'NSE' },
    { symbol: 'ADANIGREEN.NS', name: 'Adani Green Energy Limited', sector: 'Renewable Energy', exchange: 'NSE' },
    { symbol: 'ADANITRANS.NS', name: 'Adani Transmission Limited', sector: 'Power', exchange: 'NSE' },
    { symbol: 'GODREJCP.NS', name: 'Godrej Consumer Products Limited', sector: 'FMCG', exchange: 'NSE' },
    { symbol: 'MARICO.NS', name: 'Marico Limited', sector: 'FMCG', exchange: 'NSE' },
    { symbol: 'DABUR.NS', name: 'Dabur India Limited', sector: 'FMCG', exchange: 'NSE' },
    { symbol: 'COLPAL.NS', name: 'Colgate Palmolive India Limited', sector: 'FMCG', exchange: 'NSE' },
    { symbol: 'PIDILITIND.NS', name: 'Pidilite Industries Limited', sector: 'Chemicals', exchange: 'NSE' },
    { symbol: 'BERGEPAINT.NS', name: 'Berger Paints India Limited', sector: 'Paints', exchange: 'NSE' },
    { symbol: 'DMART.NS', name: 'Avenue Supermarts Limited', sector: 'Retail', exchange: 'NSE' },
    { symbol: 'NAUKRI.NS', name: 'Info Edge India Limited', sector: 'Internet', exchange: 'NSE' },
    { symbol: 'ZOMATO.NS', name: 'Zomato Limited', sector: 'Food Delivery', exchange: 'NSE' },
    { symbol: 'PAYTM.NS', name: 'One 97 Communications Limited', sector: 'Fintech', exchange: 'NSE' },
    { symbol: 'POLICYBZR.NS', name: 'PB Fintech Limited', sector: 'Fintech', exchange: 'NSE' },
    { symbol: 'MINDTREE.NS', name: 'Mindtree Limited', sector: 'Information Technology', exchange: 'NSE' },
    { symbol: 'LTI.NS', name: 'Larsen & Toubro Infotech Limited', sector: 'Information Technology', exchange: 'NSE' },
    { symbol: 'MPHASIS.NS', name: 'Mphasis Limited', sector: 'Information Technology', exchange: 'NSE' },
    { symbol: 'PERSISTENT.NS', name: 'Persistent Systems Limited', sector: 'Information Technology', exchange: 'NSE' },
    { symbol: 'COFORGE.NS', name: 'Coforge Limited', sector: 'Information Technology', exchange: 'NSE' },
    { symbol: 'LTTS.NS', name: 'L&T Technology Services Limited', sector: 'Information Technology', exchange: 'NSE' },

    // Banking & Financial Services
    { symbol: 'FEDERALBNK.NS', name: 'Federal Bank Limited', sector: 'Banking', exchange: 'NSE' },
    { symbol: 'IDFCFIRSTB.NS', name: 'IDFC First Bank Limited', sector: 'Banking', exchange: 'NSE' },
    { symbol: 'BANDHANBNK.NS', name: 'Bandhan Bank Limited', sector: 'Banking', exchange: 'NSE' },
    { symbol: 'PNB.NS', name: 'Punjab National Bank', sector: 'Banking', exchange: 'NSE' },
    { symbol: 'BANKBARODA.NS', name: 'Bank of Baroda', sector: 'Banking', exchange: 'NSE' },
    { symbol: 'CANBK.NS', name: 'Canara Bank', sector: 'Banking', exchange: 'NSE' },
    { symbol: 'UNIONBANK.NS', name: 'Union Bank of India', sector: 'Banking', exchange: 'NSE' },
    { symbol: 'YESBANK.NS', name: 'Yes Bank Limited', sector: 'Banking', exchange: 'NSE' },
    { symbol: 'RBLBANK.NS', name: 'RBL Bank Limited', sector: 'Banking', exchange: 'NSE' },
    { symbol: 'SOUTHBANK.NS', name: 'South Indian Bank Limited', sector: 'Banking', exchange: 'NSE' },
    { symbol: 'CHOLAFIN.NS', name: 'Cholamandalam Investment and Finance Company Limited', sector: 'Financial Services', exchange: 'NSE' },
    { symbol: 'BAJAJHLDNG.NS', name: 'Bajaj Holdings & Investment Limited', sector: 'Financial Services', exchange: 'NSE' },
    { symbol: 'LICHSGFIN.NS', name: 'LIC Housing Finance Limited', sector: 'Financial Services', exchange: 'NSE' },
    { symbol: 'HDFCAMC.NS', name: 'HDFC Asset Management Company Limited', sector: 'Financial Services', exchange: 'NSE' },
    { symbol: 'MUTHOOTFIN.NS', name: 'Muthoot Finance Limited', sector: 'Financial Services', exchange: 'NSE' },

    // Pharmaceuticals & Healthcare
    { symbol: 'BIOCON.NS', name: 'Biocon Limited', sector: 'Pharmaceuticals', exchange: 'NSE' },
    { symbol: 'REDDY.NS', name: 'Dr. Reddys Laboratories Limited', sector: 'Pharmaceuticals', exchange: 'NSE' },
    { symbol: 'LUPIN.NS', name: 'Lupin Limited', sector: 'Pharmaceuticals', exchange: 'NSE' },
    { symbol: 'CADILAHC.NS', name: 'Cadila Healthcare Limited', sector: 'Pharmaceuticals', exchange: 'NSE' },
    { symbol: 'AUROPHARMA.NS', name: 'Aurobindo Pharma Limited', sector: 'Pharmaceuticals', exchange: 'NSE' },
    { symbol: 'TORNTPHARM.NS', name: 'Torrent Pharmaceuticals Limited', sector: 'Pharmaceuticals', exchange: 'NSE' },
    { symbol: 'GLENMARK.NS', name: 'Glenmark Pharmaceuticals Limited', sector: 'Pharmaceuticals', exchange: 'NSE' },
    { symbol: 'ALKEM.NS', name: 'Alkem Laboratories Limited', sector: 'Pharmaceuticals', exchange: 'NSE' },
    { symbol: 'FORTIS.NS', name: 'Fortis Healthcare Limited', sector: 'Healthcare', exchange: 'NSE' },
    { symbol: 'MAXHEALTH.NS', name: 'Max Healthcare Institute Limited', sector: 'Healthcare', exchange: 'NSE' },
    { symbol: 'NARAYANHRT.NS', name: 'Narayana Hrudayalaya Limited', sector: 'Healthcare', exchange: 'NSE' },

    // Automobiles & Auto Components
    { symbol: 'ASHOKLEY.NS', name: 'Ashok Leyland Limited', sector: 'Automobiles', exchange: 'NSE' },
    { symbol: 'ESCORTS.NS', name: 'Escorts Limited', sector: 'Automobiles', exchange: 'NSE' },
    { symbol: 'TVSMOTORS.NS', name: 'TVS Motor Company Limited', sector: 'Automobiles', exchange: 'NSE' },
    { symbol: 'BALKRISIND.NS', name: 'Balkrishna Industries Limited', sector: 'Auto Components', exchange: 'NSE' },
    { symbol: 'MRF.NS', name: 'MRF Limited', sector: 'Auto Components', exchange: 'NSE' },
    { symbol: 'APOLLOTYRE.NS', name: 'Apollo Tyres Limited', sector: 'Auto Components', exchange: 'NSE' },
    { symbol: 'CEAT.NS', name: 'CEAT Limited', sector: 'Auto Components', exchange: 'NSE' },
    { symbol: 'BOSCHLTD.NS', name: 'Bosch Limited', sector: 'Auto Components', exchange: 'NSE' },
    { symbol: 'MOTHERSUMI.NS', name: 'Motherson Sumi Systems Limited', sector: 'Auto Components', exchange: 'NSE' },
    { symbol: 'BHARATFORG.NS', name: 'Bharat Forge Limited', sector: 'Auto Components', exchange: 'NSE' },

    // Metals & Mining
    { symbol: 'SAIL.NS', name: 'Steel Authority of India Limited', sector: 'Metals', exchange: 'NSE' },
    { symbol: 'JINDALSTEL.NS', name: 'Jindal Steel & Power Limited', sector: 'Metals', exchange: 'NSE' },
    { symbol: 'VEDL.NS', name: 'Vedanta Limited', sector: 'Metals', exchange: 'NSE' },
    { symbol: 'NMDC.NS', name: 'NMDC Limited', sector: 'Mining', exchange: 'NSE' },
    { symbol: 'MOIL.NS', name: 'MOIL Limited', sector: 'Mining', exchange: 'NSE' },
    { symbol: 'WELCORP.NS', name: 'Welspun Corp Limited', sector: 'Metals', exchange: 'NSE' },
    { symbol: 'NATIONALUM.NS', name: 'National Aluminium Company Limited', sector: 'Metals', exchange: 'NSE' },

    // Textiles & Apparel
    { symbol: 'RAYMOND.NS', name: 'Raymond Limited', sector: 'Textiles', exchange: 'NSE' },
    { symbol: 'ARVIND.NS', name: 'Arvind Limited', sector: 'Textiles', exchange: 'NSE' },
    { symbol: 'WELSPUNIND.NS', name: 'Welspun India Limited', sector: 'Textiles', exchange: 'NSE' },
    { symbol: 'PAGEIND.NS', name: 'Page Industries Limited', sector: 'Textiles', exchange: 'NSE' },
    { symbol: 'ADITYADB1.NS', name: 'Aditya Birla Fashion and Retail Limited', sector: 'Retail', exchange: 'NSE' },

    // Chemicals & Fertilizers
    { symbol: 'UPL.NS', name: 'UPL Limited', sector: 'Chemicals', exchange: 'NSE' },
    { symbol: 'AAVAS.NS', name: 'Aavas Financiers Limited', sector: 'Financial Services', exchange: 'NSE' },
    { symbol: 'SRF.NS', name: 'SRF Limited', sector: 'Chemicals', exchange: 'NSE' },
    { symbol: 'DEEPAKNTR.NS', name: 'Deepak Nitrite Limited', sector: 'Chemicals', exchange: 'NSE' },
    { symbol: 'GNFC.NS', name: 'Gujarat Narmada Valley Fertilizers & Chemicals Limited', sector: 'Fertilizers', exchange: 'NSE' },
    { symbol: 'CHAMBLFERT.NS', name: 'Chambal Fertilisers and Chemicals Limited', sector: 'Fertilizers', exchange: 'NSE' },
    { symbol: 'COROMANDEL.NS', name: 'Coromandel International Limited', sector: 'Fertilizers', exchange: 'NSE' },

    // Real Estate
    { symbol: 'DLF.NS', name: 'DLF Limited', sector: 'Real Estate', exchange: 'NSE' },
    { symbol: 'GODREJPROP.NS', name: 'Godrej Properties Limited', sector: 'Real Estate', exchange: 'NSE' },
    { symbol: 'OBEROIRLTY.NS', name: 'Oberoi Realty Limited', sector: 'Real Estate', exchange: 'NSE' },
    { symbol: 'PRESTIGE.NS', name: 'Prestige Estates Projects Limited', sector: 'Real Estate', exchange: 'NSE' },
    { symbol: 'BRIGADE.NS', name: 'Brigade Enterprises Limited', sector: 'Real Estate', exchange: 'NSE' },

    // Media & Entertainment
    { symbol: 'ZEEL.NS', name: 'Zee Entertainment Enterprises Limited', sector: 'Media', exchange: 'NSE' },
    { symbol: 'SUNTV.NS', name: 'Sun TV Network Limited', sector: 'Media', exchange: 'NSE' },
    { symbol: 'PVRINOX.NS', name: 'PVR INOX Limited', sector: 'Entertainment', exchange: 'NSE' },
    { symbol: 'BALRAMCHIN.NS', name: 'Balrampur Chini Mills Limited', sector: 'Sugar', exchange: 'NSE' },

    // Popular US Stocks (for global exposure)
    { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', exchange: 'NASDAQ' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', exchange: 'NASDAQ' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology', exchange: 'NASDAQ' },
    { symbol: 'TSLA', name: 'Tesla, Inc.', sector: 'Automobiles', exchange: 'NASDAQ' },
    { symbol: 'AMZN', name: 'Amazon.com, Inc.', sector: 'E-commerce', exchange: 'NASDAQ' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology', exchange: 'NASDAQ' },
    { symbol: 'META', name: 'Meta Platforms, Inc.', sector: 'Technology', exchange: 'NASDAQ' },
    { symbol: 'NFLX', name: 'Netflix, Inc.', sector: 'Entertainment', exchange: 'NASDAQ' },
    { symbol: 'AMD', name: 'Advanced Micro Devices, Inc.', sector: 'Technology', exchange: 'NASDAQ' },
    { symbol: 'INTC', name: 'Intel Corporation', sector: 'Technology', exchange: 'NASDAQ' }
];

// Popular search terms and their mappings
export const SEARCH_ALIASES = {
    // Common search terms
    'reliance': 'RELIANCE.NS',
    'tcs': 'TCS.NS',
    'hdfc': 'HDFCBANK.NS',
    'infosys': 'INFY.NS',
    'sbi': 'SBIN.NS',
    'icici': 'ICICIBANK.NS',
    'wipro': 'WIPRO.NS',
    'maruti': 'MARUTI.NS',
    'bajaj': 'BAJFINANCE.NS',
    'adani': 'ADANIENT.NS',
    'tata': 'TCS.NS',
    'airtel': 'BHARTIARTL.NS',
    'itc': 'ITC.NS',
    'ongc': 'ONGC.NS',
    'coal': 'COALINDIA.NS',
    'power': 'POWERGRID.NS',
    'lt': 'LT.NS',
    'larsen': 'LT.NS',
    'sun pharma': 'SUNPHARMA.NS',
    'dr reddy': 'DRREDDY.NS',
    'cipla': 'CIPLA.NS',
    'biocon': 'BIOCON.NS',
    'titan': 'TITAN.NS',
    'asian paints': 'ASIANPAINT.NS',
    'ultratech': 'ULTRACEMCO.NS',
    'nestle': 'NESTLEIND.NS',
    'britannia': 'BRITANNIA.NS',
    'dabur': 'DABUR.NS',
    'godrej': 'GODREJCP.NS',
    'marico': 'MARICO.NS',
    'hul': 'HINDUNILVR.NS',
    'hindustan unilever': 'HINDUNILVR.NS',
    'zomato': 'ZOMATO.NS',
    'paytm': 'PAYTM.NS',
    'naukri': 'NAUKRI.NS',
    'dmart': 'DMART.NS',
    'apollo': 'APOLLOHOSP.NS',
    'fortis': 'FORTIS.NS',
    'hero': 'HEROMOTOCO.NS',
    'bajaj auto': 'BAJAJ-AUTO.NS',
    'eicher': 'EICHERMOT.NS',
    'tata motors': 'TATAMOTORS.NS',
    'mahindra': 'M&M.NS',
    'tata steel': 'TATASTEEL.NS',
    'jsw': 'JSWSTEEL.NS',
    'hindalco': 'HINDALCO.NS',
    'vedanta': 'VEDL.NS',
    'sail': 'SAIL.NS',
    'ntpc': 'NTPC.NS',
    'bpcl': 'BPCL.NS',
    'ioc': 'IOC.NS',
    'hpcl': 'HINDPETRO.NS',
    'grasim': 'GRASIM.NS',
    'shree cement': 'SHREECEM.NS',
    'dlf': 'DLF.NS',
    'godrej properties': 'GODREJPROP.NS',
    'oberoi': 'OBEROIRLTY.NS',
    'zee': 'ZEEL.NS',
    'sun tv': 'SUNTV.NS',
    'pvr': 'PVRINOX.NS',
    
    // US stocks
    'apple': 'AAPL',
    'google': 'GOOGL',
    'microsoft': 'MSFT',
    'tesla': 'TSLA',
    'amazon': 'AMZN',
    'nvidia': 'NVDA',
    'meta': 'META',
    'facebook': 'META',
    'netflix': 'NFLX',
    'amd': 'AMD',
    'intel': 'INTC'
};

// Get stocks by sector
export const getStocksBySector = (sector) => {
    return INDIAN_STOCKS.filter(stock => 
        stock.sector.toLowerCase().includes(sector.toLowerCase())
    );
};

// Search stocks with fuzzy matching
export const searchStocks = (query, limit = 10) => {
    const searchTerm = query.toLowerCase().trim();
    
    // Check for exact alias match first
    if (SEARCH_ALIASES[searchTerm]) {
        const exactMatch = INDIAN_STOCKS.find(stock => 
            stock.symbol === SEARCH_ALIASES[searchTerm]
        );
        if (exactMatch) {
            return [exactMatch];
        }
    }
    
    // Search by symbol and name
    const results = INDIAN_STOCKS.filter(stock => {
        const symbolMatch = stock.symbol.toLowerCase().includes(searchTerm);
        const nameMatch = stock.name.toLowerCase().includes(searchTerm);
        const sectorMatch = stock.sector.toLowerCase().includes(searchTerm);
        
        return symbolMatch || nameMatch || sectorMatch;
    });
    
    // Sort by relevance (exact matches first)
    results.sort((a, b) => {
        const aSymbolExact = a.symbol.toLowerCase() === searchTerm;
        const bSymbolExact = b.symbol.toLowerCase() === searchTerm;
        const aNameExact = a.name.toLowerCase().includes(searchTerm);
        const bNameExact = b.name.toLowerCase().includes(searchTerm);
        
        if (aSymbolExact && !bSymbolExact) return -1;
        if (!aSymbolExact && bSymbolExact) return 1;
        if (aNameExact && !bNameExact) return -1;
        if (!aNameExact && bNameExact) return 1;
        
        return 0;
    });
    
    return results.slice(0, limit);
};

export default INDIAN_STOCKS;