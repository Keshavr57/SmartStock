import Parser from 'rss-parser';
const parser = new Parser();

class NewsService {
    constructor() {
        // Sentiment analysis keywords
        this.sentimentKeywords = {
            negative: [
                'crash', 'fall', 'decline', 'drop', 'plunge', 'tumble', 'slump', 'loss', 'losses',
                'bankruptcy', 'recession', 'inflation', 'war', 'crisis', 'collapse', 'failure',
                'bearish', 'sell-off', 'correction', 'volatility', 'uncertainty', 'risk',
                'downgrade', 'cut', 'reduce', 'weak', 'poor', 'disappointing', 'concern',
                'threat', 'warning', 'alert', 'caution', 'fear', 'panic', 'stress'
            ],
            positive: [
                'growth', 'profit', 'surge', 'boom', 'rally', 'rise', 'gain', 'gains',
                'investment', 'expansion', 'recovery', 'bullish', 'upgrade', 'strong',
                'robust', 'healthy', 'optimistic', 'confident', 'breakthrough', 'success',
                'achievement', 'milestone', 'record', 'high', 'peak', 'soar', 'jump',
                'increase', 'improve', 'better', 'positive', 'good', 'excellent', 'outstanding'
            ],
            neutral: [
                'report', 'update', 'announcement', 'meeting', 'policy', 'statement',
                'conference', 'discussion', 'review', 'analysis', 'forecast', 'outlook',
                'guidance', 'plan', 'strategy', 'initiative', 'program', 'launch'
            ]
        };

        // Market impact categories
        this.marketImpactKeywords = {
            high: [
                'rbi', 'reserve bank', 'interest rate', 'repo rate', 'inflation', 'gdp',
                'budget', 'policy', 'election', 'government', 'regulation', 'tax',
                'nifty', 'sensex', 'market crash', 'global', 'fed', 'federal reserve'
            ],
            medium: [
                'earnings', 'quarterly', 'results', 'revenue', 'profit', 'ipo',
                'merger', 'acquisition', 'dividend', 'bonus', 'split', 'buyback'
            ],
            low: [
                'appointment', 'resignation', 'partnership', 'collaboration',
                'product launch', 'expansion', 'opening', 'closure'
            ]
        };

        // Trusted news sources (higher priority)
        this.trustedSources = [
            'economic times', 'mint', 'business standard', 'reuters', 'bloomberg',
            'moneycontrol', 'livemint', 'financial express', 'cnbc', 'et now'
        ];
    }

    // Analyze sentiment of news title and content
    analyzeSentiment(text) {
        const lowerText = text.toLowerCase();
        let positiveScore = 0;
        let negativeScore = 0;
        let neutralScore = 0;

        // Count positive keywords
        this.sentimentKeywords.positive.forEach(keyword => {
            if (lowerText.includes(keyword)) {
                positiveScore += 1;
            }
        });

        // Count negative keywords
        this.sentimentKeywords.negative.forEach(keyword => {
            if (lowerText.includes(keyword)) {
                negativeScore += 1;
            }
        });

        // Count neutral keywords
        this.sentimentKeywords.neutral.forEach(keyword => {
            if (lowerText.includes(keyword)) {
                neutralScore += 1;
            }
        });

        // Determine overall sentiment
        if (negativeScore > positiveScore && negativeScore > 0) {
            return { sentiment: 'negative', score: negativeScore, icon: '🔴' };
        } else if (positiveScore > negativeScore && positiveScore > 0) {
            return { sentiment: 'positive', score: positiveScore, icon: '🟢' };
        } else {
            return { sentiment: 'neutral', score: neutralScore, icon: '🟡' };
        }
    }

