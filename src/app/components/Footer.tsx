import { Zap, Twitter, Github, Linkedin, Instagram, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { SmoothLink } from "./SmoothLink";

const services = [
  "Landing Pages",
  "Business Websites",
  "Portfolio Websites",
  "E-Commerce Stores",
  "Custom Web Apps",
  "Website Maintenance",
];

const company = [
  { label: "About", route: "/about", section: null },
  { label: "Portfolio", route: null, section: "portfolio" },
  { label: "Pricing", route: null, section: "pricing" },
  { label: "Blog", route: "/blog", section: null },
  { label: "Careers", route: "/careers", section: null },
];

const socials = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Github, href: "#", label: "GitHub" },
  { icon: Instagram, href: "#", label: "Instagram" },
];

export function Footer() {
  return (
    <footer className="bg-[#0a0a14] text-gray-400 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <span
                className="text-xl font-bold tracking-tight text-white"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Servio
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-6">
              Websites Built for Your Business. We help startups, small businesses, and creators grow their online presence.
            </p>
            <div className="flex gap-3">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-lg bg-white/5 hover:bg-indigo-600 border border-white/10 hover:border-indigo-500 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-semibold mb-5">Services</h4>
            <ul className="space-y-3">
              {services.map((s) => (
                <li key={s}>
                  <SmoothLink to="services" className="text-sm hover:text-indigo-400 transition-colors">
                    {s}
                  </SmoothLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-5">Company</h4>
            <ul className="space-y-3">
              {company.map(({ label, route, section }) => (
                <li key={label}>
                  {section ? (
                    <SmoothLink to={section} className="text-sm hover:text-indigo-400 transition-colors">
                      {label}
                    </SmoothLink>
                  ) : route ? (
                    <Link to={route} className="text-sm hover:text-indigo-400 transition-colors">
                      {label}
                    </Link>
                  ) : (
                    <span className="text-sm cursor-default">{label}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-5">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm">
                <Mail className="w-4 h-4 mt-0.5 text-indigo-400 flex-shrink-0" />
                <span>hello@servio.dev</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Phone className="w-4 h-4 mt-0.5 text-indigo-400 flex-shrink-0" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <MapPin className="w-4 h-4 mt-0.5 text-indigo-400 flex-shrink-0" />
                <span>San Francisco, CA, USA</span>
              </li>
            </ul>
            <div className="mt-6">
              <SmoothLink
                to="contact"
                className="inline-flex px-5 py-2.5 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all duration-200"
              >
                Get Free Quote
              </SmoothLink>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Servio. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <Link to="/privacy-policy" className="hover:text-indigo-400 transition-colors">Privacy Policy</Link>
            <Link to="/terms-of-service" className="hover:text-indigo-400 transition-colors">Terms of Service</Link>
            <Link to="/cookie-policy" className="hover:text-indigo-400 transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
