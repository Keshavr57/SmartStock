// SmartStock design system: the small set of primitives every page is built from.
// Neutrals are zinc, the accent is brand (violet), and green/red are reserved for gains and losses.
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { signedPct, signedRupees, trendClass } from '@/lib/market'

export function Panel({ children, className, as: Tag = 'section' }: { children: ReactNode; className?: string; as?: 'section' | 'div' | 'article' | 'aside' }) {
    return (
        <Tag className={cn('bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl', className)}>
            {children}
        </Tag>
    )
}

export function PanelHeader({ title, subtitle, action, className }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode; className?: string }) {
    return (
        <div className={cn('flex items-start justify-between gap-3 px-4 pt-4 pb-3', className)}>
            <div className="min-w-0">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
                {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    )
}

export function PageHeader({ title, description, actions }: { title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
    return (
        <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
            <div className="min-w-0">
                <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{title}</h1>
                {description && <p className="text-sm text-zinc-500 mt-1 max-w-2xl">{description}</p>}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    )
}

/** Page container: consistent width and padding across the app. */
export function Page({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
    return <div className={cn('mx-auto w-full px-4 md:px-6 py-5 md:py-6', wide ? 'max-w-[1800px]' : 'max-w-[1440px]')}>{children}</div>
}

export function Delta({ value, kind = 'pct', className }: { value: number | null | undefined; kind?: 'pct' | 'rupees'; className?: string }) {
    return (
        <span className={cn('tabular-nums', trendClass(value), className)}>
            {kind === 'pct' ? signedPct(value) : signedRupees(value)}
        </span>
    )
}

export function DeltaPill({ value, className }: { value: number | null | undefined; className?: string }) {
    const tone = value == null || value === 0
        ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
        : value > 0
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
            : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
    return <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium tabular-nums', tone, className)}>{signedPct(value)}</span>
}

export function Stat({ label, value, sub, className }: { label: ReactNode; value: ReactNode; sub?: ReactNode; className?: string }) {
    return (
        <div className={cn('min-w-0', className)}>
            <p className="text-xs text-zinc-500">{label}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-50 truncate">{value}</p>
            {sub && <p className="mt-0.5 text-xs text-zinc-500 tabular-nums">{sub}</p>}
        </div>
    )
}

export function Badge({ children, tone = 'neutral', className }: { children: ReactNode; tone?: 'neutral' | 'brand' | 'up' | 'down' | 'warn'; className?: string }) {
    const tones = {
        neutral: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
        brand: 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300',
        up: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
        down: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
        warn: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
    }
    return <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-medium', tones[tone], className)}>{children}</span>
}

export function Segmented<T extends string>({ options, value, onChange, className }: {
    options: { value: T; label: ReactNode }[]; value: T; onChange: (v: T) => void; className?: string
}) {
    return (
        <div className={cn('inline-flex p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800', className)}>
            {options.map(o => (
                <button
                    key={o.value}
                    onClick={() => onChange(o.value)}
                    className={cn('px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
                        value === o.value
                            ? 'bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-sm'
                            : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200')}
                >
                    {o.label}
                </button>
            ))}
        </div>
    )
}

export function Tabs<T extends string>({ tabs, value, onChange, className }: {
    tabs: { value: T; label: ReactNode }[]; value: T; onChange: (v: T) => void; className?: string
}) {
    return (
        <div className={cn('flex gap-1 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto', className)}>
            {tabs.map(t => (
                <button
                    key={t.value}
                    onClick={() => onChange(t.value)}
                    className={cn('px-3 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors',
                        value === t.value
                            ? 'border-brand-600 text-zinc-900 dark:text-zinc-100'
                            : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200')}
                >
                    {t.label}
                </button>
            ))}
        </div>
    )
}

export function Button({ children, variant = 'secondary', size = 'md', className, ...props }:
    ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'buy' | 'sell'; size?: 'sm' | 'md' }) {
    const variants = {
        primary: 'bg-brand-600 hover:bg-brand-700 text-white',
        secondary: 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800',
        ghost: 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800',
        buy: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        sell: 'bg-rose-600 hover:bg-rose-700 text-white'
    }
    const sizes = { sm: 'h-8 px-3 text-xs', md: 'h-9 px-4 text-sm' }
    return (
        <button
            className={cn('inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed', variants[variant], sizes[size], className)}
            {...props}
        >
            {children}
        </button>
    )
}

export function Skeleton({ className }: { className?: string }) {
    return <div className={cn('animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800', className)} />
}

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: ReactNode; description?: ReactNode; action?: ReactNode }) {
    return (
        <div className="flex flex-col items-center text-center px-6 py-10">
            {icon && <div className="mb-3 text-zinc-400">{icon}</div>}
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{title}</p>
            {description && <p className="text-sm text-zinc-500 mt-1 max-w-sm">{description}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    )
}

/** Minimal SVG sparkline: colour follows the direction of the series. */
export function Sparkline({ values, width = 96, height = 28, className }: { values: number[]; width?: number; height?: number; className?: string }) {
    if (values.length < 2) return <div style={{ width, height }} className={className} />
    const min = Math.min(...values)
    const max = Math.max(...values)
    const span = max - min || 1
    const step = width / (values.length - 1)
    const points = values.map((v, i) => `${(i * step).toFixed(1)},${(height - 2 - ((v - min) / span) * (height - 4)).toFixed(1)}`)
    const up = values[values.length - 1] >= values[0]
    const stroke = up ? '#059669' : '#e11d48'
    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden="true">
            <polyline points={points.join(' ')} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
    )
}

/** Table cell class helpers shared by every data table. */
export const tableHead = 'px-4 py-2 text-xs font-medium text-zinc-500 text-right first:text-left whitespace-nowrap'
export const tableCell = 'px-4 py-2.5 text-sm text-right first:text-left whitespace-nowrap tabular-nums'
