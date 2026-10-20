import indianMarketService from '../stocks/indianMarket.service.js';

// Landing page data: trending NSE stocks. Fails to an empty list rather than mocked prices.
async function getLandingPageData() {
    const stocks = await indianMarketService.getTrendingStocks().catch((error) => {
        console.error("Trending stocks unavailable:", error.message);
        return [];
    });
    return { stocks };
}

// Export simple object with functions (no class)
export default {
    getLandingPageData
};
