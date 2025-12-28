import { useState, useEffect } from "react"
import { Navbar } from "@/components/Navbar"
import { Sidebar } from "@/components/Sidebar"
import Home from "@/pages/Home"
import Compare from "@/pages/Compare"
import IPOs from "@/pages/IPOs"
import Learn from "@/pages/Learn"
import AIAdvisor from "@/pages/AIAdvisor"
import News from "@/pages/News"
import { Footer } from "@/components/Footer"

export default function App() {
    const [isDark, setIsDark] = useState(false)
    const [currentPage, setCurrentPage] = useState("Home")

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add("dark")
        } else {
            document.documentElement.classList.remove("dark")
        }
    }, [isDark])

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
            />

            <div className="flex">
                <Sidebar onPageChange={setCurrentPage} currentPage={currentPage} />
                <main className="flex-1 min-h-[calc(100vh-64px)] flex flex-col">
                    <div className="flex-1">
                        {renderPage()}
                    </div>
                    <Footer />
                </main>
            </div>
        </div>
    )
}
