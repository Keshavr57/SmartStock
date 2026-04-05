import { useState, useEffect } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom"
import { Navbar } from "@/components/Navbar"
import { Sidebar } from "@/components/Sidebar"
import Home from "@/pages/Home"
import Compare from "@/pages/Compare"
import IPOs from "@/pages/IPOs"
import Learn from "@/pages/ComprehensiveLearn"
import AIAdvisor from "@/pages/AIAdvisor"
import News from "@/pages/News"
import VirtualTrading from "@/pages/VirtualTrading"
import Portfolio from "@/pages/Portfolio"
import Landing from "@/pages/Landing"
import Login from "@/pages/Login"
import Signup from "@/pages/Signup"
import { Footer } from "@/components/Footer"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { authService } from "./lib/auth"

// Main App Content Component (inside Router)
function AppContent() {
    const [isDark, setIsDark] = useState(false)
    const [showSidebar, setShowSidebar] = useState(true)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [loading, setLoading] = useState(true)
    const location = useLocation()
    const navigate = useNavigate()

    // Get current page from URL
    const getCurrentPage = () => {
        const path = location.pathname
        switch (path) {
            case '/':
            case '/home':
                return 'Home'
            case '/compare':
                return 'Compare'
            case '/ipos':
                return 'IPOs'
            case '/learn':
                return 'Learn'
            case '/ai-advisor':
                return 'AI Advisors'
            case '/news':
                return 'News'
            case '/virtual-trading':
                return 'VirtualTrading'
            case '/portfolio':
                return 'Portfolio'
            default:
                return 'Home'
        }
    }

    const currentPage = getCurrentPage()

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add("dark")
        } else {
            document.documentElement.classList.remove("dark")
        }
    }, [isDark])

    // Check authentication status on app load
    useEffect(() => {
        const checkAuth = () => {
            setLoading(true)
            
            if (authService.isAuthenticated()) {
                setIsAuthenticated(true)
            } else {
                setIsAuthenticated(false)
            }
            
            setLoading(false)
        }

        checkAuth()
    }, [])

    const handleLogin = () => {
        // Force re-check authentication status
        if (authService.isAuthenticated()) {
            setIsAuthenticated(true);
            navigate('/home');
        } else {
            setIsAuthenticated(false);
        }
    };

    const handleLogout = () => {
        authService.logout()
        setIsAuthenticated(false)
        navigate('/home')
    }

    const handlePageChange = (page: string) => {
        const routes = {
            'Home': '/home',
            'Compare': '/compare',
            'IPOs': '/ipos',
            'Learn': '/learn',
            'Learning': '/learn',
            'AI Advisors': '/ai-advisor',
            'AI': '/ai-advisor',
            'News': '/news',
            'VirtualTrading': '/virtual-trading',
            'Virtual Trading': '/virtual-trading',
            'Portfolio': '/portfolio'
        }
        
        const route = routes[page as keyof typeof routes] || '/home'
        navigate(route)
    }

    // Show loading spinner while checking authentication
    if (loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
                <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-600 dark:text-gray-400">Loading...</span>
                </div>
            </div>
        )
    }

    // If not authenticated, show landing page
    if (!isAuthenticated) {
        return (
            <Routes>
                <Route path="/login" element={<Login onLogin={handleLogin} />} />
                <Route path="/signup" element={<Signup onLogin={handleLogin} />} />
                <Route path="*" element={<Landing onLogin={handleLogin} />} />
            </Routes>
        )
    }

    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white font-sans selection:bg-black/10 dark:selection:bg-white/10">
            <Navbar
                isDark={isDark}
                toggleTheme={() => setIsDark(!isDark)}
                onPageChange={handlePageChange}
                currentPage={currentPage}
                onLogout={handleLogout}
            />

            <div className="flex">
                {showSidebar && <Sidebar onPageChange={handlePageChange} currentPage={currentPage} />}
                
                <main className={`flex-1 flex flex-col ${showSidebar ? "md:ml-64" : ""} pt-16 min-h-screen relative`}>
                    {/* Toggle Sidebar Button */}
                    <div className="fixed top-4 left-4 z-50 md:hidden">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setShowSidebar(!showSidebar)}
                        >
                            <Menu className="h-4 w-4" />
                        </Button>
                    </div>
                    
                    <div className="flex-1">
                        <Routes>
                            <Route path="/" element={<Navigate to="/home" replace />} />
                            <Route path="/home" element={<Home />} />
                            <Route path="/compare" element={<Compare />} />
                            <Route path="/ipos" element={<IPOs />} />
                            <Route path="/learn" element={<Learn />} />
                            <Route path="/ai-advisor" element={<AIAdvisor />} />
                            <Route path="/news" element={<News />} />
                            <Route path="/virtual-trading" element={<VirtualTrading />} />
                            <Route path="/portfolio" element={<Portfolio />} />
                            {/* Catch all route - redirect to home */}
                            <Route path="*" element={<Navigate to="/home" replace />} />
                        </Routes>
                    </div>
                    <Footer onPageChange={handlePageChange} />
                </main>
            </div>
        </div>
    )
}

export default function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    )
}
