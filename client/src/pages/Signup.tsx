import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../lib/auth';

interface SignupProps {
    onLogin: () => void;
}

const Signup: React.FC<SignupProps> = ({ onLogin }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [googleLoading, setGoogleLoading] = useState(false);

    const [signupForm, setSignupForm] = useState({
        name: '',
        email: '',
        password: ''
    });

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);

        script.onload = () => {
            if (window.google) {
                const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ||
                    document.querySelector('meta[name="google-signin-client_id"]')?.getAttribute('content') ||
                    '817549154886-k5r92c4grcvr5usdiqfjtib2se0uc5qv.apps.googleusercontent.com';

                if (clientId && clientId !== 'undefined') {
                    window.google.accounts.id.initialize({
                        client_id: clientId,
                        callback: handleGoogleSignIn,
                        auto_select: false,
                        cancel_on_tap_outside: true,
                        use_fedcm_for_prompt: false
                    });
                }
            }
        };

        return () => {
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }
        };
    }, []);

    const handleGoogleSignIn = async (response: any) => {
        setGoogleLoading(true);
        setError('');

        try {
            const result = await authService.googleLogin(response.credential);

            if (result.success) {
                onLogin();
                navigate('/home');
            } else {
                setError(result.error || result.message || 'Google authentication failed');
            }
        } catch (error) {
            setError('Google authentication failed. Please try again.');
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleGoogleButtonClick = () => {
        if (window.google) {
            try {
                setGoogleLoading(true);
                const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ||
                    document.querySelector('meta[name="google-signin-client_id"]')?.getAttribute('content') ||
                    '817549154886-k5r92c4grcvr5usdiqfjtib2se0uc5qv.apps.googleusercontent.com';

                if (clientId && clientId !== 'undefined') {
                    window.google.accounts.id.initialize({
                        client_id: clientId,
                        callback: handleGoogleSignIn,
                        auto_select: false,
                        cancel_on_tap_outside: true,
                        use_fedcm_for_prompt: false
                    });
                }

                const buttonContainer = document.createElement('div');
                document.body.appendChild(buttonContainer);
                buttonContainer.style.display = 'none';

                window.google.accounts.id.renderButton(buttonContainer, {
                    theme: 'outline',
                    size: 'large',
                    width: 350,
                    text: 'signin_with',
                    shape: 'rectangular'
                });

                window.google.accounts.id.prompt();
                setTimeout(() => setGoogleLoading(false), 2000);
            } catch (error) {
                setGoogleLoading(false);
                setError('');
            }
        } else {
            setGoogleLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (signupForm.password.length < 6) {
            setError('Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        try {
            const result = await authService.register(signupForm.name, signupForm.email, signupForm.password);

            if (result.success) {
                onLogin();
                navigate('/home');
            } else {
                setError(result.error || result.message || 'Registration failed');
            }
        } catch (error) {
            setError('Network error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-6 relative font-['Inter'] text-[#141b2b] z-50">
            <style>
                {`
                .material-symbols-outlined {
                    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
                }
                `}
            </style>

            <div className="w-full max-w-[1100px] grid md:grid-cols-2 bg-white rounded-xl overflow-hidden shadow-xl relative z-10 border border-gray-200/50">

                {/* Left Side: Brand & Visual Context */}
                <div className="hidden md:flex flex-col justify-between p-12 relative overflow-hidden" style={{ backgroundColor: 'rgba(124,58,237,0.06)' }}>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-12 cursor-pointer" onClick={() => navigate('/')}>
                            <span className="material-symbols-outlined text-[#7c3aed] text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>insights</span>
                            <span className="text-xl font-['Plus_Jakarta_Sans'] font-extrabold tracking-tight text-[#141b2b]">SmartStock</span>
                        </div>
                        <h2 className="text-3xl lg:text-4xl font-['Plus_Jakarta_Sans'] font-bold text-[#141b2b] leading-tight mb-6">
                            Master the markets with <span className="text-[#7c3aed]">architectural calm.</span>
                        </h2>
                        <p className="text-[#4a4455] text-lg leading-relaxed mb-8">
                            Join 50,000+ Indian investors learning to navigate volatility through data-driven insights and AI-powered simulation.
                        </p>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-[#7c3aed]/10 flex items-center justify-center text-[#7c3aed]">
                                    <span className="material-symbols-outlined shrink-0 text-xl font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-[#141b2b]">Curated Learning</h4>
                                    <p className="text-sm text-[#4a4455]">Structured paths from basics to F&amp;O.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-[#7c3aed]/10 flex items-center justify-center text-[#7c3aed]">
                                    <span className="material-symbols-outlined shrink-0 text-xl font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-[#141b2b]">Virtual Trading</h4>
                                    <p className="text-sm text-[#4a4455]">Practice with ₹1L virtual capital.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-[#7c3aed]/10 flex items-center justify-center text-[#7c3aed]">
                                    <span className="material-symbols-outlined shrink-0 text-xl font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-[#141b2b]">AI Insights</h4>
                                    <p className="text-sm text-[#4a4455]">Smart fundamental stock tracking.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Signup Form */}
                <div className="p-8 md:p-14 flex flex-col justify-center bg-white z-10 relative">
                    <div className="md:hidden flex items-center gap-2 mb-10 cursor-pointer" onClick={() => navigate('/')}>
                        <span className="material-symbols-outlined text-[#7c3aed] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>insights</span>
                        <span className="text-lg font-bold tracking-tight text-[#141b2b]">SmartStock</span>
                    </div>
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-[#141b2b] font-['Plus_Jakarta_Sans'] mb-2">Create Account</h1>
                        <p className="text-[#4a4455] text-sm">Start your financial journey with the Curator.</p>
                    </div>

                    {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>}

                    <form className="space-y-5" onSubmit={handleSignup}>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-[#4a4455]" htmlFor="name">Full Name</label>
                            <input
                                className="w-full px-4 py-3 bg-gray-50 rounded-lg border border-transparent focus:border-[#7c3aed]/30 focus:ring-2 focus:ring-[#7c3aed]/20 transition-all text-[#141b2b] outline-none placeholder:text-gray-400"
                                id="name"
                                name="name"
                                placeholder="Arjun Sharma"
                                type="text"
                                value={signupForm.name}
                                onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                                autoComplete="name"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-[#4a4455]" htmlFor="email">Email Address</label>
                            <input
                                className="w-full px-4 py-3 bg-gray-50 rounded-lg border border-transparent focus:border-[#7c3aed]/30 focus:ring-2 focus:ring-[#7c3aed]/20 transition-all text-[#141b2b] outline-none placeholder:text-gray-400"
                                id="email"
                                name="email"
                                placeholder="name@example.com"
                                type="email"
                                value={signupForm.email}
                                onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                                autoComplete="email"
                                required
                            />
                        </div>
                        <div className="space-y-1.5 pb-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-[#4a4455]" htmlFor="password">Password</label>
                            <input
                                className="w-full px-4 py-3 bg-gray-50 rounded-lg border border-transparent focus:border-[#7c3aed]/30 focus:ring-2 focus:ring-[#7c3aed]/20 transition-all text-[#141b2b] outline-none placeholder:text-gray-400"
                                id="password"
                                name="password"
                                placeholder="••••••••"
                                type="password"
                                value={signupForm.password}
                                onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                                autoComplete="new-password"
                                minLength={6}
                                required
                            />
                        </div>
                        <button disabled={loading} className="w-full py-3.5 bg-[#7c3aed] hover:bg-[#6b25e0] text-white font-bold rounded-lg shadow-md hover:shadow-[#7c3aed]/30 transition-all disabled:opacity-50 mt-2" type="submit">
                            {loading ? "Creating Account..." : "Create Account"}
                        </button>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="px-4 bg-white text-gray-400 font-semibold tracking-widest uppercase">or continue with</span>
                        </div>
                    </div>

                    <button type="button" onClick={handleGoogleButtonClick} disabled={googleLoading} className="w-full flex items-center justify-center gap-3 py-3.5 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-[#141b2b] font-semibold transition-colors disabled:opacity-50">
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        {googleLoading ? "Signing up..." : "Sign up with Google"}
                    </button>

                    <p className="mt-8 text-center text-sm text-[#4a4455]">
                        Already have an account?
                        <button onClick={() => navigate('/login')} className="text-[#7c3aed] font-bold ml-1 hover:underline">Login</button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
