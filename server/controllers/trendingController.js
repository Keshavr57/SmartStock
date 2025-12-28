// Trending Crypto using CoinGecko (Free Tier)
const getTrendingCrypto = async (req, res) => {
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/search/trending');
        const trending = response.data.coins.map(c => ({
            name: c.item.name,
            symbol: c.item.symbol,
            price_btc: c.item.price_btc,
            thumb: c.item.thumb
        }));
        res.json({ status: "success", data: trending });
    } catch (error) {
        res.status(500).json({ status: "error", message: "Crypto data unavailable" });
    }
};

// For Trending Indian Stocks, we recommend RapidAPI (Indian Stock Exchange API)
// or using yfinance on your Python service to fetch Top Gainers.