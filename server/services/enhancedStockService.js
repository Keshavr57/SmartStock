import axios from 'axios';

class EnhancedStockService {
    constructor() {
        // API Configuration
        this.apis = {
            fmp: {
                baseURL: 'https://financialmodelingprep.com/api/v3',
                key: process.env.FMP_API_KEY || 'demo' // Get free key from financialmodelingprep.com
            },
            alphaVantage: {
                baseURL: 'https://www.alphavantage.co/query',
                key: process.env.ALPHA_VANTAGE_KEY || 'demo' // Get free key from alphavantage.co
            },
            polygon: {
                baseURL: 'https://api.polygon.io/v2',
                key: process.env.POLYGON_API_KEY || 'demo' // Get free key from polygon.io
            },
            yahoo: {
                baseURL: 'https://query1.finance.yahoo.com'
            },
            indianAPI: {
                baseURL: 'https://stock.indianapi.in',
                key: process.env.INDIAN_API_KEY
            },
            coinGecko: {
                baseURL: 'https://api.coingecko.com/api/v3'
            }
        };

        // Cache for 5 minutes
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000;
    }

    async getComprehensiveStockData(symbol) {
        try {
            console.log(`🔍 Fetching comprehensive data for ${symbol}`);
            
            // Check cache first
            const cacheKey = `enhanced_${symbol}`;
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                console.log(`📦 Using cached data for ${symbol}`);
                return cached;
            }

            let result = this.getEmptyDataStructure(symbol);

            // Determine symbol type and fetch data accordingly
            if (symbol.includes('.NS') || symbol.includes('.BO')) {
                result = await this.getIndianStockData(symbol, result);
            } else if (this.isCrypto(symbol)) {
                result = await this.getCryptoData(symbol, result);
            } else {
                result = await this.getUSStockData(symbol, result);
            }

            // Cache the result
            this.setCache(cacheKey, result);
            
            console.log(`✅ Enhanced data fetched for ${symbol}`);
            return result;

        } catch (error) {
            console.error(`❌ Error fetching enhanced data for ${symbol}:`, error.message);
            return this.getEmptyDataStructure(symbol);
        }
    }

    async getUSStockData(symbol, result) {
        try {
            // Use multiple APIs for comprehensive data
            const [fmpData, alphaData, yahooData] = await Promise.allSettled([
                this.getFMPData(symbol),
                this.getAlphaVantageData(symbol),
                this.getYahooData(symbol)
            ]);

            // Process FMP data (most comprehensive)
            if (fmpData.status === 'fulfilled' && fmpData.value) {
                const fmp = fmpData.value;
                
                // Basic info
                result.name = fmp.companyName || fmp.name;
                result.sector = fmp.sector;
                result.industry = fmp.industry;
                result.description = fmp.description;
                result.website = fmp.website;
                result.employees = fmp.fullTimeEmployees;
                
                // Price data
                result.lastTradedPrice = fmp.price;
                result.oneDayChange = fmp.change;
                result.oneDayChangePercent = fmp.changesPercentage;
                result.volume = fmp.volume;
                result.avgVolume = fmp.avgVolume;
                
                // Market data
                result.marketCap = fmp.marketCap;
                result.fiftyTwoWeekHigh = fmp.yearHigh;
                result.fiftyTwoWeekLow = fmp.yearLow;
                
                // Valuation metrics
                result.peRatio = fmp.pe;
                result.pegRatio = fmp.peg;
                result.pbRatio = fmp.priceToBook;
                result.eps = fmp.eps;
                result.beta = fmp.beta;
                
                // Profitability
                result.roe = fmp.roe;
                result.roa = fmp.roa;
                result.grossMargin = fmp.grossProfitMargin;
                result.operatingMargin = fmp.operatingProfitMargin;
                result.netMargin = fmp.netProfitMargin;
                
                // Financial health
                result.debtToEquity = fmp.debtToEquity;
                result.currentRatio = fmp.currentRatio;
                result.quickRatio = fmp.quickRatio;
                
                // Dividends
                result.dividendYield = fmp.dividendYield;
                result.payoutRatio = fmp.payoutRatio;
                
                // Financial statements
                result.revenue = fmp.revenue;
                result.grossProfit = fmp.grossProfit;
                result.operatingIncome = fmp.operatingIncome;
                result.netIncome = fmp.netIncome;
                result.ebitda = fmp.ebitda;
                result.totalAssets = fmp.totalAssets;
                result.totalDebt = fmp.totalDebt;
                result.totalEquity = fmp.totalEquity;
                result.freeCashFlow = fmp.freeCashFlow;
                result.operatingCashFlow = fmp.operatingCashFlow;
            }

            // Process Alpha Vantage data (technical indicators)
            if (alphaData.status === 'fulfilled' && alphaData.value) {
                const alpha = alphaData.value;
                result.fiftyDMA = alpha.sma50;
                result.twoHundredDMA = alpha.sma200;
                result.rsi = alpha.rsi;
                result.macd = alpha.macd;
            }

            // Process Yahoo data (additional metrics)
            if (yahooData.status === 'fulfilled' && yahooData.value) {
                const yahoo = yahooData.value;
                // Fill any missing data from Yahoo
                if (!result.lastTradedPrice) result.lastTradedPrice = yahoo.price;
                if (!result.marketCap) result.marketCap = yahoo.marketCap;
                if (!result.peRatio) result.peRatio = yahoo.pe;
            }

            return result;

        } catch (error) {
            console.error(`Error fetching US stock data for ${symbol}:`, error.message);
            return result;
        }
    }

    async getIndianStockData(symbol, result) {
        try {
            // Use Indian API + Yahoo Finance for Indian stocks
            const [indianData, yahooData] = await Promise.allSettled([
                this.getIndianAPIData(symbol),
                this.getYahooData(symbol)
            ]);

            // Process Indian API data
            if (indianData.status === 'fulfilled' && indianData.value) {
                const indian = indianData.value;
                
                result.name = indian.name;
                result.lastTradedPrice = indian.price;
                result.oneDayChange = indian.change;
                result.oneDayChangePercent = indian.changePercent;
                result.volume = indian.volume;
                result.marketCap = indian.marketCap;
                result.peRatio = indian.pe;
                result.pbRatio = indian.pb;
                result.roe = indian.roe;
                result.eps = indian.eps;
                result.dividendYield = indian.dividendYield;
                result.bookValue = indian.bookValue;
                result.fiftyTwoWeekHigh = indian.high52w;
                result.fiftyTwoWeekLow = indian.low52w;
                
                // Shareholding pattern (unique to Indian stocks)
                if (indian.shareholding) {
                    result.promoters = indian.shareholding.promoters;
                    result.fii = indian.shareholding.fii;
                    result.dii = indian.shareholding.dii;
                    result.public = indian.shareholding.public;
                    result.government = indian.shareholding.government;
                }
            }

            // Supplement with Yahoo data
            if (yahooData.status === 'fulfilled' && yahooData.value) {
                const yahoo = yahooData.value;
                // Fill missing data from Yahoo
                if (!result.sector) result.sector = yahoo.sector;
                if (!result.industry) result.industry = yahoo.industry;
                if (!result.employees) result.employees = yahoo.employees;
                if (!result.revenue) result.revenue = yahoo.revenue;
                if (!result.ebitda) result.ebitda = yahoo.ebitda;
            }

            return result;

        } catch (error) {
            console.error(`Error fetching Indian stock data for ${symbol}:`, error.message);
            return result;
        }
    }

    async getCryptoData(symbol, result) {
        try {
            console.log(`🔍 Fetching crypto data for ${symbol}`);
            const coinId = this.getCoinGeckoId(symbol);
            
            const response = await axios.get(`${this.apis.coinGecko.baseURL}/coins/${coinId}`, {
                timeout: 10000
            });

            if (response.data && response.data.market_data) {
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
                
                // Crypto-specific metrics
                result.circulatingSupply = coin.market_data.circulating_supply;
                result.totalSupply = coin.market_data.total_supply;
                result.maxSupply = coin.market_data.max_supply;
                
                console.log(`✅ Crypto data processed for ${symbol}`);
            } else {
                console.log(`⚠️ No market data found for ${symbol}`);
            }

            return result;

        } catch (error) {
            console.error(`❌ Error fetching crypto data for ${symbol}:`, error.message);
            return result;
        }
    }

    // API-specific methods
    async getFMPData(symbol) {
        try {
            console.log(`🔍 Fetching FMP data for ${symbol}`);
            
            // Use the new FMP API structure for free tier
            const [quote, profile] = await Promise.allSettled([
                axios.get(`https://financialmodelingprep.com/api/v3/quote-short/${symbol}?apikey=${this.apis.fmp.key}`, { timeout: 10000 }),
                axios.get(`https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${this.apis.fmp.key}`, { timeout: 10000 })
            ]);

            const result = {};

            // Process quote data (new endpoint)
            if (quote.status === 'fulfilled' && quote.value.data && Array.isArray(quote.value.data) && quote.value.data.length > 0) {
                const q = quote.value.data[0];
                console.log(`💰 FMP Quote data found for ${symbol}`);
                result.price = q.price;
                result.volume = q.volume;
            } else {
                console.log(`⚠️ No FMP quote data for ${symbol}`);
            }

            // Process profile data
            if (profile.status === 'fulfilled' && profile.value.data && Array.isArray(profile.value.data) && profile.value.data.length > 0) {
                const p = profile.value.data[0];
                console.log(`📋 FMP Profile data found for ${symbol}`);
                result.companyName = p.companyName;
                result.sector = p.sector;
                result.industry = p.industry;
                result.description = p.description;
                result.website = p.website;
                result.fullTimeEmployees = p.fullTimeEmployees;
                result.beta = p.beta;
                result.marketCap = p.mktCap;
                result.pe = p.pe;
                result.eps = p.eps;
            } else {
                console.log(`⚠️ No FMP profile data for ${symbol}`);
            }

            console.log(`✅ FMP data processed for ${symbol}:`, Object.keys(result));
            return result;

        } catch (error) {
            console.error(`❌ FMP API error for ${symbol}:`, error.response?.data || error.message);
            return null;
        }
    }

    async getAlphaVantageData(symbol) {
        try {
            const [overview, sma50, sma200, rsi, macd] = await Promise.allSettled([
                axios.get(`${this.apis.alphaVantage.baseURL}?function=OVERVIEW&symbol=${symbol}&apikey=${this.apis.alphaVantage.key}`),
                axios.get(`${this.apis.alphaVantage.baseURL}?function=SMA&symbol=${symbol}&interval=daily&time_period=50&series_type=close&apikey=${this.apis.alphaVantage.key}`),
                axios.get(`${this.apis.alphaVantage.baseURL}?function=SMA&symbol=${symbol}&interval=daily&time_period=200&series_type=close&apikey=${this.apis.alphaVantage.key}`),
                axios.get(`${this.apis.alphaVantage.baseURL}?function=RSI&symbol=${symbol}&interval=daily&time_period=14&series_type=close&apikey=${this.apis.alphaVantage.key}`),
                axios.get(`${this.apis.alphaVantage.baseURL}?function=MACD&symbol=${symbol}&interval=daily&series_type=close&apikey=${this.apis.alphaVantage.key}`)
            ]);

            const result = {};

            // Process technical indicators
            if (sma50.status === 'fulfilled' && sma50.value.data) {
                const smaData = sma50.value.data['Technical Analysis: SMA'];
                if (smaData) {
                    const latestDate = Object.keys(smaData)[0];
                    result.sma50 = parseFloat(smaData[latestDate]['SMA']);
                }
            }

            if (sma200.status === 'fulfilled' && sma200.value.data) {
                const smaData = sma200.value.data['Technical Analysis: SMA'];
                if (smaData) {
                    const latestDate = Object.keys(smaData)[0];
                    result.sma200 = parseFloat(smaData[latestDate]['SMA']);
                }
            }

            if (rsi.status === 'fulfilled' && rsi.value.data) {
                const rsiData = rsi.value.data['Technical Analysis: RSI'];
                if (rsiData) {
                    const latestDate = Object.keys(rsiData)[0];
                    result.rsi = parseFloat(rsiData[latestDate]['RSI']);
                }
            }

            if (macd.status === 'fulfilled' && macd.value.data) {
                const macdData = macd.value.data['Technical Analysis: MACD'];
                if (macdData) {
                    const latestDate = Object.keys(macdData)[0];
                    result.macd = parseFloat(macdData[latestDate]['MACD']);
                }
            }

            return result;

        } catch (error) {
            console.error(`Alpha Vantage API error for ${symbol}:`, error.message);
            return null;
        }
    }

    async getYahooData(symbol) {
        try {
            console.log(`🔍 Fetching Yahoo data for ${symbol}`);
            
            const [quote, fundamentals] = await Promise.allSettled([
                axios.get(`${this.apis.yahoo.baseURL}/v8/finance/chart/${symbol}`, { timeout: 10000 }),
                axios.get(`${this.apis.yahoo.baseURL}/v10/finance/quoteSummary/${symbol}?modules=summaryDetail,financialData,defaultKeyStatistics,assetProfile,incomeStatementHistory,balanceSheetHistory`, { timeout: 15000 })
            ]);

            const result = {};

            // Process quote data
            if (quote.status === 'fulfilled' && quote.value.data?.chart?.result?.[0]) {
                const q = quote.value.data.chart.result[0].meta;
                console.log(`💰 Yahoo Quote data found for ${symbol}`);
                result.price = q.regularMarketPrice;
                result.change = q.regularMarketPrice - q.previousClose;
                result.changePercent = ((q.regularMarketPrice - q.previousClose) / q.previousClose) * 100;
                result.volume = q.regularMarketVolume;
                result.fiftyTwoWeekHigh = q.fiftyTwoWeekHigh;
                result.fiftyTwoWeekLow = q.fiftyTwoWeekLow;
            } else {
                console.log(`⚠️ No Yahoo quote data for ${symbol}`);
            }

            // Process fundamentals
            if (fundamentals.status === 'fulfilled' && fundamentals.value.data?.quoteSummary?.result?.[0]) {
                const f = fundamentals.value.data.quoteSummary.result[0];
                console.log(`📊 Yahoo Fundamentals data found for ${symbol}`);
                
                if (f.summaryDetail) {
                    result.pe = f.summaryDetail.trailingPE?.raw;
                    result.marketCap = f.summaryDetail.marketCap?.raw;
                    result.dividendYield = f.summaryDetail.dividendYield?.raw;
                    result.beta = f.summaryDetail.beta?.raw;
                }
                
                if (f.financialData) {
                    result.revenue = f.financialData.totalRevenue?.raw;
                    result.ebitda = f.financialData.ebitda?.raw;
                    result.roe = f.financialData.returnOnEquity?.raw;
                    result.roa = f.financialData.returnOnAssets?.raw;
                    result.debtToEquity = f.financialData.debtToEquity?.raw;
                    result.currentRatio = f.financialData.currentRatio?.raw;
                    result.grossMargin = f.financialData.grossMargins?.raw;
                    result.operatingMargin = f.financialData.operatingMargins?.raw;
                    result.netMargin = f.financialData.profitMargins?.raw;
                }
                
                if (f.defaultKeyStatistics) {
                    result.eps = f.defaultKeyStatistics.trailingEps?.raw;
                    result.bookValue = f.defaultKeyStatistics.bookValue?.raw;
                    result.pbRatio = f.defaultKeyStatistics.priceToBook?.raw;
                    result.pegRatio = f.defaultKeyStatistics.pegRatio?.raw;
                }
                
                if (f.assetProfile) {
                    result.sector = f.assetProfile.sector;
                    result.industry = f.assetProfile.industry;
                    result.employees = f.assetProfile.fullTimeEmployees;
                    result.website = f.assetProfile.website;
                    result.description = f.assetProfile.longBusinessSummary;
                }

                // Financial statements
                if (f.incomeStatementHistory?.incomeStatementHistory?.[0]) {
                    const income = f.incomeStatementHistory.incomeStatementHistory[0];
                    result.grossProfit = income.grossProfit?.raw;
                    result.operatingIncome = income.operatingIncome?.raw;
                    result.netIncome = income.netIncome?.raw;
                }

                if (f.balanceSheetHistory?.balanceSheetStatements?.[0]) {
                    const balance = f.balanceSheetHistory.balanceSheetStatements[0];
                    result.totalAssets = balance.totalAssets?.raw;
                    result.totalDebt = balance.totalDebt?.raw;
                    result.totalEquity = balance.totalStockholderEquity?.raw;
                }
            } else {
                console.log(`⚠️ No Yahoo fundamentals data for ${symbol}`);
            }

            console.log(`✅ Yahoo data processed for ${symbol}:`, Object.keys(result));
            return result;

        } catch (error) {
            console.error(`❌ Yahoo API error for ${symbol}:`, error.response?.data || error.message);
            return null;
        }
    }

    async getIndianAPIData(symbol) {
        try {
            const cleanSymbol = symbol.replace('.NS', '').replace('.BO', '');
            const response = await axios.get(`${this.apis.indianAPI.baseURL}/stock`, {
                params: { name: cleanSymbol },
                headers: { "X-Api-Key": this.apis.indianAPI.key },
                timeout: 10000
            });

            return response.data;
        } catch (error) {
            console.error(`Indian API error for ${symbol}:`, error.message);
            return null;
        }
    }

    // Helper methods
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
            // Basic Info
            name: null,
            sector: null,
            industry: null,
            description: null,
            website: null,
            employees: null,
            
            // Price Information
            lastTradedPrice: null,
            oneDayChange: null,
            oneDayChangePercent: null,
            fiftyTwoWeekHigh: null,
            fiftyTwoWeekLow: null,
            volume: null,
            avgVolume: null,
            
            // Key Metrics
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
            
            // Profitability
            grossMargin: null,
            operatingMargin: null,
            netMargin: null,
            
            // Returns (calculated from historical data)
            oneMonthReturn: null,
            threeMonthReturn: null,
            sixMonthReturn: null,
            oneYearReturn: null,
            threeYearReturn: null,
            fiveYearReturn: null,
            
            // Financial Statements
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
            
            // Share Holding Pattern (Indian stocks)
            promoters: null,
            dii: null,
            fii: null,
            public: null,
            government: null,
            
            // Technical Indicators
            fiftyDMA: null,
            twoHundredDMA: null,
            rsi: null,
            macd: null,
            
            // Crypto-specific
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

export default new EnhancedStockService();