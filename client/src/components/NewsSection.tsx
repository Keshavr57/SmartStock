import { useState, useEffect } from "react"
import { getTrendingNews } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Clock, Newspaper } from "lucide-react"

export function NewsSection() {
    const [news, setNews] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const res = await getTrendingNews()
                if (res.status === "success") {
                    setNews(res.data)
                }
            } catch (error) {
                console.error("Failed to fetch news:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchNews()
    }, [])

    if (loading) {
        return (
            <div className="py-12 px-4 container mx-auto">
                <div className="h-48 flex items-center justify-center bg-muted/20 rounded-2xl animate-pulse">
                    <p className="text-muted-foreground">Loading latest market news...</p>
                </div>
            </div>
        )
    }

    return (
        <section className="py-12 px-4 container mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl premium-gradient flex items-center justify-center text-white">
                        <Newspaper className="h-6 w-6" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight">Market News</h2>
                </div>
                <Badge variant="outline" className="px-3 py-1">Live Updates</Badge>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {news.map((item, index) => (
                    <Card key={index} className="group hover:border-primary/50 transition-all duration-300 border-muted/50 overflow-hidden flex flex-col">
                        <CardHeader className="pb-3 flex-1">
                            <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground">
                                <span className="px-2 py-0.5 rounded-full bg-primary/5 text-primary font-medium">
                                    {item.source}
                                </span>
                                <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {new Date(item.date).toLocaleDateString()}
                                </div>
                            </div>
                            <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                                {item.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline group/link"
                            >
                                Read Full Story
                                <ExternalLink className="h-4 w-4 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                            </a>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>
    )
}
