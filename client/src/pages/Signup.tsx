import { useCallback, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { authService } from '../lib/auth'
import { AuthLayout, Divider, Field, GoogleButton } from '@/components/auth/AuthLayout'

export default function Signup({ onLogin }: { onLogin: () => void }) {
    const navigate = useNavigate()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const done = useCallback(() => { onLogin(); navigate('/home') }, [onLogin, navigate])

    const submit = async (e: FormEvent) => {
        e.preventDefault()
        if (password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }
        setLoading(true)
        setError('')
        try {
            const result = await authService.register(name, email, password)
            if (result.success) done()
            else setError(result.error || result.message || 'Registration failed')
        } catch {
            setError('Could not reach the server. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthLayout
            title="Create your account"
            subtitle="Free, with ₹1,00,000 of virtual cash to start."
            footer={<>Already have an account? <Link to="/login" className="font-medium text-brand-600 dark:text-brand-300 hover:underline">Log in</Link></>}
        >
            <GoogleButton text="signup_with" onSuccess={done} onError={setError} />
            <Divider />
            <form onSubmit={submit} className="space-y-4">
                <Field label="Full name" autoComplete="name" required value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
                <Field label="Email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                <Field label="Password" type="password" autoComplete="new-password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" />
                {error && <p className="flex items-start gap-1.5 text-sm text-rose-600 dark:text-rose-400"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}</p>}
                <button type="submit" disabled={loading} className="w-full h-10 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium disabled:opacity-50">
                    {loading ? 'Creating account…' : 'Create account'}
                </button>
                <p className="text-xs text-zinc-500 text-center">Paper trading for learning. No real money is ever involved.</p>
            </form>
        </AuthLayout>
    )
}
