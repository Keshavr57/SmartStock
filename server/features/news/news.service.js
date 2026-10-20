import Parser from 'rss-parser';
import mongoose from 'mongoose';
import NewsArticle from '../../models/NewsArticle.js';
import { analyzeHeadline, EVENT_TYPES } from './newsModel.js';
import { linkEntities } from './entityLinker.js';
import { measureReaction, summarize } from './eventStudy.js';

const parser = new Parser({
    timeout: 10000,
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
});

// Feeds verified to be live. Google News adds company-specific coverage beyond the market desks.
export const FEEDS = [
    { name: 'Economic Times', url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms' },
    { name: 'Economic Times', url: 'https://economictimes.indiatimes.com/markets/stocks/news/rssfeeds/2146842.cms' },
    { name: 'Mint', url: 'https://www.livemint.com/rss/markets' },
    { name: 'Business Standard', url: 'https://www.business-standard.com/rss/markets-106.rss' },
    { name: 'Google News', url: 'https://news.google.com/rss/search?q=NSE+stocks+shares+when:2d&hl=en-IN&gl=IN&ceid=IN:en' }
];

const FEED_TTL_MS = 5 * 60 * 1000;
const STATS_TTL_MS = 30 * 60 * 1000;
const MIN_SAMPLE = 5;
const MAX_ARTICLES = 60;

let feedCache = { at: 0, articles: [] };
let statsCache = { at: 0, stats: null };

const dbReady = () => mongoose.connection.readyState === 1;
const normalizeKey = (title) => title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 160);

// Google News titles end with " - Publisher"; split that into the source.
export function cleanItem(item, feedName) {
    let title = String(item.title || '').trim();
    let source = feedName;
    if (feedName === 'Google News') {
        const m = /^(.*)\s+-\s+([^-]{2,60})$/.exec(title);
        if (m) { title = m[1].trim(); source = m[2].trim(); }
    }
    const summary = feedName === 'Google News' ? '' : String(item.contentSnippet || '').replace(/\s+/g, ' ').trim().slice(0, 400);
    const published = new Date(item.isoDate || item.pubDate || Date.now());
    return { title, summary, link: item.link, source, publishedAt: isNaN(published) ? new Date() : published };
}

export function buildArticle(raw) {
    const analysis = analyzeHeadline(raw.title, raw.summary);
    const symbols = linkEntities(raw.title).length ? linkEntities(raw.title) : linkEntities(raw.summary);
    return {
        key: normalizeKey(raw.title),
        ...raw,
        symbols,
        scope: symbols.length ? 'company' : 'market',
        analysis
    };
}

async function fetchFeeds() {
    const results = await Promise.allSettled(FEEDS.map(f => parser.parseURL(f.url).then(feed => ({ feed, name: f.name }))));
    const seen = new Set();
    const articles = [];
    for (const r of results) {
        if (r.status !== 'fulfilled') continue;
        for (const item of r.value.feed.items.slice(0, 40)) {
            const raw = cleanItem(item, r.value.name);
            if (!raw.title) continue;
            const article = buildArticle(raw);
            if (seen.has(article.key)) continue;
            seen.add(article.key);
            articles.push(article);
        }
    }
    const failed = results.filter(r => r.status === 'rejected').length;
    if (failed) console.warn(`News: ${failed}/${FEEDS.length} feeds failed`);
    return articles;
}

// Upsert analysed articles; keep any reaction already measured.
export async function storeArticles(articles) {
    if (!dbReady() || articles.length === 0) return;
    await NewsArticle.bulkWrite(articles.map(a => ({
        updateOne: {
            filter: { key: a.key },
            update: {
                $set: { title: a.title, summary: a.summary, link: a.link, source: a.source, symbols: a.symbols, scope: a.scope, analysis: a.analysis },
                $setOnInsert: { key: a.key, publishedAt: a.publishedAt, reaction: { status: 'pending' } }
            },
            upsert: true
        }
    })), { ordered: false });
}

/**
 * Measures price reactions for stored articles whose 3-session window may have closed.
 * Each pending article is re-checked at most every 6 hours (checkedAt), so a batch never stalls on recent news.
 * Returns how many articles were examined and how many reactions were measured.
 */
