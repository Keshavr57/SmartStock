import {
    LayoutDashboard,
    BarChart2,
    TrendingUp,
    Wallet,
    Newspaper,
    Cpu,
    ArrowLeftRight,
    X,
    Activity,
    User,
    LogOut
} from "lucide-react"
import { cn } from "../lib/utils"
import { Button } from "./ui/button"
import { useState, useEffect } from "react"

interface SidebarProps {
    onPageChange: (page: string) => void
    currentPage: string
}

const sidebarItems = [
    { icon: LayoutDashboard, label: "Home", id: "Home" },
    { icon: ArrowLeftRight, label: "Compare", id: "Compare" },
    { icon: Activity, label: "Virtual Trading", id: "VirtualTrading" },
    { icon: Cpu, label: "AI Advisor", id: "AI" },
    { icon: Newspaper, label: "News", id: "News" },
    { icon: TrendingUp, label: "IPOs", id: "IPOs" },
    { icon: BarChart2, label: "Learn", id: "Learn" },
    { icon: Wallet, label: "Portfolio", id: "Portfolio" },
]

export function Sidebar({ onPageChange, currentPage }: SidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        // Get user from localStorage
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
    
    if (isCollapsed) {
        return (
            <aside className="hidden md:flex w-16 flex-col border-r bg-white dark:bg-zinc-950 h-[calc(100vh-64px)] p-2 sticky top-16">
                <div className="space-y-2 flex-1">
                    {sidebarItems.map((item) => (
                        <Button
                            key={item.label}
                            variant={currentPage === item.id ? "default" : "ghost"}
                            size="sm"
                            className={cn(
                                "w-full h-12 p-0 flex items-center justify-center",
                                currentPage === item.id && "bg-primary text-primary-foreground"
                            )}
                            onClick={() => onPageChange(item.id)}
                            title={item.label}
                        >
                            <item.icon className="h-5 w-5" />
                        </Button>
                    ))}
                </div>
                
                {/* User Profile - Collapsed */}
                <div className="space-y-2">
                    {user && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full h-12 p-0 flex items-center justify-center"
                            title={`Profile: ${user.name}`}
                        >
                            {user.avatar ? (
                                <img src={user.avatar} alt="Profile" className="h-8 w-8 rounded-full" />
                            ) : (
                                <User className="h-5 w-5" />
                            )}
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-12 p-0 flex items-center justify-center"
                        onClick={() => setIsCollapsed(false)}
                        title="Expand Sidebar"
                    >
                        <LayoutDashboard className="h-5 w-5" />
                    </Button>
                </div>
            </aside>
        )
    }

    return (
        <aside className="hidden md:flex w-56 flex-col border-r bg-white dark:bg-zinc-950 h-[calc(100vh-64px)] sticky top-16">
            <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-gray-900 dark:text-white">Navigation</h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsCollapsed(true)}
                        className="h-8 w-8 p-0"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            
            <div className="flex-1 p-3">
                <div className="space-y-1">
                    {sidebarItems.map((item) => (
                        <Button
                            key={item.label}
                            variant={currentPage === item.id ? "default" : "ghost"}
                            className={cn(
                                "w-full justify-start gap-3 h-10 px-3",
                                currentPage === item.id 
                                    ? "bg-primary text-primary-foreground font-medium" 
                                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                            )}
                            onClick={() => onPageChange(item.id)}
                        >
                            <item.icon className="h-4 w-4" />
                            <span className="text-sm">{item.label}</span>
                        </Button>
                    ))}
                </div>
            </div>

            {/* User Profile Section */}
            <div className="p-4 border-t border-gray-200 dark:border-zinc-800">
                {user ? (
                    <div className="space-y-3">
                        {/* User Info */}
                        <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-zinc-800">
                            {user.avatar ? (
                                <img src={user.avatar} alt="Profile" className="h-10 w-10 rounded-full" />
                            ) : (
                                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                                    <User className="h-5 w-5 text-white" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {user.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    ₹{user.virtualBalance?.toLocaleString('en-IN') || '1,00,000'}
                                </p>
                            </div>
                        </div>
                        
                        {/* Logout Button */}
                        <Button 
                            variant="ghost" 
                            className="w-full justify-start gap-3 h-10 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={handleLogout}
                        >
                            <LogOut className="h-4 w-4" />
                            <span className="text-sm">Logout</span>
                        </Button>
                    </div>
                ) : (
                    <div className="text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Not logged in</p>
                    </div>
                )}
            </div>
        </aside>
    )
}
