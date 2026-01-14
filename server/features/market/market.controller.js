import { fetchYahooFundamentals, fetchYahooHistory } from "../stocks/yahoo.service.js";

export const getMarketHistory = async (req, res) => {
    try {
        const { symbols, period = "1mo" } = req.query;
        if (!symbols) return res.status(400).json({ error: "Symbols required" });

        const symbolList = symbols.split(",").map(s => s.trim().toUpperCase());
        const results = {};

        for (const sym of symbolList) {
            const history = await fetchYahooHistory(sym, period);
            results[sym] = history;
        }

        res.json({
            success: true,
            data: results
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch history" });
    }
};
