import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from './firebase';
import { Home } from 'lucide-react';

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
            navigate('/');
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
            navigate('/');
        } catch (err: unknown) {
            if (typeof err === 'object' && err !== null && 'code' in err && 'message' in err) {
                setError((err as { message: string }).message);
            } else {
                setError('An unexpected error occurred with Google Sign-In.');
            }
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-white via-indigo-50/40 to-white dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-950 px-4">
            {/* Animated gradient background blobs */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
                <motion.div
                    className="absolute -top-32 -left-24 w-[560px] h-[560px] rounded-full bg-gradient-to-br from-indigo-400/40 to-purple-400/30 dark:from-indigo-500/20 dark:to-purple-500/15 blur-3xl"
                    animate={{ y: [0, 30, 0], x: [0, 20, 0] }}
                    transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute bottom-[-160px] right-[-120px] w-[520px] h-[520px] rounded-full bg-gradient-to-br from-cyan-400/35 to-teal-300/25 dark:from-cyan-500/15 dark:to-teal-400/10 blur-3xl"
                    animate={{ y: [0, -30, 0], x: [0, -20, 0] }}
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
                            Sign In
                        </span>
                    </h1>
                    <p className="text-center text-gray-600 dark:text-gray-300 mb-8">
                        Welcome back to Servio.
                    </p>
                    {error && (
                        <p role="alert" className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 p-3 rounded-lg mb-4 text-sm">
                            {error}
                        </p>
                    )}
                    <form onSubmit={handleEmailSignIn} className="space-y-6" aria-label="Sign in with email and password">
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
                                autoComplete="current-password"
                                required
                                aria-required="true"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition"
                            />
                        </div>
                        <motion.button
                            type="submit"
                            aria-label="Sign in"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.96 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                            className="w-full flex justify-center py-2.5 px-4 rounded-md shadow-lg shadow-indigo-500/30 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] hover:bg-[position:right_center] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-[background-position] duration-500"
                        >
                            Sign In
                        </motion.button>
                    </form>
                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="w-full border-t border-gray-300 dark:border-slate-600" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white dark:bg-slate-900 text-gray-500 dark:text-gray-400">Or continue with</span>
                            </div>
                        </div>
                        <div className="mt-6">
                            <motion.button
                                onClick={handleGoogleSignIn}
                                aria-label="Sign in with Google"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.96 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                className="w-full inline-flex justify-center py-2.5 px-4 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-800 text-sm font-medium text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                            >
                                Sign in with Google
                            </motion.button>
                        </div>
                    </div>
                    <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
                        Not a member?{' '}
                        <Link to="/signup" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                            Sign up now
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
