import { TrendingUp, Menu, Sun, Moon, Search, Cpu, LogOut } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { cn } from "../lib/utils"

interface NavbarProps {
    isDark: boolean
    toggleTheme: () => void
    onPageChange: (page: string) => void
    currentPage: string
    onLogout?: () => void
}

export function Navbar({ isDark, toggleTheme, onPageChange, currentPage, onLogout }: NavbarProps) {
    const navItems = [
        { label: "Home", id: "Home" },
        { label: "Compare", id: "Compare" },
        { label: "Virtual Trading", id: "VirtualTrading" },
        { label: "IPOs", id: "IPOs" },
        { icon: Cpu, label: "AI Advisor", id: "AI" },
        { label: "News", id: "News" },
        { label: "Learn", id: "Learn" }
    ]

    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-white dark:bg-zinc-950">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <div className="flex items-center gap-4 md:gap-8">
                    <button onClick={() => onPageChange("Home")} className="flex items-center space-x-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
                            <TrendingUp className="h-5 w-5 text-white" />
                        </div>
                        <span className="inline-block font-bold text-xl tracking-tighter">
                            SmartStock
                        </span>
                    </button>

                    <div className="hidden lg:flex items-center gap-1">
                        {navItems.map((item) => (
                            <Button
                                key={item.id}
                                variant="ghost"
                                className={cn(
                                    "text-[13px] font-medium h-9 px-4 rounded-full transition-all",
                                    currentPage === item.id
                                        ? "bg-black text-white dark:bg-white dark:text-zinc-950 hover:bg-black/90 hover:text-white"
                                        : "text-zinc-500 hover:text-zinc-950 dark:hover:text-white"
                                )}
                                onClick={() => onPageChange(item.id)}
                            >
                                {item.label}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden md:flex relative w-48 xl:w-64 items-center mr-2">
                        <Search className="absolute left-3 h-4 w-4 text-zinc-400" />
                        <Input
                            placeholder="Search..."
                            className="pl-9 h-9 bg-zinc-100 dark:bg-zinc-900 border-none rounded-full text-sm ring-offset-transparent focus-visible:ring-1 focus-visible:ring-zinc-300"
                        />
                    </div>

                    <Button variant="premium" className="hidden sm:flex h-9 px-5 rounded-full font-bold text-white shadow-xl hover:scale-105 transition-transform active:scale-95" onClick={() => onPageChange("Portfolio")}>
                        Portfolio
                    </Button>

                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={toggleTheme}>
                        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </Button>

                    {onLogout && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 rounded-full text-red-600 hover:text-red-700 hover:bg-red-50" 
                            onClick={onLogout}
                            title="Logout"
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    )}

                    <Button variant="ghost" size="icon" className="md:hidden">
                        <Menu className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </nav>
    )
}
