import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { ExternalLink, ImageOff } from 'lucide-react';
import { usePublishedPortfolio } from '../hooks/usePortfolio';
import { deriveCategories } from '../lib/portfolio';

export function Portfolio() {
  const reduce = useReducedMotion();
  const { projects, loading } = usePublishedPortfolio();
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = deriveCategories(projects);
  // If the active filter no longer exists (data changed), fall back to "All".
  const effectiveCategory = categories.includes(activeCategory)
    ? activeCategory
    : 'All';
  const filteredProjects =
    effectiveCategory === 'All'
      ? projects
      : projects.filter((project) => project.category === effectiveCategory);

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
            Real projects we have built — from AI-powered SaaS platforms to business websites and e-commerce stores.
          </p>
        </motion.div>

        {loading ? (
          <div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            aria-busy="true"
            aria-label="Loading portfolio"
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl overflow-hidden shadow-lg bg-white dark:bg-slate-900"
              >
                <div className="h-64 bg-gray-100 dark:bg-slate-800 animate-pulse" />
                <div className="p-6 space-y-3">
                  <div className="h-4 w-24 bg-gray-100 dark:bg-slate-800 rounded animate-pulse" />
                  <div className="h-6 w-3/4 bg-gray-100 dark:bg-slate-800 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-12">
            Our showcase is coming soon — check back shortly.
          </p>
        ) : (
          <>
            {/* Filter Tabs */}
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-300 ${
                    effectiveCategory === category
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
                key={effectiveCategory}
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
                      {project.imageUrl ? (
                        <img
                          src={project.imageUrl}
                          alt={project.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-slate-600">
                          <ImageOff className="w-10 h-10" aria-hidden="true" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* View Project Button */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {project.projectUrl ? (
                          <a
                            href={project.projectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-3 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg font-semibold flex items-center gap-2 hover:scale-105 transition-transform"
                          >
                            View Project
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        ) : (
                          <span className="px-6 py-3 bg-white/80 dark:bg-slate-800/80 text-gray-500 dark:text-gray-400 rounded-lg font-semibold flex items-center gap-2 cursor-default">
                            Coming Soon
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-full">
                          {project.category}
                        </span>
                        {project.industry && (
                          <span className="text-sm text-gray-500 dark:text-gray-400">{project.industry}</span>
                        )}
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                        {project.title}
                      </h3>

                      <div className="flex flex-wrap gap-2">
                        {project.technologies.map((t) => (
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
          </>
        )}
      </div>
    </section>
  );
}
