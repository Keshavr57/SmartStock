import axios from "axios";

class IndianMarketService {
    constructor() {
        this.apiKey = process.env.INDIAN_API_KEY;
        this.baseUrl = "https://stock.indianapi.in";
    }

    // Get trending Indian stocks for home page
    async getTrendingStocks() {
        try {
            console.log(" Fetching trending Indian stocks...");
            
            // Get top gainers from Indian API
            const response = await axios.get(`${this.baseUrl}/top-gainers`, {
                headers: {
                    "X-Api-Key": this.apiKey
                }
            });

            if (response.data && response.data.length > 0) {
                return response.data.slice(0, 6).map(stock => ({
                    name: stock.companyName || stock.name || stock.symbol,
                    symbol: stock.symbol,
                    price: parseFloat(stock.currentPrice || stock.price || 0),
                    change: parseFloat(stock.percentChange || stock.change || 0),
                    vol: this.formatVolume(stock.volume || stock.totalTradedVolume)
                }));
            }

            // Fallback: Get specific popular stocks
            return await this.getPopularStocks();

        } catch (error) {
            console.error("Indian API trending stocks error:", error.message);
            return await this.getPopularStocks();
        }
    }

    // Fallback method to get popular Indian stocks
    async getPopularStocks() {
        const popularSymbols = ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "BHARTIARTL"];
        const stocks = [];

        for (const symbol of popularSymbols) {
            try {
                const response = await axios.get(`${this.baseUrl}/stock`, {
                    params: { name: symbol },
                    headers: { "X-Api-Key": this.apiKey }
                });

                if (response.data) {
                    const stock = response.data;
                    stocks.push({
                        name: stock.companyName || stock.name || symbol,
                        symbol: symbol,
                        price: parseFloat(stock.currentPrice || stock.price || 0),
                        change: parseFloat(stock.percentChange || stock.change || 0),
                        vol: this.formatVolume(stock.volume || stock.totalTradedVolume)
                    });
                }
            } catch (err) {
                console.error(`Error fetching ${symbol}:`, err.message);
                continue;
            }
        }

        return stocks.length > 0 ? stocks : [];
    }

    // Get upcoming IPOs from Indian API
    async getUpcomingIPOs() {
        try {
            console.log("Fetching upcoming IPOs from Indian API...");
            
            const response = await axios.get(`${this.baseUrl}/upcoming-ipos`, {
                headers: {
                    "X-Api-Key": this.apiKey
                }
            });

            if (response.data && response.data.length > 0) {
                return response.data.map(ipo => ({
                    name: ipo.companyName || ipo.name,
                    openDate: ipo.openDate || ipo.open_date,
                    closeDate: ipo.closeDate || ipo.close_date,
                    priceBand: ipo.priceBand || ipo.price_band || "TBA",
                    issueSize: ipo.issueSize || ipo.issue_size || "TBA",
                    type: ipo.category || ipo.type || "Mainboard",
                    status: this.getIPOStatus(ipo.openDate, ipo.closeDate),
                    lotSize: ipo.lotSize || ipo.lot_size || "TBA",
                    listing: ipo.listingDate || ipo.listing_date || "TBA"
                }));
            }

            // Return empty array if no data
            return [];

        } catch (error) {
            return [];
        }
    }

    // Helper method to determine IPO status
    getIPOStatus(openDate, closeDate) {
        if (!openDate || !closeDate) return "Upcoming";
        
        const now = new Date();
        const open = new Date(openDate);
        const close = new Date(closeDate);

        if (now < open) return "Upcoming";
        if (now >= open && now <= close) return "Open";
        if (now > close) return "Closed";
        
        return "Upcoming";
    }

    // Format volume for display
    formatVolume(volume) {
        if (!volume) return "N/A";
        
        const vol = parseFloat(volume);
        if (vol >= 10000000) {
            return `${(vol / 10000000).toFixed(1)}Cr`;
        } else if (vol >= 100000) {
            return `${(vol / 100000).toFixed(1)}L`;
        } else if (vol >= 1000) {
            return `${(vol / 1000).toFixed(1)}K`;
        }
        return vol.toString();
    }

}

export default new IndianMarketService();