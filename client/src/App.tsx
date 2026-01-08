import { useState, useEffect } from "react"
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
import { Footer } from "@/components/Footer"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { authService } from "./lib/auth"

export default function App() {
    const [isDark, setIsDark] = useState(false)
    const [currentPage, setCurrentPage] = useState("Home")
    const [showSidebar, setShowSidebar] = useState(true)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add("dark")
        } else {
            document.documentElement.classList.remove("dark")
        }
    }, [isDark])

    // Check authentication status on app load
    useEffect(() => {
        const checkAuth = async () => {
            setLoading(true)
            
            if (authService.isAuthenticated()) {
                // Try to refresh user profile
                const user = await authService.getProfile()
                if (user) {
                    setIsAuthenticated(true)
                } else {
                    // Token might be expired, logout
                    authService.logout()
                    setIsAuthenticated(false)
                }
            } else {
                setIsAuthenticated(false)
            }
            
            setLoading(false)
        }

        checkAuth()
    }, [])

    const handleLogin = () => {
        // Force re-check authentication status
        const checkAuthAfterLogin = async () => {
            if (authService.isAuthenticated()) {
                const user = await authService.getProfile();
                if (user) {
                    setIsAuthenticated(true);
                    setCurrentPage("Home");
                } else {
                    setIsAuthenticated(false);
                }
            }
        };
        
        checkAuthAfterLogin();
    };

    const handleLogout = () => {
        authService.logout()
        setIsAuthenticated(false)
        setCurrentPage("Home")
    }

    // Show loading spinner while checking authentication
    if (loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
                <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-600 dark:text-gray-400">Loading...</span>
                </div>
            </div>
        )
    }

    // If not authenticated, show landing page
    if (!isAuthenticated) {
        return <Landing onLogin={handleLogin} />
    }

    const renderPage = () => {
        switch (currentPage) {
            case "Compare":
                return <Compare />
            case "IPOs":
                return <IPOs />
            case "Learn":
            case "Learning":
                return <Learn />
            case "AI Advisors":
            case "AI":
                return <AIAdvisor />
            case "News":
                return <News />
            case "VirtualTrading":
            case "Virtual Trading":
                return <VirtualTrading />
            case "Portfolio":
                return <Portfolio />
            case "Home":
            case "Dashboard":
                return <Home />
            default:
                return <Home />
        }
    }

    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white font-sans selection:bg-black/10 dark:selection:bg-white/10">
            <Navbar
                isDark={isDark}
                toggleTheme={() => setIsDark(!isDark)}
                onPageChange={setCurrentPage}
                currentPage={currentPage}
                onLogout={handleLogout}
            />

            <div className="flex">
                {showSidebar && <Sidebar onPageChange={setCurrentPage} currentPage={currentPage} />}
                
                <main className="flex-1 min-h-[calc(100vh-64px)] flex flex-col relative">
                    {/* Toggle Sidebar Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-4 left-4 z-10 md:hidden lg:flex"
                        onClick={() => setShowSidebar(!showSidebar)}
                    >
                        <Menu className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex-1">
                        {renderPage()}
                    </div>
                    <Footer onPageChange={setCurrentPage} />
                </main>
            </div>
        </div>
    )
}
