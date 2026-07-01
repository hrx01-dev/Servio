import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from './firebase';
import { Home } from 'lucide-react';
import { Aurora } from '@/app/components/Aurora';
import { GlassPanel } from '@/app/components/GlassPanel';

function GoogleLogo() {
    return (
        <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
            <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
        </svg>
    );
}

export function SignIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleEmailSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/dashboard');
        } catch (err: unknown) {
            if (typeof err === 'object' && err !== null && 'code' in err && 'message' in err) {
                setError((err as { message: string }).message);
            } else {
                setError('An unexpected error occurred during sign-in.');
            }
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            navigate('/dashboard');
        } catch (err: unknown) {
            if (typeof err === 'object' && err !== null && 'code' in err && 'message' in err) {
                setError((err as { message: string }).message);
            } else {
                setError('An unexpected error occurred with Google Sign-In.');
            }
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background px-4">
            {/* Warm ambient glow — the same drifting aurora the landing page uses */}
            <Aurora intensity={0.6} />

            <Link
                to="/"
                aria-label="Back to home"
                className="absolute top-4 left-4 z-10 inline-flex items-center justify-center rounded-full p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            >
                <Home className="w-6 h-6" aria-hidden="true" />
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 max-w-md w-full"
            >
                <GlassPanel tier="strong" className="p-8 rounded-2xl shadow-elev-3">
                    <h1 className="font-display text-3xl font-bold text-center mb-2">
                        <span className="text-gradient-brand">
                            Sign In
                        </span>
                    </h1>
                    <p className="text-center text-muted-foreground mb-8">
                        Welcome back to Servio.
                    </p>
                    {error && (
                        <p role="alert" className="bg-destructive/10 text-destructive dark:text-red-300 border border-destructive/20 p-3 rounded-lg mb-4 text-sm">
                            {error}
                        </p>
                    )}
                    <form onSubmit={handleEmailSignIn} className="space-y-6" aria-label="Sign in with email and password">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-foreground">
                                Email Address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                aria-required="true"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-input-background border border-border rounded-md shadow-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/60 focus:border-primary sm:text-sm transition"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-foreground"
                            >
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                aria-required="true"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-input-background border border-border rounded-md shadow-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/60 focus:border-primary sm:text-sm transition"
                            />
                        </div>
                        <motion.button
                            type="submit"
                            aria-label="Sign in"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.96 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                            className="w-full flex justify-center py-2.5 px-4 rounded-full shadow-elev-3 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 hover:[box-shadow:0_0_28px_-4px_var(--gold)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-ring transition-[box-shadow,transform] duration-300"
                        >
                            Sign In
                        </motion.button>
                    </form>
                    <div className="mt-6">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="h-px flex-1 bg-border" aria-hidden="true" />
                            <span>Or continue with</span>
                            <span className="h-px flex-1 bg-border" aria-hidden="true" />
                        </div>
                        <div className="mt-6">
                            <motion.button
                                onClick={handleGoogleSignIn}
                                aria-label="Sign in with Google"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.96 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 border border-border rounded-full shadow-sm bg-card text-sm font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-ring transition-colors"
                            >
                                <GoogleLogo />
                                Sign in with Google
                            </motion.button>
                        </div>
                    </div>
                    <p className="mt-8 text-center text-sm text-muted-foreground">
                        Not a member?{' '}
                        <Link to="/signup" className="font-medium text-primary hover:text-primary/80">
                            Sign up now
                        </Link>
                    </p>
                </GlassPanel>
            </motion.div>
        </div>
    );
}
