import { motion, useReducedMotion } from 'motion/react';
import { TypingText } from './TypingText';
import { ClipboardList, Palette, Code2, Rocket } from 'lucide-react';

const steps = [
  {
    icon: ClipboardList,
    title: 'Requirement Collection',
    description: 'We start by understanding your business goals, target audience, and project requirements.',
    color: 'from-indigo-500 to-blue-500',
  },
  {
    icon: Palette,
    title: 'Design & Planning',
    description: 'Our designers create beautiful mockups and wireframes tailored to your brand.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Code2,
    title: 'Development',
    description: 'We build your website with clean, scalable code following best practices.',
    color: 'from-cyan-500 to-teal-500',
  },
  {
    icon: Rocket,
    title: 'Launch & Support',
    description: 'We deploy your website and provide ongoing support to ensure smooth operation.',
    color: 'from-orange-500 to-red-500',
  },
];

export function Process() {
  const reduce = useReducedMotion();

  return (
    <section aria-labelledby="process-title" className="py-20 md:py-32 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: reduce ? 0 : 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm uppercase tracking-wider">
            Our Process
          </span>
          <h2 id="process-title" className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mt-3 mb-4">
            How We{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              <TypingText text="Work" delay={150} cursorColor="bg-indigo-600" />
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            A streamlined process designed to deliver exceptional results on time and on budget.
          </p>
        </motion.div>

        <div className="relative">
          {/* Connection Line - Hidden on mobile */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-200 via-purple-200 to-cyan-200 dark:from-indigo-800 dark:via-purple-800 dark:to-cyan-800 transform -translate-y-1/2" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
                whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: reduce ? 0 : 0.5, delay: index * 0.1 }}
                className="relative"
              >
                {/* Step Number */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                      <step.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-white dark:bg-slate-900 rounded-full border-2 border-indigo-200 dark:border-indigo-800 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                      {index + 1}
                    </div>
                  </div>
                </div>

                {/* Card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg dark:shadow-slate-900/50 hover:shadow-xl dark:hover:shadow-indigo-900/20 transition-shadow duration-300">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 text-center">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Arrow - Hidden on mobile and last item */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-8 -right-4 items-center justify-center w-8 h-8 bg-white dark:bg-slate-900 rounded-full border-2 border-indigo-200 dark:border-indigo-800 z-10">
                    <svg
                      className="w-4 h-4 text-indigo-600 dark:text-indigo-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}