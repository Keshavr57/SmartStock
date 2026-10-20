import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, Check } from 'lucide-react'
import { authService } from '@/lib/auth'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
    || document.querySelector('meta[name="google-signin-client_id"]')?.getAttribute('content')
    || ''

interface GoogleCredentialResponse { credential: string }
interface GoogleIdApi {
    initialize: (config: { client_id: string; callback: (r: GoogleCredentialResponse) => void; ux_mode?: string }) => void
    renderButton: (el: HTMLElement, options: Record<string, unknown>) => void
}
declare global {
    interface Window { google?: { accounts: { id: GoogleIdApi } } }
}

let gsiScript: Promise<void> | null = null
function loadGoogleScript() {
    gsiScript ??= new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('Google sign-in failed to load'))
        document.head.appendChild(script)
    })
    return gsiScript
}

/** Google's own rendered "Sign in with Google" button (more reliable than the One Tap prompt). */
export function GoogleButton({ text, onSuccess, onError }: { text: 'signin_with' | 'signup_with'; onSuccess: () => void; onError: (msg: string) => void }) {
    const ref = useRef<HTMLDivElement>(null)
    const [unavailable, setUnavailable] = useState(!GOOGLE_CLIENT_ID)

    useEffect(() => {
        if (!GOOGLE_CLIENT_ID) return
        let cancelled = false
        loadGoogleScript().then(() => {
            if (cancelled || !ref.current || !window.google) return
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: async ({ credential }) => {
                    const result = await authService.googleLogin(credential)
                    if (result.success) onSuccess()
                    else onError(result.error || result.message || 'Google sign-in failed')
                }
            })
            window.google.accounts.id.renderButton(ref.current, {
                theme: document.documentElement.classList.contains('dark') ? 'filled_black' : 'outline',
                size: 'large', text, shape: 'rectangular', width: ref.current.offsetWidth || 360, logo_alignment: 'center'
            })
        }).catch(() => { if (!cancelled) setUnavailable(true) })
        return () => { cancelled = true }
    }, [text, onSuccess, onError])

    if (unavailable) return null
    return <div ref={ref} className="w-full flex justify-center min-h-[44px]" />
}

const POINTS = [
    '₹1,00,000 of virtual cash to practise with',
    'Real NSE prices, candlestick charts and fundamentals',
    'News tagged by sentiment, with measured past impact',
    'IPO tracker from NSE and an AI advisor in Hinglish'
]

export function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
            <aside className="hidden lg:flex flex-col justify-between p-10 bg-zinc-950 text-white relative overflow-hidden">
                <Link to="/" className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center"><TrendingUp className="w-4 h-4" strokeWidth={2.5} /></span>
                    <span className="font-semibold">SmartStock</span>
                </Link>
                <div className="max-w-md">
                    <h2 className="text-3xl font-semibold tracking-tight leading-tight">Practise investing in Indian stocks without risking real money.</h2>
                    <ul className="mt-8 space-y-3">
                        {POINTS.map(p => (
                            <li key={p} className="flex items-start gap-3 text-sm text-zinc-300">
                                <span className="mt-0.5 w-5 h-5 rounded-full bg-brand-600/30 text-brand-300 flex items-center justify-center shrink-0"><Check className="w-3 h-3" /></span>
                                {p}
                            </li>
                        ))}
                    </ul>
                </div>
                <p className="text-xs text-zinc-500">Educational platform. Paper trading only, no real money involved.</p>
            </aside>

            <main className="flex items-center justify-center p-6">
                <div className="w-full max-w-sm">
                    <Link to="/" className="lg:hidden flex items-center gap-2.5 mb-10">
                        <span className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center"><TrendingUp className="w-4 h-4" strokeWidth={2.5} /></span>
                        <span className="font-semibold">SmartStock</span>
                    </Link>
                    <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                    <p className="mt-1.5 text-sm text-zinc-500">{subtitle}</p>
                    <div className="mt-8">{children}</div>
                    <p className="mt-8 text-sm text-center text-zinc-500">{footer}</p>
                </div>
            </main>
        </div>
    )
}

export function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
    return (
        <label className="block">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
            <input
                {...props}
                className="mt-1.5 w-full h-10 px-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm placeholder:text-zinc-400 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
            />
        </label>
    )
}

export function Divider() {
    return (
        <div className="flex items-center gap-3 my-6 text-xs text-zinc-400">
            <span className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" /> or <span className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
        </div>
    )
}
