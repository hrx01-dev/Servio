import { motion } from 'motion/react';
import { Smartphone, Zap, TrendingUp, Sparkles } from 'lucide-react';

const heroImage = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3ZWJzaXRlJTIwZGFzaGJvYXJkJTIwZGVzaWdufGVufDF8fHx8MTc4MTcwMjY1OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

const floatingCards = [
  { icon: Smartphone, text: 'Mobile Responsive', color: 'from-cyan-500 to-blue-500' },
  { icon: Zap, text: 'Fast Delivery', color: 'from-purple-500 to-pink-500' },
  { icon: TrendingUp, text: 'SEO Optimized', color: 'from-indigo-500 to-purple-500' },
  { icon: Sparkles, text: 'Custom Design', color: 'from-orange-500 to-red-500' },
];

export function Hero() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 pt-20">
      {/* Gradient Mesh Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-indigo-400/30 to-purple-400/30 dark:from-indigo-600/20 dark:to-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-cyan-400/30 to-blue-400/30 dark:from-cyan-600/20 dark:to-blue-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-full border border-indigo-100 dark:border-indigo-900 mb-6"
            >
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-700 dark:text-gray-200">Available for new projects</span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Your Business Deserves a Website That{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Converts
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto lg:mx-0">
              We design and develop modern, fast, and scalable websites tailored to your business goals.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => scrollToSection('contact')}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-2xl hover:shadow-indigo-500/50 transition-all duration-300 font-semibold"
              >
                Get Free Quote
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => scrollToSection('portfolio')}
                className="px-8 py-4 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 rounded-xl border-2 border-gray-200 dark:border-slate-700 hover:border-indigo-600 hover:text-indigo-600 dark:hover:border-indigo-500 dark:hover:text-indigo-400 transition-all duration-300 font-semibold"
              >
                View Portfolio
              </motion.button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-12 pt-12 border-t border-gray-200 dark:border-slate-700">
              <div className="text-center lg:text-left">
                <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  150+
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Projects Done</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  98%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Client Satisfaction</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  5+
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Years Experience</div>
              </div>
            </div>
          </motion.div>

          {/* Right Content - Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative">
              {/* Main Dashboard Image */}
                <div className="relative rounded-2xl overflow-hidden shadow-2xl dark:shadow-2xl dark:shadow-slate-900/50">
                <img
                  src={heroImage}
                  alt="Modern Dashboard Design"
                  className="w-full h-auto dark:opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/10 to-purple-600/10 dark:from-indigo-600/20 dark:to-purple-600/20" />
              </div>

              {/* Floating Cards */}
              {floatingCards.map((card, index) => (
                <motion.div
                  key={card.text}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                  className={`absolute ${
                    index === 0
                      ? 'top-4 -left-4 sm:top-8 sm:-left-8'
                      : index === 1
                      ? 'top-1/3 -right-4 sm:-right-8'
                      : index === 2
                      ? 'bottom-1/3 -left-4 sm:-left-8'
                      : 'bottom-8 -right-4 sm:-right-8'
                  } hidden lg:block`}
                >
                  <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl p-4 shadow-xl border border-gray-100 dark:border-slate-700 flex items-center gap-3 hover:scale-110 transition-transform duration-300">
                    <div className={`w-10 h-10 bg-gradient-to-br ${card.color} rounded-lg flex items-center justify-center`}>
                      <card.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white whitespace-nowrap">
                      {card.text}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
