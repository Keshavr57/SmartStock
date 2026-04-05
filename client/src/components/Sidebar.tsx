import { useState, useEffect } from "react"

interface SidebarProps {
    onPageChange: (page: string) => void
    currentPage: string
}

export function Sidebar({ onPageChange, currentPage }: SidebarProps) {
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        const userData = localStorage.getItem('user')
        if (userData) {
            setUser(JSON.parse(userData))
        }
    }, [])

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.setItem('isAuthenticated', 'false')
        window.location.reload()
    }

    const items = [
        { id: "Home", icon: "dashboard", label: "Dashboard" },
        { id: "Compare", icon: "compare_arrows", label: "Compare" },
        { id: "VirtualTrading", icon: "query_stats", label: "Virtual Trading" },
        { id: "AI", icon: "psychology", label: "AI Advisor" },
        { id: "News", icon: "newspaper", label: "News" },
        { id: "IPOs", icon: "analytics", label: "IPOs" },
        { id: "Learn", icon: "school", label: "Learn" },
        { id: "Portfolio", icon: "inventory_2", label: "Portfolio" }
    ];

    return (
        <nav className="h-screen w-64 fixed left-0 top-0 border-r-0 bg-slate-50 dark:bg-slate-900 flex flex-col py-6 z-50 shadow-sm border-r border-gray-200 dark:border-zinc-800">
            <style>
                {`
                .material-symbols-outlined {
                    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
                }
                `}
            </style>
            <div className="px-6 mb-8 cursor-pointer" onClick={() => onPageChange("Home")}>
                <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-[#630ed4] flex items-center justify-center text-white">
                        <span className="material-symbols-outlined text-sm">trending_up</span>
                    </span>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">SmartStock</h1>
                        <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">Premium Market Insights</p>
                    </div>
                </div>
            </div>
            
            <div className="flex-1 space-y-1">
                {items.map(item => {
                    const isActive = currentPage === item.id;
                    return (
                        <a 
                            key={item.id}
                            onClick={() => onPageChange(item.id)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg mx-2 my-1 font-medium text-sm transition-colors cursor-pointer ${
                                isActive 
                                    ? "bg-slate-900 dark:bg-slate-800 text-white" 
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                            }`}
                        >
                            <span className="material-symbols-outlined" data-icon={item.icon}>{item.icon}</span>
                            <span>{item.label}</span>
                        </a>
                    )
                })}
            </div>
            
            <div className="px-2 pt-4 border-t border-slate-200 dark:border-slate-800 mt-auto">
                {user ? (
                    <>
                        <div className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-300">
                            <span className="material-symbols-outlined" data-icon="account_circle">account_circle</span>
                            <span className="font-medium text-sm">{user.name}</span>
                        </div>
                        <button onClick={handleLogout} className="w-full text-left flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors font-medium text-sm">
                            <span className="material-symbols-outlined">logout</span>
                            Logout
                        </button>
                    </>
                ) : (
                    <div className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-300">
                        <span className="font-medium text-sm">Guest Mode</span>
                    </div>
                )}
            </div>
        </nav>
    )
}
