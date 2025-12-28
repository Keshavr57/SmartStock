import {
    LayoutDashboard,
    BarChart2,
    TrendingUp,
    Wallet,
    Settings,
    HelpCircle,
    Newspaper,
    Cpu,
    ArrowLeftRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./ui/button"

interface SidebarProps {
    onPageChange: (page: string) => void
    currentPage: string
}

const sidebarItems = [
    { icon: LayoutDashboard, label: "Home", id: "Home" },
    { icon: ArrowLeftRight, label: "Compare Assets", id: "Compare" },
    { icon: Cpu, label: "AI Advisor", id: "AI" },
    { icon: Newspaper, label: "Market News", id: "News" },
    { icon: TrendingUp, label: "IPOs", id: "IPOs" },
    { icon: BarChart2, label: "Learning", id: "Learn" },
    { icon: Wallet, label: "Portfolio", id: "Portfolio" },
]

export function Sidebar({ onPageChange, currentPage }: SidebarProps) {
    return (
        <aside className="hidden md:flex w-64 flex-col border-r bg-muted/10 h-[calc(100vh-64px)] p-4 sticky top-16">
            <div className="space-y-4 flex-1">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-xs font-semibold tracking-widest text-muted-foreground uppercase">Menu</h2>
                    <div className="space-y-1">
                        {sidebarItems.map((item) => (
                            <Button
                                key={item.label}
                                variant={currentPage === item.id ? "secondary" : "ghost"}
                                className={cn(
                                    "w-full justify-start gap-3",
                                    currentPage === item.id && "bg-secondary font-medium"
                                )}
                                onClick={() => onPageChange(item.id)}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-xs font-semibold tracking-widest text-muted-foreground uppercase">Support</h2>
                    <div className="space-y-1">
                        <Button variant="ghost" className="w-full justify-start gap-3">
                            <Settings className="h-4 w-4" />
                            Settings
                        </Button>
                        <Button variant="ghost" className="w-full justify-start gap-3">
                            <HelpCircle className="h-4 w-4" />
                            Help Center
                        </Button>
                    </div>
                </div>
            </div>

            <div className="mt-auto px-3">
                <div className="rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 border border-primary/20">
                    <p className="text-sm font-semibold text-primary">AI-Powered Learning</p>
                    <p className="text-xs text-muted-foreground mt-1">Master trading with personalized insights and comprehensive education.</p>
                </div>
            </div>
        </aside>
    )
}
