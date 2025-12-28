import { TrendingUp, Facebook, Twitter, Github, Linkedin } from "lucide-react"

export function Footer() {
    return (
        <footer className="border-t bg-muted/30 pt-16 pb-8 px-4">
            <div className="container mx-auto">
                <div className="grid md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center space-x-2 mb-6">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg premium-gradient">
                                <TrendingUp className="h-5 w-5 text-white" />
                            </div>
                            <span className="font-bold text-xl tracking-tight">SmartStock</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            India's premier AI-powered trading companion. We provide
                            institutional-grade data for the modern retail investor.
                        </p>
                        <div className="flex items-center gap-4 mt-6">
                            {[Twitter, Github, Facebook, Linkedin].map((Icon, i) => (
                                <a key={i} href="#" className="text-muted-foreground hover:text-primary transition-colors">
                                    <Icon className="h-5 w-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold mb-6">Market Segments</h4>
                        <ul className="space-y-4 text-sm text-muted-foreground">
                            <li><a href="#" className="hover:text-primary">NSE/BSE Indian Stocks</a></li>
                            <li><a href="#" className="hover:text-primary">Global Cryptocurrency</a></li>
                            <li><a href="#" className="hover:text-primary">Mutual Funds</a></li>
                            <li><a href="#" className="hover:text-primary">IPO Calendar</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold mb-6">Resources</h4>
                        <ul className="space-y-4 text-sm text-muted-foreground">
                            <li><a href="#" className="hover:text-primary">AI Trading Advisor</a></li>
                            <li><a href="#" className="hover:text-primary">Portfolio Tracker</a></li>
                            <li><a href="#" className="hover:text-primary">API Documentation</a></li>
                            <li><a href="#" className="hover:text-primary">Trading Academy</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold mb-6">Legal</h4>
                        <ul className="space-y-4 text-sm text-muted-foreground">
                            <li><a href="#" className="hover:text-primary">Terms of Service</a></li>
                            <li><a href="#" className="hover:text-primary">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-primary">Disclaimer</a></li>
                            <li><a href="#" className="hover:text-primary">Cookie Settings</a></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                    <p>© 2025 SmartStock India. All rights reserved.</p>
                    <p>Trading involves risk. Always consult with a financial advisor.</p>
                </div>
            </div>
        </footer>
    )
}
