import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Home, Compass, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white dark:bg-slate-950 px-4 sm:px-6 lg:px-8">
      {/* Decorative background blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-indigo-500/10 dark:bg-indigo-500/5 blur-[80px] sm:blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-purple-500/10 dark:bg-purple-500/5 blur-[80px] sm:blur-[120px] rounded-full pointer-events-none" />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] dark:bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative z-10 text-center max-w-lg mx-auto">
        {/* Icon Animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
          className="mx-auto w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-600 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-500/25 dark:shadow-indigo-500/10 mb-8 sm:mb-10"
        >
          <Compass className="w-12 h-12 sm:w-14 sm:h-14 text-white animate-[spin_20s_linear_infinite]" />
        </motion.div>

        {/* 404 Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-8xl sm:text-9xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent"
        >
          404
        </motion.h1>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-4 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight"
        >
          Page Not Found
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-4 text-base sm:text-lg text-slate-500 dark:text-slate-400 leading-relaxed px-4"
        >
          Oops! The page you are looking for doesn't exist or has been moved. Let's get you back on track.
        </motion.p>

        {/* Navigation Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center px-4"
        >
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl shadow-md hover:shadow-lg hover:shadow-indigo-500/25 dark:hover:shadow-indigo-500/10 transition-all duration-300 font-semibold text-sm sm:text-base border border-transparent"
          >
            <Home className="w-4 h-4 sm:w-5 sm:h-5" />
            Go Back Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl transition-all duration-300 font-semibold text-sm sm:text-base border border-slate-200 dark:border-slate-800"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            Previous Page
          </button>
        </motion.div>
      </div>
    </div>
  );
}
