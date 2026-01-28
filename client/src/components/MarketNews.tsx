import React from 'react';
import { Newspaper, Clock, ExternalLink, TrendingUp } from 'lucide-react';

const MarketNews: React.FC = () => {
    const news = [
        {
            title: "Nifty 50 hits new all-time high amid strong FII inflows",
            summary: "Indian benchmark indices reached record levels as foreign institutional investors pumped in ₹2,500 crores...",
            time: "2 hours ago",
            source: "Economic Times",
            category: "Markets",
            impact: "positive"
        },
        {
            title: "RBI keeps repo rate unchanged at 6.5% in latest policy meet",
            summary: "Reserve Bank of India maintains status quo on interest rates, citing inflation concerns and growth outlook...",
            time: "4 hours ago",
            source: "Business Standard",
            category: "Policy",
            impact: "neutral"
        },
        {
            title: "IT stocks rally on strong Q3 earnings guidance from TCS",
            summary: "Technology stocks surge after Tata Consultancy Services provides optimistic revenue growth projections...",
            time: "6 hours ago",
            source: "Mint",
            category: "Earnings",
            impact: "positive"
        },
        {
            title: "Oil prices decline on global demand concerns",
            summary: "Crude oil futures drop 2.3% as investors worry about slowing economic growth in major economies...",
            time: "8 hours ago",
            source: "Reuters",
            category: "Commodities",
            impact: "negative"
        },
        {
            title: "Banking sector sees strong deposit growth in December",
            summary: "Major banks report healthy deposit mobilization with HDFC Bank leading at 12% year-on-year growth...",
            time: "1 day ago",
            source: "Financial Express",
            category: "Banking",
            impact: "positive"
        }
    ];

    const getImpactColor = (impact: string) => {
        switch (impact) {
            case 'positive': return 'text-green-600 bg-green-100 dark:bg-green-900';
            case 'negative': return 'text-red-600 bg-red-100 dark:bg-red-900';
            default: return 'text-blue-600 bg-blue-100 dark:bg-blue-900';
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Newspaper className="h-5 w-5 text-blue-600" />
                        Market News
                    </h3>
                    <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                        View All <ExternalLink className="h-3 w-3" />
                    </button>
                </div>
                <div className="space-y-4">
                    {news.map((item, index) => (
                        <div key={index} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0 pb-4 last:pb-0">
                            <div className="flex items-start gap-3">
                                <div className={`w-2 h-2 rounded-full mt-2 ${getImpactColor(item.impact).split(' ')[1]}`}></div>
                                <div className="flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <h4 className="font-medium text-gray-900 dark:text-white text-sm leading-5 hover:text-blue-600 cursor-pointer">
                                            {item.title}
                                        </h4>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getImpactColor(item.category)}`}>
                                            {item.category}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                        {item.summary}
                                    </p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {item.time}
                                        </div>
                                        <span>{item.source}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MarketNews;