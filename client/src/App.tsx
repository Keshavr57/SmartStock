import { useState } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom"
import AppShell from "@/components/shell/AppShell"
import Home from "@/pages/Home"
import Compare from "@/pages/Compare"
import IPOs from "@/pages/IPOs"
import Learn from "@/pages/ComprehensiveLearn"
import AIAdvisor from "@/pages/AIAdvisor"
import News from "@/pages/News"
import VirtualTrading from "@/pages/VirtualTrading"
import Portfolio from "@/pages/Portfolio"
import StockPage from "@/pages/StockPage"
import Landing from "@/pages/Landing"
import Login from "@/pages/Login"
import Signup from "@/pages/Signup"
import { authService } from "./lib/auth"
import "./lib/theme"

function AppContent() {
    const [isAuthenticated, setIsAuthenticated] = useState(() => authService.isAuthenticated())
    const navigate = useNavigate()

    const handleLogin = () => {
        const ok = authService.isAuthenticated()
        setIsAuthenticated(ok)
        if (ok) navigate('/home')
    }

    const handleLogout = () => {
        authService.logout()
        setIsAuthenticated(false)
        navigate('/')
    }

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
        <AppShell onLogout={handleLogout}>
            <Routes>
                <Route path="/" element={<Navigate to="/home" replace />} />
                <Route path="/home" element={<Home />} />
                <Route path="/stock/:symbol" element={<StockPage />} />
                <Route path="/virtual-trading" element={<VirtualTrading />} />
                <Route path="/compare" element={<Compare />} />
                <Route path="/ipos" element={<IPOs />} />
                <Route path="/news" element={<News />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/learn" element={<Learn />} />
                <Route path="/ai-advisor" element={<AIAdvisor />} />
                <Route path="/login" element={<Navigate to="/home" replace />} />
                <Route path="/signup" element={<Navigate to="/home" replace />} />
                <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
        </AppShell>
    )
}

export default function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    )
}
