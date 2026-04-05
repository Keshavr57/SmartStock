import { useState, useEffect } from "react"
import { Sun, Moon } from "lucide-react"

interface NavbarProps {
    isDark: boolean
    toggleTheme: () => void
    onPageChange: (page: string) => void
    currentPage: string
    onLogout?: () => void
}

export function Navbar({ isDark, toggleTheme, onPageChange, currentPage, onLogout }: NavbarProps) {
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        const userData = localStorage.getItem('user')
        if (userData) {
            setUser(JSON.parse(userData))
        }
    }, [])

    return (
        <header className="fixed top-0 right-0 w-full md:w-[calc(100%-16rem)] z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex justify-between items-center h-16 px-4 md:px-8 border-b border-gray-100 dark:border-zinc-800">
            <h2 className="text-slate-900 dark:text-white font-semibold text-lg hidden md:block">
                Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}{user ? `, ${user.name.split(' ')[0]}` : ''}
            </h2>
            
            <div className="flex items-center gap-4 md:gap-6 ml-auto md:ml-0">
                {user && (
                    <div className="hidden sm:flex items-center bg-[#e9edff]-container dark:bg-[#630ed4]/10 px-4 py-1.5 rounded-full text-[#630ed4] font-bold text-sm">
                        ₹{user.virtualBalance?.toLocaleString('en-IN') || '1,00,000'}
                    </div>
                )}
                
                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                    <button className="hover:text-[#630ed4] transition-colors"><span className="material-symbols-outlined text-xl">notifications</span></button>
                    <button className="hover:text-[#630ed4] transition-colors" onClick={toggleTheme}>
                        {isDark ? <span className="material-symbols-outlined text-xl">light_mode</span> : <span className="material-symbols-outlined text-xl">dark_mode</span>}
                    </button>
                </div>
                
                {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 shadow-sm" />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-[#630ed4] flex items-center justify-center text-white">
                        <span className="material-symbols-outlined text-sm">person</span>
                    </div>
                )}
            </div>
        </header>
    )
}
