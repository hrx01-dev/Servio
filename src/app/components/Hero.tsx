import { motion, useReducedMotion } from 'motion/react';
import { Smartphone, Zap, TrendingUp, Sparkles } from 'lucide-react';
import { useState, useRef } from 'react';
import { TypingText } from './TypingText';

const heroImage = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3ZWJzaXRlJTIwZGFzaGJvYXJkJTIwZGVzaWdufGVufDF8fHx8MTc4MTcwMjY1OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

const floatingCards = [
  { icon: Smartphone, text: 'Mobile Responsive', color: 'from-cyan-500 to-blue-500' },
  { icon: Zap, text: 'Fast Delivery', color: 'from-purple-500 to-pink-500' },
  { icon: TrendingUp, text: 'SEO Optimized', color: 'from-indigo-500 to-purple-500' },
  { icon: Sparkles, text: 'Custom Design', color: 'from-orange-500 to-red-500' },
];

export function Hero() {
  const reduce = useReducedMotion();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduce) return;
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePosition({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    }
  };

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 pt-20" onMouseMove={handleMouseMove} ref={containerRef}>
      {/* Gradient Mesh Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-indigo-400/30 to-purple-400/30 dark:from-indigo-600/20 dark:to-purple-600/20 rounded-full blur-3xl animate-pulse motion-reduce:animate-none" />
        <div className="absolute -bottom-1/2 -right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-cyan-400/30 to-blue-400/30 dark:from-cyan-600/20 dark:to-blue-600/20 rounded-full blur-3xl animate-pulse motion-reduce:animate-none" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.6 }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              transition={{ duration: reduce ? 0 : 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-full border border-indigo-100 dark:border-indigo-900 mb-6"
            >
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse motion-reduce:animate-none" />
              <span className="text-sm text-gray-700 dark:text-gray-200">Available for new projects</span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Your Business Deserves a Website That{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                <TypingText text="Converts" delay={1200} triggerOnView={false} cursorColor="bg-indigo-600" />
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto lg:mx-0">
              We design and develop modern, fast, and scalable websites tailored to your business goals.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <motion.button
                whileHover={reduce ? undefined : { scale: 1.05 }}
                whileTap={reduce ? undefined : { scale: 0.95 }}
                onClick={() => scrollToSection('contact')}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-2xl hover:shadow-indigo-500/50 transition-all duration-300 font-semibold"
              >
                Get Free Quote
              </motion.button>
              <motion.button
                whileHover={reduce ? undefined : { scale: 1.05 }}
                whileTap={reduce ? undefined : { scale: 0.95 }}
                onClick={() => scrollToSection('portfolio')}
                className="px-8 py-4 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 rounded-xl border-2 border-gray-200 dark:border-slate-700 hover:border-indigo-600 hover:text-indigo-600 dark:hover:border-indigo-500 dark:hover:text-indigo-400 transition-all duration-300 font-semibold"
              >
                View Portfolio
              </motion.button>
            </div>

            {/* What we deliver — honest, verifiable claims rather than
                unverified vanity metrics. */}
            <div className="grid grid-cols-3 gap-6 mt-12 pt-12 border-t border-gray-200 dark:border-slate-700">
              <div className="text-center lg:text-left">
                <div className="text-2xl lg:text-3xl font-bold leading-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  100%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Custom Code</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-2xl lg:text-3xl font-bold leading-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Mobile-First
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Responsive Design</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-2xl lg:text-3xl font-bold leading-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  SEO-Ready
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Built to Rank</div>
              </div>
            </div>
          </motion.div>

          {/* Right Content - Dashboard Mockup */}
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, x: 20 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, x: 0 }}
            transition={{ duration: reduce ? 0 : 0.6, delay: 0.2 }}
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
                <motion.div
                  className="absolute inset-0 bg-gradient-to-tr from-indigo-600/10 to-purple-600/10 dark:from-indigo-600/20 dark:to-purple-600/20"
                  animate={reduce ? undefined : {
                    opacity: [0.6, 1, 0.6],
                    scale: [1, 1.04, 1],
                    backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              </div>

              {/* Floating Cards */}
              {floatingCards.map((card, index) => {
                const cardAnimations = [
                  {
                    y: [0, -20, 0, 12, 0],
                    x: [0, 8, 0, -8, 0],
                    rotate: [-3, 3, -3],
                  },
                  {
                    y: [0, -18, 0, 15, 0],
                    x: [0, -10, 0, 10, 0],
                    rotate: [2, -2, 2],
                  },
                  {
                    y: [0, -25, 0, 10, 0],
                    x: [0, 12, 0, -12, 0],
                    rotate: [-2, 2, -2],
                  },
                  {
                    y: [0, -22, 0, 14, 0],
                    x: [0, -6, 0, 6, 0],
                    rotate: [3, -3, 3],
                  },
                ];

                const parallaxMultipliers = [8, -10, 6, -8];
                const multiplier = reduce ? 0 : parallaxMultipliers[index];
                const parallaxX = (mousePosition.x - 0.5) * multiplier;
                const parallaxY = (mousePosition.y - 0.5) * multiplier;

                return (
                  <div
                    key={card.text}
                    className={`absolute ${
                      index === 0
                        ? 'top-4 -left-4 sm:top-8 sm:-left-8'
                        : index === 1
                        ? 'top-1/3 -right-4 sm:-right-8'
                        : index === 2
                        ? 'bottom-1/3 -left-4 sm:-left-8'
                        : 'bottom-8 -right-4 sm:-right-8'
                    } hidden lg:block`}
                    style={{
                      transform: `translate(${parallaxX}px, ${parallaxY}px)`,
                      transition: 'transform 0.15s ease-out',
                    }}
                  >
                    <motion.div
                      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
                      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '0px 0px -100px 0px' }}
                      transition={{ duration: reduce ? 0 : 0.6, delay: 0.3 + index * 0.15 }}
                    >
                    <motion.div
                      animate={reduce ? undefined : { ...cardAnimations[index] }}
                      transition={{
                        duration: 5,
                        repeat: Infinity,
                        repeatType: 'mirror' as const,
                        ease: 'easeInOut',
                      }}
                      whileHover={reduce ? undefined : {
                        y: -12,
                        scale: 1.08,
                        rotate: 2,
                        boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
                      }}
                      className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl p-4 shadow-xl border border-gray-100 dark:border-slate-700 flex items-center gap-3 cursor-pointer group transition-shadow duration-300"
                      style={{
                        filter: 'drop-shadow(0 10px 25px rgba(0,0,0,0.1)) drop-shadow(0 0 20px rgba(99,102,241,0.1))',
                      }}
                    >
                      {/* Glowing gradient border overlay */}
                      <motion.div
                        className="absolute inset-0 rounded-2xl pointer-events-none"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        animate={reduce ? undefined : {
                          boxShadow: [
                            `inset 0 0 20px rgba(99,102,241,0), inset 0 0 0px ${card.color}`,
                            `inset 0 0 20px rgba(99,102,241,0.2), inset 0 0 1px rgba(99,102,241,0.5)`,
                            `inset 0 0 20px rgba(99,102,241,0), inset 0 0 0px ${card.color}`,
                          ],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      />

                      <div
                        className={`w-10 h-10 bg-gradient-to-br ${card.color} rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:shadow-2xl relative overflow-hidden`}
                      >
                        {/* Pulsing glow effect on icon */}
                        <motion.div
                          className={`absolute inset-0 bg-gradient-to-br ${card.color} rounded-lg blur-md`}
                          animate={reduce ? undefined : {
                            opacity: [0.3, 0.6, 0.3],
                            scale: [1, 1.1, 1],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                        />
                        <card.icon className="w-5 h-5 text-white relative z-10" />
                      </div>

                      <span className="font-medium text-gray-900 dark:text-white whitespace-nowrap relative z-10">
                        {card.text}
                      </span>
                    </motion.div>
                  </motion.div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
