import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { TypingText } from "./TypingText";
import { ChevronDown } from "lucide-react";
import { SmoothLink } from "./SmoothLink";

const faqs = [
  {
    q: "How long does a website take to build?",
    a: "Timelines depend on complexity. A landing page typically takes 3–7 days, a business website 1–2 weeks, and a custom web application 4–8 weeks. We'll give you a precise timeline after reviewing your requirements.",
  },
  {
    q: "How much does a website cost?",
    a: "Our projects start at $999 for a landing page. Business websites typically range from $2,499–$4,999, and custom applications from $4,999 upward. Every project is unique, so we provide a free detailed quote after understanding your needs.",
  },
  {
    q: "Do you provide hosting and domain services?",
    a: "We don't sell hosting directly, but we can recommend the best platforms for your project (Vercel, Netlify, AWS, etc.) and handle the full deployment process. We'll guide you through purchasing and setting up your domain.",
  },
  {
    q: "Can I request revisions during development?",
    a: "Absolutely. All plans include revisions — Starter includes 2, Business includes 5, and Premium includes unlimited revisions. We work collaboratively through each milestone to ensure you're completely satisfied.",
  },
  {
    q: "Do you work with businesses outside your country?",
    a: "Yes! We work with clients globally. All communication happens via video calls, email, and project management tools. We accommodate different time zones to ensure smooth collaboration.",
  },
  {
    q: "What happens after my website launches?",
    a: "We don't disappear after launch. We provide a post-launch support period (30 days on Starter, 60 days on Business, 90 days on Premium) to fix any bugs and ensure everything runs smoothly. Ongoing maintenance plans are also available.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  const reduce = useReducedMotion();

  return (
    <section aria-labelledby="faq-title" className="py-20 md:py-32 bg-white dark:bg-slate-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: reduce ? 0 : 0.6 }}
          className="text-center mb-14"
        >
          <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm uppercase tracking-wider">
            FAQ
          </span>
          <h2 id="faq-title" className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mt-3 mb-4">
            Frequently Asked{" "}
            <span className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] bg-clip-text text-transparent">
              <TypingText text="Questions" delay={150} cursorColor="bg-indigo-600" />
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Everything you need to know before getting started.
          </p>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
              whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: reduce ? 0 : 0.4, delay: index * 0.05 }}
              className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
                open === index
                  ? "border-indigo-200 dark:border-indigo-800 shadow-md shadow-indigo-50 dark:shadow-indigo-900/20"
                  : "border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700"
              }`}
            >
              <button
                onClick={() => setOpen(open === index ? null : index)}
                className="w-full flex items-center justify-between px-6 py-5 text-left"
              >
                <span className={`font-semibold transition-colors ${open === index ? "text-indigo-600 dark:text-indigo-400" : "text-gray-900 dark:text-white"}`}>
                  {faq.q}
                </span>
                <ChevronDown
                  className={`w-5 h-5 flex-shrink-0 ml-4 transition-all duration-300 ${
                    open === index ? "rotate-180 text-indigo-500 dark:text-indigo-400" : "text-gray-400 dark:text-gray-500"
                  }`}
                />
              </button>
              <AnimatePresence initial={false}>
                {open === index && (
                  <motion.div
                    key="content"
                    initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                    exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    transition={{ duration: reduce ? 0 : 0.3, ease: "easeInOut" }}
                  >
                    <div className="px-6 pb-5">
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{faq.a}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: reduce ? 0 : 0.5, delay: 0.3 }}
          className="mt-10 text-center p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800"
        >
          <p className="text-gray-600 dark:text-gray-300">
            Still have questions?{" "}
            <SmoothLink
              to="contact"
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
              Get in touch with us
            </SmoothLink>
          </p>
        </motion.div>
      </div>
    </section>
  );
}