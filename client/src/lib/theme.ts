import { useCallback, useEffect, useState } from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'
const STORAGE_KEY = 'smartstock-theme'

const systemPrefersDark = () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false

function readPreference(): ThemePreference {
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
    } catch { /* storage blocked: fall back to system */ }
    return 'system'
}

function apply(pref: ThemePreference) {
    const dark = pref === 'dark' || (pref === 'system' && systemPrefersDark())
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
}

/** Theme preference persisted per browser; "system" follows the OS setting live. */
export function useTheme() {
    const [preference, setPreference] = useState<ThemePreference>(readPreference)

    useEffect(() => {
        apply(preference)
        try { localStorage.setItem(STORAGE_KEY, preference) } catch { /* ignore */ }
        if (preference !== 'system') return
        const media = window.matchMedia('(prefers-color-scheme: dark)')
        const onChange = () => apply('system')
        media.addEventListener('change', onChange)
        return () => media.removeEventListener('change', onChange)
    }, [preference])

    const isDark = preference === 'dark' || (preference === 'system' && systemPrefersDark())
    const toggle = useCallback(() => setPreference(isDark ? 'light' : 'dark'), [isDark])
    return { preference, setPreference, isDark, toggle }
}

// Apply before React renders to avoid a light flash on dark-mode reloads.
apply(readPreference())
