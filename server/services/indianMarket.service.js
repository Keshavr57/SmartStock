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
            console.error("❌ Indian API trending stocks error:", error.message);
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

        return stocks.length > 0 ? stocks : this.getMockTrendingStocks();
    }

    // Get upcoming IPOs from Indian API
    async getUpcomingIPOs() {
        try {
            console.log("🇮🇳 Fetching upcoming IPOs from Indian API...");
            
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

            // If no data, return mock IPOs
            return this.getMockIPOs();

        } catch (error) {
            console.error("❌ Indian API IPO error:", error.message);
            return this.getMockIPOs();
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

    // Mock trending stocks as fallback
    getMockTrendingStocks() {
        return [
            {
                name: "Reliance Industries",
                symbol: "RELIANCE",
                price: 1558.20,
                change: 2.15,
                vol: "15.2Cr"
            },
            {
                name: "Tata Consultancy Services",
                symbol: "TCS",
                price: 3280.00,
                change: 1.85,
                vol: "8.9Cr"
            },
            {
                name: "HDFC Bank",
                symbol: "HDFCBANK",
                price: 1742.50,
                change: -0.65,
                vol: "12.1Cr"
            },
            {
                name: "Infosys",
                symbol: "INFY",
                price: 1845.30,
                change: 3.25,
                vol: "11.8Cr"
            },
            {
                name: "ICICI Bank",
                symbol: "ICICIBANK",
                price: 1285.75,
                change: 1.45,
                vol: "18.5Cr"
            },
            {
                name: "Bharti Airtel",
                symbol: "BHARTIARTL",
                price: 1598.40,
                change: -1.20,
                vol: "9.7Cr"
            }
        ];
    }

    // Mock IPO data as fallback - Updated for 2026
    getMockIPOs() {
        return [
            {
                name: "Bajaj Housing Finance",
                openDate: "2026-01-15",
                closeDate: "2026-01-17",
                priceBand: "₹66-70",
                issueSize: "₹6,560 Cr",
                type: "Mainboard",
                status: "Upcoming",
                lotSize: "214 shares",
                listing: "2026-01-22",
                riskLevel: "Medium",
                riskIcon: "🟡",
                promoterHolding: "52.5%",
                companyAge: "15 years",
                profitHistory: "Profitable for 10+ years"
            },
            {
                name: "NTPC Green Energy",
                openDate: "2026-01-20",
                closeDate: "2026-01-22",
                priceBand: "₹102-108",
                issueSize: "₹10,000 Cr",
                type: "Mainboard",
                status: "Upcoming",
                lotSize: "138 shares",
                listing: "2026-01-27",
                riskLevel: "Low",
                riskIcon: "🟢",
                promoterHolding: "75.0%",
                companyAge: "5 years",
                profitHistory: "Profitable for 3 years"
            },
            {
                name: "Hyundai Motor India",
                openDate: "2026-02-05",
                closeDate: "2026-02-07",
                priceBand: "₹1,865-1,960",
                issueSize: "₹27,870 Cr",
                type: "Mainboard",
                status: "Upcoming",
                lotSize: "7 shares",
                listing: "2026-02-12",
                riskLevel: "Low",
                riskIcon: "🟢",
                promoterHolding: "82.5%",
                companyAge: "28 years",
                profitHistory: "Profitable for 15+ years"
            },
            {
                name: "Ola Electric Mobility",
                openDate: "2026-02-10",
                closeDate: "2026-02-12",
                priceBand: "₹72-76",
                issueSize: "₹5,500 Cr",
                type: "Mainboard",
                status: "Upcoming",
                lotSize: "195 shares",
                listing: "2026-02-17",
                riskLevel: "High",
                riskIcon: "🔴",
                promoterHolding: "45.2%",
                companyAge: "8 years",
                profitHistory: "Loss-making, improving"
            },
            {
                name: "Zomato Hyperpure",
                openDate: "2026-02-15",
                closeDate: "2026-02-17",
                priceBand: "₹85-90",
                issueSize: "₹4,200 Cr",
                type: "Mainboard",
                status: "Upcoming",
                lotSize: "166 shares",
                listing: "2026-02-22",
                riskLevel: "Medium",
                riskIcon: "🟡",
                promoterHolding: "48.7%",
                companyAge: "6 years",
                profitHistory: "Recently profitable"
            },
            {
                name: "Nykaa Fashion",
                openDate: "2026-03-10",
                closeDate: "2026-03-12",
                priceBand: "₹125-132",
                issueSize: "₹3,800 Cr",
                type: "Mainboard",
                status: "Upcoming",
                lotSize: "113 shares",
                listing: "2026-03-17",
                riskLevel: "Medium",
                riskIcon: "🟡",
                promoterHolding: "51.8%",
                companyAge: "7 years",
                profitHistory: "Profitable for 4 years"
            },
            {
                name: "Zerodha",
                openDate: "2026-03-20",
                closeDate: "2026-03-22",
                priceBand: "₹2,800-3,000",
                issueSize: "₹8,500 Cr",
                type: "Mainboard",
                status: "Upcoming",
                lotSize: "5 shares",
                listing: "2026-03-27",
                riskLevel: "Low",
                riskIcon: "🟢",
                promoterHolding: "85.0%",
                companyAge: "14 years",
                profitHistory: "Highly profitable for 10+ years"
            },
            {
                name: "Paytm Insurance Broking",
                openDate: "2026-03-01",
                closeDate: "2026-03-03",
                priceBand: "₹55-58",
                issueSize: "₹1,200 Cr",
                type: "SME",
                status: "Upcoming",
                lotSize: "258 shares",
                listing: "2026-03-08",
                riskLevel: "Medium",
                riskIcon: "🟡",
                promoterHolding: "65.3%",
                companyAge: "4 years",
                profitHistory: "Profitable for 2 years"
            }
        ];
    }
}

export default new IndianMarketService();