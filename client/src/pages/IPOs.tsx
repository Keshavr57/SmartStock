import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, RefreshCw, Calendar, DollarSign, AlertTriangle, Clock, Target, BarChart3, BookOpen, FileText, Filter } from "lucide-react"
import { useState, useEffect } from "react"
import { getUpcomingIPOs } from "../lib/api"

interface IPO {
    company: string;
    openDate: string;
    closeDate: string;
    date: string;
    price: string;
    status: string;
    size: string;
    riskLevel: string;
    riskIcon: string;
    riskColor: string;
    riskScore: number;
    riskFactors: string[];
    lotSize: string;
    type: string;
    sector: string;
    gmp: string;
    subscription: string;
    listingDate: string;
}

type FilterType = 'All' | 'Open' | 'Upcoming' | 'Closed';
type TypeFilterType = 'All Types' | 'Mainboard' | 'SME';

export default function IPOs() {
    const [ipos, setIpos] = useState<IPO[]>([])
    const [filteredIpos, setFilteredIpos] = useState<IPO[]>([])
    const [loading, setLoading] = useState(true)
    const [lastUpdated, setLastUpdated] = useState<string>('')
    const [showRiskGuide, setShowRiskGuide] = useState(false)
    const [activeFilter, setActiveFilter] = useState<FilterType>('All')
    const [activeTypeFilter, setActiveTypeFilter] = useState<TypeFilterType>('All Types')

    const filterOptions: FilterType[] = ['All', 'Open', 'Upcoming', 'Closed']
    const typeFilterOptions: TypeFilterType[] = ['All Types', 'Mainboard', 'SME']

    const fetchIPOs = async (fastMode = false, forceRefresh = false) => {
        setLoading(true)
        try {
            const res = await getUpcomingIPOs(fastMode, forceRefresh)
            if (res && res.status === "success" && Array.isArray(res.data)) {
                const mappedData: IPO[] = res.data.map((item: any) => ({
                    company: item.name || "Unknown Company",
                    openDate: item.openDate || "TBA",
                    closeDate: item.closeDate || "TBA",
                    date: item.openDate && item.closeDate ? `${item.openDate} - ${item.closeDate}` : (item.openDate || "TBA"),
                    price: item.priceBand || "TBA",
                    status: item.status || "Upcoming",
                    size: item.issueSize || "TBA",
                    riskLevel: item.riskLevel || "Medium",
                    riskIcon: item.riskIcon || "🟡",
                    riskColor: item.riskColor || "yellow",
                    riskScore: item.riskScore || 2.0,
                    riskFactors: item.riskFactors || [],
                    lotSize: item.lotSize || "TBA",
                    type: item.type || item.category || "Mainboard",
                    sector: item.sector || "General",
                    gmp: item.gmp || "N/A",
                    subscription: item.subscription || "N/A",
                    listingDate: item.listingDate || "TBA"
                }))
                
                // Filter out any old 2024 data that might still be coming through
                const current2025Data = mappedData.filter(ipo => {
                    const year = new Date().getFullYear();
                    return !ipo.date.includes('2024') || ipo.date.includes('2025') || ipo.date.includes(year.toString());
                });
                
                const finalData = current2025Data.length > 0 ? current2025Data : mappedData;
                setIpos(finalData)
                setLastUpdated(res.lastUpdated || new Date().toLocaleString())
                
                console.log(`✅ IPO data loaded: ${mappedData.length} total, ${current2025Data.length} current`)
            }
        } catch (error) {
            console.error('IPO loading error:', error)
            // Don't show error to user, just log it
        } finally {
            setLoading(false)
        }
    }

    // Filter IPOs based on active filters
    useEffect(() => {
        let filtered = ipos;
        
        // Apply status filter
        if (activeFilter !== 'All') {
            filtered = filtered.filter(ipo => ipo.status === activeFilter);
        }
        
        // Apply type filter
        if (activeTypeFilter !== 'All Types') {
            filtered = filtered.filter(ipo => {
                if (activeTypeFilter === 'Mainboard') {
                    return ipo.type === 'Mainboard' || ipo.type === 'Main Board';
                } else {
                    return ipo.type === 'SME';
                }
            });
        }
        
        setFilteredIpos(filtered);
    }, [ipos, activeFilter, activeTypeFilter])

    useEffect(() => {
        // Force refresh to get current 2025 data
        fetchIPOs(true, true) // Fast mode + force refresh
        
        // Full load after 2 seconds with force refresh
        setTimeout(() => {
            fetchIPOs(false, true) // Full load + force refresh
        }, 2000)
    }, [])

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'open': return 'bg-green-100 text-green-800 border-green-200'
            case 'upcoming': return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200'
            default: return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    const getTypeColor = (type: string) => {
        return type === 'Mainboard' || type === 'Main Board' 
            ? 'bg-purple-100 text-purple-800 border-purple-200'
            : 'bg-orange-100 text-orange-800 border-orange-200'
    }

    const getFilterButtonStyle = (filter: FilterType) => {
        const isActive = activeFilter === filter
        const baseStyle = "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
        
        if (isActive) {
            switch (filter) {
                case 'Open':
                    return `${baseStyle} bg-green-600 text-white shadow-md`
                case 'Upcoming':
                    return `${baseStyle} bg-blue-600 text-white shadow-md`
                case 'Closed':
                    return `${baseStyle} bg-gray-600 text-white shadow-md`
                default:
                    return `${baseStyle} bg-purple-600 text-white shadow-md`
            }
        } else {
            return `${baseStyle} bg-white text-gray-700 border border-gray-300 hover:bg-gray-50`
        }
    }

    const getFilterCount = (filter: FilterType) => {
        if (filter === 'All') return ipos.length
        return ipos.filter(ipo => ipo.status === filter).length
    }

    const getTypeFilterCount = (filter: TypeFilterType) => {
        if (filter === 'All Types') return ipos.length
        if (filter === 'Mainboard') {
            return ipos.filter(ipo => ipo.type === 'Mainboard' || ipo.type === 'Main Board').length
        }
        return ipos.filter(ipo => ipo.type === 'SME').length
    }

    const getTypeFilterButtonStyle = (filter: TypeFilterType) => {
        const isActive = activeTypeFilter === filter
        const baseStyle = "px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200"
        
        if (isActive) {
            switch (filter) {
                case 'Mainboard':
                    return `${baseStyle} bg-purple-600 text-white shadow-sm`
                case 'SME':
                    return `${baseStyle} bg-orange-600 text-white shadow-sm`
                default:
                    return `${baseStyle} bg-gray-600 text-white shadow-sm`
            }
        } else {
            return `${baseStyle} bg-gray-100 text-gray-700 hover:bg-gray-200`
        }
    }

    return (
        <section className="bg-slate-50 dark:bg-slate-900 min-h-[calc(100vh-64px)] p-4 md:p-8 border-t dark:border-slate-800" id="ipo-calendar">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">IPO Calendar</h1>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time tracker & Analysis</p>
                    </div>
                    <button 
                        onClick={() => fetchIPOs(false, true)}
                        disabled={loading}
                        className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-colors border border-slate-200 dark:border-slate-700 hover:border-[#630ed4] dark:hover:border-[#a975ff] hover:text-[#630ed4] flex items-center gap-2 uppercase tracking-widest"
                    >
                        {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        Sync Data
                    </button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {filterOptions.map((filter) => {
                        const count = getFilterCount(filter);
                        const isActive = activeFilter === filter;
                        return (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`text-left p-6 rounded-2xl shadow-sm border transition-all text-sm uppercase tracking-widest font-black ${isActive ? 'bg-[#630ed4] text-white border-[#630ed4] scale-100 shadow-xl shadow-primary/20' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 hover:border-[#630ed4]/50'}`}
                            >
                                <div className="text-3xl mb-2">{count}</div>
                                {filter} IPOs
                            </button>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {loading ? (
                        Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-slate-700 animate-pulse">
                                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4"></div>
                                <div className="h-20 bg-slate-100 dark:bg-slate-900 rounded w-full"></div>
                            </div>
                        ))
                    ) : filteredIpos.length === 0 ? (
                        <div className="col-span-full py-16 bg-white dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 rounded-3xl flex flex-col items-center justify-center text-center">
                            <AlertTriangle className="h-16 w-16 text-slate-300 dark:text-slate-600 mb-4" />
                            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase">No IPOs Found</h3>
                            <p className="text-slate-500 font-medium">Try checking a different filter.</p>
                        </div>
                    ) : (
                        filteredIpos.map((ipo, index) => (
                            <div key={index} className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700 hover:border-[#630ed4]/30 transition-colors group relative overflow-hidden">
                                <div className="flex justify-between items-start mb-8 relative z-10">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-tight mb-1">{ipo.company}</h3>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{ipo.sector} • {ipo.type}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${ipo.status.toLowerCase() === 'open' ? 'bg-green-500/10 text-green-600' : ipo.status.toLowerCase() === 'upcoming' ? 'bg-[#e9edff]-container-low dark:bg-[#630ed4]/20 text-[#630ed4] dark:text-[#a975ff]' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                                            {ipo.status}
                                        </span>
                                        <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${ipo.riskScore > 2.5 ? 'text-green-600' : ipo.riskScore > 1.5 ? 'text-yellow-600' : 'text-red-500'}`}>
                                            {ipo.riskIcon} {ipo.riskLevel} Risk
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-2xl relative z-10 border border-slate-100 dark:border-slate-700/50">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 whitespace-nowrap">Issue Size</p>
                                        <p className="font-black text-slate-800 dark:text-white whitespace-nowrap">{ipo.size}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 whitespace-nowrap">Price Band</p>
                                        <p className="font-black text-slate-800 dark:text-white whitespace-nowrap text-sm">{ipo.price}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 whitespace-nowrap">Min Lot</p>
                                        <p className="font-black text-slate-800 dark:text-white whitespace-nowrap">{ipo.lotSize}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 whitespace-nowrap">GMP</p>
                                        <p className={`font-black whitespace-nowrap ${ipo.gmp !== 'N/A' ? 'text-green-600' : 'text-slate-800 dark:text-white'}`}>{ipo.gmp}</p>
                                    </div>
                                </div>

                                <div className="text-xs font-bold text-slate-500 flex justify-between items-center bg-slate-50 dark:bg-slate-900 px-4 py-3 rounded-xl relative z-10">
                                    <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {ipo.date}</span>
                                    {ipo.listingDate !== 'TBA' && <span className="uppercase text-[10px] bg-white dark:bg-slate-800 px-2 py-1 rounded shadow-sm border border-slate-100 dark:border-slate-700">List: {ipo.listingDate}</span>}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-6 md:p-8 relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center relative z-10">
                        <AlertTriangle className="w-8 h-8 text-amber-500 shrink-0" />
                        <div>
                            <h4 className="font-black text-amber-600 uppercase tracking-widest text-sm mb-1">Educational Platform</h4>
                            <p className="text-amber-700/80 dark:text-amber-300/80 text-sm font-medium leading-relaxed">
                                Our risk assessments are educational tools based on fundamental factors. GMP data is unofficial and for reference only. Always consult a SEBI-registered financial advisor before investing. Past performance doesn't guarantee future results.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    )
}
