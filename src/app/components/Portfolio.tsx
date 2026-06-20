import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { ExternalLink } from 'lucide-react';

// A web-development workstation (code + a site in the browser) — depicts the
// actual deliverable. Replaces an earlier generic stock portrait of a person,
// which did not show any website/landing-page work.
const portfolioImage1 = "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080&auto=format";
const portfolioImage2 = "https://images.unsplash.com/photo-1487014679447-9f8336841d58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlY29tbWVyY2UlMjB3ZWJzaXRlJTIwbW9ja3VwfGVufDF8fHx8MTc4MTcwMjY2MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const portfolioImage3 = "https://images.unsplash.com/photo-1561070791-2526d30994b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0Zm9saW8lMjBjcmVhdGl2ZSUyMGRlc2lnbnxlbnwxfHx8fDE3ODE3MDI2NjB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
// Generic analytics-dashboard photo (no third-party branding). Replaces an
// earlier image that was a screenshot of Adalo's marketing site — shipping a
// real third-party product as our own portfolio work was a trademark/honesty risk.
const portfolioImage4 = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080&auto=format";
const portfolioImage5 = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080&auto=format";
const portfolioImage6 = "https://images.unsplash.com/photo-1558655146-9f40138edfeb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080&auto=format";

const projects = [
  {
    id: 1,
    title: 'TechStart Landing',
    category: 'Business',
    industry: 'Technology',
    image: portfolioImage1,
    tech: ['React', 'Tailwind', 'Vercel'],
  },
  {
    id: 2,
    title: 'Online Store',
    category: 'E-Commerce',
    industry: 'Retail',
    image: portfolioImage2,
    tech: ['Next.js', 'Stripe', 'Shopify'],
  },
  {
    id: 3,
    title: 'Creative Portfolio',
    category: 'Portfolio',
    industry: 'Design',
    image: portfolioImage3,
    tech: ['React', 'Framer Motion', 'Firebase'],
  },
  {
    id: 4,
    title: 'CloudSync SaaS',
    category: 'SaaS',
    industry: 'Software',
    image: portfolioImage4,
    tech: ['React', 'Node.js', 'PostgreSQL'],
  },
  {
    id: 5,
    title: 'Local Restaurant',
    category: 'Business',
    industry: 'Food & Beverage',
    image: portfolioImage5,
    tech: ['WordPress', 'WooCommerce'],
  },
  {
    id: 6,
    title: 'Designer Showcase',
    category: 'Portfolio',
    industry: 'Creative',
    image: portfolioImage6,
    tech: ['Webflow', 'Custom CSS'],
  },
];

const categories = ['All', 'Business', 'Portfolio', 'E-Commerce', 'SaaS'];

export function Portfolio() {
  const reduce = useReducedMotion();
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredProjects =
    activeCategory === 'All'
      ? projects
      : projects.filter((project) => project.category === activeCategory);

  return (
    <section id="portfolio" aria-labelledby="portfolio-title" className="py-20 md:py-32 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: reduce ? 0 : 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm uppercase tracking-wider">
            What We Build
          </span>
          <h2 id="portfolio-title" className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mt-3 mb-4">
            Portfolio{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Showcase
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            A look at the kind of sites we craft — sample concepts that show our range and quality.
          </p>
        </motion.div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-300 ${
                activeCategory === category
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Portfolio Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -20 }}
            transition={{ duration: reduce ? 0 : 0.5 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                transition={{ duration: reduce ? 0 : 0.5, delay: index * 0.1 }}
                className="group relative bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-lg dark:shadow-slate-900/50 hover:shadow-2xl dark:hover:shadow-indigo-900/20 transition-all duration-300"
              >
                {/* Image */}
                <div className="relative h-64 overflow-hidden bg-gray-100 dark:bg-slate-800">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* View Project Button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button className="px-6 py-3 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg font-semibold flex items-center gap-2 hover:scale-105 transition-transform">
                      View Project
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-full">
                      {project.category}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{project.industry}</span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {project.title}
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    {project.tech.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-1 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-400 text-[10px] font-medium rounded-md border border-gray-100 dark:border-slate-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}