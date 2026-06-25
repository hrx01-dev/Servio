import { motion, useReducedMotion } from 'motion/react';
import { TypingText } from './TypingText';
import { Check, Star } from 'lucide-react';
import { scrollToSection } from '../lib/scrollToSection';

const plans = [
  {
    name: 'Starter',
    price: '$999',
    description: 'Perfect for small businesses and startups',
    features: [
      'Single Landing Page',
      'Mobile Responsive Design',
      'Basic SEO Optimization',
      'Contact Form Integration',
      '2 Revisions Included',
      '1 Week Delivery',
    ],
    highlighted: false,
  },
  {
    name: 'Business',
    price: '$2,499',
    description: 'Most popular for growing businesses',
    features: [
      'Multi-page Website (Up to 5 pages)',
      'CMS Integration',
      'Advanced SEO & Analytics',
      'E-commerce Ready',
      'Custom Functionality',
      '5 Revisions Included',
      'Priority Support',
      '2 Week Delivery',
    ],
    highlighted: true,
  },
  {
    name: 'Premium',
    price: '$4,999+',
    description: 'For complex web applications',
    features: [
      'Custom Web Application',
      'Advanced Features & Integrations',
      'User Authentication',
      'Database Design',
      'API Development',
      'Unlimited Revisions',
      'Dedicated Project Manager',
      '4 Week Delivery',
      '3 Months Free Support',
    ],
    highlighted: false,
  },
];

export function Pricing() {
  const reduce = useReducedMotion();

  return (
    <section id="pricing" aria-labelledby="pricing-title" className="py-20 md:py-32 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: reduce ? 0 : 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm uppercase tracking-wider">
            Pricing
          </span>
          <h2 id="pricing-title" className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mt-3 mb-4">
            Simple,{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              <TypingText text="Transparent Pricing" delay={150} cursorColor="bg-indigo-600" />
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Choose the perfect plan for your business. All plans include a 30-day money-back guarantee.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
              whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: reduce ? 0 : 0.5, delay: index * 0.1 }}
              className={`relative bg-white dark:bg-slate-900 rounded-2xl p-8 ${
                plan.highlighted
                  ? 'border-2 border-indigo-600 shadow-2xl shadow-indigo-500/20 dark:shadow-indigo-900/30 md:-mt-4 md:mb-4'
                  : 'border-2 border-gray-200 dark:border-slate-800 shadow-lg dark:shadow-slate-900/50'
              }`}
            >
              {/* Popular Badge */}
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="flex items-center gap-1 px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full text-sm font-semibold shadow-lg">
                    <Star className="w-4 h-4 fill-current" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">{plan.description}</p>
                <div className="mb-2">
                  <span className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {plan.price}
                  </span>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">One-time payment</p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                      plan.highlighted
                        ? 'bg-indigo-600'
                        : 'bg-indigo-100'
                    }`}>
                      <Check className={`w-3 h-3 ${
                        plan.highlighted ? 'text-white' : 'text-indigo-600'
                      }`} />
                    </div>
                    <span className="text-gray-700 dark:text-gray-200">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => scrollToSection('contact')}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                  plan.highlighted
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-500/50 hover:scale-105'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
              >
                Get Started
              </button>
            </motion.div>
          ))}
        </div>

        {/* Custom Quote CTA */}
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: reduce ? 0 : 0.6 }}
          className="mt-16 text-center"
        >
          <div className="inline-block p-1 rounded-2xl bg-gray-100 dark:bg-slate-800">
            <div className="px-8 py-6 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Need a custom solution?</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">We build enterprise-grade applications tailored to your specific needs.</p>
              <button
                onClick={() => scrollToSection('contact')}
                className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline inline-flex items-center gap-2"
              >
                Contact us for a custom quote →
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}