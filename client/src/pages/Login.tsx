import { useCallback, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { authService } from '../lib/auth'
import { AuthLayout, Divider, Field, GoogleButton } from '@/components/auth/AuthLayout'

export default function Login({ onLogin }: { onLogin: () => void }) {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const done = useCallback(() => { onLogin(); navigate('/home') }, [onLogin, navigate])

    const submit = async (e: FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const result = await authService.login(email, password)
            if (result.success) done()
            else setError(result.error || result.message || 'Login failed')
        } catch {
            setError('Could not reach the server. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthLayout
            title="Log in"
            subtitle="Welcome back. Pick up where you left off."
            footer={<>New to SmartStock? <Link to="/signup" className="font-medium text-brand-600 dark:text-brand-300 hover:underline">Create an account</Link></>}
        >
            <GoogleButton text="signin_with" onSuccess={done} onError={setError} />
            <Divider />
            <form onSubmit={submit} className="space-y-4">
                <Field label="Email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                <Field label="Password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                {error && <p className="flex items-start gap-1.5 text-sm text-rose-600 dark:text-rose-400"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}</p>}
                <button type="submit" disabled={loading} className="w-full h-10 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium disabled:opacity-50">
                    {loading ? 'Logging in…' : 'Log in'}
                </button>
            </form>
        </AuthLayout>
    )
}
