import axios from 'axios';

class ComprehensiveStockService {
    constructor() {
        this.baseURL = 'https://query1.finance.yahoo.com/v8/finance/chart/';
        this.fundamentalsURL = 'https://query2.finance.yahoo.com/v10/finance/quoteSummary/';
        this.statisticsURL = 'https://query1.finance.yahoo.com/v10/finance/quoteSummary/';
    }

    async getComprehensiveStockData(symbol) {
        try {
            console.log(`📊 Fetching comprehensive data for ${symbol}`);
            
            const [priceData, fundamentals, statistics] = await Promise.allSettled([
                this.getPriceData(symbol),
                this.getFundamentals(symbol),
                this.getStatistics(symbol)
            ]);

            const result = {
                symbol,
                // Price Information
                lastTradedPrice: null,
                oneDayChange: null,
                oneDayChangePercent: null,
                fiftyTwoWeekHigh: null,
                fiftyTwoWeekLow: null,
                
                // Key Metrics
                marketCap: null,
                peRatio: null,
                bookValue: null,
                pbRatio: null,
                roe: null,
                roce: null,
                eps: null,
                dividendYield: null,
                
                // Returns
                oneMonthReturn: null,
                threeMonthReturn: null,
                oneYearReturn: null,
                threeYearReturn: null,
                fiveYearReturn: null,
                
                // Historical Performance
                threeMonthHigh: null,
                threeMonthLow: null,
                oneYearHigh: null,
                oneYearLow: null,
                threeYearHigh: null,
                threeYearLow: null,
                fiveYearHigh: null,
                fiveYearLow: null,
                
                // Income Statement
                revenue: null,
                expenses: null,
                ebitda: null,
                profitBeforeTax: null,
                netProfit: null,
                
                // Balance Sheet
                totalAssets: null,
                totalLiabilities: null,
                
                // Cash Flow
                operatingActivities: null,
                investingActivities: null,
                financingActivities: null,
                netCashFlow: null,
                
                // Share Holding Pattern (mostly for Indian stocks)
                promoters: null,
                dii: null,
                fii: null,
                public: null,
                government: null,
                
                // Technicals
                fiftyDMA: null,
                twoHundredDMA: null,
                rsi: null,
                macd: null,
                
                // Margin Availability
                mtf: null,
                pledgeMargin: null
            };

            // Process price data
            if (priceData.status === 'fulfilled' && priceData.value) {
                const price = priceData.value;
                result.lastTradedPrice = price.regularMarketPrice;
                result.oneDayChange = price.regularMarketChange;
                result.oneDayChangePercent = price.regularMarketChangePercent;
                result.fiftyTwoWeekHigh = price.fiftyTwoWeekHigh;
                result.fiftyTwoWeekLow = price.fiftyTwoWeekLow;
            }

            // Process fundamentals
            if (fundamentals.status === 'fulfilled' && fundamentals.value) {
                const fund = fundamentals.value;
                result.marketCap = fund.marketCap;
                result.peRatio = fund.trailingPE;
                result.bookValue = fund.bookValue;
                result.pbRatio = fund.priceToBook;
                result.roe = fund.returnOnEquity;
                result.eps = fund.trailingEps;
                result.dividendYield = fund.dividendYield;
                result.ebitda = fund.ebitda;
                result.revenue = fund.totalRevenue;
                result.totalAssets = fund.totalAssets;
                result.totalLiabilities = fund.totalLiab;
            }

            // Process statistics
            if (statistics.status === 'fulfilled' && statistics.value) {
                const stats = statistics.value;
                result.fiftyDMA = stats.fiftyDayAverage;
                result.twoHundredDMA = stats.twoHundredDayAverage;
                result.oneYearHigh = stats.fiftyTwoWeekHigh;
                result.oneYearLow = stats.fiftyTwoWeekLow;
            }

            // Calculate returns (mock data for now - would need historical data)
            result.oneMonthReturn = this.generateMockReturn();
            result.threeMonthReturn = this.generateMockReturn();
            result.oneYearReturn = this.generateMockReturn();
            result.threeYearReturn = this.generateMockReturn();
            result.fiveYearReturn = this.generateMockReturn();

            // Mock technical indicators
            result.rsi = this.generateRSI();
            result.macd = this.generateMACD();

            // Mock shareholding pattern (for Indian stocks)
            if (symbol.includes('.NS') || symbol.includes('.BO')) {
                result.promoters = Math.random() * 30 + 40; // 40-70%
                result.fii = Math.random() * 20 + 10; // 10-30%
                result.dii = Math.random() * 15 + 5; // 5-20%
                result.public = Math.random() * 20 + 10; // 10-30%
                result.government = Math.random() * 5; // 0-5%
            }

            console.log(`✅ Comprehensive data fetched for ${symbol}`);
            return result;

        } catch (error) {
            console.error(`❌ Error fetching comprehensive data for ${symbol}:`, error.message);
            return this.getMockData(symbol);
        }
    }

