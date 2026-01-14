import { TrendingUp, Facebook, Twitter, Github, Linkedin, Mail, Phone } from "lucide-react"

interface FooterProps {
    onPageChange?: (page: string) => void;
}

export function Footer({ onPageChange }: FooterProps) {
    const handleNavigation = (page: string) => {
        if (onPageChange) {
            onPageChange(page);
        }
    };

    return (
        <footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 pt-8 pb-6 px-4 mt-auto">
            <div className="container mx-auto max-w-6xl">
                <div className="grid md:grid-cols-4 gap-8 mb-8">
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center space-x-2 mb-4">
                            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-r from-purple-600 to-purple-600">
                                <TrendingUp className="h-4 w-4 text-white" />
                            </div>
                            <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-white">SmartStock</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                            India's premier AI-powered virtual trading platform. Practice trading with real market data and learn investment strategies risk-free.
                        </p>
                        
                        {/* Newsletter Signup */}
                        <div className="mb-4">
                            <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Stay Updated</h5>
                            <div className="flex gap-2">
                                <input 
                                    type="email" 
                                    placeholder="Enter your email"
                                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                />
                                <button 
                                    onClick={() => alert('Thank you for your interest! Newsletter feature coming soon.')}
                                    className="px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
                                >
                                    Subscribe
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-purple-500 transition-colors">
                                <Twitter className="h-4 w-4" />
                            </a>
                            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                                <Github className="h-4 w-4" />
                            </a>
                            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-purple-600 transition-colors">
                                <Linkedin className="h-4 w-4" />
                            </a>
                            <a href="mailto:support@smartstock.com" className="text-gray-500 hover:text-green-600 transition-colors">
                                <Mail className="h-4 w-4" />
                            </a>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">Trading Features</h4>
                        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            <li>
                                <button 
                                    onClick={() => handleNavigation('VirtualTrading')} 
                                    className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-left"
                                >
                                    Virtual Trading
                                </button>
                            </li>
                            <li>
                                <button 
                                    onClick={() => handleNavigation('Portfolio')} 
                                    className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-left"
                                >
                                    Portfolio Tracker
                                </button>
                            </li>
                            <li>
                                <button 
                                    onClick={() => handleNavigation('Compare')} 
                                    className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-left"
                                >
                                    Stock Comparison
                                </button>
                            </li>
                            <li>
                                <button 
                                    onClick={() => handleNavigation('IPOs')} 
                                    className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-left"
                                >
                                    IPO Analysis
                                </button>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">Resources</h4>
                        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            <li>
                                <button 
                                    onClick={() => handleNavigation('AI Advisors')} 
                                    className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-left"
                                >
                                    AI Trading Advisor
                                </button>
                            </li>
                            <li>
                                <button 
                                    onClick={() => handleNavigation('Learn')} 
                                    className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-left"
                                >
                                    Learning Center
                                </button>
                            </li>
                            <li>
                                <button 
                                    onClick={() => handleNavigation('News')} 
                                    className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-left"
                                >
                                    Market News
                                </button>
                            </li>
                            <li>
                                <a href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                                    Trading Guide
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">Support</h4>
                        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            <li>
                                <a 
                                    href="#help" 
                                    className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        alert('Help Center: Contact us at support@smartstock.com for assistance with virtual trading, account setup, or technical issues.');
                                    }}
                                >
                                    Help Center
                                </a>
                            </li>
                            <li>
                                <a 
                                    href="mailto:support@smartstock.com" 
                                    className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                                >
                                    Contact Us
                                </a>
                            </li>
                            <li>
                                <a 
                                    href="#privacy" 
                                    className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        alert('Privacy Policy: We protect your data and use it only for educational trading simulation. No real financial information is stored.');
                                    }}
                                >
                                    Privacy Policy
                                </a>
                            </li>
                            <li>
                                <a 
                                    href="#terms" 
                                    className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        alert('Terms of Service: This is an educational platform for virtual trading. No real money is involved. Use responsibly for learning purposes.');
                                    }}
                                >
                                    Terms of Service
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <p>© 2025 SmartStock India. All rights reserved.</p>
                    <div className="flex items-center gap-4">
                        <p className="text-center md:text-right">
                            Virtual trading platform for educational purposes. No real money involved.
                        </p>
                        <button 
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="flex items-center gap-1 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
                            aria-label="Scroll to top"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                            <span className="text-xs">Top</span>
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    )
}
