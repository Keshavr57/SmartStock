import { useState, useEffect } from "react"
import { getTrendingNews, getNewsBySentiment, getNewsByImpact } from "../lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Clock, Newspaper, RefreshCw, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

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

export default function News() {
    const [news, setNews] = useState<NewsItem[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [activeFilter, setActiveFilter] = useState<string>('all')
    const [searchQuery, setSearchQuery] = useState('')

    const fetchNews = async (filter: string = 'all', fastMode = false) => {
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
                    res = await getTrendingNews(fastMode);
            }
            
            if (res.status === "success") {
                setNews(res.data)
            }
        } catch (error) {
            console.error('News loading error:', error)
            // Don't show error to user, just log it
        } finally {
            setLoading(false)
        }
    }

    const handleRefresh = async () => {
        setRefreshing(true)
        await fetchNews(activeFilter, false) // Full refresh
        setRefreshing(false)
    }

    useEffect(() => {
        // Fast initial load, then full load in background
        fetchNews('all', true)
        
        // Full load after 2 seconds
        setTimeout(() => {
            fetchNews('all', false)
        }, 2000)
    }, [])

    const handleFilterChange = (filter: string) => {
        setActiveFilter(filter)
        fetchNews(filter, false) // Full load for filters
    }

    const getSentimentColor = (sentiment: string) => {
        switch (sentiment) {
            case 'positive': return 'bg-green-100 text-green-800';
            case 'negative': return 'bg-red-100 text-red-800';
            default: return 'bg-yellow-100 text-yellow-800';
        }
    }

    const getImpactColor = (impact: string) => {
        switch (impact) {
            case 'high': return 'bg-purple-100 text-purple-800';
            case 'medium': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    const filteredNews = news.filter(item =>
        searchQuery === '' || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.source.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const filters = [
        { id: 'all', label: 'All News' },
        { id: 'positive', label: 'Positive' },
        { id: 'negative', label: 'Negative' },
        { id: 'neutral', label: 'Neutral' },
        { id: 'high', label: 'High Impact' },
        { id: 'medium', label: 'Medium Impact' },
        { id: 'low', label: 'Low Impact' }
    ]

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Market News</h1>
                    <p className="text-gray-600">Stay updated with the latest market developments</p>
                </div>

                {/* Search and Filters */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search news..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Refresh Button */}
                        <Button 
                            variant="outline" 
                            onClick={handleRefresh} 
                            disabled={refreshing}
                            className="flex items-center space-x-2"
                        >
                            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                            <span>Refresh</span>
                        </Button>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-2 mt-4">
                        {filters.map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => handleFilterChange(filter.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    activeFilter === filter.id
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* News Grid */}
                {loading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-64 bg-white rounded-lg border border-gray-200 animate-pulse">
                                <div className="p-6">
                                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredNews.map((item, index) => (
                            <Card key={index} className="bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between mb-3 text-xs text-gray-500">
                                        <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                                            {item.source}
                                        </Badge>
                                        <div className="flex items-center space-x-1">
                                            <Clock className="h-3 w-3" />
                                            <span>{new Date(item.date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2 mb-3">
                                        <Badge className={getSentimentColor(item.sentiment)}>
                                            {item.sentimentIcon} {item.sentiment}
                                        </Badge>
                                        <Badge className={getImpactColor(item.marketImpact)}>
                                            {item.impactBadge}
                                        </Badge>
                                    </div>

                                    <CardTitle className="text-lg leading-tight text-gray-900 hover:text-blue-600 transition-colors">
                                        {item.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <a
                                        href={item.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center space-x-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                        <span>Read Full Story</span>
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* No Results */}
                {!loading && filteredNews.length === 0 && (
                    <div className="text-center py-12">
                        <Newspaper className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No news found</h3>
                        <p className="text-gray-600">Try adjusting your search or filter criteria</p>
                    </div>
                )}

                {/* Disclaimer */}
                <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                        <strong>Educational Purpose:</strong> News analysis is for educational purposes only. Always verify information from original sources and consult financial advisors for investment decisions.
                    </p>
                </div>
            </div>
        </div>
    )
}
