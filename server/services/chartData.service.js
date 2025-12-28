import axios from "axios";
import yahooFinance from "yahoo-finance2";

class ChartDataService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
    }

    // Get cached data or fetch new data
    async getCachedData(key, fetchFunction) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        try {
            const data = await fetchFunction();
            this.cache.set(key, { data, timestamp: Date.now() });
            return data;
        } catch (error) {
            console.error(`Error fetching ${key}:`, error.message);
            return cached ? cached.data : null;
        }
    }

    // Get NIFTY 50 chart data
    async getNiftyChartData() {
        return this.getCachedData('nifty50', async () => {
            try {
                const data = await yahooFinance.chart('^NSEI', {
                    period1: Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000), // 7 days ago
                    period2: Math.floor(Date.now() / 1000), // now
                    interval: '1d'
                });

                if (!data || !data.quotes || data.quotes.length === 0) {
                    throw new Error('No NIFTY data available');
                }

                return {
                    name: 'NIFTY 50',
                    symbol: '^NSEI',
                    data: data.quotes.slice(-7).map((quote, index) => ({
                        name: this.formatDate(quote.date),
                        value: Math.round(quote.close),
                        change: index > 0 ? ((quote.close - data.quotes[data.quotes.length - 8 + index - 1]?.close) / data.quotes[data.quotes.length - 8 + index - 1]?.close * 100) : 0
                    })),
                    currentPrice: Math.round(data.quotes[data.quotes.length - 1].close),
                    change: this.calculateChange(data.quotes),
                    color: '#2563eb'
                };
            } catch (error) {
                console.log('Using fallback data for NIFTY 50');
                return this.getFallbackData('NIFTY 50', '^NSEI', '#2563eb');
            }
        });
    }

    // Get S&P 500 chart data
    async getSP500ChartData() {
        return this.getCachedData('sp500', async () => {
            try {
                const data = await yahooFinance.chart('^GSPC', {
                    period1: Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000), // 7 days ago
                    period2: Math.floor(Date.now() / 1000), // now
                    interval: '1d'
                });

                if (!data || !data.quotes || data.quotes.length === 0) {
                    throw new Error('No S&P 500 data available');
                }

                return {
                    name: 'S&P 500',
                    symbol: '^GSPC',
                    data: data.quotes.slice(-7).map((quote, index) => ({
                        name: this.formatDate(quote.date),
                        value: Math.round(quote.close),
                        change: index > 0 ? ((quote.close - data.quotes[data.quotes.length - 8 + index - 1]?.close) / data.quotes[data.quotes.length - 8 + index - 1]?.close * 100) : 0
                    })),
                    currentPrice: Math.round(data.quotes[data.quotes.length - 1].close),
                    change: this.calculateChange(data.quotes),
                    color: '#16a34a'
                };
            } catch (error) {
                console.log('Using fallback data for S&P 500');
                return this.getFallbackData('S&P 500', '^GSPC', '#16a34a');
            }
        });
    }

    // Get Bitcoin chart data
    async getBTCChartData() {
        return this.getCachedData('btc', async () => {
            // Use CoinGecko for Bitcoin data
            const response = await axios.get('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart', {
                params: {
                    vs_currency: 'usd',
                    days: '7',
                    interval: 'daily'
                },
                timeout: 10000
            });

            if (!response.data || !response.data.prices) {
                throw new Error('No Bitcoin data available');
            }

            const prices = response.data.prices;
            const currentPrice = Math.round(prices[prices.length - 1][1]);
            const previousPrice = Math.round(prices[prices.length - 2][1]);
            const change = ((currentPrice - previousPrice) / previousPrice) * 100;

            return {
                name: 'Bitcoin',
                symbol: 'BTC',
                data: prices.map((price, index) => ({
                    name: this.formatDate(new Date(price[0])),
                    value: Math.round(price[1]),
                    change: index > 0 ? ((price[1] - prices[index - 1][1]) / prices[index - 1][1] * 100) : 0
                })),
                currentPrice: currentPrice,
                change: change,
                color: '#f59e0b'
            };
        });
    }

    // Get all chart data for home page
    async getAllChartsData() {
        try {
            const [nifty, sp500, btc] = await Promise.allSettled([
                this.getNiftyChartData(),
                this.getSP500ChartData(),
                this.getBTCChartData()
            ]);

            return {
                success: true,
                charts: {
                    nifty: nifty.status === 'fulfilled' ? nifty.value : this.getFallbackData('NIFTY 50', '^NSEI', '#2563eb'),
                    sp500: sp500.status === 'fulfilled' ? sp500.value : this.getFallbackData('S&P 500', '^GSPC', '#16a34a'),
                    btc: btc.status === 'fulfilled' ? btc.value : this.getFallbackData('Bitcoin', 'BTC', '#f59e0b')
                }
            };
        } catch (error) {
            console.error('Error fetching all charts data:', error);
            return {
                success: false,
                charts: {
                    nifty: this.getFallbackData('NIFTY 50', '^NSEI', '#2563eb'),
                    sp500: this.getFallbackData('S&P 500', '^GSPC', '#16a34a'),
                    btc: this.getFallbackData('Bitcoin', 'BTC', '#f59e0b')
                }
            };
        }
    }

    // Helper function to calculate percentage change
    calculateChange(quotes) {
        if (quotes.length < 2) return 0;
        const current = quotes[quotes.length - 1].close;
        const previous = quotes[quotes.length - 2].close;
        return ((current - previous) / previous) * 100;
    }

    // Helper function to format date
    formatDate(date) {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { weekday: 'short' });
    }

    // Fallback data when APIs fail
    getFallbackData(name, symbol, color) {
        const baseValues = {
            'NIFTY 50': 24150,
            'S&P 500': 5850,
            'Bitcoin': 87500
        };
        
        const baseValue = baseValues[name] || 1000;
        const data = [];
        
        // Generate realistic market data for the last 7 days
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        let currentValue = baseValue;
        
        for (let i = 0; i < 7; i++) {
            // Simulate realistic market movements (±2% daily change)
            const randomChange = (Math.random() - 0.5) * 0.04; // ±2% random change
            currentValue = currentValue * (1 + randomChange);
            
            data.push({
                name: days[i],
                value: Math.round(currentValue),
                change: randomChange * 100
            });
        }

        // Calculate overall change from first to last day
        const overallChange = ((data[6].value - data[0].value) / data[0].value) * 100;

        return {
            name,
            symbol,
            data,
            currentPrice: data[data.length - 1].value,
            change: overallChange,
            color,
            isFallback: true
        };
    }
}

export default new ChartDataService();