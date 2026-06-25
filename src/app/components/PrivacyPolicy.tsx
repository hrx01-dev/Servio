import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { motion, useReducedMotion } from "motion/react";

export function PrivacyPolicy() {
  const reduce = useReducedMotion();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
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
            Privacy Policy
          </h1>
          <div className="space-y-8 text-lg leading-relaxed text-gray-600 dark:text-gray-300">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Effective Date: {new Date().toLocaleDateString()}
            </p>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">1. Information We Collect</h2>
              <p>When you request a quote or contact us through our website, we may collect the following personal information:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Name</li>
                <li>Email address</li>
                <li>Phone number (optional)</li>
                <li>Business name</li>
                <li>Project details and budget information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">2. How We Use Your Information</h2>
              <p>We use the information we collect primarily to provide, maintain, and improve our services. Specifically, we use your data to:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Respond to your inquiries and provide accurate project proposals.</li>
                <li>Communicate with you regarding ongoing projects and updates.</li>
                <li>Ensure compliance with our legal obligations.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">3. Data Protection and Compliance</h2>
              <p>We are committed to protecting your personal data in accordance with applicable data protection laws, including the General Data Protection Regulation (GDPR) and the Digital Personal Data Protection Act (DPDP Act) of India. We implement appropriate technical and organizational measures to ensure a level of security appropriate to the risk, safeguarding your data against unauthorized access, disclosure, or destruction.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">4. Your Rights</h2>
              <p>Depending on your location and applicable laws, you may have the right to access, correct, or delete your personal data. You may also have the right to object to or restrict certain processing of your data. If you wish to exercise any of these rights, please contact us using the information provided below.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">5. Contact Us</h2>
              <p>If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:</p>
              <p className="mt-4 font-medium text-indigo-600 dark:text-indigo-400">hello@servio.dev</p>
            </section>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
