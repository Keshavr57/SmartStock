// Headline sentiment + event model for Indian market news.
//
// score = 0.55 · lexicon + 0.45 · eventPrior     (when an event is detected; otherwise lexicon only)
//   lexicon   = tanh(Σ wᵢ · mᵢ / 2.5)             wᵢ: term weight (±1..±3), mᵢ: modifiers (negation −1, intensifier ×1.5, softener ×0.5)
//   eventPrior = direction of the matched event type (±1, 0 for ambiguous events)
// label: score ≥ +0.15 positive, ≤ −0.15 negative, otherwise neutral.
// confidence grows with the number of signals and drops when lexicon and event disagree.
//
// Term weights follow the Loughran–McDonald idea that general-purpose sentiment words mislead in finance
// ("liability", "tax", "risk" are not negative news), extended with Indian-market vocabulary.

const LEXICON = {
    // strong positive
    soars: 3, soar: 3, skyrockets: 3, zooms: 3, rockets: 3, 'multi-bagger': 3, multibagger: 3, blockbuster: 3, 'record high': 3,
    'all-time high': 3, 'upper circuit': 3, outperforms: 2, beats: 2, beat: 2, surges: 2.5, surge: 2.5, jumps: 2, jump: 2,
    rallies: 2, rally: 2, spurts: 2, climbs: 1.5, gains: 1.5, gain: 1.5, rises: 1, rise: 1, rose: 1, up: 0.5, higher: 1,
    upgrade: 2.5, upgrades: 2.5, upgraded: 2.5, 'buy rating': 2, bullish: 2, optimistic: 1.5, robust: 1.5, strong: 1.5,
    stronger: 1.5, healthy: 1, improves: 1.5, improved: 1.5, recovery: 1.5, rebounds: 2, rebound: 2, wins: 1.5, win: 1,
    bags: 2, secures: 1.5, bagged: 2, 'order win': 2.5, 'bags order': 2.5, profit: 0.5, 'net profit rises': 2.5, expands: 1,
    expansion: 1, approval: 1.5, approves: 1, approved: 1, dividend: 1, bonus: 1.5, buyback: 2, 'stock split': 1,
    inflows: 1.5, 'net buyers': 2, outperform: 2, overweight: 1.5, accumulate: 1.5, 'target raised': 2.5, 'raises target': 2.5,
    'hikes target': 2.5, boost: 1.5, boosts: 1.5, tailwind: 1.5, tailwinds: 1.5, 'rate cut': 1.5, eases: 1, easing: 1,
    upbeat: 2, stellar: 2.5, 'better-than-expected': 2.5, 'above estimates': 2.5, 'tops estimates': 2.5, milestone: 1,
    lifts: 1.5, lift: 1, cheer: 1.5, cheers: 1.5, recovers: 1.5, bounces: 1.5, 'extends gains': 1.5, 'extend gains': 1.5,
    oversubscribed: 2, subscribed: 1, 'fully subscribed': 1.5, 'strong demand': 2, 'record profit': 2.5, 'record revenue': 2,
    'margin expansion': 2, inflow: 1.5, dovish: 1.5, ceasefire: 1.5, outperformed: 2, beat: 2, 'all-time high': 3, peak: 1,

    // strong negative
    crashes: -3, crash: -3, plunges: -3, plunge: -3, tanks: -3, tank: -3, nosedives: -3, 'lower circuit': -3,
    collapses: -3, collapse: -3, slumps: -2.5, slump: -2.5, tumbles: -2.5, tumble: -2.5, sinks: -2.5, slides: -2,
    slide: -2, falls: -1.5, fall: -1.5, fell: -1.5, drops: -1.5, drop: -1.5, declines: -1.5, decline: -1.5, dips: -1,
    dip: -1, down: -0.5, lower: -1, weak: -1.5, weaker: -1.5, weakness: -1.5, misses: -2, miss: -2, 'below estimates': -2.5,
    'worse-than-expected': -2.5, downgrade: -2.5, downgrades: -2.5, downgraded: -2.5, 'sell rating': -2, underperform: -2,
    underweight: -1.5, bearish: -2, 'target cut': -2.5, 'cuts target': -2.5, 'slashes target': -3, loss: -1.5, losses: -1.5,
    'net loss': -2.5, 'profit falls': -2.5, 'profit drops': -2.5, 'profit declines': -2.5, outflows: -1.5, 'net sellers': -2,
    selloff: -2, 'sell-off': -2, 'selling pressure': -2, penalty: -2, penalised: -2, penalized: -2, fine: -0.5, fined: -2,
    probe: -2, raid: -2.5, raids: -2.5, fraud: -3, scam: -3, default: -3, defaults: -3, insolvency: -3, bankruptcy: -3,
    pledge: -1, pledged: -1.5, resigns: -1.5, resignation: -1.5, exits: -1, layoffs: -1.5, 'job cuts': -1.5, headwinds: -1.5,
    headwind: -1.5, pressure: -1, concerns: -1, concern: -1, worries: -1.5, fears: -1.5, uncertainty: -1, volatile: -0.5,
    slowdown: -1.5, contraction: -1.5, recession: -2.5, inflation: -0.5, 'rate hike': -1.5, ban: -2, banned: -2, halts: -1.5,
    suspends: -1.5, recall: -1.5, warning: -1, 'warning letter': -2.5, 'import alert': -2.5, 'usfda observations': -2,
    downbeat: -2, disappoints: -2, disappointing: -2, lacklustre: -1.5, lackluster: -1.5, muted: -1, subdued: -1,
    weaken: -1.5, weakens: -1.5, weakened: -1.5, weakening: -1.5, lose: -1.5, loses: -1.5, lost: -1.5, losing: -1.5,
    slip: -1, slips: -1, slipped: -1, sheds: -1.5, erodes: -2, wipes: -2, wiped: -2, 'extends losses': -2, 'extend losses': -2,
    falters: -1.5, stumbles: -2, sluggish: -1.5, jitters: -1.5, turmoil: -2, tensions: -1, war: -1.5, hawkish: -1.5,
    outflow: -1.5, 'weak demand': -2, 'margin pressure': -2, undersubscribed: -2, 'profit warning': -3, delisting: -1.5
};

