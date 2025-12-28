import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { Globe, Shield, Zap } from "lucide-react"

const features = [
    {
        icon: Globe,
        title: "Global Markets",
        desc: "NSE/BSE and Global Crypto at your fingertips."
    },
    {
        icon: Zap,
        title: "Instant Alerts",
        desc: "Never miss a move with real-time price triggers."
    },
    {
        icon: Shield,
        title: "AI Security",
        desc: "Enterprise-grade analysis with smart risk metrics."
    }
]

export function Hero() {
    return (
        <section className="relative overflow-hidden py-20 px-4">
            {/* Background blobs for depth */}
            <div className="absolute top-0 left-1/2 -z-10 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-[120px]" />
            <div className="absolute bottom-0 right-0 -z-10 h-[300px] w-[300px] rounded-full bg-violet-500/10 blur-[100px]" />

            <div className="container mx-auto text-center">
                <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 mb-6 text-sm font-medium">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Indian Market Live: Nifty 21,750 (+0.8%)
                </div>

                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
                    Invest Smarter with <br />
                    <span className="gradient-text">AI Intelligence</span>
                </h1>

                <p className="mx-auto max-w-2xl text-lg text-muted-foreground mb-10">
                    The all-in-one platform for modern traders. Analyze stocks, track crypto,
                    and get AI-powered insights to grow your wealth with precision.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                    <Button size="lg" variant="premium" className="h-12 px-8 text-md">
                        Start Trading Now
                    </Button>
                    <Button size="lg" variant="outline" className="h-12 px-8 text-md">
                        View Market Demo
                    </Button>
                </div>

                <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {features.map((f, i) => (
                        <Card key={i} className="glass border-none shadow-none text-left">
                            <CardContent className="pt-6">
                                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                    <f.icon className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {f.desc}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    )
}