export async function computePendingReactions(limit = 200) {
    if (!dbReady()) return { examined: 0, done: 0 };
    const now = Date.now();
    const pending = await NewsArticle.find({
        'reaction.status': 'pending',
        publishedAt: { $lte: new Date(now - 20 * 60 * 60 * 1000), $gte: new Date(now - 300 * 24 * 60 * 60 * 1000) },
        $or: [{ 'reaction.checkedAt': { $exists: false } }, { 'reaction.checkedAt': { $lte: new Date(now - 6 * 60 * 60 * 1000) } }]
    }).sort({ publishedAt: 1 }).limit(limit).lean();

    let done = 0;
    for (const article of pending) {
        const symbol = article.symbols?.[0] || null;
        let reaction;
        try {
            reaction = await measureReaction(symbol, new Date(article.publishedAt));
        } catch (error) {
            console.warn(`Reaction failed for ${symbol || 'market'}: ${error.message}`);
            reaction = { status: 'pending' };
        }
        const update = reaction.status === 'pending'
            ? { 'reaction.checkedAt': new Date() }
            : { reaction: { ...reaction, symbol: symbol || '^NSEI', computedAt: new Date() } };
        await NewsArticle.updateOne({ _id: article._id }, { $set: update });
        if (reaction.status === 'done') done++;
    }
    if (done) statsCache.at = 0;
    return { examined: pending.length, done };
}

const predictedDirection = (a) => (a.analysis.label === 'positive' ? 1 : a.analysis.label === 'negative' ? -1 : 0);

/**
 * Historical statistics from every measured article:
 *  - byEvent: per event type (how did "earnings beat" news actually move stocks?)
 *  - byBucket: per scope × sentiment label, used when an article has no detected event
 *  - model: directional accuracy of the sentiment label vs the realised move, and a naive baseline
 */
export async function getHistoricalStats() {
    if (statsCache.stats && Date.now() - statsCache.at < STATS_TTL_MS) return statsCache.stats;
    if (!dbReady()) return null;
    const measured = await NewsArticle.find({ 'reaction.status': 'done' }, { analysis: 1, scope: 1, reaction: 1 }).lean();
    const rows = measured.map(a => ({
        eventType: a.analysis?.event?.type || null,
        bucket: `${a.scope}:${a.analysis?.label}`,
        predicted: predictedDirection(a),
        eventDirection: a.analysis?.event?.direction ?? 0,
        describesMove: Boolean(a.analysis?.describesMove),
        ar1: a.reaction.ar1,
        arNext: a.reaction.arNext ?? null,
        car3: a.reaction.car3
    }));

    const group = (keyFn, predictedFn = r => r.predicted) => {
        const map = {};
        for (const r of rows) {
            const k = keyFn(r);
            if (!k) continue;
            (map[k] ||= []).push({ ...r, predicted: predictedFn(r) });
        }
        return Object.fromEntries(Object.entries(map).map(([k, v]) => [k, summarize(v)]));
    };

    // Accuracy is judged only on moves large enough to be meaningful (|AR| ≥ 0.5%), against the naive baseline
    // of always guessing the more common direction. The model is only useful where it beats that baseline.
    const accuracy = (subset, field) => {
        const evaluated = subset.filter(r => r.predicted !== 0 && r[field] != null && Math.abs(r[field]) >= 0.5);
        if (!evaluated.length) return { evaluated: 0, accuracy: null, baseline: null };
        const correct = evaluated.filter(r => Math.sign(r[field]) === r.predicted).length;
        const upShare = evaluated.filter(r => r[field] > 0).length / evaluated.length;
        return {
            evaluated: evaluated.length,
            accuracy: Math.round((correct / evaluated.length) * 1000) / 10,
            baseline: Math.round(Math.max(upShare, 1 - upShare) * 1000) / 10
        };
    };

    const stats = {
        sampleSize: rows.length,
        byEvent: group(r => r.eventType, r => r.eventDirection),
        byBucket: group(r => r.bucket),
        model: {
            // Does the label match the move in the session the news hit? (descriptive; headlines may report the move)
            sameSession: accuracy(rows, 'ar1'),
            // Does it predict the NEXT session, using only headlines that are not price-move reports? (predictive)
            nextSession: accuracy(rows.filter(r => !r.describesMove), 'arNext')
        },
        computedAt: new Date().toISOString()
    };
    statsCache = { at: Date.now(), stats };
    return stats;
}