// Larger phrases must be matched before the single words they contain.
const PHRASES = Object.keys(LEXICON).filter(k => k.includes(' ') || k.includes('-')).sort((a, b) => b.length - a.length);

const NEGATORS = new Set(['not', 'no', 'never', 'without', 'fails', 'failed', 'unable', "didn't", "doesn't", "won't", 'despite', 'nor', 'barely']);
const INTENSIFIERS = new Set(['sharply', 'massive', 'record', 'biggest', 'huge', 'steep', 'strongly', 'significantly', 'multi-year', 'highest', 'lowest', 'over']);
const SOFTENERS = new Set(['slightly', 'marginally', 'mildly', 'modest', 'modestly', 'flat', 'likely', 'may', 'could', 'might']);

// Event taxonomy. direction: expected price direction for the linked stock (or market for macro events).
export const EVENT_TYPES = [
    { type: 'earnings_beat', label: 'Earnings beat', direction: 1, re: /\b(beats?|tops?|above|better than|ahead of)\b.{0,30}\b(estimates?|expectations?|street|forecasts?|consensus)\b/i },
    { type: 'earnings_miss', label: 'Earnings miss', direction: -1, re: /\b(miss(es|ed)?|below|worse than|short of|lags?)\b.{0,30}\b(estimates?|expectations?|street|forecasts?|consensus)\b/i },
    { type: 'profit_rise', label: 'Profit growth', direction: 1, re: /\b(q[1-4]|quarterly|net)?\s*(profit|pat|earnings|net income)\b.{0,25}\b(rises?|jumps?|surges?|soars?|grows?|up|climbs?|increases?|doubles?)\b/i },
    { type: 'profit_fall', label: 'Profit decline', direction: -1, re: /\b(profit|pat|earnings|net income)\b.{0,25}\b(falls?|drops?|declines?|slumps?|plunges?|down|dips?|halves|shrinks?)\b|\bnet loss\b|\bloss widens\b/i },
    { type: 'rating_upgrade', label: 'Broker upgrade / buy call', direction: 1, re: /\b(upgrade[sd]?|initiates? (coverage )?with (a )?buy|raises? (price )?target|hikes? target|target (price )?raised|buy call|top pick|overweight)\b/i },
    { type: 'rating_downgrade', label: 'Broker downgrade / sell call', direction: -1, re: /\b(downgrade[sd]?|cuts? (price )?target|slashes target|target (price )?cut|sell call|underweight|reduce rating)\b/i },
    { type: 'order_win', label: 'Order / contract win', direction: 1, re: /\b(bags?|wins?|secures?|bagged|won|receives?|gets?)\b.{0,40}\b(order|contract|deal|project|tender|mandate)s?\b/i },
    { type: 'capital_return', label: 'Dividend / buyback / bonus', direction: 1, re: /\b(dividend|buyback|buy-back|bonus (issue|shares)|stock split|special dividend)\b/i },
    { type: 'regulatory_action', label: 'Regulatory / legal action', direction: -1, re: /\b(sebi|ed|cbi|income tax|gst|usfda|fda|cci|rbi)\b.{0,40}\b(penalty|fine[sd]?|order|probe|raid|ban|notice|show[- ]cause|observations?|warning letter|import alert|restrict)\b|\b(raid|probe|fraud|scam|show[- ]cause notice)\b/i },
    { type: 'promoter_selling', label: 'Promoter / block selling', direction: -1, re: /\b(promoters?|stake ?holder)\b.{0,30}\b(sells?|offloads?|trims?|pledges?|dilutes?)\b|\b(block deal|stake sale|ofs|offer for sale)\b/i },
    { type: 'promoter_buying', label: 'Promoter / insider buying', direction: 1, re: /\b(promoters?)\b.{0,30}\b(buys?|hikes? stake|raises? stake|increases? stake|creeping acquisition)\b/i },
    { type: 'mna', label: 'Merger / acquisition', direction: 0, re: /\b(acquires?|acquisition|merger|merges?|takeover|amalgamation|demerger|stake (buy|acquisition))\b/i },
    { type: 'management_change', label: 'Management change', direction: -1, re: /\b(ceo|cfo|md|chairman|managing director|chief executive)\b.{0,30}\b(resigns?|quits?|steps? down|exits?|sacked|ousted)\b/i },
    { type: 'guidance_up', label: 'Guidance raised', direction: 1, re: /\b(raises?|hikes?|ups|upgrades?)\b.{0,20}\b(guidance|outlook|forecast)\b/i },
    { type: 'guidance_down', label: 'Guidance cut', direction: -1, re: /\b(cuts?|lowers?|slashes?|trims?|downgrades?)\b.{0,20}\b(guidance|outlook|forecast)\b/i },
    { type: 'rbi_rate_cut', label: 'RBI rate cut / easing', direction: 1, macro: true, re: /\b(rbi|mpc|repo)\b.{0,40}\b(cuts?|lowers?|reduces?|eases?)\b|\brate cut\b/i },
    { type: 'rbi_rate_hike', label: 'RBI rate hike / tightening', direction: -1, macro: true, re: /\b(rbi|mpc|repo)\b.{0,40}\b(hikes?|raises?|increases?|tightens?)\b|\brate hike\b/i },
    { type: 'fii_buying', label: 'FII / FPI buying', direction: 1, macro: true, re: /\b(fiis?|fpis?|foreign (portfolio )?investors?)\b.{0,40}\b(buy|bought|pour|inflows?|net buyers?|invest(ed)?)\b/i },
    { type: 'fii_selling', label: 'FII / FPI selling', direction: -1, macro: true, re: /\b(fiis?|fpis?|foreign (portfolio )?investors?)\b.{0,40}\b(sell|sold|pull out|outflows?|net sellers?|dump|withdraw)\b/i },
    { type: 'crude_up', label: 'Crude oil rising', direction: -1, macro: true, re: /\b(crude|brent|oil prices?)\b.{0,30}\b(rises?|jumps?|surges?|climbs?|spikes?|high|soars?|gains?)\b/i },
    { type: 'rupee_weak', label: 'Rupee weakening', direction: -1, macro: true, re: /\brupee\b.{0,30}\b(falls?|slips?|weakens?|record low|depreciates?|hits? (a )?low)\b/i },
    { type: 'rupee_strong', label: 'Rupee strengthening', direction: 1, macro: true, re: /\brupee\b.{0,30}\b(rises?|gains?|strengthens?|appreciates?|recovers?)\b/i },
    { type: 'market_rally', label: 'Broad market rally', direction: 1, macro: true, re: /\b(sensex|nifty|markets?|d-street|dalal street|indices)\b.{0,40}\b(rall(y|ies)|surges?|jumps?|soars?|climbs?|gains?|rises?|record high)\b/i },
    { type: 'market_fall', label: 'Broad market fall', direction: -1, macro: true, re: /\b(sensex|nifty|markets?|d-street|dalal street|indices)\b.{0,40}\b(falls?|crash(es)?|tanks?|slumps?|plunges?|drops?|declines?|tumbles?|slides?|sheds?)\b/i },
    { type: 'ipo', label: 'IPO news', direction: 0, re: /\bipo\b|\blisting\b|\bgrey market premium\b|\bgmp\b/i }
];