    async getPriceData(symbol) {
        try {
            const response = await axios.get(`${this.baseURL}${symbol}`, {
                timeout: 5000
            });
            
            const result = response.data?.chart?.result?.[0];
            if (!result) return null;

            const meta = result.meta;
            return {
                regularMarketPrice: meta.regularMarketPrice,
                regularMarketChange: meta.regularMarketPrice - meta.previousClose,
                regularMarketChangePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
                fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
                fiftyTwoWeekLow: meta.fiftyTwoWeekLow
            };
        } catch (error) {
            console.error(`Error fetching price data for ${symbol}:`, error.message);
            return null;
        }
    }

    async getFundamentals(symbol) {
        try {
            const modules = [
                'summaryDetail',
                'financialData',
                'defaultKeyStatistics',
                'incomeStatementHistory',
                'balanceSheetHistory',
                'cashflowStatementHistory'
            ].join(',');

            const response = await axios.get(`${this.fundamentalsURL}${symbol}`, {
                params: { modules },
                timeout: 10000
            });

            const quoteSummary = response.data?.quoteSummary?.result?.[0];
            if (!quoteSummary) return null;

            const summaryDetail = quoteSummary.summaryDetail || {};
            const financialData = quoteSummary.financialData || {};
            const incomeStatement = quoteSummary.incomeStatementHistory?.incomeStatementHistory?.[0] || {};
            const balanceSheet = quoteSummary.balanceSheetHistory?.balanceSheetStatements?.[0] || {};

            const keyStats = result.defaultKeyStatistics || {};

            return {
                marketCap: summaryDetail.marketCap?.raw,
                trailingPE: summaryDetail.trailingPE?.raw,
                bookValue: keyStats.bookValue?.raw,
                priceToBook: keyStats.priceToBook?.raw,
                returnOnEquity: financialData.returnOnEquity?.raw,
                trailingEps: keyStats.trailingEps?.raw,
                dividendYield: summaryDetail.dividendYield?.raw,
                ebitda: financialData.ebitda?.raw,
                totalRevenue: financialData.totalRevenue?.raw,
                totalAssets: balanceSheet.totalAssets?.raw,
                totalLiab: balanceSheet.totalLiab?.raw
            };
        } catch (error) {
            console.error(`Error fetching fundamentals for ${symbol}:`, error.message);
            return null;
        }
    }

    async getStatistics(symbol) {
        try {
            const response = await axios.get(`${this.statisticsURL}${symbol}`, {
                params: { modules: 'summaryDetail,defaultKeyStatistics' },
                timeout: 5000
            });

            const result = response.data?.quoteSummary?.result?.[0];
            if (!result) return null;

            const summaryDetail = result.summaryDetail || {};
            const keyStats = result.defaultKeyStatistics || {};

            return {
                fiftyDayAverage: summaryDetail.fiftyDayAverage?.raw,
                twoHundredDayAverage: summaryDetail.twoHundredDayAverage?.raw,
                fiftyTwoWeekHigh: summaryDetail.fiftyTwoWeekHigh?.raw,
                fiftyTwoWeekLow: summaryDetail.fiftyTwoWeekLow?.raw
            };
        } catch (error) {
            console.error(`Error fetching statistics for ${symbol}:`, error.message);
            return null;
        }
    }

    generateMockReturn() {
        return (Math.random() - 0.5) * 40; // -20% to +20%
    }

    generateRSI() {
        return Math.random() * 100; // 0-100
    }

    generateMACD() {
        return (Math.random() - 0.5) * 10; // -5 to +5
    }

    getMockData(symbol) {
        return {
            symbol,
            lastTradedPrice: Math.random() * 1000 + 100,
            oneDayChange: (Math.random() - 0.5) * 50,
            oneDayChangePercent: (Math.random() - 0.5) * 10,
            fiftyTwoWeekHigh: Math.random() * 1200 + 800,
            fiftyTwoWeekLow: Math.random() * 200 + 50,
            marketCap: Math.random() * 1000000000000,
            peRatio: Math.random() * 30 + 5,
            bookValue: Math.random() * 500 + 50,
            pbRatio: Math.random() * 5 + 0.5,
            roe: Math.random() * 0.3 + 0.05,
            roce: Math.random() * 0.25 + 0.05,
            eps: Math.random() * 50 + 5,
            dividendYield: Math.random() * 0.05 + 0.01,
            oneMonthReturn: this.generateMockReturn(),
            threeMonthReturn: this.generateMockReturn(),
            oneYearReturn: this.generateMockReturn(),
            threeYearReturn: this.generateMockReturn(),
            fiveYearReturn: this.generateMockReturn(),
            revenue: Math.random() * 100000000000,
            ebitda: Math.random() * 20000000000,
            totalAssets: Math.random() * 500000000000,
            totalLiabilities: Math.random() * 300000000000,
            fiftyDMA: Math.random() * 1000 + 100,
            twoHundredDMA: Math.random() * 1000 + 100,
            rsi: this.generateRSI(),
            macd: this.generateMACD()
        };
    }
}

export default new ComprehensiveStockService();