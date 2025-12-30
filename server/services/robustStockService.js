import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class RobustStockService {
    constructor() {
        this.apis = {
            // Free APIs that actually work
            yahooQuery1: 'https://query1.finance.yahoo.com',
            yahooQuery2: 'https://query2.finance.yahoo.com',
            finnhub: 'https://finnhub.io/api/v1',
            alphavantage: 'https://www.alphavantage.co/query',
            fmp: 'https://financialmodelingprep.com/api/v3',
            coinGecko: 'https://api.coingecko.com/api/v3',
            indianAPI: 'https://stock.indianapi.in'
        };
        
        this.keys = {
            fmp: process.env.FMP_API_KEY,
            alphavantage: process.env.ALPHA_VANTAGE_KEY,
            finnhub: process.env.FINNHUB_API_KEY || 'demo', // Get free key from finnhub.io
            indianAPI: process.env.INDIAN_API_KEY
        };

        // Debug: Log loaded keys
        console.log('🔑 RobustStockService initialized with API keys');

        // Cache for 3 minutes
        this.cache = new Map();
        this.cacheTimeout = 3 * 60 * 1000;
    }

    async getComprehensiveStockData(symbol) {
        try {
            console.log(`🔍 Fetching robust data for ${symbol}`);
            
            // Check cache
            const cacheKey = `robust_${symbol}`;
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                console.log(`📦 Using cached data for ${symbol}`);
                return cached;
            }

            let result = this.getEmptyDataStructure(symbol);

            // Route to appropriate data source
            if (symbol.includes('.NS') || symbol.includes('.BO')) {
                result = await this.getIndianStockData(symbol, result);
            } else if (this.isCrypto(symbol)) {
                result = await this.getCryptoData(symbol, result);
            } else {
                result = await this.getUSStockData(symbol, result);
            }

            // Cache and return
            this.setCache(cacheKey, result);
            console.log(`✅ Robust data fetched for ${symbol}`);
            return result;

        } catch (error) {
            console.error(`❌ Error in robust service for ${symbol}:`, error.message);
            return this.getEmptyDataStructure(symbol);
        }
    }

    async getUSStockData(symbol, result) {
        try {
            // Try multiple sources in parallel
            const [yahooData, finnhubData, fmpData] = await Promise.allSettled([
                this.getYahooData(symbol),
                this.getFinnhubData(symbol),
                this.getFMPDataNew(symbol)
            ]);

            // Merge data from all sources
            if (yahooData.status === 'fulfilled' && yahooData.value) {
                this.mergeData(result, yahooData.value);
            }

            if (finnhubData.status === 'fulfilled' && finnhubData.value) {
                this.mergeData(result, finnhubData.value);
            }

            if (fmpData.status === 'fulfilled' && fmpData.value) {
                this.mergeData(result, fmpData.value);
            }

            return result;
        } catch (error) {
            console.error(`Error fetching US stock data for ${symbol}:`, error.message);
            return result;
        }
    }

    async getYahooData(symbol) {
        try {
            console.log(`🔍 Fetching Yahoo data for ${symbol}`);
            
            // Use a simpler Yahoo Finance approach
            const response = await axios.get(`${this.apis.yahooQuery1}/v8/finance/chart/${symbol}`, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            if (response.data?.chart?.result?.[0]) {
                const data = response.data.chart.result[0];
                const meta = data.meta;
                
                console.log(`✅ Yahoo data found for ${symbol}`);
                return {
                    name: meta.longName || meta.shortName,
                    lastTradedPrice: meta.regularMarketPrice,
                    oneDayChange: meta.regularMarketPrice - meta.previousClose,
                    oneDayChangePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
                    volume: meta.regularMarketVolume,
                    fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
                    fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
                    marketCap: meta.marketCap,
                    currency: meta.currency
                };
            }

            return null;
        } catch (error) {
            console.error(`Yahoo API error for ${symbol}:`, error.message);
            return null;
        }
    }

    async getFinnhubData(symbol) {
        try {
            console.log(`🔍 Fetching Finnhub data for ${symbol}`);
            
            const [profile, metrics] = await Promise.allSettled([
                axios.get(`${this.apis.finnhub}/stock/profile2?symbol=${symbol}&token=${this.keys.finnhub}`),
                axios.get(`${this.apis.finnhub}/stock/metric?symbol=${symbol}&metric=all&token=${this.keys.finnhub}`)
            ]);

            const result = {};

            if (profile.status === 'fulfilled' && profile.value.data) {
                const p = profile.value.data;
                console.log(`📋 Finnhub profile found for ${symbol}`);
                result.name = p.name;
                result.sector = p.finnhubIndustry;
                result.website = p.weburl;
                result.employees = p.employeeTotal;
                result.marketCap = p.marketCapitalization * 1000000; // Convert to actual value
                result.description = p.description;
            }

            if (metrics.status === 'fulfilled' && metrics.value.data?.metric) {
                const m = metrics.value.data.metric;
                console.log(`📊 Finnhub metrics found for ${symbol}`);
                result.peRatio = m.peBasicExclExtraTTM;
                result.pbRatio = m.pbQuarterly;
                result.roe = m.roeRfy;
                result.roa = m.roaRfy;
                result.eps = m.epsBasicExclExtraAnnual;
                result.dividendYield = m.dividendYieldIndicatedAnnual;
                result.beta = m.beta;
                result.grossMargin = m.grossMarginTTM;
                result.operatingMargin = m.operatingMarginTTM;
                result.netMargin = m.netProfitMarginTTM;
                result.currentRatio = m.currentRatioQuarterly;
                result.debtToEquity = m.totalDebt2TotalEquityQuarterly;
            }

            return Object.keys(result).length > 0 ? result : null;
        } catch (error) {
            console.error(`Finnhub API error for ${symbol}:`, error.message);
            return null;
        }
    }

    async getFMPDataNew(symbol) {
        try {
            console.log(`🔍 Fetching FMP data (new) for ${symbol}`);
            
            // Try the working FMP endpoints
            const response = await axios.get(`${this.apis.fmp}/profile/${symbol}?apikey=${this.keys.fmp}`, {
                timeout: 10000
            });

            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                const data = response.data[0];
                console.log(`📋 FMP profile found for ${symbol}`);
                
                return {
                    name: data.companyName,
                    sector: data.sector,
                    industry: data.industry,
                    website: data.website,
                    employees: data.fullTimeEmployees,
                    description: data.description,
                    marketCap: data.mktCap,
                    peRatio: data.pe,
                    eps: data.eps,
                    beta: data.beta,
                    lastTradedPrice: data.price,
                    fiftyTwoWeekHigh: data.range?.split('-')?.[1]?.trim(),
                    fiftyTwoWeekLow: data.range?.split('-')?.[0]?.trim()
                };
            }

            return null;
        } catch (error) {
            console.error(`FMP API error for ${symbol}:`, error.message);
            return null;
        }
    }

    async getIndianStockData(symbol, result) {
        try {
            console.log(`🔍 Fetching Indian stock data for ${symbol}`);
            
            const [indianData, yahooData] = await Promise.allSettled([
                this.getIndianAPIData(symbol),
                this.getYahooData(symbol)
            ]);

            if (indianData.status === 'fulfilled' && indianData.value) {
                this.mergeData(result, indianData.value);
            }

            if (yahooData.status === 'fulfilled' && yahooData.value) {
                this.mergeData(result, yahooData.value);
            }

            return result;
        } catch (error) {
            console.error(`Error fetching Indian stock data for ${symbol}:`, error.message);
            return result;
        }
    }

    async getIndianAPIData(symbol) {
        try {
            const cleanSymbol = symbol.replace('.NS', '').replace('.BO', '');
            console.log(`🇮🇳 Calling Indian API for: ${cleanSymbol}`);
            
            const response = await axios.get(`${this.apis.indianAPI}/stock`, {
                params: { name: cleanSymbol },
                headers: { 
                    "X-Api-Key": this.keys.indianAPI,
                    "Content-Type": "application/json"
                },
                timeout: 15000
            });

            if (response.data && response.status === 200) {
                console.log(`🇮🇳 Indian API comprehensive data found for ${symbol}`);
                const data = response.data;
                
                // Extract financial data from the comprehensive response
                const result = {
                    name: data.companyName || data.name,
                    lastTradedPrice: typeof data.currentPrice === 'object' ? 
                        parseFloat(data.currentPrice.NSE || data.currentPrice.BSE) : 
                        parseFloat(data.currentPrice || data.price),
                    oneDayChange: data.change,
                    oneDayChangePercent: parseFloat(data.percentChange) || data.changePercent,
                    volume: data.volume,
                    marketCap: data.marketCap,
                    fiftyTwoWeekHigh: parseFloat(data.yearHigh) || data.high52w,
                    fiftyTwoWeekLow: parseFloat(data.yearLow) || data.low52w,
                    sector: data.sector,
                    industry: data.industry,
                    beta: data.beta
                };

                // Extract key metrics if available
                if (data.keyMetrics) {
                    // Extract values from the nested keyMetrics structure
                    const metrics = data.keyMetrics;
                    
                    // P/E Ratio from valuation section
                    result.peRatio = this.extractMetricValue(metrics.valuation, ['pPerEExcludingExtraordinaryItemsMostRecentFiscalYear', 'pPerEBasicExcludingExtraordinaryItemsTTM']);
                    
                    // P/B Ratio from valuation section
                    result.pbRatio = this.extractMetricValue(metrics.valuation, ['priceToTangibleBookMostRecentQuarter', 'priceToBookMostRecentQuarter']);
                    
                    // ROE from management effectiveness (convert from percentage to decimal)
                    const roeValue = this.extractMetricValue(metrics.mgmtEffectiveness, ['returnOnAverageEquityTrailing12Month', 'returnOnAverageEquityMostRecentFiscalYear)']);
                    result.roe = roeValue ? roeValue / 100 : null;
                    
                    // ROA from management effectiveness (convert from percentage to decimal)
                    const roaValue = this.extractMetricValue(metrics.mgmtEffectiveness, ['returnOnAverageAssetsTrailing12Month', 'returnOnAverageAssetsMostRecenFiscalYear']);
                    result.roa = roaValue ? roaValue / 100 : null;
                    
                    // EPS from per share data
                    result.eps = this.extractMetricValue(metrics.persharedata, ['ePSNormalizedMostRecentFiscalYear', 'ePSIncludingExtraOrdinaryItemsTrailing12Month']);
                    
                    // Dividend Yield from valuation (convert from percentage to decimal)
                    const dividendYield = this.extractMetricValue(metrics.valuation, ['currentDividendYieldCommonStockPrimaryIssueLTM', 'dividendYieldIndicatedAnnualDividendDividedByClosingprice']);
                    result.dividendYield = dividendYield ? dividendYield / 100 : null;
                    
                    // Book Value from per share data
                    result.bookValue = this.extractMetricValue(metrics.persharedata, ['bookValuePerShareMostRecentQuarter', 'bookValuePerShare MostRecentFiscalYear']);
                    
                    // Debt to Equity from financial strength
                    result.debtToEquity = this.extractMetricValue(metrics.financialstrength, ['totalDebtPerTotalEquityMostRecentQuarter', 'totalDebtPerTotalEquityMostRecentFiscalYear']);
                    
                    // Market Cap from price and volume
                    const marketCapCrores = this.extractMetricValue(metrics.priceandVolume, ['marketCap']);
                    result.marketCap = marketCapCrores ? marketCapCrores * 10000000 : null; // Convert from crores to actual value
                    
                    // Beta from price and volume
                    result.beta = this.extractMetricValue(metrics.priceandVolume, ['beta']);
                    
                    // Margins from margins section (convert from percentage to decimal)
                    const grossMarginValue = this.extractMetricValue(metrics.margins, ['grossMarginTrailing12Month', 'grossMargin1stHistoricalFiscalYear']);
                    result.grossMargin = grossMarginValue ? grossMarginValue / 100 : null;
                    
                    const operatingMarginValue = this.extractMetricValue(metrics.margins, ['operatingMarginTrailing12Month', 'operatingMargin1stHistoricalFiscalYear']);
                    result.operatingMargin = operatingMarginValue ? operatingMarginValue / 100 : null;
                    
                    const netMarginValue = this.extractMetricValue(metrics.margins, ['netProfitMarginPercentTrailing12Month', 'netProfitMarginPercent1stHistoricalFiscalYear']);
                    result.netMargin = netMarginValue ? netMarginValue / 100 : null;
                }

                // Extract financial data from stockFinancialData or financials
                const financialData = data.stockFinancialData || data.financials;
                if (financialData && Array.isArray(financialData)) {
                    const latestFinancials = financialData[0]; // Most recent period
                    
                    if (latestFinancials?.stockFinancialMap) {
                        const financials = latestFinancials.stockFinancialMap;
                        
                        // Income Statement Data
                        if (financials.INC) {
                            const incomeData = this.extractFinancialValue(financials.INC);
                            result.revenue = incomeData['TotalRevenue'] || incomeData['Revenue'];
                            result.grossProfit = incomeData['GrossProfit'];
                            result.operatingIncome = incomeData['OperatingIncome'];
                            result.netIncome = incomeData['NetIncome'];
                            result.eps = result.eps || incomeData['DilutedNormalizedEPS'];
                            result.dividendYield = result.dividendYield || incomeData['DPS-CommonStockPrimaryIssue'];
                            
                            // Calculate margins ONLY if not already available from keyMetrics
                            if (result.revenue) {
                                if (result.grossMargin === null && result.grossProfit) {
                                    result.grossMargin = (result.grossProfit / result.revenue); // Return as decimal (0.31 not 31%)
                                }
                                if (result.operatingMargin === null && result.operatingIncome) {
                                    result.operatingMargin = (result.operatingIncome / result.revenue); // Return as decimal
                                }
                                if (result.netMargin === null && result.netIncome) {
                                    result.netMargin = (result.netIncome / result.revenue); // Return as decimal
                                }
                            }
                        }
                        
                        // Balance Sheet Data
                        if (financials.BAL) {
                            const balanceData = this.extractFinancialValue(financials.BAL);
                            result.totalAssets = balanceData['TotalAssets'];
                            result.totalDebt = balanceData['TotalDebt'];
                            result.totalEquity = balanceData['TotalEquity'];
                            result.bookValue = result.bookValue || balanceData['TangibleBookValueperShareCommonEq'];
                            
                            // Calculate financial ratios ONLY if not already available from keyMetrics
                            if (result.debtToEquity === null && result.totalDebt && result.totalEquity) {
                                result.debtToEquity = (result.totalDebt / result.totalEquity);
                            }
                            
                            if (result.pbRatio === null && result.lastTradedPrice && result.bookValue) {
                                result.pbRatio = result.lastTradedPrice / result.bookValue;
                            }
                            
                            if (result.peRatio === null && result.lastTradedPrice && result.eps) {
                                result.peRatio = result.lastTradedPrice / result.eps;
                            }
                            
                            if (result.roe === null && result.netIncome && result.totalEquity) {
                                result.roe = (result.netIncome / result.totalEquity); // Return as decimal (0.0826 not 8.26)
                            }
                            
                            if (result.roa === null && result.netIncome && result.totalAssets) {
                                result.roa = (result.netIncome / result.totalAssets); // Return as decimal
                            }
                        }
                        
                        // Cash Flow Data
                        if (financials.CAS) {
                            const cashFlowData = this.extractFinancialValue(financials.CAS);
                            result.operatingCashFlow = cashFlowData['CashfromOperatingActivities'];
                            result.freeCashFlow = cashFlowData['CashfromOperatingActivities'] - Math.abs(cashFlowData['CapitalExpenditures'] || 0);
                        }
                    }
                }

                // Extract shareholding pattern if available
                if (data.shareholding) {
                    result.promoters = parseFloat(data.shareholding.promoters);
                    result.fii = parseFloat(data.shareholding.fii);
                    result.dii = parseFloat(data.shareholding.dii);
                    result.public = parseFloat(data.shareholding.public);
                    result.government = parseFloat(data.shareholding.government);
                }

                console.log(`✅ Extracted comprehensive Indian data for ${symbol}`);
                return result;
            }

            return null;
        } catch (error) {
            console.error(`❌ Indian API error for ${symbol}:`, error.response?.status, error.response?.data || error.message);
            return null;
        }
    }

    // Helper method to extract financial values from the Indian API format
    extractFinancialValue(financialArray) {
        const result = {};
        if (Array.isArray(financialArray)) {
            financialArray.forEach(item => {
                if (item.key && item.value && item.value !== "0.00") {
                    // Convert string values to numbers
                    const numValue = parseFloat(item.value);
                    if (!isNaN(numValue)) {
                        result[item.key] = numValue;
                    }
                }
            });
        }
        return result;
    }

    // Helper method to extract metric values from Indian API keyMetrics arrays
    extractMetricValue(metricsArray, possibleKeys) {
        if (!Array.isArray(metricsArray)) return null;
        
        for (const item of metricsArray) {
            if (item.key && item.value !== null && item.value !== undefined) {
                for (const key of possibleKeys) {
                    if (item.key === key) {
                        const value = parseFloat(item.value);
                        if (!isNaN(value)) {
                            return value;
                        }
                    }
                }
            }
        }
        return null;
    }

    async getCryptoData(symbol, result) {
        try {
            console.log(`🔍 Fetching crypto data for ${symbol}`);
            const coinId = this.getCoinGeckoId(symbol);
            
            const response = await axios.get(`${this.apis.coinGecko}/coins/${coinId}`, {
                timeout: 10000
            });

            if (response.data?.market_data) {
                const coin = response.data;
                console.log(`🪙 Crypto data found for ${symbol}`);
                
                result.name = coin.name;
                result.lastTradedPrice = coin.market_data.current_price?.usd;
                result.oneDayChangePercent = coin.market_data.price_change_percentage_24h;
                result.marketCap = coin.market_data.market_cap?.usd;
                result.volume = coin.market_data.total_volume?.usd;
                result.fiftyTwoWeekHigh = coin.market_data.high_52w?.usd;
                result.fiftyTwoWeekLow = coin.market_data.low_52w?.usd;
                result.description = coin.description?.en;
                result.circulatingSupply = coin.market_data.circulating_supply;
                result.totalSupply = coin.market_data.total_supply;
                result.maxSupply = coin.market_data.max_supply;
            }

            return result;
        } catch (error) {
            console.error(`Error fetching crypto data for ${symbol}:`, error.message);
            return result;
        }
    }

    // Helper methods
    mergeData(target, source) {
        for (const [key, value] of Object.entries(source)) {
            if (value !== null && value !== undefined && !target[key]) {
                target[key] = value;
            }
        }
    }

    isCrypto(symbol) {
        const cryptoSymbols = ['BTC', 'ETH', 'ADA', 'DOT', 'SOL', 'MATIC', 'AVAX', 'LINK', 'UNI'];
        return cryptoSymbols.some(crypto => symbol.toUpperCase().includes(crypto));
    }

    getCoinGeckoId(symbol) {
        const cryptoMap = {
            'BTC': 'bitcoin',
            'ETH': 'ethereum',
            'ADA': 'cardano',
            'DOT': 'polkadot',
            'SOL': 'solana',
            'MATIC': 'polygon',
            'AVAX': 'avalanche-2',
            'LINK': 'chainlink',
            'UNI': 'uniswap'
        };
        
        const cleanSymbol = symbol.replace('-USD', '').replace('-USDT', '').toUpperCase();
        return cryptoMap[cleanSymbol] || 'bitcoin';
    }

    getEmptyDataStructure(symbol) {
        return {
            symbol,
            name: null,
            sector: null,
            industry: null,
            description: null,
            website: null,
            employees: null,
            lastTradedPrice: null,
            oneDayChange: null,
            oneDayChangePercent: null,
            fiftyTwoWeekHigh: null,
            fiftyTwoWeekLow: null,
            volume: null,
            avgVolume: null,
            marketCap: null,
            peRatio: null,
            pegRatio: null,
            bookValue: null,
            pbRatio: null,
            roe: null,
            roa: null,
            eps: null,
            dividendYield: null,
            debtToEquity: null,
            currentRatio: null,
            quickRatio: null,
            beta: null,
            grossMargin: null,
            operatingMargin: null,
            netMargin: null,
            revenue: null,
            grossProfit: null,
            operatingIncome: null,
            netIncome: null,
            ebitda: null,
            totalAssets: null,
            totalDebt: null,
            totalEquity: null,
            freeCashFlow: null,
            operatingCashFlow: null,
            promoters: null,
            dii: null,
            fii: null,
            public: null,
            government: null,
            fiftyDMA: null,
            twoHundredDMA: null,
            rsi: null,
            macd: null,
            circulatingSupply: null,
            totalSupply: null,
            maxSupply: null
        };
    }

    // Cache methods
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }
}

export default new RobustStockService();