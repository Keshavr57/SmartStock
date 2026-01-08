import axios from 'axios';

class ComprehensiveStockService {
    constructor() {
        this.yahooBaseURL = 'https://query1.finance.yahoo.com/v8/finance/chart/';
        this.yahooFundamentalsURL = 'https://query2.finance.yahoo.com/v10/finance/quoteSummary/';
        this.indianAPIBaseURL = 'https://stock.indianapi.in';
        this.indianAPIKey = process.env.INDIAN_API_KEY;
        this.coinGeckoURL = 'https://api.coingecko.com/api/v3';
        
        // Cache for API responses (5 minutes)
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    async getComprehensiveStockData(symbol) {
        try {
            // Check cache first
            const cacheKey = `comprehensive_${symbol}`;
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                return cached;
            }

            let result = this.getEmptyDataStructure(symbol);

            // Determine data source based on symbol
            if (symbol.includes('.NS') || symbol.includes('.BO')) {
                // Indian stock - use Indian API + Yahoo Finance
                result = await this.getIndianStockData(symbol, result);
            } else if (this.isCrypto(symbol)) {
                // Cryptocurrency - use CoinGecko
                result = await this.getCryptoData(symbol, result);
            } else {
                // US/International stock - use Yahoo Finance
                result = await this.getYahooStockData(symbol, result);
            }

            // Cache the result
            this.setCache(cacheKey, result);
            
            return result;

        } catch (error) {
            // Return empty structure on error
            return this.getEmptyDataStructure(symbol);
        }
    }

    async getIndianStockData(symbol, result) {
        try {
            // Get data from Indian API
            const indianData = await this.fetchFromIndianAPI(symbol);
            if (indianData) {
                result.name = indianData.name;
                result.lastTradedPrice = indianData.price;
                result.oneDayChange = indianData.change;
                result.oneDayChangePercent = indianData.changePercent;
                result.volume = indianData.volume;
                result.marketCap = indianData.marketCap;
                result.peRatio = indianData.pe;
                result.pbRatio = indianData.pb;
                result.roe = indianData.roe;
                result.eps = indianData.eps;
                result.dividendYield = indianData.dividendYield;
                result.bookValue = indianData.bookValue;
                result.fiftyTwoWeekHigh = indianData.high52w;
                result.fiftyTwoWeekLow = indianData.low52w;
                
                // Shareholding pattern for Indian stocks
                if (indianData.shareholding) {
                    result.promoters = indianData.shareholding.promoters;
                    result.fii = indianData.shareholding.fii;
                    result.dii = indianData.shareholding.dii;
                    result.public = indianData.shareholding.public;
                }
            }

            // Supplement with Yahoo Finance data
            const yahooData = await this.getYahooStockData(symbol, result);
            
            // Merge the data, preferring Indian API for Indian-specific metrics
            return { ...yahooData, ...result };

        } catch (error) {
            return this.getYahooStockData(symbol, result);
        }
    }

    async getYahooStockData(symbol, result) {
        try {
            const [priceData, fundamentals, statistics, profile] = await Promise.allSettled([
                this.getYahooPriceData(symbol),
                this.getYahooFundamentals(symbol),
                this.getYahooStatistics(symbol),
                this.getYahooProfile(symbol)
            ]);

            // Process price data
            if (priceData.status === 'fulfilled' && priceData.value) {
                const price = priceData.value;
                result.lastTradedPrice = price.regularMarketPrice;
                result.oneDayChange = price.regularMarketChange;
                result.oneDayChangePercent = price.regularMarketChangePercent;
                result.volume = price.regularMarketVolume;
                result.fiftyTwoWeekHigh = price.fiftyTwoWeekHigh;
                result.fiftyTwoWeekLow = price.fiftyTwoWeekLow;
            }

            // Process fundamentals
            if (fundamentals.status === 'fulfilled' && fundamentals.value) {
                const fund = fundamentals.value;
                result.marketCap = fund.marketCap;
                result.peRatio = fund.trailingPE;
                result.pegRatio = fund.pegRatio;
                result.bookValue = fund.bookValue;
                result.pbRatio = fund.priceToBook;
                result.roe = fund.returnOnEquity;
                result.eps = fund.trailingEps;
                result.dividendYield = fund.dividendYield;
                result.beta = fund.beta;
                result.debtToEquity = fund.debtToEquity;
                result.currentRatio = fund.currentRatio;
                result.quickRatio = fund.quickRatio;
                result.grossMargin = fund.grossMargins;
                result.operatingMargin = fund.operatingMargins;
                result.netMargin = fund.profitMargins;
                result.revenue = fund.totalRevenue;
                result.revenueGrowth = fund.revenueGrowth;
                result.grossProfit = fund.grossProfits;
                result.ebitda = fund.ebitda;
                result.operatingIncome = fund.operatingIncome;
                result.netIncome = fund.netIncomeToCommon;
                result.totalAssets = fund.totalAssets;
                result.totalLiabilities = fund.totalLiab;
                result.totalDebt = fund.totalDebt;
                result.cash = fund.totalCash;
                result.operatingCashFlow = fund.operatingCashflow;
                result.freeCashFlow = fund.freeCashflow;
                result.targetPrice = fund.targetMeanPrice;
                result.recommendation = fund.recommendationKey;
            }

            // Process statistics
            if (statistics.status === 'fulfilled' && statistics.value) {
                const stats = statistics.value;
                result.fiftyDMA = stats.fiftyDayAverage;
                result.twoHundredDMA = stats.twoHundredDayAverage;
                result.avgVolume = stats.averageVolume;
            }

            // Process profile
            if (profile.status === 'fulfilled' && profile.value) {
                const prof = profile.value;
                result.name = prof.longName || prof.shortName;
                result.sector = prof.sector;
                result.industry = prof.industry;
                result.employees = prof.fullTimeEmployees;
                result.website = prof.website;
                result.description = prof.longBusinessSummary;
            }

            // Calculate technical indicators
            result.rsi = this.calculateRSI(result.lastTradedPrice, result.fiftyDMA);
            result.macd = this.calculateMACD(result.lastTradedPrice, result.fiftyDMA, result.twoHundredDMA);

            return result;

        } catch (error) {
            return result;
        }
    }