// Expected impact from history: event-type stats if the sample is big enough, else the scope × sentiment bucket.
export function attachImpact(article, stats) {
    const eventStats = article.analysis.event && stats?.byEvent?.[article.analysis.event.type];
    const bucketStats = stats?.byBucket?.[`${article.scope}:${article.analysis.label}`];
    const history = eventStats?.n >= MIN_SAMPLE ? { basis: 'event', ...eventStats }
        : bucketStats?.n >= MIN_SAMPLE ? { basis: 'sentiment', ...bucketStats } : null;

    const typicalMove = history?.meanAbsAr1 ?? (article.scope === 'company' ? 1.5 : 0.6);
    const strength = Math.abs(article.analysis.score) * (0.5 + 0.5 * article.analysis.confidence);
    const expectedMove = Math.round(typicalMove * strength * 100) / 100;
    const level = expectedMove >= 1.5 ? 'high' : expectedMove >= 0.6 ? 'medium' : 'low';
    return { ...article, impact: { level, expectedMovePercent: expectedMove, history } };
}

function toResponse(a) {
    return {
        id: a.key,
        title: a.title,
        summary: a.summary,
        link: a.link,
        source: a.source,
        publishedAt: a.publishedAt,
        symbols: a.symbols,
        scope: a.scope,
        sentiment: a.analysis.label,
        sentimentScore: a.analysis.score,
        confidence: a.analysis.confidence,
        event: a.analysis.event || null,
        evidence: a.analysis.evidence || [],
        impact: a.impact,
        reaction: a.reaction?.status === 'done' ? { ar1: a.reaction.ar1, car3: a.reaction.car3, reactionDate: a.reaction.reactionDate } : null
    };
}

/** Latest analysed news, newest first. Feeds are re-polled at most every 5 minutes. */
export async function getLatestNews({ sentiment, impact, symbol } = {}) {
    if (Date.now() - feedCache.at > FEED_TTL_MS) {
        const articles = await fetchFeeds();
        if (articles.length) {
            feedCache = { at: Date.now(), articles };
            storeArticles(articles).catch(err => console.warn('Storing news failed:', err.message));
        }
    }
    const stats = await getHistoricalStats().catch(() => null);

    // Prefer the stored copy (it carries measured reactions) when the database is available.
    let articles = feedCache.articles;
    if (dbReady()) {
        const keys = articles.map(a => a.key);
        const stored = await NewsArticle.find({ key: { $in: keys } }).lean();
        const byKey = new Map(stored.map(s => [s.key, s]));
        articles = articles.map(a => byKey.get(a.key) || a);
    }

    return articles
        .map(a => attachImpact(a, stats))
        .filter(a => !sentiment || a.analysis.label === sentiment)
        .filter(a => !impact || a.impact.level === impact)
        .filter(a => !symbol || a.symbols.includes(symbol))
        .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
        .slice(0, MAX_ARTICLES)
        .map(toResponse);
}

/** Stored headlines about one stock (newest first), with the same tags and historical impact as the feed. */
export async function getNewsForSymbol(symbol, limit = 12) {
    if (!dbReady()) return [];
    const [articles, stats] = await Promise.all([
        NewsArticle.find({ symbols: symbol }).sort({ publishedAt: -1 }).limit(limit).lean(),
        getHistoricalStats().catch(() => null)
    ]);
    return articles.map(a => toResponse(attachImpact(a, stats)));
}

export async function getNewsAnalytics() {
    const stats = await getHistoricalStats();
    const labels = Object.fromEntries(EVENT_TYPES.map(e => [e.type, { label: e.label, direction: e.direction, macro: Boolean(e.macro) }]));
    const events = Object.entries(stats?.byEvent || {})
        .map(([type, s]) => ({ type, ...labels[type], ...s }))
        .sort((a, b) => b.n - a.n);
    return {
        sampleSize: stats?.sampleSize ?? 0,
        model: stats?.model ?? null,
        events,
        buckets: stats?.byBucket ?? {},
        computedAt: stats?.computedAt ?? null,
        methodology: 'Market-adjusted event study: AR₁ = stock return − NIFTY 50 return on the first session after publication; CAR₃ sums 3 sessions.'
    };
}

export default { getLatestNews, getNewsAnalytics, computePendingReactions, storeArticles, buildArticle };
