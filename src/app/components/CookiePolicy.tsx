import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { motion, useReducedMotion } from "motion/react";
import { SEO } from "./SEO";

export function CookiePolicy() {
  const reduce = useReducedMotion();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <SEO
        title="Cookie Policy"
        description="Learn how Servio uses cookies and similar technologies to improve your experience on our website."
        canonical="/cookie-policy"
      />
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: reduce ? 0 : 0.4 }}
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors mb-10"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.5, delay: 0.1 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-8">
            Cookie Policy
          </h1>
          <div className="space-y-8 text-lg leading-relaxed text-gray-600 dark:text-gray-300">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Effective Date: {new Date().toLocaleDateString()}
            </p>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">1. What Are Cookies</h2>
              <p>Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work, or work more efficiently, as well as to provide information to the owners of the site.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">2. How We Use Cookies</h2>
              <p>At Servio, we use cookies primarily to enhance your experience on our website. We use cookies to:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Remember your preferences and settings (e.g., theme preferences).</li>
                <li>Understand how you use our website so we can improve our content and layout.</li>
                <li>Maintain basic functionality, such as security and network management.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">3. Types of Cookies We Use</h2>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li><strong>Essential Cookies:</strong> These cookies are necessary for the website to function properly and cannot be switched off in our systems. They are usually only set in response to actions made by you, such as setting your privacy preferences or logging in.</li>
                <li><strong>Performance and Analytics Cookies:</strong> These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us know which pages are the most and least popular.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">4. Managing Cookies</h2>
              <p>Most web browsers allow you to manage cookies through their settings preferences. However, if you limit the ability of websites to set cookies, you may worsen your overall user experience, since it will no longer be personalized to you.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">5. Contact Us</h2>
              <p>If you have any questions about our use of cookies, please contact us at:</p>
              <p className="mt-4 font-medium text-indigo-600 dark:text-indigo-400">hello@servio.dev</p>
            </section>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
