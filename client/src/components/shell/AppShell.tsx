import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Search, Moon, Sun, LogOut, PanelLeftClose, PanelLeftOpen, Menu, X, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/lib/theme'
import { fetchAccount, fetchMarketStatus, fetchQuotes, price, rupees, signedPct, trendClass, usePolling } from '@/lib/market'
import type { AccountSummary, MarketStatus, Quote } from '@/lib/market'
import { NAV_GROUPS } from './nav'
import CommandPalette from './CommandPalette'

const COLLAPSE_KEY = 'smartstock-sidebar-collapsed'
const TICKER = [
    { symbol: '^NSEI', label: 'NIFTY 50' },
    { symbol: '^NSEBANK', label: 'BANK NIFTY' },
    { symbol: '^BSESN', label: 'SENSEX' }
]

interface ShellUser { name?: string; email?: string; avatar?: string }

function readUser(): ShellUser | null {
    try { return JSON.parse(localStorage.getItem('user') || 'null') } catch { return null }
}

function Logo({ compact }: { compact?: boolean }) {
    return (
        <NavLink to="/home" className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white shrink-0">
                <TrendingUp className="w-4 h-4" strokeWidth={2.5} />
            </span>
            {!compact && <span className="font-semibold text-[15px] tracking-tight text-zinc-900 dark:text-zinc-50">SmartStock</span>}
        </NavLink>
    )
}

