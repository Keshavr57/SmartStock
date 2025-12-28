import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TrendingUp, ArrowUpRight, Info } from "lucide-react"
import { useState, useEffect } from "react"
import { getUpcomingIPOs } from "@/lib/api"

export default function IPOs() {
    const [ipos, setIpos] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchIPOs = async () => {
        setLoading(true)
        try {
            console.log("🔍 Fetching IPO data from:", `http://localhost:5050/api/ipo/upcoming?t=${Date.now()}`)
            const res = await getUpcomingIPOs()
            console.log("📊 Raw IPO response:", res)
            console.log("📊 Response status:", res?.status)
            console.log("📊 Response data type:", typeof res?.data)
            console.log("📊 Response data length:", res?.data?.length)
            
            if (res && res.status === "success" && Array.isArray(res.data)) {
                console.log("✅ Processing", res.data.length, "IPOs")
                const mappedData = res.data.map((item: any, index: number) => {
                    console.log(`📈 Processing IPO ${index + 1}:`, item.name, {
                        openDate: item.openDate,
                        closeDate: item.closeDate,
                        priceBand: item.priceBand,
                        riskLevel: item.riskLevel,
                        riskIcon: item.riskIcon
                    })
                    return {
                        company: item.name || "Unknown Company",
                        date: item.openDate && item.closeDate ? `${item.openDate} - ${item.closeDate}` : (item.openDate || "TBA"),
                        price: item.priceBand || "TBA",
                        status: item.status || "Upcoming",
                        type: item.type || "Mainboard",
                        size: item.issueSize || "TBA",
                        riskLevel: item.riskLevel || "Unknown",
                        riskIcon: item.riskIcon || "⚪",
                        promoterHolding: item.promoterHolding || "N/A",
                        companyAge: item.companyAge || "N/A",
                        profitHistory: item.profitHistory || "N/A",
                        lotSize: item.lotSize || "TBA"
                    }
                })
                console.log("✅ Final mapped IPO data:", mappedData)
                setIpos(mappedData)
            } else {
                console.error("❌ Unexpected IPO data format:", res)
                console.error("❌ Expected: {status: 'success', data: Array}, Got:", {
                    status: res?.status,
                    dataType: typeof res?.data,
                    isArray: Array.isArray(res?.data)
                })
            }
        } catch (error) {
            console.error("❌ Failed to fetch IPOs:", error)
            if (error instanceof Error) {
                console.error("❌ Error message:", error.message)
                console.error("❌ Error stack:", error.stack)
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchIPOs()
    }, [])

    const handleRefresh = () => {
        fetchIPOs()
    }
    return (
        <div className="p-6 container mx-auto space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-extrabold tracking-tight">IPO Calendar</h1>
                <p className="text-muted-foreground text-lg">Track latest and upcoming Indian IPOs with detailed analysis.</p>
                <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                    Debug: {ipos.length} IPOs loaded • Loading: {loading ? "Yes" : "No"} • Last fetch: {new Date().toLocaleTimeString()}
                </div>
            </div>

            {loading ? (
                <div className="py-20 text-center">
                    <p className="text-muted-foreground animate-pulse">Fetching latest IPO data...</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
                        <CardContent className="p-4 flex items-start gap-3">
                            <Info className="h-5 w-5 text-amber-600 mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-1">Educational Platform</h3>
                                <p className="text-sm text-amber-700 dark:text-amber-300">
                                    This is an educational platform, not investment tips. Risk assessments are based on promoter holding, company age, and profit history. Always do your own research and consult financial advisors.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
                        <CardContent className="p-4">
                            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Risk Level Guide</h3>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">🟢</span>
                                    <span className="text-blue-700 dark:text-blue-300">Low Risk: High promoter holding, established company, consistent profits</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">🟡</span>
                                    <span className="text-blue-700 dark:text-blue-300">Medium Risk: Moderate fundamentals, growing company</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">🔴</span>
                                    <span className="text-blue-700 dark:text-blue-300">High Risk: Low promoter holding, young company, losses</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm overflow-hidden">
                        <CardHeader className="bg-muted/30 pb-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl">Mainboard IPOs</CardTitle>
                                <Button variant="outline" size="sm" className="gap-2" onClick={handleRefresh} disabled={loading}>
                                    {loading ? "Loading..." : "Refresh"} <TrendingUp className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => {
                                    console.log("🧪 Manual test - Current IPOs:", ipos);
                                    console.log("🧪 Manual test - Loading state:", loading);
                                    alert(`IPOs loaded: ${ipos.length}, Loading: ${loading}`);
                                }}>
                                    Debug
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-muted/50">
                                        <TableHead className="w-[250px]">Company Name</TableHead>
                                        <TableHead>Offer Date</TableHead>
                                        <TableHead>Price Range</TableHead>
                                        <TableHead>Risk Level</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {ipos.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                {loading ? "Loading IPO data..." : "No IPO data available. Click Refresh to try again."}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        ipos.map((ipo) => (
                                        <TableRow key={ipo.company} className="group border-muted/30">
                                            <TableCell className="font-semibold py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                        {ipo.company[0]}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold">{ipo.company}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            Lot: {ipo.lotSize} • Age: {ipo.companyAge}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{ipo.date}</TableCell>
                                            <TableCell className="font-medium">{ipo.price}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">{ipo.riskIcon}</span>
                                                    <Badge
                                                        variant={
                                                            ipo.riskLevel === "Low" ? "default" : 
                                                            ipo.riskLevel === "Medium" ? "secondary" : 
                                                            ipo.riskLevel === "High" ? "destructive" : "outline"
                                                        }
                                                        className={`font-medium ${
                                                            ipo.riskLevel === "Low" ? "bg-green-100 text-green-800 hover:bg-green-100" :
                                                            ipo.riskLevel === "Medium" ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" :
                                                            ipo.riskLevel === "High" ? "bg-red-100 text-red-800 hover:bg-red-100" : ""
                                                        }`}
                                                    >
                                                        {ipo.riskLevel}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={ipo.status === "Open" ? "default" : "secondary"}
                                                    className={`font-medium ${
                                                        ipo.status === "Open" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""
                                                    }`}
                                                >
                                                    {ipo.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Details <ArrowUpRight className="ml-2 h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6 flex items-start gap-4">
                    <Info className="h-6 w-6 text-primary mt-1" />
                    <div>
                        <h3 className="font-bold text-lg mb-1">How to apply?</h3>
                        <p className="text-sm text-muted-foreground">
                            You can apply for these IPOs using your existing broker like Zerodha, Upstox, or Groww via ASBA or UPI.
                            Our AI advisor can help you decide which IPOs are worth your investment.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
