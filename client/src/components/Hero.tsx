import { Button } from "./ui/button"
import { IndianRupee, Globe, Brain, Clock } from "lucide-react"

const features = [
    {
        icon: IndianRupee,
        title: "Indian Markets (NSE/BSE)",
        desc: "Real-time data from National and Bombay Stock Exchanges"
    },
    {
        icon: Globe,
        title: "Global Crypto Markets",
        desc: "Track Bitcoin, Ethereum, and emerging cryptocurrencies"
    },
    {
        icon: Brain,
        title: "AI-Powered Insights",
        desc: "Smart analysis and personalized investment recommendations"
    },
    {
        icon: Clock,
        title: "Portfolio Management",
        desc: "Connect and manage your investments in one place"
    }
]

export function Hero() {
    return (
        <section className="min-h-screen bg-white py-16 px-4">
            <div className="container mx-auto max-w-6xl">
                <div className="text-center mb-20">
                    <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
                        Connect Your Portfolio to <br />
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Grow with Smart AI
                        </span>
                    </h1>

                    <p className="mx-auto max-w-3xl text-lg text-gray-600 mb-10 leading-relaxed">
                        India's most comprehensive platform for stock analysis, cryptocurrency tracking, and 
                        AI-powered investment insights. Make smarter decisions with real-time NSE/BSE data 
                        and global market intelligence.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button size="lg" className="h-12 px-8 text-base font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                            Connect Portfolio Now
                        </Button>
                        <Button size="lg" variant="outline" className="h-12 px-8 text-base font-medium border-gray-300 hover:bg-gray-50 rounded-lg">
                            Explore Demo
                        </Button>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((f, i) => (
                        <div key={i} className="text-center">
                            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                                <f.icon className="h-8 w-8 text-gray-800" strokeWidth={1.5} />
                            </div>
                            <h3 className="font-semibold text-base mb-2 text-gray-900">{f.title}</h3>
                            <p className="text-sm text-gray-600 leading-relaxed px-2">
                                {f.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}