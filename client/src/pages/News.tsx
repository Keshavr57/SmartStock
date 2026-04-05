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
        <section className="bg-slate-50 dark:bg-slate-900 min-h-[calc(100vh-64px)] p-4 md:p-8 border-t dark:border-slate-800" id="discover">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Market News</h1>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Stay updated with developments</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative flex-1 w-full max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search news..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:border-[#630ed4] dark:focus:border-[#a975ff] shadow-inner font-medium"
                        />
                    </div>
                    
                    <button 
                        onClick={handleRefresh} 
                        disabled={refreshing}
                        className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-6 py-3 rounded-xl font-bold text-sm shadow-sm transition-colors border border-slate-200 dark:border-slate-600 hover:border-[#630ed4] dark:hover:border-[#a975ff] hover:text-[#630ed4] flex items-center gap-2 uppercase tracking-widest w-full md:w-auto justify-center"
                    >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Sync News
                    </button>
                </div>

                <div className="flex flex-wrap gap-2">
                    {filters.map((filter) => (
                        <button
                            key={filter.id}
                            onClick={() => handleFilterChange(filter.id)}
                            className={`px-5 py-2 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all ${
                                activeFilter === filter.id
                                    ? 'bg-[#630ed4] text-white shadow-md'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-[#630ed4]/50'
                            }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 animate-pulse">
                                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4"></div>
                                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded mb-4 w-full"></div>
                                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded mb-4 w-5/6"></div>
                                <div className="h-10 bg-slate-100 dark:bg-slate-900 rounded w-full mt-6"></div>
                            </div>
                        ))}
                    </div>
                ) : filteredNews.length === 0 ? (
                    <div className="py-16 bg-white dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 rounded-3xl flex flex-col items-center justify-center text-center">
                        <Newspaper className="h-16 w-16 text-slate-300 dark:text-slate-600 mb-4" />
                        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase">No News Found</h3>
                        <p className="text-slate-500 font-medium">Try adjusting your search or filter.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredNews.map((item, index) => (
                            <div key={index} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col h-full group">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full">
                                        {item.source}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {(() => {
                                            const raw = item.date || item.publishDate;
                                            if (!raw) return 'Just now';
                                            const d = new Date(raw);
                                            return isNaN(d.getTime()) ? 'Just now' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                                        })()}
                                    </span>
                                </div>

                                <div className="flex gap-2 mb-4 flex-wrap">
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] uppercase font-black flex items-center gap-1 border ${
                                        item.sentiment === 'positive'
                                            ? 'bg-green-500 text-white border-green-500'
                                            : item.sentiment === 'negative'
                                            ? 'bg-red-500 text-white border-red-500'
                                            : 'bg-slate-200 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'
                                    }`}>
                                        {item.sentimentIcon} {item.sentiment}
                                    </span>
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] uppercase font-black border ${
                                        item.marketImpact === 'high'
                                            ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800'
                                            : item.marketImpact === 'medium'
                                            ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
                                            : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600'
                                    }`}>
                                        Impact: {item.impactBadge}
                                    </span>
                                </div>

                                <h3 className="text-base font-black text-slate-800 dark:text-white mb-4 leading-snug group-hover:text-[#630ed4] transition-colors">{item.title}</h3>

                                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700">
                                    <a href={item.link} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-[#630ed4] dark:text-[#a975ff] hover:text-[#4d0aab] transition-colors">
                                        Read Full Article <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-6 md:p-8 relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center relative z-10">
                        <Newspaper className="w-8 h-8 text-amber-500 shrink-0" />
                        <div>
                            <h4 className="font-black text-amber-600 uppercase tracking-widest text-sm mb-1">Educational Platform</h4>
                            <p className="text-amber-700/80 dark:text-amber-300/80 text-sm font-medium leading-relaxed">
                                News analysis is for educational purposes only. Always verify information from original sources and consult financial advisors for investment decisions.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
