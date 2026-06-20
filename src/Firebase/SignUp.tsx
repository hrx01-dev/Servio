import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from './firebase';
import { Home } from 'lucide-react';

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

export function SignUp() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleEmailSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            navigate('/');
        } catch (err: unknown) {
            if (typeof err === 'object' && err !== null && 'code' in err && 'message' in err) {
                setError((err as { message: string }).message);
            } else {
                setError('An unexpected error occurred during sign-up.');
            }
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            navigate('/');
        } catch (err: unknown) {
            if (typeof err === 'object' && err !== null && 'code' in err && 'message' in err) {
                setError((err as { message: string }).message);
            } else {
                setError('An unexpected error occurred with Google Sign-Up.');
            }
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-white via-indigo-50/40 to-white dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-950 px-4">
            {/* Animated gradient background blobs */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
                <motion.div
                    className="absolute -top-32 -right-24 w-[560px] h-[560px] rounded-full bg-gradient-to-br from-purple-400/40 to-fuchsia-300/25 dark:from-purple-500/20 dark:to-fuchsia-400/10 blur-3xl"
                    animate={{ y: [0, 30, 0], x: [0, -20, 0] }}
                    transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute bottom-[-160px] left-[-120px] w-[520px] h-[520px] rounded-full bg-gradient-to-br from-indigo-400/40 to-cyan-300/25 dark:from-indigo-500/20 dark:to-cyan-400/10 blur-3xl"
                    animate={{ y: [0, -30, 0], x: [0, 20, 0] }}
                    transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            <Link
                to="/"
                aria-label="Back to home"
                className="absolute top-4 left-4 z-10 inline-flex items-center justify-center rounded-full p-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
            >
                <Home className="w-6 h-6" aria-hidden="true" />
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative max-w-md w-full p-px rounded-2xl bg-gradient-to-br from-indigo-500/60 via-purple-500/40 to-cyan-400/50 shadow-xl shadow-indigo-500/10"
            >
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-8 rounded-2xl">
                    <h1 className="text-3xl font-bold text-center mb-2">
                        <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent">
                            Create an Account
                        </span>
                    </h1>
                    <p className="text-center text-gray-600 dark:text-gray-300 mb-8">
                        Join Servio to get started.
                    </p>
                    {error && (
                        <p role="alert" className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 p-3 rounded-lg mb-4 text-sm">
                            {error}
                        </p>
                    )}
                    <form onSubmit={handleEmailSignUp} className="space-y-6" aria-label="Create an account with email and password">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
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
                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                            >
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                aria-required="true"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition"
                            />
                        </div>
                        <motion.button
                            type="submit"
                            aria-label="Sign up"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.96 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                            className="w-full flex justify-center py-2.5 px-4 rounded-md shadow-lg shadow-indigo-500/30 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] hover:bg-[position:right_center] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-[background-position] duration-500"
                        >
                            Sign Up
                        </motion.button>
                    </form>
                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="w-full border-t border-gray-300 dark:border-slate-600" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white dark:bg-slate-900 text-gray-500 dark:text-gray-400">Or sign up with</span>
                            </div>
                        </div>
                        <div className="mt-6">
                            <motion.button
                                onClick={handleGoogleSignIn}
                                aria-label="Sign up with Google"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.96 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-800 text-sm font-medium text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                            >
                                <GoogleLogo />
                                Sign up with Google
                            </motion.button>
                        </div>
                    </div>
                    <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
                        Already a member?{' '}
                        <Link to="/signin" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                            Sign in
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
