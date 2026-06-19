import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from './firebase';
import { Home } from 'lucide-react';

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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-md w-full bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg"
            >
                <Link to="/" className="absolute top-4 left-4 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">
                    <Home className="w-6 h-6" />
                </Link>
                <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">
                    Create an Account
                </h2>
                <p className="text-center text-gray-600 dark:text-gray-300 mb-8">
                    Join Servio to get started.
                </p>
                {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</p>}
                <form onSubmit={handleEmailSignUp} className="space-y-6">
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
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                    <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Sign Up
                    </button>
                </form>
                <div className="mt-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300 dark:border-slate-600" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400">Or sign up with</span>
                        </div>
                    </div>
                    <div className="mt-6">
                        <button onClick={handleGoogleSignIn} className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-700 text-sm font-medium text-gray-500 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600">
                            Sign up with Google
                        </button>
                    </div>
                </div>
                <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
                    Already a member?{' '}
                    <Link to="/signin" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                        Sign in
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}