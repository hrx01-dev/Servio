import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Sarah Chen",
    role: "CEO",
    company: "TechStart Inc.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&auto=format",
    rating: 5,
    text: "Servio transformed our online presence completely. Our new website loads in under 2 seconds and our conversion rate jumped by 47% within the first month. The team was incredibly professional and delivered ahead of schedule.",
  },
  {
    id: 2,
    name: "Marcus Thompson",
    role: "Founder",
    company: "Bloom Digital",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&auto=format",
    rating: 5,
    text: "Working with Servio was seamless from start to finish. They took our rough ideas and turned them into a stunning e-commerce store that our customers love. Revenue increased 3x in just 60 days after launch.",
  },
  {
    id: 3,
    name: "Priya Mehta",
    role: "Creative Director",
    company: "Artisan Studio",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&auto=format",
    rating: 5,
    text: "The portfolio website Servio built for us is breathtaking. Every client who visits comments on how impressive and polished it looks. The attention to micro-interactions and detail is unmatched.",
  },
  {
    id: 4,
    name: "James Rivera",
    role: "COO",
    company: "CloudSync Labs",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&auto=format",
    rating: 5,
    text: "We needed a complex SaaS dashboard built quickly. Servio delivered in 3 weeks with clean code, excellent documentation, and ongoing support that's been invaluable. Highly recommend.",
  },
];

export function Testimonials() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const prev = () => {
    setDirection(-1);
    setCurrent((c) => (c - 1 + testimonials.length) % testimonials.length);
  };

  const next = () => {
    setDirection(1);
    setCurrent((c) => (c + 1) % testimonials.length);
  };

  return (
    <section aria-labelledby="testimonials-title" className="py-20 md:py-32 bg-gradient-to-br from-[#0f0f1a] to-[#1a1040] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-cyan-400 font-semibold text-sm uppercase tracking-wider">
            Testimonials
          </span>
          <h2 id="testimonials-title" className="text-4xl md:text-5xl font-bold text-white mt-3 mb-4">
            What Our{" "}
            <span className="bg-gradient-to-r from-[#4F46E5] to-[#06B6D4] bg-clip-text text-transparent">
              Clients Say
            </span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Don't just take our word for it — hear from the businesses we've helped grow.
          </p>
        </motion.div>

        {/* Carousel */}
        <div className="relative max-w-4xl mx-auto">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current}
              custom={direction}
              initial={{ opacity: 0, x: direction * 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -60 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-6">
                {Array.from({ length: testimonials[current].rating }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-white/90 text-lg md:text-xl leading-relaxed mb-8">
                "{testimonials[current].text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <img
                  src={testimonials[current].avatar}
                  alt={testimonials[current].name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-indigo-400/50"
                />
                <div>
                  <div className="font-bold text-white">{testimonials[current].name}</div>
                  <div className="text-gray-400 text-sm">
                    {testimonials[current].role} · {testimonials[current].company}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === current ? "w-8 bg-indigo-500" : "w-2 bg-white/20 hover:bg-white/40"
                  }`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={prev}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
                aria-label="Previous"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={next}
                className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
                aria-label="Next"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
