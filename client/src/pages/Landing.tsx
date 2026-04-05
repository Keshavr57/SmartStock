import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Menu, X, Bot, MessageCircle, BarChart3, BookOpen } from 'lucide-react';
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
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);








    const showLoginRequired = () => {
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-[#f9f9ff] text-[#141b2b]">
            <style>
                {`
                .dot-pattern {
                    background-image: radial-gradient(#7c3aed 0.5px, transparent 0.5px);
                    background-size: 24px 24px;
                    opacity: 0.05;
                }
                .material-symbols-outlined {
                    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
                }
                `}
            </style>
            {/*  Top Navigation Bar  */}
            <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-none">
            <nav className="flex justify-between items-center w-full px-8 py-4 max-w-7xl mx-auto">
            <div className="text-xl font-bold text-[#141b2b] dark:text-white font-headline tracking-tight">SmartStock</div>
            <div className="hidden md:flex gap-8 items-center font-['Plus_Jakarta_Sans'] font-medium text-sm">
            <a className="text-[#7c3aed] font-bold border-b-2 border-[#7c3aed] pb-1 transition-all" href="#">Home</a>
            <button className="text-[#4a4455] dark:text-slate-400 hover:text-[#7c3aed] transition-colors duration-200" onClick={showLoginRequired}>Compare</button>
            <button className="text-[#4a4455] dark:text-slate-400 hover:text-[#7c3aed] transition-colors duration-200" onClick={showLoginRequired}>IPOs</button>
            <button className="text-[#4a4455] dark:text-slate-400 hover:text-[#7c3aed] transition-colors duration-200" onClick={showLoginRequired}>AI Advisor</button>
            <button className="text-[#4a4455] dark:text-slate-400 hover:text-[#7c3aed] transition-colors duration-200" onClick={showLoginRequired}>News</button>
            <button className="text-[#4a4455] dark:text-slate-400 hover:text-[#7c3aed] transition-colors duration-200" onClick={showLoginRequired}>Learn</button>
            </div>
            <div className="flex items-center gap-4">
            <button className="text-[#4a4455] dark:text-slate-400 font-medium text-sm hover:text-[#7c3aed] transition-colors" onClick={() => navigate('/login')}>Login</button>
            <button className="bg-[#630ed4] hover:bg-[#630ed4]-container text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all scale-95 active:opacity-80" onClick={() => navigate('/signup')}>Sign Up</button>
            </div>
            </nav>
            </header>
            <main>
            {/*  Hero Section  */}
            <section className="relative min-h-[870px] flex items-center overflow-hidden bg-white">
            <div className="absolute inset-0 dot-pattern"></div>
            <div className="max-w-7xl mx-auto px-8 w-full grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10 py-12 md:py-20">
            <div className="flex flex-col justify-center space-y-8">
            <h1 className="text-5xl md:text-7xl font-bold font-headline leading-[1.1] text-[#141b2b]">
                                    Learn Trading. <br/> Invest Smarter. <br/> <span className="text-[#630ed4]">Grow Wealth.</span>
            </h1>
            <p className="text-[#141b2b]-variant text-lg md:text-xl max-w-xl leading-relaxed">
                                    Master the Indian stock market with real-time simulations, AI-driven insights, and a community of professional curators.
                                </p>
            <div className="flex flex-wrap gap-4">
            <button className="bg-[#630ed4] text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all flex items-center gap-2 group">
                                        Start Free Trial
                                        <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
            <button className="bg-[#e9edff]-high text-[#630ed4] px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#e9edff] transition-all">
                                        Watch Demo
                                    </button>
            </div>
            <div className="flex flex-wrap gap-3 pt-4">
            <span className="bg-[#6ffbbe] text-[#005236] px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">verified</span> 500k+ Active Traders
                                    </span>
            <span className="bg-[#eaddff] text-[#5a00c6] px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">auto_awesome</span> AI-First Platform
                                    </span>
            <span className="bg-[#a20017]-fixed text-[#ffffff]-fixed-variant px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">military_tech</span> #1 Ranked Learning
                                    </span>
            </div>
            </div>
            <div className="relative flex items-center justify-center">
            {/*  Floating Cards Wrapper  */}
            <div className="relative w-full max-w-md">
            {/*  RELIANCE.NS Card  */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-[#ccc3d8]/10 relative z-20 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
            <div className="flex justify-between items-start mb-6">
            <div>
            <h3 className="font-bold text-xl font-headline">RELIANCE.NS</h3>
            <p className="text-xs text-[#141b2b]-variant font-medium">Reliance Industries Ltd.</p>
            </div>
            <span className="bg-[#6cf8bb] text-[#00714d] px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">trending_up</span> +2.45%
                                            </span>
            </div>
            <div className="flex items-end gap-4 mb-6">
            <span className="text-4xl font-bold font-headline">₹2,945.10</span>
            <span className="text-[#006c49] font-bold text-sm mb-1">+₹70.20 Today</span>
            </div>
            <div className="h-24 w-full bg-[#e9edff]-low rounded-lg overflow-hidden flex items-end">
            <svg className="w-full h-full" viewBox="0 0 400 100">
            <path d="M0,80 Q50,75 100,60 T200,40 T300,50 T400,20" fill="none" stroke="#006c49" strokeWidth="3"></path>
            <path d="M0,80 Q50,75 100,60 T200,40 T300,50 T400,20 V100 H0 Z" fill="url(#grad1)" opacity="0.1"></path>
            <defs>
            <linearGradient id="grad1" x1="0%" x2="0%" y1="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#006c49', stopOpacity: 1 }}></stop>
            <stop offset="100%" style={{ stopColor: '#006c49', stopOpacity: 0 }}></stop>
            </linearGradient>
            </defs>
            </svg>
            </div>
            </div>
            {/*  Portfolio Card  */}
            <div className="absolute -bottom-10 -right-4 md:-right-10 bg-[#630ed4]-container text-white p-6 rounded-2xl shadow-2xl z-30 transform rotate-6 hover:rotate-0 transition-transform duration-500 w-64">
            <p className="text-xs font-medium opacity-80 uppercase tracking-widest mb-1">Portfolio Balance</p>
            <h4 className="text-2xl font-bold mb-4">₹12,45,000.00</h4>
            <div className="flex justify-between items-center bg-white/10 rounded-xl p-3">
            <div className="text-center">
            <p className="text-[10px] opacity-70">Day Gain</p>
            <p className="text-xs font-bold">+₹14.2k</p>
            </div>
            <div className="h-8 w-px bg-white/20"></div>
            <div className="text-center">
            <p className="text-[10px] opacity-70">Wins</p>
            <p className="text-xs font-bold">12/14</p>
            </div>
            </div>
            </div>
            {/*  Decorative circle  */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#630ed4]/10 rounded-full blur-3xl -z-10"></div>
            <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-[#006c49]/10 rounded-full blur-3xl -z-10"></div>
            </div>
            </div>
            </div>
            </section>
            {/*  Feature Cards  */}
            <section className="py-24 max-w-7xl mx-auto px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/*  Virtual Trading  */}
            <div className="group bg-white border border-[#ccc3d8]/10 rounded-2xl p-8 hover:shadow-xl hover:-translate-y-2 hover:border-[#630ed4]/30 transition-all duration-300">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white mb-6">
            <span className="material-symbols-outlined" data-icon="account_balance_wallet" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
            </div>
            <h3 className="text-xl font-bold font-headline mb-3">Virtual Trading</h3>
            <p className="text-[#141b2b]-variant text-sm mb-6 leading-relaxed">Practice with ₹1Cr virtual cash without risking real capital.</p>
            <button className="text-[#630ed4] font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all" onClick={showLoginRequired}>
            Explore <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
            </div>
            {/*  Stock Analysis  */}
            <div className="group bg-white border border-[#ccc3d8]/10 rounded-2xl p-8 hover:shadow-xl hover:-translate-y-2 hover:border-[#630ed4]/30 transition-all duration-300">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center text-white mb-6">
            <span className="material-symbols-outlined" data-icon="analytics" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
            </div>
            <h3 className="text-xl font-bold font-headline mb-3">Stock Analysis</h3>
            <p className="text-[#141b2b]-variant text-sm mb-6 leading-relaxed">Deep fundamental and technical data for 5000+ NSE/BSE stocks.</p>
            <button className="text-[#630ed4] font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all" onClick={showLoginRequired}>
            Explore <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
            </div>
            {/*  AI-Powered Learning  */}
            <div className="group bg-white border border-[#ccc3d8]/10 rounded-2xl p-8 hover:shadow-xl hover:-translate-y-2 hover:border-[#630ed4]/30 transition-all duration-300">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white mb-6">
            <span className="material-symbols-outlined" data-icon="psychology" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
            </div>
            <h3 className="text-xl font-bold font-headline mb-3">AI Learning</h3>
            <p className="text-[#141b2b]-variant text-sm mb-6 leading-relaxed">Personalized paths powered by our proprietary FinSage AI engine.</p>
            <button className="text-[#630ed4] font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all" onClick={showLoginRequired}>
            Explore <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
            </div>
            {/*  Educational Platform  */}
            <div className="group bg-white border border-[#ccc3d8]/10 rounded-2xl p-8 hover:shadow-xl hover:-translate-y-2 hover:border-[#630ed4]/30 transition-all duration-300">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white mb-6">
            <span className="material-symbols-outlined" data-icon="school" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
            </div>
            <h3 className="text-xl font-bold font-headline mb-3">Education</h3>
            <p className="text-[#141b2b]-variant text-sm mb-6 leading-relaxed">Curated courses from market veterans and financial analysts.</p>
            <button className="text-[#630ed4] font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all" onClick={showLoginRequired}>
            Explore <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
            </div>
            </div>
            </section>
            {/*  Live Market Pulse  */}
            <section className="py-24 bg-[#e9edff]-low">
            <div className="max-w-7xl mx-auto px-8">
            <div className="text-center mb-16">
            <h2 className="text-4xl font-bold font-headline mb-4">Live Market Pulse</h2>
            <p className="text-[#141b2b]-variant max-w-2xl mx-auto">Real-time data from Indian and Global exchanges to keep you ahead of the curve.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            {/*  Indian Stocks  */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold font-headline">Trending Indian Stocks</h3>
            <span className="text-xs font-bold text-[#630ed4] uppercase">NSE/BSE</span>
            </div>
            <div className="space-y-6">
            {/*  Stock Item  */}
            <div className="flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#e9edff]-high flex items-center justify-center font-bold text-[#630ed4]">R</div>
            <div>
            <p className="font-bold">RELIANCE</p>
            <p className="text-[10px] text-[#141b2b]-variant">Energy &amp; Retail</p>
            </div>
            </div>
            <div className="flex-1 px-8 hidden md:block">
            <svg className="h-8 w-32" viewBox="0 0 100 20">
            <path d="M0,15 Q25,10 50,15 T100,5" fill="none" stroke="#006c49" strokeWidth="1.5"></path>
            </svg>
            </div>
            <div className="text-right">
            <p className="font-bold">₹2,945.10</p>
            <p className="text-[#006c49] text-xs font-bold">+2.45%</p>
            </div>
            </div>
            {/*  Stock Item  */}
            <div className="flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#e9edff]-high flex items-center justify-center font-bold text-[#630ed4]">T</div>
            <div>
            <p className="font-bold">TCS</p>
            <p className="text-[10px] text-[#141b2b]-variant">IT Services</p>
            </div>
            </div>
            <div className="flex-1 px-8 hidden md:block">
            <svg className="h-8 w-32" viewBox="0 0 100 20">
            <path d="M0,5 Q25,15 50,10 T100,18" fill="none" stroke="#a20017" strokeWidth="1.5"></path>
            </svg>
            </div>
            <div className="text-right">
            <p className="font-bold">₹3,822.40</p>
            <p className="text-[#a20017] text-xs font-bold">-0.12%</p>
            </div>
            </div>
            {/*  Stock Item  */}
            <div className="flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#e9edff]-high flex items-center justify-center font-bold text-[#630ed4]">H</div>
            <div>
            <p className="font-bold">HDFCBANK</p>
            <p className="text-[10px] text-[#141b2b]-variant">Banking</p>
            </div>
            </div>
            <div className="flex-1 px-8 hidden md:block">
            <svg className="h-8 w-32" viewBox="0 0 100 20">
            <path d="M0,18 L20,12 L40,15 L60,8 L80,10 L100,2" fill="none" stroke="#006c49" strokeWidth="1.5"></path>
            </svg>
            </div>
            <div className="text-right">
            <p className="font-bold">₹1,442.85</p>
            <p className="text-[#006c49] text-xs font-bold">+1.88%</p>
            </div>
            </div>
            </div>
            </div>
            {/*  Global Markets  */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold font-headline">Global Indices</h3>
            <span className="text-xs font-bold text-[#141b2b]-variant uppercase">Real-time</span>
            </div>
            <div className="grid grid-cols-2 gap-6">
            <div className="p-4 rounded-xl bg-[#e9edff]-low">
            <p className="text-xs font-bold text-[#141b2b]-variant mb-1 uppercase">S&amp;P 500</p>
            <p className="text-xl font-bold">5,248.50</p>
            <p className="text-[#006c49] text-xs font-bold">+0.56%</p>
            </div>
            <div className="p-4 rounded-xl bg-[#e9edff]-low">
            <p className="text-xs font-bold text-[#141b2b]-variant mb-1 uppercase">NASDAQ</p>
            <p className="text-xl font-bold">16,380.20</p>
            <p className="text-[#006c49] text-xs font-bold">+1.12%</p>
            </div>
            <div className="p-4 rounded-xl bg-[#e9edff]-low">
            <p className="text-xs font-bold text-[#141b2b]-variant mb-1 uppercase">DOW JONES</p>
            <p className="text-xl font-bold">39,280.10</p>
            <p className="text-[#a20017] text-xs font-bold">-0.05%</p>
            </div>
            <div className="p-4 rounded-xl bg-[#e9edff]-low">
            <p className="text-xs font-bold text-[#141b2b]-variant mb-1 uppercase">FTSE 100</p>
            <p className="text-xl font-bold">7,935.00</p>
            <p className="text-[#006c49] text-xs font-bold">+0.33%</p>
            </div>
            </div>
            </div>
            </div>
            {/*  Performance Cards  */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-6 border border-[#ccc3d8]/10 flex items-center justify-between gap-6">
            <div>
            <p className="text-sm font-bold text-[#141b2b]-variant mb-2">NIFTY 50</p>
            <h4 className="text-2xl font-bold font-headline mb-1">22,326.90</h4>
            <span className="text-[#006c49] font-bold text-sm">+0.85% (Past Week)</span>
            </div>
            <div className="flex-1 h-16 max-w-[200px]">
            <svg className="w-full h-full" viewBox="0 0 200 60">
            <polyline fill="none" points="0,50 40,45 80,30 120,35 160,15 200,10" stroke="#006c49" strokeWidth="3" />
            </svg>
            </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-[#ccc3d8]/10 flex items-center justify-between gap-6">
            <div>
            <p className="text-sm font-bold text-[#141b2b]-variant mb-2">S&amp;P 500</p>
            <h4 className="text-2xl font-bold font-headline mb-1">5,248.50</h4>
            <span className="text-[#006c49] font-bold text-sm">+1.24% (Past Week)</span>
            </div>
            <div className="flex-1 h-16 max-w-[200px]">
            <svg className="w-full h-full" viewBox="0 0 200 60">
            <polyline fill="none" points="0,40 40,42 80,25 120,28 160,10 200,5" stroke="#006c49" strokeWidth="3" />
            </svg>
            </div>
            </div>
            </div>
            </div>
            </section>
            {/*  Live Market News  */}
            <section className="py-24 max-w-7xl mx-auto px-8">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <div>
            <h2 className="text-4xl font-bold font-headline mb-2">Market Intelligence</h2>
            <p className="text-[#141b2b]-variant">Stay updated with signals that actually move the needle.</p>
            </div>
            <button className="text-[#630ed4] font-bold flex items-center gap-1 hover:underline underline-offset-4">
                                View All News <span className="material-symbols-outlined text-sm">arrow_right_alt</span>
            </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/*  News Column 1  */}
            <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border-l-4 border-[#a20017] shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between mb-3">
            <span className="text-[10px] font-bold text-[#a20017] uppercase tracking-tighter bg-[#a20017]/10 px-2 py-0.5 rounded">Breaking News</span>
            <span className="text-[10px] font-medium text-[#141b2b]-variant">10 Min Ago</span>
            </div>
            <h4 className="text-lg font-bold mb-3 leading-tight">RBI maintains repo rate at 6.5%, signals hawkish stance on inflation.</h4>
            <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[8px] text-white font-bold">ET</div>
            <span className="text-xs font-medium text-[#141b2b]-variant">Economic Times</span>
            </div>
            </div>
            <div className="bg-white p-6 rounded-xl border-l-4 border-[#630ed4] shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between mb-3">
            <span className="text-[10px] font-bold text-[#630ed4] uppercase tracking-tighter bg-[#630ed4]/10 px-2 py-0.5 rounded">Markets</span>
            <span className="text-[10px] font-medium text-[#141b2b]-variant">1 Hour Ago</span>
            </div>
            <h4 className="text-lg font-bold mb-3 leading-tight">Nifty IT index drops 2% as global tech giants forecast lower growth.</h4>
            <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-orange-600 flex items-center justify-center text-[8px] text-white font-bold">B</div>
            <span className="text-xs font-medium text-[#141b2b]-variant">Bloomberg Quint</span>
            </div>
            </div>
            </div>
            {/*  News Column 2  */}
            <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border-l-4 border-[#630ed4] shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between mb-3">
            <span className="text-[10px] font-bold text-[#630ed4] uppercase tracking-tighter bg-[#630ed4]/10 px-2 py-0.5 rounded">Markets</span>
            <span className="text-[10px] font-medium text-[#141b2b]-variant">3 Hours Ago</span>
            </div>
            <h4 className="text-lg font-bold mb-3 leading-tight">Zomato hits all-time high as analysts upgrade price target to ₹250.</h4>
            <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-blue-800 flex items-center justify-center text-[8px] text-white font-bold">MC</div>
            <span className="text-xs font-medium text-[#141b2b]-variant">MoneyControl</span>
            </div>
            </div>
            <div className="bg-white p-6 rounded-xl border-l-4 border-[#630ed4] shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between mb-3">
            <span className="text-[10px] font-bold text-[#630ed4] uppercase tracking-tighter bg-[#630ed4]/10 px-2 py-0.5 rounded">Analysis</span>
            <span className="text-[10px] font-medium text-[#141b2b]-variant">5 Hours Ago</span>
            </div>
            <h4 className="text-lg font-bold mb-3 leading-tight">Top 5 IPOs to watch out for in Q3 2024: From Fintech to Infrastructure.</h4>
            <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[8px] text-white font-bold">SM</div>
            <span className="text-xs font-medium text-[#141b2b]-variant">SmartStock Insights</span>
            </div>
            </div>
            </div>
            </div>
            </section>
            {/*  AI Advisor Feature Showcase  */}
            <section className="py-24 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
            <div className="inline-block bg-[#630ed4]/10 text-[#630ed4] px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Powered by FinSage AI</div>
            <h2 className="text-4xl md:text-5xl font-bold font-headline leading-tight">Your Personal <br/> Quantitative Analyst.</h2>
            <p className="text-[#141b2b]-variant text-lg">FinSage scans millions of data points across global markets to provide actionable clarity in plain English.</p>
            <ul className="space-y-4">
            <li className="flex items-center gap-3 font-medium">
            <span className="material-symbols-outlined text-[#006c49]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                        Real-time technical analysis on any stock ticker.
                                    </li>
            <li className="flex items-center gap-3 font-medium">
            <span className="material-symbols-outlined text-[#006c49]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                        IPO risk assessment &amp; subscription probability.
                                    </li>
            <li className="flex items-center gap-3 font-medium">
            <span className="material-symbols-outlined text-[#006c49]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                        Portfolio rebalancing alerts based on market volatility.
                                    </li>
            <li className="flex items-center gap-3 font-medium">
            <span className="material-symbols-outlined text-[#006c49]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                        Macro-economic impact summaries in 30 seconds.
                                    </li>
            </ul>
            <button className="bg-[#630ed4] text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all flex items-center gap-2">
                                    Try FinSage Free <span className="material-symbols-outlined">auto_awesome</span>
            </button>
            </div>
            <div className="relative">
            {/*  AI Chat UI Preview  */}
            <div className="bg-[#e9edff]-low rounded-3xl p-4 md:p-8 shadow-2xl relative z-10 border border-[#ccc3d8]/10">
            <div className="flex items-center gap-4 mb-8 border-b border-[#ccc3d8]/20 pb-4">
            <div className="w-12 h-12 rounded-full bg-[#630ed4] flex items-center justify-center text-white">
            <span className="material-symbols-outlined">smart_toy</span>
            </div>
            <div>
            <h4 className="font-bold">FinSage Advisor</h4>
            <span className="text-[10px] text-[#006c49] font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#006c49]"></span> Online &amp; Analyzing
                                            </span>
            </div>
            </div>
            <div className="space-y-6">
            <div className="flex gap-3 max-w-[85%]">
            <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm text-sm leading-relaxed">
                                                "Is HDFCBANK a good buy right now for a 6-month horizon?"
                                            </div>
            </div>
            <div className="flex flex-row-reverse gap-3 ml-auto max-w-[85%]">
            <div className="bg-[#630ed4] text-white p-4 rounded-2xl rounded-tr-none shadow-sm text-sm leading-relaxed">
                                                "HDFCBANK is currently testing a major support level at ₹1,430. Technical indicators (RSI: 42) suggest it's approaching oversold territory. Fundamentals remain strong with 18% YoY credit growth. Risk: Moderate. Recommendation: Accumulate in tranches."
                                            </div>
            </div>
            <div className="flex gap-3">
            <div className="flex gap-2">
            <span className="w-2 h-2 rounded-full bg-[#630ed4]/40"></span>
            <span className="w-2 h-2 rounded-full bg-[#630ed4]/40"></span>
            <span className="w-2 h-2 rounded-full bg-[#630ed4]/40"></span>
            </div>
            </div>
            </div>
            </div>
            {/*  Decorative Elements  */}
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-[#630ed4]/10 rounded-full blur-3xl -z-10"></div>
            </div>
            </div>
            </section>
            {/*  CTA Banner  */}
            <section className="py-20 max-w-7xl mx-auto px-8">
            <div className="bg-[#630ed4] rounded-[2rem] p-12 md:p-20 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
            <div className="relative z-10 space-y-8">
            <h2 className="text-4xl md:text-6xl font-bold font-headline text-white max-w-4xl mx-auto leading-tight">Start Your Trading Journey Today</h2>
            <p className="text-white/80 text-xl max-w-2xl mx-auto">Join over 500,000 Indians who are learning to grow their wealth the smart way.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="bg-white text-[#630ed4] px-10 py-5 rounded-2xl font-bold text-xl hover:bg-opacity-90 transition-all shadow-lg" onClick={() => navigate('/signup')}>Get Started Now</button>
            <button className="bg-transparent border-2 border-white/30 text-white px-10 py-5 rounded-2xl font-bold text-xl hover:bg-white/10 transition-all">Download App</button>
            </div>
            </div>
            </div>
            </section>
            </main>
            {/*  Footer  */}
            <footer className="bg-[#09090f] text-white pt-20 pb-10">
            <div className="max-w-7xl mx-auto px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
            <div className="space-y-6">
            <div className="text-2xl font-bold text-[#630ed4] font-headline">SmartStock</div>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">Curating financial clarity for the next generation of Indian investors. Experience the market like never before.</p>
            <div className="flex gap-4">
            <a className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#630ed4] transition-colors" href="#">
            <img alt="X" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD5yV_QoHFHSiJ5pXSl8Vy_ARuHYiZBeaFtSLeTi9Tvn3CrbfRYmYQDgdaPZXLlKdfPamOvMSU_uXIsgCIvKMpsCDqrfdv5i45A8Cw7HWiNOeaniRnMhcIoyyF6V_E1sUTHX0g1Qz6PWzXstP5pqOmNNcyTpWHByPfaYnNDbqw4NL57jLV_tnzjHR9iEXm_-EzEwUnMplzBhA-vBeGIIGencDA8iq5pj5fa86DLQm4DBxZWLKfWX2PsbZ_5LunNMksxime7Egfvu7ls"/>
            </a>
            <a className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#630ed4] transition-colors" href="#">
            <img alt="LinkedIn" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuASEvsVMrw96mIwrLx6ypHcrD3tmIGgZz_J2fmeFJYqYeuPxy1yiGdSLLt5ovPDetHP3db5k1FxhW1b4uAaZOXvXKbDZVHs7yY2HkjKQBWIEZrG0xQcGKqonaRiuSsu7Xbiasy19F30jpuRQggpUQ0D_PuuDJBHIvX6g6-9y71eALaCZLCUzmh4mdyd4qH3oH-As9v35Y2v-QIhvTz2gdPR85mVO5x2-9uBaip3JNFV6lWiDh5H5QI4AHbaogfceg6OVEDtuHfmkvkq"/>
            </a>
            <a className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#630ed4] transition-colors" href="#">
            <img alt="Instagram" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDz-fHmXfMDtijho_PEBvY94sdz2cw_ASF9QQ08j79IrEiA3nOg7a5pTwdqTVrKm7GhVyhqMXHDsO12-bjvMcng1FKgncNDHY8l4EccVhWpmO57zh1stp5g2hTNztJaKO7parfcwvp2jeCI5B3ot_0hLPguWjlcFxus6utHb5PoCqTjzi-OBsLcxB8Un95ckzOEkpdX0Lc-QrYb32rrazwFbCI5SMjm3WM5bvkziskAe2mXvEji-AOr9k2CXzat32Opo7-HtL35v0Kj"/>
            </a>
            </div>
            </div>
            <div>
            <h5 className="font-bold mb-6 text-white uppercase text-xs tracking-widest">Platform</h5>
            <ul className="space-y-4 text-sm text-white/50">
            <li><a className="hover:text-[#630ed4] transition-colors" href="#">Virtual Trading</a></li>
            <li><a className="hover:text-[#630ed4] transition-colors" href="#">Stock Screener</a></li>
            <li><button className="hover:text-[#630ed4] transition-colors" onClick={showLoginRequired}>AI Advisor</button></li>
            <li><a className="hover:text-[#630ed4] transition-colors" href="#">Learning Hub</a></li>
            </ul>
            </div>
            <div>
            <h5 className="font-bold mb-6 text-white uppercase text-xs tracking-widest">Resources</h5>
            <ul className="space-y-4 text-sm text-white/50">
            <li><a className="hover:text-[#630ed4] transition-colors" href="#">Market News</a></li>
            <li><a className="hover:text-[#630ed4] transition-colors" href="#">IPO Watchlist</a></li>
            <li><a className="hover:text-[#630ed4] transition-colors" href="#">Educational Guides</a></li>
            <li><a className="hover:text-[#630ed4] transition-colors" href="#">Community Forum</a></li>
            </ul>
            </div>
            <div>
            <h5 className="font-bold mb-6 text-white uppercase text-xs tracking-widest">Legal</h5>
            <ul className="space-y-4 text-sm text-white/50">
            <li><a className="hover:text-[#630ed4] transition-colors" href="#">Privacy Policy</a></li>
            <li><a className="hover:text-[#630ed4] transition-colors" href="#">Terms of Service</a></li>
            <li><a className="hover:text-[#630ed4] transition-colors" href="#">Risk Disclosure</a></li>
            <li><a className="hover:text-[#630ed4] transition-colors" href="#">Contact Us</a></li>
            </ul>
            </div>
            </div>
            <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-white/40 text-xs">
            <div>© 2024 SmartStock. Curating financial clarity.</div>
            <div className="flex items-center gap-1 font-medium">
                                Made with <span className="material-symbols-outlined text-[#a20017] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span> for India
                            </div>
            </div>
            </div>
            </footer>

                    </div>
    );
};

export default Landing;
