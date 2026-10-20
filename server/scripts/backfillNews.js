// Seeds the news event-study dataset: pulls recent company-specific headlines from Google News for
// large-cap NSE stocks plus market-wide headlines, analyses them, stores them, and measures each one's
// real abnormal price reaction. Safe to re-run (articles are de-duplicated by title).
//
// Usage: node scripts/backfillNews.js [--days=120] [--limit=60]
//        node scripts/backfillNews.js --reanalyze   (re-score stored headlines with the current model and re-measure reactions)
import 'dotenv/config';
import mongoose from 'mongoose';
import Parser from 'rss-parser';
import { INDIAN_STOCKS } from '../features/stocks/indianStocks.data.js';
import NewsArticle from '../models/NewsArticle.js';
import { buildArticle, cleanItem, storeArticles, computePendingReactions } from '../features/news/news.service.js';

const arg = (name, fallback) => Number(process.argv.find(a => a.startsWith(`--${name}=`))?.split('=')[1]) || fallback;
const DAYS = arg('days', 120);
const LIMIT = arg('limit', 60);
const REANALYZE = process.argv.includes('--reanalyze');

const parser = new Parser({ timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' } });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const googleNews = (query) =>
    `https://news.google.com/rss/search?q=${encodeURIComponent(`${query} when:${DAYS}d`)}&hl=en-IN&gl=IN&ceid=IN:en`;

async function collect(query, keep) {
    try {
        const feed = await parser.parseURL(googleNews(query));
        return feed.items.map(item => buildArticle(cleanItem(item, 'Google News'))).filter(keep);
    } catch (error) {
        console.warn(`  feed failed for "${query}": ${error.message}`);
        return [];
    }
}

async function fetchHistory() {
    const companies = INDIAN_STOCKS.slice(0, LIMIT);
    let stored = 0;

    for (const stock of companies) {
        const shortName = stock.name.replace(/\b(limited|ltd\.?)\b/gi, '').replace(/\(.*?\)/g, '').trim();
        // Keep only headlines our linker attributes to this company, so the measured reaction is the right stock's.
        const articles = await collect(`"${shortName}" share`, a => a.symbols[0] === stock.symbol);
        await storeArticles(articles);
        stored += articles.length;
        console.log(`${stock.symbol.padEnd(16)} ${String(articles.length).padStart(3)} headlines`);
        await sleep(800);
    }

    for (const query of ['Sensex Nifty today', 'RBI repo rate', 'FII selling Indian equities', 'FPI inflows India stocks', 'crude oil rupee Indian markets']) {
        const articles = await collect(query, a => a.scope === 'market');
        await storeArticles(articles);
        stored += articles.length;
        console.log(`market: "${query}" ${articles.length} headlines`);
        await sleep(800);
    }
    return stored;
}

async function main() {
    await mongoose.connect(process.env.MONGO_URI, { dbName: 'SmartStock' });
    let stored = 0;
    if (REANALYZE) {
        const all = await NewsArticle.find({}, { title: 1, summary: 1 }).lean();
        await NewsArticle.bulkWrite(all.map(doc => {
            const fresh = buildArticle({ title: doc.title, summary: doc.summary || '' });
            return {
                updateOne: {
                    filter: { _id: doc._id },
                    update: { $set: { analysis: fresh.analysis, symbols: fresh.symbols, scope: fresh.scope, reaction: { status: 'pending' } } }
                }
            };
        }), { ordered: false });
        stored = all.length;
        console.log(`Re-analysed ${stored} stored headlines.`);
    } else {
        stored = await fetchHistory();
    }
    console.log(`Stored/updated ${stored} headlines. Measuring price reactions...`);

    let total = 0;
    for (;;) {
        const { examined, done } = await computePendingReactions(300);
        total += done;
        if (examined === 0) break;
        console.log(`  measured ${total} so far`);
    }
    console.log(`Done. ${total} reactions measured.`);
    await mongoose.disconnect();
}

main().catch(async (error) => {
    console.error('Backfill failed:', error);
    await mongoose.disconnect();
    process.exit(1);
});
