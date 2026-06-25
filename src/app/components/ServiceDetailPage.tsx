import { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, Check, ChevronDown, ArrowRight } from 'lucide-react';
import { services } from '../data/servicesData';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

function FAQItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: reduce ? 0 : 0.4, delay: index * 0.07 }}
      className="border border-white/60 dark:border-slate-700/60 rounded-2xl overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
        aria-expanded={open}
      >
        <span className="font-semibold text-gray-900 dark:text-white">{question}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="shrink-0 text-indigo-500"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="overflow-hidden"
      >
        <p className="px-6 pb-5 text-gray-600 dark:text-gray-300 leading-relaxed">{answer}</p>
      </motion.div>
    </motion.div>
  );
}

export function ServiceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const reduce = useReducedMotion();
  const service = services.find((s) => s.slug === slug);

  if (!service) return <Navigate to="/" replace />;

  const Icon = service.icon;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Navbar />

      <main>
        {/* ── Hero ── */}
        <section className="relative isolate overflow-hidden pt-24 pb-20 md:pt-32 md:pb-28">
          {/* Aurora blobs */}
          <div
            aria-hidden
            className={`pointer-events-none absolute -top-40 -left-32 w-[600px] h-[600px] rounded-full bg-gradient-to-br ${service.color} opacity-20 blur-3xl`}
          />
          <div
            aria-hidden
            className={`pointer-events-none absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-gradient-to-br ${service.color} opacity-15 blur-3xl`}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white via-white/90 to-white dark:from-slate-950 dark:via-slate-950/90 dark:to-slate-950"
          />

          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Back link */}
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: reduce ? 0 : 0.4 }}
            >
              <Link
                to="/#services"
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors mb-10"
              >
                <ArrowLeft className="w-4 h-4" />
                All Services
              </Link>
            </motion.div>

            {/* Icon chip */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: reduce ? 0 : 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="mb-7"
            >
              <div className="relative inline-block">
                <div
                  className={`absolute -inset-3 rounded-2xl bg-gradient-to-br ${service.color} opacity-40 blur-xl`}
                />
                <div
                  className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${service.color} ring-1 ring-white/40 dark:ring-white/20 shadow-lg flex items-center justify-center`}
                >
                  <span
                    aria-hidden
                    className="absolute inset-x-1 top-1 h-1/2 rounded-t-xl bg-gradient-to-b from-white/50 to-transparent"
                  />
                  <Icon className="relative w-8 h-8 text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.25)]" />
                </div>
              </div>
            </motion.div>

            {/* Heading */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduce ? 0 : 0.55, delay: 0.1 }}
            >
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm uppercase tracking-wider">
                Our Services
              </span>
              <h1 className="mt-3 text-4xl md:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                {service.title}
              </h1>
              <p className="mt-4 text-xl md:text-2xl text-gray-600 dark:text-gray-300 font-medium">
                {service.tagline}
              </p>
              <p className="mt-4 text-lg text-gray-500 dark:text-gray-400 max-w-2xl leading-relaxed">
                {service.whatIsIt}
              </p>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduce ? 0 : 0.5, delay: 0.2 }}
              className="mt-9 flex flex-wrap gap-4"
            >
              <a
                href="/#quote"
                className={`inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r ${service.color} shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200`}
              >
                Get a Free Quote
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="/#services"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white/60 dark:bg-slate-900/60 backdrop-blur transition-all duration-200"
              >
                View All Services
              </a>
            </motion.div>
          </div>
        </section>

        {/* ── What's included ── */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-white to-indigo-50/40 dark:from-slate-950 dark:to-indigo-950/10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: reduce ? 0 : 0.5 }}
              className="mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                What's{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500">
                  included
                </span>
              </h2>
              <p className="mt-3 text-gray-500 dark:text-gray-400 text-lg">
                Everything delivered in your package — no hidden extras.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 gap-4">
              {service.includes.map((item, i) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: reduce ? 0 : 0.4, delay: i * 0.06 }}
                  className="flex items-start gap-3 p-4 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-white/60 dark:border-slate-700/50 backdrop-blur-sm shadow-sm"
                >
                  <span className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br ${service.color} flex items-center justify-center`}>
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </span>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">{item}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Ideal for ── */}
        <section className="py-16 md:py-24 bg-white dark:bg-slate-950">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: reduce ? 0 : 0.5 }}
              className="mb-10"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                Who it's{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500">
                  for
                </span>
              </h2>
              <p className="mt-3 text-gray-500 dark:text-gray-400 text-lg">
                This service is a great fit if you are…
              </p>
            </motion.div>

            <div className="flex flex-wrap gap-3">
              {service.idealFor.map((item, i) => (
                <motion.span
                  key={item}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ duration: reduce ? 0 : 0.35, delay: i * 0.07 }}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold border border-transparent bg-gradient-to-r ${service.color} text-white shadow-md`}
                >
                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  {item}
                </motion.span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Process ── */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-indigo-50/40 to-white dark:from-indigo-950/10 dark:to-slate-950">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: reduce ? 0 : 0.5 }}
              className="mb-14 text-center"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                How we{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500">
                  work
                </span>
              </h2>
              <p className="mt-3 text-gray-500 dark:text-gray-400 text-lg">
                A clear process from first conversation to launch day.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-4 gap-6">
              {service.process.map((step, i) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: reduce ? 0 : 0.5, delay: i * 0.1 }}
                  className="relative group"
                >
                  {/* Connector line (hidden on last) */}
                  {i < service.process.length - 1 && (
                    <div
                      aria-hidden
                      className="hidden md:block absolute top-6 left-[calc(50%+28px)] right-[-50%] h-px bg-gradient-to-r from-indigo-300/70 to-transparent dark:from-indigo-700/50"
                    />
                  )}

                  <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-white/60 dark:border-slate-700/50 backdrop-blur-sm shadow-sm group-hover:shadow-md transition-shadow duration-300">
                    <div
                      className={`w-12 h-12 rounded-full bg-gradient-to-br ${service.color} flex items-center justify-center text-white font-bold text-lg shadow-md mb-4`}
                    >
                      {step.step}
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Highlights ── */}
        <section className="py-16 md:py-24 bg-white dark:bg-slate-950">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: reduce ? 0 : 0.5 }}
              className="mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                Why it{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500">
                  stands out
                </span>
              </h2>
              <p className="mt-3 text-gray-500 dark:text-gray-400 text-lg">
                The details that make the difference.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 gap-6">
              {service.highlights.map((h, i) => (
                <motion.div
                  key={h.title}
                  initial={{ opacity: 0, y: 24, scale: 0.97 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: reduce ? 0 : 0.5, delay: i * 0.1 }}
                  className="relative overflow-hidden group rounded-2xl p-7 bg-white/55 dark:bg-slate-900/55 border border-white/60 dark:border-slate-700/60 backdrop-blur-xl shadow-sm hover:shadow-lg transition-shadow duration-300"
                >
                  <div
                    aria-hidden
                    className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-[0.06] transition-opacity duration-500`}
                  />
                  <div
                    className={`inline-flex w-10 h-10 rounded-xl bg-gradient-to-br ${service.color} items-center justify-center mb-4 shadow`}
                  >
                    <Check className="w-5 h-5 text-white" strokeWidth={2.5} />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">{h.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{h.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQs ── */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-indigo-50/40 to-white dark:from-indigo-950/10 dark:to-slate-950">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: reduce ? 0 : 0.5 }}
              className="mb-12 text-center"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                Common{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500">
                  questions
                </span>
              </h2>
              <p className="mt-3 text-gray-500 dark:text-gray-400 text-lg">
                Everything you need to know before getting started.
              </p>
            </motion.div>

            <div className="space-y-3">
              {service.faqs.map((faq, i) => (
                <FAQItem key={faq.question} question={faq.question} answer={faq.answer} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA banner ── */}
        <section className="py-16 md:py-24 bg-white dark:bg-slate-950">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: reduce ? 0 : 0.6 }}
              className="relative overflow-hidden rounded-3xl p-10 md:p-14 text-center border border-white/60 dark:border-slate-700/60 bg-white/55 dark:bg-slate-900/55 backdrop-blur-2xl shadow-xl"
            >
              {/* Gradient blobs inside card */}
              <div
                aria-hidden
                className={`pointer-events-none absolute -top-20 -left-20 w-72 h-72 rounded-full bg-gradient-to-br ${service.color} opacity-20 blur-3xl`}
              />
              <div
                aria-hidden
                className={`pointer-events-none absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-gradient-to-br ${service.color} opacity-15 blur-3xl`}
              />

              <div className="relative z-10">
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm uppercase tracking-wider">
                  Ready to start?
                </span>
                <h2 className="mt-3 text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                  Let's build your{' '}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500">
                    {service.title.toLowerCase()}
                  </span>
                </h2>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
                  Tell us about your project and we'll get back to you with a tailored quote — usually within 24 hours.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-4">
                  <a
                    href="/#quote"
                    className={`inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white bg-gradient-to-r ${service.color} shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200`}
                  >
                    Get a Free Quote
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <Link
                    to="/#services"
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white/60 dark:bg-slate-900/60 transition-all duration-200"
                  >
                    Explore Other Services
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