function NavList({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
    return (
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
            {NAV_GROUPS.map(group => (
                <div key={group.label}>
                    {!collapsed && <p className="px-3 mb-1 text-[11px] font-medium text-zinc-400">{group.label}</p>}
                    <ul className="space-y-0.5">
                        {group.items.map(item => (
                            <li key={item.to}>
                                <NavLink
                                    to={item.to}
                                    onClick={onNavigate}
                                    title={collapsed ? item.label : undefined}
                                    className={({ isActive }) => cn(
                                        'flex items-center gap-3 rounded-lg text-sm font-medium transition-colors',
                                        collapsed ? 'justify-center h-10' : 'px-3 h-9',
                                        isActive
                                            ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                                            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
                                    )}
                                >
                                    <item.icon className="w-[18px] h-[18px] shrink-0" />
                                    {!collapsed && item.label}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </nav>
    )
}

function UserFooter({ collapsed, onLogout }: { collapsed: boolean; onLogout: () => void }) {
    const user = readUser()
    const initials = (user?.name || 'U').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
    return (
        <div className={cn('border-t border-zinc-200 dark:border-zinc-800 p-2', collapsed ? 'space-y-1' : 'flex items-center gap-2')}>
            <div className={cn('flex items-center gap-2.5 min-w-0', collapsed ? 'justify-center py-1' : 'flex-1 px-2 py-1.5')}>
                {user?.avatar
                    ? <img src={user.avatar} alt="" className="w-8 h-8 rounded-full shrink-0" />
                    : <span className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 flex items-center justify-center shrink-0">{initials}</span>}
                {!collapsed && (
                    <span className="min-w-0">
                        <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{user?.name || 'Trader'}</span>
                        <span className="block text-xs text-zinc-500 truncate">{user?.email}</span>
                    </span>
                )}
            </div>
            <button
                onClick={onLogout}
                title="Log out"
                className={cn('rounded-lg text-zinc-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center justify-center', collapsed ? 'w-full h-9' : 'w-8 h-8 shrink-0')}
            >
                <LogOut className="w-4 h-4" />
            </button>
        </div>
    )
}

function MarketTicker() {
    const { data: market } = usePolling<MarketStatus>(fetchMarketStatus, 60000)
    const { data: quotes } = usePolling<Quote[]>(() => fetchQuotes(TICKER.map(t => t.symbol)), market?.isOpen ? 20000 : 120000, [market?.isOpen])
    return (
        <div className="hidden lg:flex items-center gap-5 text-xs tabular-nums min-w-0">
            <span className="flex items-center gap-1.5 whitespace-nowrap" title={market?.status}>
                <span className={cn('w-1.5 h-1.5 rounded-full', market?.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400')} />
                <span className="text-zinc-500">{market ? (market.isOpen ? 'Market open' : market.status.replace('Market Closed', 'Closed')) : '…'}</span>
            </span>
            {TICKER.map(t => {
                const q = quotes?.find(x => x.symbol === t.symbol)
                return (
                    <span key={t.symbol} className="hidden xl:flex items-baseline gap-1.5 whitespace-nowrap">
                        <span className="text-zinc-500">{t.label}</span>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">{price(q?.price)}</span>
                        <span className={trendClass(q?.changePercent)}>{signedPct(q?.changePercent)}</span>
                    </span>
                )
            })}
        </div>
    )
}

function CashChip() {
    const { data } = usePolling<AccountSummary>(fetchAccount, 60000)
    return (
        <NavLink to="/portfolio" title="Available cash" className="hidden sm:flex shrink-0 items-center gap-1.5 px-3 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs tabular-nums whitespace-nowrap hover:bg-zinc-200 dark:hover:bg-zinc-700">
            <span className="text-zinc-500">Cash</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{rupees(data?.availableBalance)}</span>
        </NavLink>
    )
}

export default function AppShell({ children, onLogout }: { children: ReactNode; onLogout: () => void }) {
    const { isDark, toggle } = useTheme()
    const location = useLocation()
    const [collapsed, setCollapsed] = useState(() => {
        try { return localStorage.getItem(COLLAPSE_KEY) === '1' } catch { return false }
    })
    const [mobileOpen, setMobileOpen] = useState(false)
    const [paletteOpen, setPaletteOpen] = useState(false)

    useEffect(() => {
        try { localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0') } catch { /* ignore */ }
    }, [collapsed])

    // ⌘K / Ctrl+K opens search from anywhere.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault()
                setPaletteOpen(o => !o)
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [])

    // Scroll to top on navigation, like a normal page load.
    useEffect(() => { window.scrollTo(0, 0) }, [location.pathname])

    const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform)

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
            {/* Desktop sidebar */}
            <aside className={cn(
                'hidden md:flex fixed inset-y-0 left-0 z-40 flex-col bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-[width] duration-200',
                collapsed ? 'w-16' : 'w-60'
            )}>
                <div className={cn('h-14 flex items-center border-b border-zinc-200 dark:border-zinc-800', collapsed ? 'justify-center' : 'px-4 justify-between')}>
                    <Logo compact={collapsed} />
                    {!collapsed && (
                        <button onClick={() => setCollapsed(true)} title="Collapse sidebar" className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                            <PanelLeftClose className="w-4 h-4" />
                        </button>
                    )}
                </div>
                {collapsed && (
                    <button onClick={() => setCollapsed(false)} title="Expand sidebar" className="mx-auto mt-2 p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                        <PanelLeftOpen className="w-4 h-4" />
                    </button>
                )}
                <NavList collapsed={collapsed} />
                <UserFooter collapsed={collapsed} onLogout={onLogout} />
            </aside>

            {/* Mobile drawer */}
            {mobileOpen && (
                <div className="md:hidden fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-zinc-950/40" onClick={() => setMobileOpen(false)} />
                    <aside className="absolute inset-y-0 left-0 w-64 flex flex-col bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800">
                        <div className="h-14 flex items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800">
                            <Logo />
                            <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-md text-zinc-500"><X className="w-4 h-4" /></button>
                        </div>
                        <NavList collapsed={false} onNavigate={() => setMobileOpen(false)} />
                        <UserFooter collapsed={false} onLogout={onLogout} />
                    </aside>
                </div>
            )}

            <div className={cn('transition-[padding] duration-200', collapsed ? 'md:pl-16' : 'md:pl-60')}>
                {/* Top bar */}
                <header className="sticky top-0 z-30 h-14 flex items-center gap-3 px-3 md:px-5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur border-b border-zinc-200 dark:border-zinc-800">
                    <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 -ml-1 rounded-md text-zinc-600 dark:text-zinc-300" aria-label="Open menu">
                        <Menu className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setPaletteOpen(true)}
                        className="flex items-center gap-2 h-9 w-full max-w-sm px-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm text-zinc-500 hover:bg-zinc-200/70 dark:hover:bg-zinc-700/70 transition-colors"
                    >
                        <Search className="w-4 h-4" />
                        <span className="flex-1 text-left truncate">Search stocks, pages…</span>
                        <kbd className="hidden sm:inline text-[10px] font-medium text-zinc-400 border border-zinc-300 dark:border-zinc-600 rounded px-1.5 py-0.5">{isMac ? '⌘K' : 'Ctrl K'}</kbd>
                    </button>
                    <div className="flex-1 flex justify-center min-w-0"><MarketTicker /></div>
                    <CashChip />
                    <button onClick={toggle} title={isDark ? 'Light mode' : 'Dark mode'} className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-100">
                        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                </header>

                <main className="pb-20 md:pb-0">{children}</main>
            </div>

            {/* Mobile bottom navigation */}
            <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 h-16 grid grid-cols-5 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
                {[NAV_GROUPS[0].items[0], NAV_GROUPS[0].items[1], NAV_GROUPS[1].items[0], NAV_GROUPS[0].items[4], NAV_GROUPS[2].items[1]].map(item => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => cn('flex flex-col items-center justify-center gap-1 text-[11px] font-medium', isActive ? 'text-brand-600 dark:text-brand-300' : 'text-zinc-500')}
                    >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
        </div>
    )
}
