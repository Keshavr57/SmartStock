import React, { useState, useEffect } from 'react';
import { TrendingUp, Menu, X, Bot, MessageCircle, BarChart3 } from 'lucide-react';
import { MarketTable } from "@/components/MarketTable";
import { authService } from '../lib/auth';

// Google OAuth configuration
declare global {
    interface Window {
        google: any;
    }
}

interface LandingProps {
    onLogin: () => void;
}

const Landing: React.FC<LandingProps> = ({ onLogin }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showSignupModal, setShowSignupModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [googleLoading, setGoogleLoading] = useState(false);

    // Login form state
    const [loginForm, setLoginForm] = useState({
        email: '',
        password: ''
    });

    // Signup form state
    const [signupForm, setSignupForm] = useState({
        name: '',
        email: '',
        password: ''
    });

    useEffect(() => {
        // Load Google Sign-In script
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);

        script.onload = () => {
            if (window.google) {
                window.google.accounts.id.initialize({
                    client_id: '817549154886-k5r92c4grcvr5usdiqfjtib2se0uc5qv.apps.googleusercontent.com',
                    callback: handleGoogleSignIn,
                    auto_select: false,
                    cancel_on_tap_outside: true,
                    use_fedcm_for_prompt: false,
                    // Add allowed origins for development
                    allowed_parent_origin: ['http://localhost:5173', 'http://localhost:3000', 'https://smart-stock-ku3d.vercel.app']
                });
            }
        };

        return () => {
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }
        };
    }, []);

    const handleGoogleSignIn = async (response: any) => {
        setGoogleLoading(true);
        setError('');

        try {
            const result = await authService.googleLogin(response.credential);
            
            if (result.success) {
                setShowLoginModal(false);
                setShowSignupModal(false);
                onLogin();
            } else {
                setError(result.error || result.message || 'Google authentication failed');
            }
        } catch (error) {
            setError('Google authentication failed');
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleGoogleButtonClick = () => {
        if (window.google) {
            try {
                // Use the renderButton approach which is more reliable
                const buttonContainer = document.getElementById('google-signin-container');
                if (buttonContainer) {
                    buttonContainer.innerHTML = '';
                    window.google.accounts.id.renderButton(buttonContainer, {
                        theme: 'outline',
                        size: 'large',
                        width: '100%',
                        text: 'signin_with',
                        shape: 'rectangular'
                    });
                } else {
                    // Fallback to prompt
                    window.google.accounts.id.prompt();
                }
            } catch (error) {
                console.error('Google Sign-In error:', error);
                // Don't show error for Google OAuth issues, just hide the button
                setError('');
            }
        } else {
            // Don't show error for Google OAuth issues
            console.log('Google Sign-In not available');
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await authService.login(loginForm.email, loginForm.password);
            
            if (result.success) {
                setShowLoginModal(false);
                onLogin();
            } else {
                setError(result.error || result.message || 'Login failed');
            }
        } catch (error) {
            setError('Network error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (signupForm.password.length < 6) {
            setError('Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        try {
            const result = await authService.register(signupForm.name, signupForm.email, signupForm.password);
            
            if (result.success) {
                setShowSignupModal(false);
                onLogin();
            } else {
                setError(result.error || result.message || 'Registration failed');
            }
        } catch (error) {
            setError('Network error occurred');
        } finally {
            setLoading(false);
        }
    };

    const showLoginRequired = () => {
        alert('Please login to access this feature');
        setShowLoginModal(true);
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Navbar - Exactly like Figma */}
            <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                                <TrendingUp className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gray-900">SmartStock</span>
                        </div>

                        {/* Navigation Menu */}
                        <div className="hidden lg:flex items-center space-x-8">
                            <button className="text-gray-900 font-medium px-4 py-2 bg-gray-900 text-white rounded-lg">
                                Home
                            </button>
                            <button className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2">
                                Compare
                            </button>
                            <button className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2">
                                Crypto
                            </button>
                            <button className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2">
                                IPOs
                            </button>
                            <button 
                                onClick={showLoginRequired}
                                className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2"
                            >
                                AI Advisor
                            </button>
                            <button 
                                onClick={showLoginRequired}
                                className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2"
                            >
                                News
                            </button>
                            <button className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2">
                                Learn
                            </button>
                        </div>

                        {/* Connect Portfolio Button */}
                        <div className="hidden md:flex items-center space-x-4">
                            <button 
                                onClick={() => setShowLoginModal(true)}
                                className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2"
                            >
                                Login
                            </button>
                            <button 
                                onClick={() => setShowSignupModal(true)}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
                            >
                                Sign Up
                            </button>
                        </div>

                        {/* Mobile menu */}
                        <div className="lg:hidden">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="text-gray-600 hover:text-gray-900"
                            >
                                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    {isMenuOpen && (
                        <div className="lg:hidden border-t border-gray-100 py-4">
                            <div className="space-y-2">
                                <button className="block w-full text-left px-4 py-2 text-gray-900 font-medium">Home</button>
                                <button className="block w-full text-left px-4 py-2 text-gray-600">Compare</button>
                                <button className="block w-full text-left px-4 py-2 text-gray-600">Crypto</button>
                                <button className="block w-full text-left px-4 py-2 text-gray-600">IPOs</button>
                                <button onClick={showLoginRequired} className="block w-full text-left px-4 py-2 text-gray-600">AI Advisor</button>
                                <button onClick={showLoginRequired} className="block w-full text-left px-4 py-2 text-gray-600">News</button>
                                <button className="block w-full text-left px-4 py-2 text-gray-600">Learn</button>
                                <button 
                                    onClick={() => setShowLoginModal(true)}
                                    className="block w-full text-left px-4 py-2 text-gray-600"
                                >
                                    Login
                                </button>
                                <button 
                                    onClick={() => setShowSignupModal(true)}
                                    className="block w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
                                >
                                    Sign Up
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            {/* Hero Section - Fixed */}
            <section className="py-20 px-6 text-center">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
                        Learn Trading with
                    </h1>
                    <h2 className="text-5xl md:text-6xl font-bold mb-8">
                        <span className="text-blue-600">Smart AI Insights</span>
                    </h2>
                    <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
                        India's most comprehensive platform for virtual trading, stock analysis, and 
                        AI-powered investment learning. Practice with virtual money using real market data.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button 
                            onClick={() => setShowSignupModal(true)}
                            className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 font-semibold text-lg"
                        >
                            Start Learning Free
                        </button>
                        <button className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg hover:bg-gray-50 font-semibold text-lg">
                            Explore Demo
                        </button>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-16 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="text-center p-6 bg-gray-50 rounded-lg">
                            <div className="text-4xl mb-4">💰</div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Virtual Trading</h3>
                            <p className="text-gray-600 text-sm">Practice with ₹1,00,000 virtual money using real market data</p>
                        </div>
                        
                        <div className="text-center p-6 bg-gray-50 rounded-lg">
                            <div className="text-4xl mb-4">🎯</div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Stock Analysis</h3>
                            <p className="text-gray-600 text-sm">Compare stocks and get detailed analysis of Indian markets</p>
                        </div>
                        
                        <div className="text-center p-6 bg-gray-50 rounded-lg">
                            <div className="text-4xl mb-4">🧠</div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered Learning</h3>
                            <p className="text-gray-600 text-sm">Smart insights and educational recommendations</p>
                        </div>
                        
                        <div className="text-center p-6 bg-gray-50 rounded-lg">
                            <div className="text-4xl mb-4">📚</div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Educational Platform</h3>
                            <p className="text-gray-600 text-sm">Learn trading concepts with comprehensive resources</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Market Table Section */}
            <section className="py-16 px-6">
                <div className="max-w-6xl mx-auto">
                    <MarketTable />
                </div>
            </section>

            {/* Market Analytics Charts */}
            <section className="py-16 px-6 bg-gray-50">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Market Analytics</h2>
                        <p className="text-gray-600">Visualize market trends and make informed decisions with our comprehensive charts and analytics</p>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* S&P 500 Performance Chart */}
                        <div className="bg-white rounded-lg p-6 border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">S&P 500 Performance</h3>
                            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                                <div className="text-center">
                                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                    <p className="text-gray-500">Chart visualization</p>
                                    <p className="text-sm text-gray-400">Login to view live data</p>
                                </div>
                            </div>
                        </div>

                        {/* Crypto Market Trends */}
                        <div className="bg-white rounded-lg p-6 border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Crypto Market Trends</h3>
                            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                                <div className="text-center">
                                    <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                    <p className="text-gray-500">Chart visualization</p>
                                    <p className="text-sm text-gray-400">Login to view live data</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Live Market News */}
            <section className="py-16 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Live Market News</h2>
                        <p className="text-gray-600">Stay updated with the latest developments in Indian stock markets and global cryptocurrency news</p>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Indian Markets */}
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-semibold text-gray-900">Indian Markets</h3>
                                <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">NSE/BSE</span>
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100" onClick={showLoginRequired}>
                                    <div className="flex items-center space-x-2 mb-2">
                                        <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">Breaking</span>
                                        <span className="text-sm text-gray-500">2 hours ago</span>
                                    </div>
                                    <h4 className="font-semibold text-gray-900 mb-1">Reliance Industries Q3 Results: Profit Jumps 15% YoY</h4>
                                    <p className="text-gray-600 text-sm">RIL reports strong quarterly earnings driven by petrochemicals and retail segments...</p>
                                </div>
                                
                                <div className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100" onClick={showLoginRequired}>
                                    <div className="flex items-center space-x-2 mb-2">
                                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">Markets</span>
                                        <span className="text-sm text-gray-500">5 hours ago</span>
                                    </div>
                                    <h4 className="font-semibold text-gray-900 mb-1">Nifty 50 Hits New All-Time High as IT Stocks Rally</h4>
                                    <p className="text-gray-600 text-sm">Index crosses 22,000 mark for the first time led by TCS and Infosys gains...</p>
                                </div>
                            </div>
                        </div>

                        {/* Cryptocurrency */}
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-semibold text-gray-900">Cryptocurrency</h3>
                                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">Global</span>
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100" onClick={showLoginRequired}>
                                    <div className="flex items-center space-x-2 mb-2">
                                        <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">Regulation</span>
                                        <span className="text-sm text-gray-500">1 hour ago</span>
                                    </div>
                                    <h4 className="font-semibold text-gray-900 mb-1">Bitcoin ETF Approval Drives Indian Crypto Interest</h4>
                                    <p className="text-gray-600 text-sm">Global investors show increased interest following US Bitcoin ETF approvals...</p>
                                </div>
                                
                                <div className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100" onClick={showLoginRequired}>
                                    <div className="flex items-center space-x-2 mb-2">
                                        <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-bold">Technology</span>
                                        <span className="text-sm text-gray-500">3 hours ago</span>
                                    </div>
                                    <h4 className="font-semibold text-gray-900 mb-1">Ethereum Layer 2 Solutions Gain Traction in India</h4>
                                    <p className="text-gray-600 text-sm">Polygon and other L2 networks see rising adoption among Indian developers...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* AI Trading Advisor Preview */}
            <section className="py-16 px-6 bg-gray-50">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">AI Trading Advisor</h2>
                        <p className="text-gray-600">Get personalized investment insights and trading recommendations powered by AI</p>
                    </div>
                    
                    <div className="bg-white rounded-lg p-8 border border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-3">
                                <Bot className="h-8 w-8 text-blue-600" />
                                <span className="text-lg font-semibold text-gray-900">SmartStock AI</span>
                            </div>
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">Online</span>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <div className="flex items-start space-x-3">
                                <Bot className="h-6 w-6 text-blue-600 mt-1" />
                                <div>
                                    <p className="text-gray-900">Hello! I'm your AI trading assistant. I can help you analyze stocks, cryptocurrencies, and provide investment insights. What would you like to know?</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mb-6">
                            <p className="text-sm text-gray-600 mb-3">Suggested questions:</p>
                            <div className="flex flex-wrap gap-2">
                                <button onClick={showLoginRequired} className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm hover:bg-blue-200">What's the outlook for AAPL?</button>
                                <button onClick={showLoginRequired} className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm hover:bg-blue-200">Should I invest in Bitcoin?</button>
                                <button onClick={showLoginRequired} className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm hover:bg-blue-200">Analyze Tesla's performance</button>
                                <button onClick={showLoginRequired} className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm hover:bg-blue-200">Best IPOs this month?</button>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                            <input 
                                type="text" 
                                placeholder="Ask me about stocks, crypto, or trading strategies..."
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                onClick={showLoginRequired}
                                readOnly
                            />
                            <button 
                                onClick={showLoginRequired}
                                className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700"
                            >
                                <MessageCircle className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {/* Logo & Description */}
                        <div className="md:col-span-2">
                            <div className="flex items-center space-x-2 mb-4">
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                    <TrendingUp className="h-5 w-5 text-white" />
                                </div>
                                <span className="text-xl font-bold">SmartStock</span>
                            </div>
                            <p className="text-gray-400 mb-4 max-w-md">
                                Learn trading with virtual money and real market data. 
                                Educational platform for stock analysis and AI-powered insights.
                            </p>
                            <div className="flex space-x-4">
                                <button className="text-gray-400 hover:text-white">
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                                    </svg>
                                </button>
                                <button className="text-gray-400 hover:text-white">
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                                    </svg>
                                </button>
                                <button className="text-gray-400 hover:text-white">
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Platform</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li><button className="hover:text-white">Virtual Trading</button></li>
                                <li><button className="hover:text-white">Stock Analysis</button></li>
                                <li><button className="hover:text-white">AI Advisor</button></li>
                                <li><button className="hover:text-white">Learning Center</button></li>
                            </ul>
                        </div>

                        {/* Support */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Support</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li><button className="hover:text-white">Help Center</button></li>
                                <li><button className="hover:text-white">Contact Us</button></li>
                                <li><button className="hover:text-white">Privacy Policy</button></li>
                                <li><button className="hover:text-white">Terms of Service</button></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
                        <div className="text-gray-400 text-sm">
                            © 2025 SmartStock. All rights reserved. Educational trading platform.
                        </div>
                        <div className="text-gray-400 text-sm mt-4 md:mt-0">
                            Made with ❤️ for learning traders
                        </div>
                    </div>
                </div>
            </footer>

            {/* Login Modal */}
            {showLoginModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
                            <button 
                                onClick={() => {
                                    setShowLoginModal(false);
                                    setError('');
                                    setLoginForm({ email: '', password: '' });
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        
                        {error && (
                            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                                {error}
                            </div>
                        )}
                        
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <input 
                                    type="email" 
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Email address"
                                    value={loginForm.email}
                                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                                    autoComplete="email"
                                    required
                                />
                            </div>
                            <div>
                                <input 
                                    type="password" 
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Password"
                                    value={loginForm.password}
                                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                                    autoComplete="current-password"
                                    required
                                />
                            </div>
                            <button 
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Logging in...' : 'Login'}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="flex items-center my-4">
                            <div className="flex-1 border-t border-gray-300"></div>
                            <span className="px-4 text-gray-500 text-sm">or</span>
                            <div className="flex-1 border-t border-gray-300"></div>
                        </div>

                        {/* Google Login Button */}
                        <div id="google-signin-container" className="w-full">
                            <button 
                                type="button"
                                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={handleGoogleButtonClick}
                                disabled={googleLoading}
                            >
                                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                                {googleLoading ? 'Signing in...' : 'Continue with Google'}
                            </button>
                        </div>
                        
                        <p className="text-center text-gray-600 mt-4">
                            New to SmartStock? 
                            <button 
                                onClick={() => {
                                    setShowLoginModal(false);
                                    setShowSignupModal(true);
                                    setError('');
                                }}
                                className="text-blue-600 hover:underline ml-1"
                            >
                                Sign up free
                            </button>
                        </p>
                    </div>
                </div>
            )}

            {/* Signup Modal */}
            {showSignupModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
                            <button 
                                onClick={() => {
                                    setShowSignupModal(false);
                                    setError('');
                                    setSignupForm({ name: '', email: '', password: '' });
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        
                        {error && (
                            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                                {error}
                            </div>
                        )}
                        
                        <form onSubmit={handleSignup} className="space-y-4">
                            <div>
                                <input 
                                    type="text" 
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Full name"
                                    value={signupForm.name}
                                    onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                                    autoComplete="name"
                                    required
                                />
                            </div>
                            <div>
                                <input 
                                    type="email" 
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Email address"
                                    value={signupForm.email}
                                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                                    autoComplete="email"
                                    required
                                />
                            </div>
                            <div>
                                <input 
                                    type="password" 
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Create password (min 6 characters)"
                                    value={signupForm.password}
                                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                                    autoComplete="new-password"
                                    required
                                    minLength={6}
                                />
                            </div>
                            <button 
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Creating Account...' : 'Create Account'}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="flex items-center my-4">
                            <div className="flex-1 border-t border-gray-300"></div>
                            <span className="px-4 text-gray-500 text-sm">or</span>
                            <div className="flex-1 border-t border-gray-300"></div>
                        </div>

                        {/* Google Signup Button */}
                        <div id="google-signup-container" className="w-full">
                            <button 
                                type="button"
                                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={handleGoogleButtonClick}
                                disabled={googleLoading}
                            >
                                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                                {googleLoading ? 'Signing up...' : 'Sign up with Google'}
                            </button>
                        </div>
                        
                        <p className="text-center text-gray-600 mt-4">
                            Already have an account? 
                            <button 
                                onClick={() => {
                                    setShowSignupModal(false);
                                    setShowLoginModal(true);
                                    setError('');
                                }}
                                className="text-blue-600 hover:underline ml-1"
                            >
                                Login
                            </button>
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Landing;