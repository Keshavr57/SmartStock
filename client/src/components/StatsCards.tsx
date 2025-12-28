import { Card, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./ui/button"

import { getMarketHighlights } from "@/lib/api"
import { useState, useEffect } from "react"

export function StatsCards() {
    const [stockStats, setStockStats] = useState<any[]>([])
    const [cryptoStats, setCryptoStats] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await getMarketHighlights()
                if (res.status === "success" && res.data) {
                    const stocks = Array.isArray(res.data.stocks) ? res.data.stocks : []
                    const crypto = Array.isArray(res.data.crypto) ? res.data.crypto : []

                    setStockStats(stocks.map((s: any) => ({
                        symbol: s.symbol,
                        price: s.price ? `₹${s.price}` : 'N/A',
                        change: s.change !== undefined ? `${s.change > 0 ? '+' : ''}${s.change}%` : '0%',
                        up: s.change > 0
                    })))
                    setCryptoStats(crypto.map((c: any) => ({
                        symbol: c.symbol,
                        price: c.price ? `$${c.price.toLocaleString()}` : 'N/A',
                        change: c.change !== undefined ? `${c.change > 0 ? '+' : ''}${c.change.toFixed(2)}%` : '0%',
                        up: c.change > 0
                    })))
                }
            } catch (error) {
                console.error("Failed to fetch market highlights:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    if (loading) return (
        <div className="py-12 px-4 container mx-auto text-center">
            <p className="text-muted-foreground animate-pulse">Loading market data...</p>
        </div>
    )

    return (
        <section className="py-12 px-4 container mx-auto">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold tracking-tight">Market Highlights</h2>
                <Button variant="ghost" className="gap-2 text-primary">
                    View all markets <ArrowRight className="h-4 w-4" />
                </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-10">
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="font-semibold text-lg">Indian Stocks</span>
                        <Badge variant="success">NSE Live</Badge>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {stockStats.map((s) => (
                            <StatItem key={s.symbol} {...s} />
                        ))}
                    </div>
                </div>

                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="font-semibold text-lg">Cryptocurrency</span>
                        <Badge variant="warning">Global 24h</Badge>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {cryptoStats.map((s) => (
                            <StatItem key={s.symbol} {...s} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

interface StatItemProps {
    symbol: string
    price: string
    change: string
    up: boolean
}

function StatItem({ symbol, price, change, up }: StatItemProps) {
    return (
        <Card className="hover:scale-[1.02] transition-transform">
            <CardContent className="p-4 flex justify-between items-center">
                <div>
                    <p className="font-bold text-sm tracking-widest text-muted-foreground">{symbol}</p>
                    <p className="text-lg font-semibold mt-1">{price}</p>
                </div>
                <div className={cn(
                    "flex flex-col items-end gap-1",
                    up ? "text-emerald-500" : "text-red-500"
                )}>
                    {up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    <span className="text-sm font-medium">{change}</span>
                </div>
            </CardContent>
        </Card>
    )
}

