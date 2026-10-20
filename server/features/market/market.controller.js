import { fetchYahooHistory } from "../stocks/yahoo.service.js";

const ALLOWED_PERIODS = new Set(["5d", "1mo", "3mo", "6mo", "1y", "5y"]);

export const getMarketHistory = async (req, res) => {
    try {
        const { symbols, period = "1mo" } = req.query;
        if (!symbols) return res.status(400).json({ error: "Symbols required" });

        const symbolList = symbols.split(",").map(s => s.trim().toUpperCase()).filter(Boolean).slice(0, 5);
        if (!ALLOWED_PERIODS.has(period)) return res.status(400).json({ error: "Invalid period" });

        const histories = await Promise.all(symbolList.map(sym => fetchYahooHistory(sym, period)));
        const results = Object.fromEntries(symbolList.map((sym, i) => [sym, histories[i]]));

        res.json({
            success: true,
            data: results
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch history" });
    }
};
