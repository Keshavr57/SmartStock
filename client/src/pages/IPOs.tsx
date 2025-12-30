import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, RefreshCw, Calendar, DollarSign, AlertTriangle } from "lucide-react"
import { useState, useEffect } from "react"
import { getUpcomingIPOs } from "@/lib/api"

export default function IPOs() {
    const [ipos, setIpos] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchIPOs = async () => {
        setLoading(true)
        try {
            const res = await getUpcomingIPOs()
            if (res && res.status === "success" && Array.isArray(res.data)) {
                const mappedData = res.data.map((item: any) => ({
                    company: item.name || "Unknown Company",
                    date: item.openDate && item.closeDate ? `${item.openDate} - ${item.closeDate}` : (item.openDate || "TBA"),
                    price: item.priceBand || "TBA",
                    status: item.status || "Upcoming",
                    size: item.issueSize || "TBA",
                    riskLevel: item.riskLevel || "Medium",
                    riskIcon: item.riskIcon || "🟡",
                    lotSize: item.lotSize || "TBA"
                }))
                setIpos(mappedData)
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

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        IPO Calendar
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Track upcoming Indian IPOs with risk analysis
                    </p>
                </div>

                {/* Risk Guide */}
                <Card className="mb-6">
                    <CardContent className="p-4">
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
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={fetchIPOs}
                                disabled={loading}
                                className="ml-auto"
                            >
                                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                Refresh
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* IPO Grid */}
                {loading ? (
                    <div className="text-center py-12">
                        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-500">Loading IPO data...</p>
                    </div>
                ) : ipos.length === 0 ? (
                    <div className="text-center py-12">
                        <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-500">No IPOs available at the moment</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {ipos.map((ipo, index) => (
                            <Card key={index} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <TrendingUp className="h-6 w-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                                                    {ipo.company}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    Lot Size: {ipo.lotSize}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-6">
                                            <div className="text-center">
                                                <div className="flex items-center gap-1 text-sm text-gray-500 mb-1">
                                                    <Calendar className="h-4 w-4" />
                                                    Date
                                                </div>
                                                <p className="font-medium">{ipo.date}</p>
                                            </div>
                                            
                                            <div className="text-center">
                                                <div className="flex items-center gap-1 text-sm text-gray-500 mb-1">
                                                    <DollarSign className="h-4 w-4" />
                                                    Price
                                                </div>
                                                <p className="font-medium">{ipo.price}</p>
                                            </div>
                                            
                                            <div className="text-center">
                                                <div className="flex items-center gap-1 text-sm text-gray-500 mb-1">
                                                    <AlertTriangle className="h-4 w-4" />
                                                    Risk
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">{ipo.riskIcon}</span>
                                                    <Badge
                                                        variant={
                                                            ipo.riskLevel === "Low" ? "default" : 
                                                            ipo.riskLevel === "Medium" ? "secondary" : 
                                                            "destructive"
                                                        }
                                                    >
                                                        {ipo.riskLevel}
                                                    </Badge>
                                                </div>
                                            </div>
                                            
                                            <Badge
                                                variant={ipo.status === "Open" ? "default" : "secondary"}
                                                className={ipo.status === "Open" ? "bg-green-100 text-green-800" : ""}
                                            >
                                                {ipo.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Educational Note */}
                <Card className="mt-8 bg-amber-50 border-amber-200">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-amber-800 mb-1">Educational Platform</h3>
                                <p className="text-sm text-amber-700">
                                    This is for educational purposes only. Always do your own research and consult financial advisors before investing in IPOs.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