    // Analyze market impact level
    analyzeMarketImpact(text) {
        const lowerText = text.toLowerCase();
        let highImpact = 0;
        let mediumImpact = 0;
        let lowImpact = 0;

        // Check for high impact keywords
        this.marketImpactKeywords.high.forEach(keyword => {
            if (lowerText.includes(keyword)) {
                highImpact += 1;
            }
        });

        // Check for medium impact keywords
        this.marketImpactKeywords.medium.forEach(keyword => {
            if (lowerText.includes(keyword)) {
                mediumImpact += 1;
            }
        });

        // Check for low impact keywords
        this.marketImpactKeywords.low.forEach(keyword => {
            if (lowerText.includes(keyword)) {
                lowImpact += 1;
            }
        });

        // Determine impact level
        if (highImpact > 0) {
            return { impact: 'high', level: 3, badge: 'High Impact' };
        } else if (mediumImpact > 0) {
            return { impact: 'medium', level: 2, badge: 'Medium Impact' };
        } else {
            return { impact: 'low', level: 1, badge: 'Low Impact' };
        }
    }

    // Check if source is trusted
    isTrustedSource(source) {
        const lowerSource = source.toLowerCase();
        return this.trustedSources.some(trusted => lowerSource.includes(trusted));
    }

    // Enhanced news processing with sentiment and impact analysis
    processNewsItem(item, sourceType) {
        const sentiment = this.analyzeSentiment(item.title);
        const impact = this.analyzeMarketImpact(item.title);
        const isTrusted = this.isTrustedSource(item.source || '');

        return {
            title: item.title,
            link: item.link,
            date: new Date(item.pubDate),
            source: sourceType,
            type: sourceType.toLowerCase(),
            sentiment: sentiment.sentiment,
            sentimentIcon: sentiment.icon,
            sentimentScore: sentiment.score,
            marketImpact: impact.impact,
            impactLevel: impact.level,
            impactBadge: impact.badge,
            isTrusted: isTrusted,
            priority: this.calculatePriority(sentiment, impact, isTrusted)
        };
    }

    // Calculate news priority for sorting
    calculatePriority(sentiment, impact, isTrusted) {
        let priority = 0;
        
        // Impact level contributes most to priority
        priority += impact.level * 10;
        
        // Sentiment score adds to priority
        priority += sentiment.score * 2;
        
        // Trusted sources get bonus
        if (isTrusted) {
            priority += 5;
        }
        
        // Negative news gets slight priority boost (more urgent)
        if (sentiment.sentiment === 'negative') {
            priority += 3;
        }
        
        return priority;
    }

    async getUnifiedNews() {
        try {
            // Enhanced RSS sources for better Indian market coverage
            const sources = [
                {
                    url: 'https://news.google.com/rss/search?q=NSE+BSE+Stock+Market+India&hl=en-IN&gl=IN&ceid=IN:en',
                    type: 'Indian Markets'
                },
                {
                    url: 'https://news.google.com/rss/search?q=RBI+Interest+Rate+Inflation+India&hl=en-IN&gl=IN&ceid=IN:en',
                    type: 'Economic Policy'
                },
                {
                    url: 'https://news.google.com/rss/search?q=IPO+India+Stock+Market&hl=en-IN&gl=IN&ceid=IN:en',
                    type: 'IPO & Markets'
                },
                {
                    url: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
                    type: 'Crypto Global'
                }
            ];

            // Fetch all sources in parallel
            const feedPromises = sources.map(async (source) => {
                try {
                    const feed = await parser.parseURL(source.url);
                    return feed.items.map(item => this.processNewsItem(item, source.type));
                } catch (error) {
                    console.error(`Error fetching ${source.type}:`, error.message);
                    return [];
                }
            });

            const allFeeds = await Promise.all(feedPromises);
            const allNews = allFeeds.flat();

            // Sort by priority (highest first), then by date
            const sortedNews = allNews.sort((a, b) => {
                if (b.priority !== a.priority) {
                    return b.priority - a.priority;
                }
                return b.date - a.date;
            });

            // Return top 20 news items with enhanced metadata
            return sortedNews.slice(0, 20);

        } catch (error) {
            console.error("Enhanced News Service Error:", error);
            throw new Error("Could not fetch enhanced news with sentiment analysis.");
        }
    }

    // Get filtered news by sentiment
    async getNewsBySentiment(sentiment) {
        const allNews = await this.getUnifiedNews();
        return allNews.filter(news => news.sentiment === sentiment);
    }

    // Get filtered news by market impact
    async getNewsByImpact(impact) {
        const allNews = await this.getUnifiedNews();
        return allNews.filter(news => news.marketImpact === impact);
    }
}

export default new NewsService();