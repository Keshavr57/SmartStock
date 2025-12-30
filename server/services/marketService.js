import axios from 'axios';
import indianMarketService from './indianMarket.service.js';

class MarketService {
    async getLandingPageData() {
        try {
            console.log("🏠 Fetching landing page data...");

            // 1. Get trending Indian stocks using Indian API
            const stocks = await indianMarketService.getTrendingStocks();

            // 2. Get crypto data from CoinGecko
            const cryptoIds = 'bitcoin,ethereum,polygon-ecosystem,solana';
            const cryptoRes = await axios.get(`https://api.coingecko.com/api/v3/coins/markets`, {
                params: { vs_currency: 'inr', ids: cryptoIds, price_change_percentage: '24h' }
            });

            const cryptoData = cryptoRes.data.map(coin => ({
                name: coin.name,
                symbol: coin.symbol.toUpperCase(),
                price: coin.current_price,
                change: coin.price_change_percentage_24h,
                image: coin.image
            }));

            console.log("✅ Landing page data fetched successfully");
            return {
                stocks: stocks,
                crypto: cryptoData
            };

        } catch (error) {
            console.error("❌ Market Service Error:", error.message);
            
            // Fallback to mock data if all APIs fail
            return {
                stocks: [
                    { name: "Reliance Industries", symbol: "RELIANCE", price: 1558.20, change: 2.15, vol: "15.2Cr" },
                    { name: "Tata Consultancy Services", symbol: "TCS", price: 3280.00, change: 1.85, vol: "8.9Cr" },
                    { name: "HDFC Bank", symbol: "HDFCBANK", price: 1742.50, change: -0.65, vol: "12.1Cr" },
                    { name: "Infosys", symbol: "INFY", price: 1845.30, change: 3.25, vol: "11.8Cr" }
                ],
                crypto: [
                    { name: "Bitcoin", symbol: "BTC", price: 45000, change: 2.1, image: "" },
                    { name: "Ethereum", symbol: "ETH", price: 2400, change: 1.5, image: "" },
                    { name: "Polygon", symbol: "POL", price: 0.45, change: 3.2, image: "" },
                    { name: "Solana", symbol: "SOL", price: 95, change: -1.8, image: "" }
                ]
            };
        }
    }
}

export default new MarketService();