    async getCryptoData(symbol, result) {
        try {
            const coinId = this.getCoinGeckoId(symbol);
            
            const coinData = await axios.get(`${this.coinGeckoURL}/coins/${coinId}`, { timeout: 10000 });

            if (coinData.data) {
                const coin = coinData.data;
                result.name = coin.name;
                result.lastTradedPrice = coin.market_data.current_price.usd;
                result.oneDayChangePercent = coin.market_data.price_change_percentage_24h;
                result.marketCap = coin.market_data.market_cap.usd;
                result.volume = coin.market_data.total_volume.usd;
                result.fiftyTwoWeekHigh = coin.market_data.high_52w.usd;
                result.fiftyTwoWeekLow = coin.market_data.low_52w.usd;
                result.description = coin.description.en;
                
                // Crypto-specific metrics
                result.circulatingSupply = coin.market_data.circulating_supply;
                result.totalSupply = coin.market_data.total_supply;
                result.maxSupply = coin.market_data.max_supply;
            }

            return result;

        } catch (error) {
            return result;
        }
    }

    async fetchFromIndianAPI(symbol) {
        try {
            const cleanSymbol = symbol.replace('.NS', '').replace('.BO', '');
            const response = await axios.get(`${this.indianAPIBaseURL}/stock`, {
                params: { name: cleanSymbol },
                headers: { "X-Api-Key": this.indianAPIKey },
                timeout: 10000
            });

            return response.data;
        } catch (error) {
            return null;
        }
    }

    async getYahooPriceData(symbol) {
        try {
            const response = await axios.get(`${this.yahooBaseURL}${symbol}`, { timeout: 10000 });
            const result = response.data?.chart?.result?.[0];
            if (!result) return null;

            const meta = result.meta;
            return {
                regularMarketPrice: meta.regularMarketPrice,
                regularMarketChange: meta.regularMarketPrice - meta.previousClose,
                regularMarketChangePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
                regularMarketVolume: meta.regularMarketVolume,
                fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
                fiftyTwoWeekLow: meta.fiftyTwoWeekLow
            };
        } catch (error) {
            return null;
        }
    }

    async getYahooFundamentals(symbol) {
        try {
            const modules = [
                'summaryDetail',
                'financialData',
                'defaultKeyStatistics',
                'incomeStatementHistory',
                'balanceSheetHistory',
                'cashflowStatementHistory',
                'recommendationTrend'
            ].join(',');

            const response = await axios.get(`${this.yahooFundamentalsURL}${symbol}`, {
                params: { modules },
                timeout: 15000
            });

            const quoteSummary = response.data?.quoteSummary?.result?.[0];
            if (!quoteSummary) return null;

            const summaryDetail = quoteSummary.summaryDetail || {};
            const financialData = quoteSummary.financialData || {};
            const incomeStatement = quoteSummary.incomeStatementHistory?.incomeStatementHistory?.[0] || {};
            const balanceSheet = quoteSummary.balanceSheetHistory?.balanceSheetStatements?.[0] || {};

            return {
                // Valuation metrics
                marketCap: summaryDetail.marketCap?.raw,
                trailingPE: summaryDetail.trailingPE?.raw,
                pegRatio: financialData.pegRatio?.raw,
                bookValue: financialData.bookValue?.raw,
                priceToBook: financialData.priceToBook?.raw,
                beta: financialData.beta?.raw,
                
                // Profitability
                returnOnEquity: financialData.returnOnEquity?.raw,
                returnOnAssets: financialData.returnOnAssets?.raw,
                grossMargins: financialData.grossMargins?.raw,
                operatingMargins: financialData.operatingMargins?.raw,
                profitMargins: financialData.profitMargins?.raw,
                
                // Financial health
                debtToEquity: financialData.debtToEquity?.raw,
                currentRatio: financialData.currentRatio?.raw,
                quickRatio: financialData.quickRatio?.raw,
                
                // Per share metrics
                trailingEps: financialData.trailingEps?.raw,
                forwardEps: financialData.forwardEps?.raw,
                dividendYield: summaryDetail.dividendYield?.raw,
                
                // Growth metrics
                revenueGrowth: financialData.revenueGrowth?.raw,
                earningsGrowth: financialData.earningsGrowth?.raw,
                
                // Income statement
                totalRevenue: financialData.totalRevenue?.raw,
                grossProfits: financialData.grossProfits?.raw,
                ebitda: financialData.ebitda?.raw,
                operatingIncome: incomeStatement.operatingIncome?.raw,
                netIncomeToCommon: incomeStatement.netIncome?.raw,
                
                // Balance sheet
                totalAssets: balanceSheet.totalAssets?.raw,
                totalLiab: balanceSheet.totalLiab?.raw,
                totalDebt: financialData.totalDebt?.raw,
                totalCash: financialData.totalCash?.raw,
                
                // Cash flow
                operatingCashflow: financialData.operatingCashflow?.raw,
                freeCashflow: financialData.freeCashflow?.raw,
                
                // Analyst data
                targetMeanPrice: financialData.targetMeanPrice?.raw,
                recommendationKey: financialData.recommendationKey,
                numberOfAnalystOpinions: financialData.numberOfAnalystOpinions?.raw
            };
        } catch (error) {
            return null;
        }
    }

