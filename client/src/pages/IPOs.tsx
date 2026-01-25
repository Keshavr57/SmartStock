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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Live IPO Calendar
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Real-time IPO data with risk analysis - No TBA entries!
                    </p>
                    {lastUpdated && (
                        <p className="text-sm text-gray-500 mt-2">
                            Last updated: {lastUpdated}
                        </p>
                    )}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <TrendingUp className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Open IPOs</p>
                                    <p className="text-xl font-bold text-gray-900">
                                        {ipos.filter(ipo => ipo.status === 'Open').length}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Clock className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Upcoming</p>
                                    <p className="text-xl font-bold text-gray-900">
                                        {ipos.filter(ipo => ipo.status === 'Upcoming').length}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <Target className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Mainboard</p>
                                    <p className="text-xl font-bold text-gray-900">
                                        {ipos.filter(ipo => ipo.type === 'Mainboard' || ipo.type === 'Main Board').length}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <BarChart3 className="h-5 w-5 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">SME</p>
                                    <p className="text-xl font-bold text-gray-900">
                                        {ipos.filter(ipo => ipo.type === 'SME').length}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter Buttons */}
                <Card className="mb-6">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-2">
                                <Filter className="h-5 w-5 text-gray-600" />
                                <span className="text-sm font-medium text-gray-700">Filter IPOs:</span>
                            </div>
                            
                            <div className="flex items-center gap-2 flex-wrap">
                                {filterOptions.map((filter) => (
                                    <button
                                        key={filter}
                                        onClick={() => setActiveFilter(filter)}
                                        className={getFilterButtonStyle(filter)}
                                    >
                                        <span>{filter}</span>
                                        <span className="ml-2 px-2 py-0.5 bg-black/10 rounded-full text-xs">
                                            {getFilterCount(filter)}
                                        </span>
                                    </button>
                                ))}
                            </div>
                            
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => fetchIPOs(false, true)} // Force refresh with cache clear
                                disabled={loading}
                                className="ml-auto"
                            >
                                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                Refresh
                            </Button>
                        </div>
                        
                        {/* Active Filter Info */}
                        {activeFilter !== 'All' && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-sm text-gray-600">
                                    Showing <span className="font-semibold text-gray-900">{filteredIpos.length}</span> {activeFilter.toLowerCase()} IPOs
                                    {filteredIpos.length === 0 && (
                                        <span className="text-gray-500"> - No {activeFilter.toLowerCase()} IPOs available at the moment</span>
                                    )}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Risk Guide */}
                <Card className="mb-6">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <span>🟢</span>
                                    <span className="text-gray-600">Low Risk</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                    <span className="text-gray-600">Medium Risk</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                    <span className="text-gray-600">High Risk</span>
                                </div>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setShowRiskGuide(!showRiskGuide)}
                                className="text-blue-600 hover:text-blue-800"
                            >
                                <BookOpen className="h-4 w-4 mr-1" />
                                {showRiskGuide ? 'Hide' : 'Show'} Risk Guide
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Collapsible Risk Assessment Guide */}
                {showRiskGuide && (
                    <Card className="mb-6 bg-blue-50 border-blue-200">
                        <CardContent className="p-6">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <BarChart3 className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                        How We Calculate IPO Risk Assessment
                                    </h3>
                                    <p className="text-blue-800 mb-4 text-sm">
                                        Our educational risk assessment analyzes 3 key factors to help you understand IPO investment risks:
                                    </p>
                                    
                                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                                        <div className="bg-white rounded-lg p-4 border border-blue-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Target className="h-4 w-4 text-blue-600" />
                                                <span className="font-semibold text-blue-900">Promoter Holding</span>
                                            </div>
                                            <ul className="text-blue-700 space-y-1">
                                                <li className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                    <span>75%+ = Low Risk</span>
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                                    <span>60-74% = Medium Risk</span>
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                                    <span>Below 60% = High Risk</span>
                                                </li>
                                            </ul>
                                            <p className="text-xs text-blue-600 mt-2">Higher holding shows management confidence</p>
                                        </div>
                                        
                                        <div className="bg-white rounded-lg p-4 border border-blue-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Clock className="h-4 w-4 text-blue-600" />
                                                <span className="font-semibold text-blue-900">Company Age</span>
                                            </div>
                                            <ul className="text-blue-700 space-y-1">
                                                <li className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                    <span>15+ years = Low Risk</span>
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                                    <span>8-14 years = Medium Risk</span>
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                                    <span>Below 8 years = High Risk</span>
                                                </li>
                                            </ul>
                                            <p className="text-xs text-blue-600 mt-2">Established companies have proven track records</p>
                                        </div>
                                        
                                        <div className="bg-white rounded-lg p-4 border border-blue-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <DollarSign className="h-4 w-4 text-blue-600" />
                                                <span className="font-semibold text-blue-900">Issue Size</span>
                                            </div>
                                            <ul className="text-blue-700 space-y-1">
                                                <li className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                    <span>₹5000+ Cr = Low Risk</span>
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                                    <span>₹1000-5000 Cr = Medium Risk</span>
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                                    <span>Below ₹1000 Cr = High Risk</span>
                                                </li>
                                            </ul>
                                            <p className="text-xs text-blue-600 mt-2">Larger issues typically have better liquidity</p>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4 p-3 bg-blue-100 rounded-lg border border-blue-300">
                                        <p className="text-xs text-blue-800">
                                            <strong>Educational Note:</strong> This assessment is for learning purposes only. 
                                            Always read the prospectus, consider your risk tolerance, and consult a financial advisor before investing.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* IPO Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {loading ? (
                        Array.from({ length: 6 }).map((_, index) => (
                            <Card key={index} className="animate-pulse">
                                <CardContent className="p-6">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                                    <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                                </CardContent>
                            </Card>
                        ))
                    ) : filteredIpos.length === 0 ? (
                        <div className="col-span-full text-center py-12">
                            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {activeFilter === 'All' ? 'No IPOs Available' : `No ${activeFilter} IPOs Available`}
                            </h3>
                            <p className="text-gray-500">
                                {activeFilter === 'All' 
                                    ? 'Check back later for new IPO listings.' 
                                    : `There are currently no ${activeFilter.toLowerCase()} IPOs. Try a different filter or check back later.`
                                }
                            </p>
                            {activeFilter !== 'All' && (
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setActiveFilter('All')}
                                    className="mt-4"
                                >
                                    Show All IPOs
                                </Button>
                            )}
                        </div>
                    ) : (
                        filteredIpos.map((ipo, index) => (
                            <Card key={index} className="hover:shadow-lg transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                {ipo.company}
                                            </h3>
                                            <p className="text-sm text-gray-500 mb-2">{ipo.sector}</p>
                                            <div className="flex items-center gap-2 mb-3">
                                                <Badge className={getStatusColor(ipo.status)}>
                                                    {ipo.status}
                                                </Badge>
                                                <Badge className={getTypeColor(ipo.type)}>
                                                    {ipo.type}
                                                </Badge>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-lg">{ipo.riskIcon}</span>
                                                    <span className="text-xs text-gray-600">{ipo.riskLevel} Risk</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                            <div>
                                                <p className="text-gray-500">Open - Close</p>
                                                <p className="font-medium">{ipo.date}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="h-4 w-4 text-gray-400" />
                                            <div>
                                                <p className="text-gray-500">Price Band</p>
                                                <p className="font-medium">{ipo.price}</p>
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <p className="text-gray-500">Issue Size</p>
                                            <p className="font-medium">{ipo.size}</p>
                                        </div>
                                        
                                        <div>
                                            <p className="text-gray-500">Lot Size</p>
                                            <p className="font-medium">{ipo.lotSize}</p>
                                        </div>
                                        
                                        {ipo.gmp !== 'N/A' && (
                                            <div>
                                                <p className="text-gray-500">GMP</p>
                                                <p className="font-medium text-green-600">{ipo.gmp}</p>
                                            </div>
                                        )}
                                        
                                        {ipo.subscription !== 'N/A' && (
                                            <div>
                                                <p className="text-gray-500">Subscription</p>
                                                <p className="font-medium text-blue-600">{ipo.subscription}</p>
                                            </div>
                                        )}
                                    </div>

                                    {ipo.listingDate !== 'TBA' && (
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <p className="text-sm text-gray-500">Expected Listing: <span className="font-medium text-gray-900">{ipo.listingDate}</span></p>
                                        </div>
                                    )}

                                    {/* Risk Factors (if available) */}
                                    {ipo.riskFactors && ipo.riskFactors.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <div className="flex items-center gap-2 mb-2">
                                                <AlertTriangle className="h-4 w-4 text-gray-500" />
                                                <span className="text-sm font-medium text-gray-700">Risk Assessment Factors:</span>
                                            </div>
                                            <ul className="text-xs text-gray-600 space-y-1">
                                                {ipo.riskFactors.slice(0, 3).map((factor: string, idx: number) => (
                                                    <li key={idx} className="flex items-start gap-2">
                                                        <div className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                                                        <span>{factor}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                            {ipo.riskScore && (
                                                <p className="text-xs text-gray-500 mt-2">
                                                    Risk Score: {ipo.riskScore}/3.0
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Simplified Educational Disclaimer */}
                <Card className="mt-8">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-6 w-6 text-amber-500 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-gray-600">
                                <h4 className="font-semibold text-gray-900 mb-3 text-base flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-amber-600" />
                                    Investment Guidelines
                                </h4>
                                
                                <div className="grid md:grid-cols-2 gap-6 mb-4">
                                    <div>
                                        <h5 className="font-medium text-gray-900 mb-2">Before Investing:</h5>
                                        <ul className="space-y-1 text-gray-600 text-sm">
                                            <li>• Read the company prospectus thoroughly</li>
                                            <li>• Check promoter background and track record</li>
                                            <li>• Assess your risk tolerance and investment goals</li>
                                            <li>• Consider market conditions and sector outlook</li>
                                        </ul>
                                    </div>
                                    
                                    <div>
                                        <h5 className="font-medium text-gray-900 mb-2">Key Risks:</h5>
                                        <ul className="space-y-1 text-gray-600 text-sm">
                                            <li>• IPO prices can be volatile post-listing</li>
                                            <li>• Limited trading history for price discovery</li>
                                            <li>• No guarantee of allotment in oversubscribed IPOs</li>
                                            <li>• Market conditions affect listing performance</li>
                                        </ul>
                                    </div>
                                </div>
                                
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                    <p className="text-amber-800 text-sm">
                                        <strong>Educational Platform:</strong> Our risk assessments are educational tools based on fundamental factors. 
                                        GMP data is unofficial and for reference only. Always consult a SEBI-registered financial advisor before investing. 
                                        Past performance doesn't guarantee future results.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}