export function tokenize(text) {
    return String(text || '')
        .toLowerCase()
        .replace(/[‘’]/g, "'")
        .replace(/[^a-z0-9%&'\- ]+/g, ' ')
        .split(/\s+/)
        .filter(Boolean);
}

// Lexicon score in (−1, 1) with matched terms for explainability.
export function lexiconScore(text) {
    let normalized = ` ${tokenize(text).join(' ')} `;
    const matches = [];

    // Phrases first, replaced by a placeholder so their words are not counted twice.
    const phraseHits = [];
    for (const phrase of PHRASES) {
        const needle = ` ${phrase} `;
        let idx = normalized.indexOf(needle);
        while (idx !== -1) {
            phraseHits.push({ term: phrase, position: idx });
            normalized = normalized.slice(0, idx) + ' ' + '_'.repeat(phrase.length) + ' ' + normalized.slice(idx + needle.length);
            idx = normalized.indexOf(needle);
        }
    }

    // Placeholders keep the original length, so positions stay valid; consume hits left to right.
    phraseHits.sort((a, b) => a.position - b.position);
    const tokens = normalized.trim().split(/\s+/);
    let raw = 0;
    tokens.forEach((token, i) => {
        let term = token;
        let weight = LEXICON[token];
        if (weight === undefined && /^_+$/.test(token)) {
            const hit = phraseHits.shift();
            if (!hit) return;
            term = hit.term;
            weight = LEXICON[term];
        }
        if (weight === undefined) return;

        let modifier = 1;
        const window = tokens.slice(Math.max(0, i - 3), i);
        if (window.some(w => NEGATORS.has(w))) modifier *= -1;
        if (window.some(w => INTENSIFIERS.has(w))) modifier *= 1.5;
        if (window.some(w => SOFTENERS.has(w))) modifier *= 0.5;

        const contribution = weight * modifier;
        raw += contribution;
        matches.push({ term, weight: Math.round(contribution * 100) / 100 });
    });

    return { score: Math.tanh(raw / 2.5), matches };
}

// Opposite events, used when a negator precedes the match ("fails to beat estimates" is a miss).
const OPPOSITE = {
    earnings_beat: 'earnings_miss', earnings_miss: 'earnings_beat', profit_rise: 'profit_fall', profit_fall: 'profit_rise',
    rating_upgrade: 'rating_downgrade', rating_downgrade: 'rating_upgrade', guidance_up: 'guidance_down', guidance_down: 'guidance_up'
};
const NEGATION_BEFORE = /\b(not|no|never|fails? to|failed to|unable to|didn't|doesn't|won't|without)\s+(\w+\s+){0,2}$/i;

export function classifyEvents(text) {
    const byType = Object.fromEntries(EVENT_TYPES.map(e => [e.type, e]));
    const found = new Map();
    for (const event of EVENT_TYPES) {
        const m = event.re.exec(text);
        if (!m) continue;
        const negated = NEGATION_BEFORE.test(text.slice(Math.max(0, m.index - 30), m.index));
        if (negated && OPPOSITE[event.type]) {
            const flipped = byType[OPPOSITE[event.type]];
            found.set(flipped.type, flipped);
        } else if (!negated) {
            found.set(event.type, event);
        }
    }
    const events = [...found.values()];
    // A specific company event (e.g. earnings beat) is more informative than a generic market-move one.
    events.sort((a, b) => Number(Boolean(a.macro)) - Number(Boolean(b.macro)));
    return events;
}

// Headlines that report a price move ("shares tank 8%", "Sensex jumps 500 points") describe the market
// rather than predict it; they are excluded when measuring predictive accuracy.
const PRICE_MOVE = /\b(shares?|stocks?|scrip|sensex|nifty|markets?|index|indices|m-?cap|market cap)\b.{0,40}\b(jumps?|surges?|soars?|rall(y|ies)|gains?|rises?|climbs?|zooms?|spurts?|falls?|tanks?|slumps?|plunges?|drops?|declines?|crash(es)?|tumbles?|slides?|sinks?|dips?|sheds?|up|down)\b.{0,25}(\d+(\.\d+)?\s?(%|per ?cent|points|pts))|\b(upper|lower) circuit\b|\b\d+(\.\d+)?\s?% (higher|lower|up|down)\b/i;

export function describesPriceMove(text) {
    return PRICE_MOVE.test(text);
}

export function labelFor(score) {
    if (score >= 0.15) return 'positive';
    if (score <= -0.15) return 'negative';
    return 'neutral';
}

/**
 * Full analysis of one headline (+ optional summary, weighted lower).
 * Returns score in [−1, 1], label, confidence in [0, 1], the primary event and the evidence used.
 */
export function analyzeHeadline(title, summary = '') {
    const head = lexiconScore(title);
    const body = summary ? lexiconScore(summary) : { score: 0, matches: [] };
    const lexicon = body.matches.length ? 0.75 * head.score + 0.25 * body.score : head.score;

    const events = classifyEvents(`${title} ${summary}`);
    const primary = events[0] || null;
    const prior = primary ? primary.direction : 0;
    const score = primary && prior !== 0 ? 0.55 * lexicon + 0.45 * prior : lexicon;

    const signals = head.matches.length + body.matches.length + (primary ? 1 : 0);
    const agrees = !primary || prior === 0 || Math.sign(lexicon) === Math.sign(prior) || lexicon === 0;
    const confidence = Math.min(1, (1 - Math.exp(-signals / 2)) * (agrees ? 1 : 0.6));

    return {
        score: Math.round(score * 1000) / 1000,
        label: labelFor(score),
        describesMove: describesPriceMove(title),
        confidence: Math.round(confidence * 100) / 100,
        event: primary ? { type: primary.type, label: primary.label, direction: primary.direction, macro: Boolean(primary.macro) } : null,
        evidence: [...head.matches, ...body.matches].slice(0, 8)
    };
}

export default { analyzeHeadline, lexiconScore, classifyEvents, tokenize, EVENT_TYPES };