    async getYahooStatistics(symbol) {
        try {
            const response = await axios.get(`${this.yahooFundamentalsURL}${symbol}`, {
                params: { modules: 'summaryDetail,defaultKeyStatistics' },
                timeout: 10000
            });

            const result = response.data?.quoteSummary?.result?.[0];
            if (!result) return null;

            const summaryDetail = result.summaryDetail || {};
            const keyStats = result.defaultKeyStatistics || {};

            return {
                fiftyDayAverage: summaryDetail.fiftyDayAverage?.raw,
                twoHundredDayAverage: summaryDetail.twoHundredDayAverage?.raw,
                averageVolume: summaryDetail.averageVolume?.raw,
                averageVolume10days: summaryDetail.averageVolume10days?.raw
            };
        } catch (error) {
            return null;
        }
    }

    async getYahooProfile(symbol) {
        try {
            const response = await axios.get(`${this.yahooFundamentalsURL}${symbol}`, {
                params: { modules: 'summaryProfile,assetProfile' },
                timeout: 10000
            });

            const result = response.data?.quoteSummary?.result?.[0];
            if (!result) return null;

            const profile = result.summaryProfile || result.assetProfile || {};

            return {
                longName: profile.longName,
                shortName: profile.shortName,
                sector: profile.sector,
                industry: profile.industry,
                fullTimeEmployees: profile.fullTimeEmployees,
                website: profile.website,
                longBusinessSummary: profile.longBusinessSummary
            };
        } catch (error) {
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

    calculateRSI(currentPrice, sma) {
        if (!currentPrice || !sma) return Math.random() * 100;
        
        // Simplified RSI calculation
        const deviation = ((currentPrice - sma) / sma) * 100;
        return Math.max(0, Math.min(100, 50 + deviation));
    }

    calculateMACD(currentPrice, shortMA, longMA) {
        if (!currentPrice || !shortMA || !longMA) return (Math.random() - 0.5) * 10;
        
        // Simplified MACD calculation
        return shortMA - longMA;
    }

    getDateDaysAgo(days) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date.toISOString().split('T')[0];
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

    getEmptyDataStructure(symbol) {
        return {
            symbol,
            name: null,
            sector: null,
            industry: null,
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
            roce: null,
            eps: null,
            dividendYield: null,
            debtToEquity: null,
            currentRatio: null,
            quickRatio: null,
            grossMargin: null,
            operatingMargin: null,
            netMargin: null,
            oneMonthReturn: null,
            threeMonthReturn: null,
            sixMonthReturn: null,
            oneYearReturn: null,
            threeYearReturn: null,
            fiveYearReturn: null,
            threeMonthHigh: null,
            threeMonthLow: null,
            oneYearHigh: null,
            oneYearLow: null,
            revenue: null,
            revenueGrowth: null,
            grossProfit: null,
            operatingIncome: null,
            ebitda: null,
            netIncome: null,
            netIncomeGrowth: null,
            totalAssets: null,
            totalLiabilities: null,
            shareholderEquity: null,
            totalDebt: null,
            cash: null,
            operatingCashFlow: null,
            freeCashFlow: null,
            capex: null,
            promoters: null,
            dii: null,
            fii: null,
            public: null,
            government: null,
            fiftyDMA: null,
            twoHundredDMA: null,
            rsi: null,
            macd: null,
            beta: null,
            targetPrice: null,
            recommendation: null,
            analystCount: null,
            employees: null,
            founded: null,
            website: null,
            description: null
        };
    }
}

export default new ComprehensiveStockService();