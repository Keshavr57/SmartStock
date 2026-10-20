import { z } from 'zod';
import { getFundamentals } from './fundamentals.service.js';
import { getLivePrice, normalizeSymbol } from './price.service.js';

const symbolsSchema = z.object({
  symbols: z.array(z.string().trim().min(1).max(25)).min(1, 'Please provide at least one stock symbol').max(3, 'Compare at most 3 stocks')
});

export const getStockFundamentals = async (req, res) => {
  try {
    const fundamentals = await getFundamentals(req.params.symbol);
    res.json({ success: true, symbol: fundamentals.symbol, fundamentals });
  } catch (error) {
    console.error('Error fetching fundamentals:', error.message);
    res.status(502).json({ success: false, error: 'Could not fetch fundamentals right now' });
  }
};

// Live quote + fundamentals + trailing returns for each symbol. Fields that no source provides are null.
async function buildComparisonRow(rawSymbol) {
  const symbol = normalizeSymbol(rawSymbol);
  const [quote, fundamentals] = await Promise.all([
    getLivePrice(symbol).catch(() => null),
    getFundamentals(symbol).catch(() => ({ symbol }))
  ]);
  return {
    ...fundamentals,
    symbol,
    name: fundamentals.name || quote?.name || symbol.replace(/\.(NS|BO)$/, ''),
    lastTradedPrice: quote?.price ?? null,
    oneDayChange: quote?.change ?? null,
    oneDayChangePercent: quote?.changePercent ?? null,
    previousClose: quote?.previousClose ?? null,
    fiftyTwoWeekHigh: quote?.fiftyTwoWeekHigh ?? null,
    fiftyTwoWeekLow: quote?.fiftyTwoWeekLow ?? null,
    volume: quote?.volume ?? null,
    lastTradeAt: quote?.asOf ?? null,
    dataQuality: quote ? 'live' : 'unavailable'
  };
}

export const getComprehensiveComparison = async (req, res) => {
  const parsed = symbolsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
  }
  try {
    const comparison = await Promise.all(parsed.data.symbols.map(buildComparisonRow));
    res.json({ success: true, comparison, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Comparison failed:', error);
    res.status(502).json({ success: false, error: 'Failed to fetch comparison data' });
  }
};

// Kept for existing clients; same payload as the comprehensive comparison.
export const compareStocks = getComprehensiveComparison;
