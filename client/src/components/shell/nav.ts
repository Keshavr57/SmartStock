import { LayoutDashboard, CandlestickChart, Briefcase, GitCompareArrows, Rocket, Newspaper, GraduationCap, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
    to: string
    label: string
    icon: LucideIcon
    keywords?: string
}

export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
    {
        label: 'Markets',
        items: [
            { to: '/home', label: 'Dashboard', icon: LayoutDashboard, keywords: 'home overview' },
            { to: '/virtual-trading', label: 'Trade', icon: CandlestickChart, keywords: 'buy sell order chart terminal virtual' },
            { to: '/compare', label: 'Compare', icon: GitCompareArrows, keywords: 'fundamentals versus' },
            { to: '/ipos', label: 'IPOs', icon: Rocket, keywords: 'listing subscription' },
            { to: '/news', label: 'News', icon: Newspaper, keywords: 'sentiment headlines' }
        ]
    },
    {
        label: 'Invest',
        items: [
            { to: '/portfolio', label: 'Portfolio', icon: Briefcase, keywords: 'holdings positions p&l orders' }
        ]
    },
    {
        label: 'Learn',
        items: [
            { to: '/learn', label: 'Learn', icon: GraduationCap, keywords: 'lessons course education' },
            { to: '/ai-advisor', label: 'AI Advisor', icon: Sparkles, keywords: 'finsage chat assistant ask' }
        ]
    }
]

export const ALL_NAV_ITEMS = NAV_GROUPS.flatMap(g => g.items)
