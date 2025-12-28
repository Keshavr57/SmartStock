import { useState, useEffect } from "react"
import { getTrendingNews, getNewsBySentiment, getNewsByImpact, getNewsAnalytics } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Clock, Newspaper, RefreshCw, Filter, TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"

type NewsItem = {
    title: string;
    link: string;
    date: Date;
    source: string;
    type: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    sentimentIcon: string;
    sentimentScore: number;
    marketImpact: 'high' | 'medium' | 'low';
    impactLevel: number;
    impactBadge: string;
    isTrusted: boolean;
    priority: number;
};

type NewsAnalytics = {
    total: number;
    sentiment: {
        positive: number;
        negative: number;
        neutral: number;
    };
    impact: {
        high: number;
        medium: number;
        low: number;
    };
    sources: Record<string, number>;
};

export default function News() {
    const [news, setNews] = useState<NewsItem[]>([])
    const [analytics, setAnalytics] = useState<NewsAnalytics | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeFilter, setActiveFilter] = useState<string>('all')

    const fetchNews = async (filter: string = 'all') => {
        setLoading(true)
        try {
            let res;
            switch (filter) {
                case 'positive':
                case 'negative':
                case 'neutral':
                    res = await getNewsBySentiment(filter as 'positive' | 'negative' | 'neutral');
                    break;
                case 'high':
                case 'medium':
                case 'low':
                    res = await getNewsByImpact(filter as 'high' | 'medium' | 'low');
                    break;
                default:
                    res = await getTrendingNews();
            }
            
            if (res.status === "success") {
                setNews(res.data)
            }
        } catch (error) {
            console.error("Failed to fetch news:", error)
        } finally {
            setLoading(false)
        }
    }

    const fetchAnalytics = async () => {
        try {
            const res = await getNewsAnalytics();
            if (res.status === "success") {
                setAnalytics(res.data);
            }
        } catch (error) {
            console.error("Failed to fetch analytics:", error);
        }
    }

    useEffect(() => {
        fetchNews()
        fetchAnalytics()
    }, [])

    const handleFilterChange = (filter: string) => {
        setActiveFilter(filter)
        fetchNews(filter)
    }

    const getSentimentColor = (sentiment: string) => {
        switch (sentiment) {
            case 'positive': return 'bg-green-100 text-green-800 hover:bg-green-100';
            case 'negative': return 'bg-red-100 text-red-800 hover:bg-red-100';
            default: return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
        }
    }

    const getImpactColor = (impact: string) => {
        switch (impact) {
            case 'high': return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
            case 'medium': return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
            default: return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
        }
    }

    return (
        <div className="p-6 container mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl premium-gradient flex items-center justify-center text-white shadow-lg">
                        <Newspaper className="h-7 w-7" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight">Smart News</h1>
                        <p className="text-muted-foreground text-lg">AI-powered sentiment analysis & market impact filtering.</p>
                    </div>
                </div>
                <Button variant="outline" className="gap-2" onClick={() => fetchNews(activeFilter)} disabled={loading}>
                    <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                    Refresh Feed
                </Button>
            </div>

            {/* Analytics Dashboard */}
            {analytics && (
                <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <BarChart3 className="h-5 w-5 text-blue-600" />
                            <h3 className="font-semibold text-blue-800 dark:text-blue-200">News Analytics</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{analytics.total}</div>
                                <div className="text-sm text-blue-700 dark:text-blue-300">Total News</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">{analytics.sentiment.positive}</div>
                                <div className="text-sm text-green-700 dark:text-green-300">🟢 Positive</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-600">{analytics.sentiment.negative}</div>
                                <div className="text-sm text-red-700 dark:text-red-300">🔴 Negative</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">{analytics.impact.high}</div>
                                <div className="text-sm text-purple-700 dark:text-purple-300">High Impact</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Smart Filters */}
            <Card className="bg-muted/30">
                <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="h-5 w-5" />
                        <h3 className="font-semibold">Smart Filters</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button 
                            variant={activeFilter === 'all' ? 'default' : 'outline'} 
                            size="sm" 
                            onClick={() => handleFilterChange('all')}
                            className="gap-2"
                        >
                            <Filter className="h-4 w-4" />
                            All News
                        </Button>
                        <Button 
                            variant={activeFilter === 'positive' ? 'default' : 'outline'} 
                            size="sm" 
                            onClick={() => handleFilterChange('positive')}
                            className="gap-2"
                        >
                            <TrendingUp className="h-4 w-4" />
                            🟢 Positive
                        </Button>
                        <Button 
                            variant={activeFilter === 'negative' ? 'default' : 'outline'} 
                            size="sm" 
                            onClick={() => handleFilterChange('negative')}
                            className="gap-2"
                        >
                            <TrendingDown className="h-4 w-4" />
                            🔴 Negative
                        </Button>
                        <Button 
                            variant={activeFilter === 'neutral' ? 'default' : 'outline'} 
                            size="sm" 
                            onClick={() => handleFilterChange('neutral')}
                            className="gap-2"
                        >
                            <Minus className="h-4 w-4" />
                            🟡 Neutral
                        </Button>
                        <Button 
                            variant={activeFilter === 'high' ? 'default' : 'outline'} 
                            size="sm" 
                            onClick={() => handleFilterChange('high')}
                        >
                            High Impact
                        </Button>
                        <Button 
                            variant={activeFilter === 'medium' ? 'default' : 'outline'} 
                            size="sm" 
                            onClick={() => handleFilterChange('medium')}
                        >
                            Medium Impact
                        </Button>
                        <Button 
                            variant={activeFilter === 'low' ? 'default' : 'outline'} 
                            size="sm" 
                            onClick={() => handleFilterChange('low')}
                        >
                            Low Impact
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* News Grid */}
            {loading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-64 bg-muted/20 rounded-2xl animate-pulse border border-muted/50" />
                    ))}
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {news.map((item, index) => (
                        <Card key={index} className="group hover:border-primary/50 transition-all duration-300 border-muted/50 overflow-hidden flex flex-col bg-card/50 backdrop-blur-sm">
                            <CardHeader className="pb-3 flex-1">
                                <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="bg-primary/5 text-primary border-none">
                                            {item.source}
                                        </Badge>
                                        {item.isTrusted && (
                                            <Badge variant="outline" className="text-xs">
                                                ✓ Trusted
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 font-medium">
                                        <Clock className="h-3 w-3" />
                                        {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2 mb-3">
                                    <Badge className={getSentimentColor(item.sentiment)}>
                                        {item.sentimentIcon} {item.sentiment}
                                    </Badge>
                                    <Badge className={getImpactColor(item.marketImpact)}>
                                        {item.impactBadge}
                                    </Badge>
                                </div>

                                <CardTitle className="text-xl leading-tight group-hover:text-primary transition-colors font-bold">
                                    {item.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline group/link"
                                >
                                    View Full Story
                                    <ExternalLink className="h-4 w-4 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                                </a>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Educational Disclaimer */}
            <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
                <CardContent className="p-4 flex items-start gap-3">
                    <Newspaper className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-1">Smart News Analysis</h3>
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                            Our AI analyzes news sentiment and market impact using keyword analysis. This is for educational purposes only. 
                            Always verify information from original sources and consult financial advisors for investment decisions.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
