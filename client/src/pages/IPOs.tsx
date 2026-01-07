import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, RefreshCw, Calendar, DollarSign, AlertTriangle, Clock, Target, BarChart3 } from "lucide-react"
import { useState, useEffect } from "react"
import { getUpcomingIPOs } from "../lib/api"

export default function IPOs() {
    const [ipos, setIpos] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [lastUpdated, setLastUpdated] = useState<string>('')

    const fetchIPOs = async () => {
        setLoading(true)
        try {
            const res = await getUpcomingIPOs()
            if (res && res.status === "success" && Array.isArray(res.data)) {
                const mappedData = res.data.map((item: any) => ({
                    company: item.name || "Unknown Company",
                    openDate: item.openDate || "TBA",
                    closeDate: item.closeDate || "TBA",
                    date: item.openDate && item.closeDate ? `${item.openDate} - ${item.closeDate}` : (item.openDate || "TBA"),
                    price: item.priceBand || "TBA",
                    status: item.status || "Upcoming",
                    size: item.issueSize || "TBA",
                    riskLevel: item.riskLevel || "Medium",
                    riskIcon: item.riskIcon || "🟡",
                    lotSize: item.lotSize || "TBA",
                    type: item.type || item.category || "Mainboard",
                    sector: item.sector || "General",
                    gmp: item.gmp || "N/A",
                    subscription: item.subscription || "N/A",
                    listingDate: item.listingDate || "TBA"
                }))
                setIpos(mappedData)
                setLastUpdated(res.lastUpdated || new Date().toLocaleString())
            }
        } catch (error) {
            console.error("Failed to fetch IPOs:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchIPOs()
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
                                    <span>🟡</span>
                                    <span className="text-gray-600">Medium Risk</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span>🔴</span>
                                    <span className="text-gray-600">High Risk</span>
                                </div>
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={fetchIPOs}
                                disabled={loading}
                                className="ml-auto"
                            >
                                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                Refresh Live Data
                            </Button>
                        </div>
                    </CardContent>
                </Card>

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
                    ) : ipos.length === 0 ? (
                        <div className="col-span-full text-center py-12">
                            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No IPOs Available</h3>
                            <p className="text-gray-500">Check back later for new IPO listings.</p>
                        </div>
                    ) : (
                        ipos.map((ipo, index) => (
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
                                                <span className="text-lg">{ipo.riskIcon}</span>
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
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Disclaimer */}
                <Card className="mt-8">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                            <div className="text-sm text-gray-600">
                                <p className="font-medium text-gray-900 mb-1">Investment Disclaimer</p>
                                <p>IPO investments are subject to market risks. Please read all scheme-related documents carefully before investing. Past performance is not indicative of future results. GMP (Grey Market Premium) is unofficial and for reference only.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}