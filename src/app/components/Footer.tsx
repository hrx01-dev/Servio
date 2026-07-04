import { Zap, Twitter, Github, Linkedin, Instagram, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { SmoothLink } from "./SmoothLink";
import { GlassPanel } from "./GlassPanel";
import { Reveal } from "./motion/Reveal";
import { Jali } from "./motifs";

const services = [
  { label: "Landing Pages", slug: "landing-pages" },
  { label: "Business Websites", slug: "business-websites" },
  { label: "Portfolio Websites", slug: "portfolio-websites" },
  { label: "E-Commerce Stores", slug: "e-commerce-stores" },
  { label: "Custom Web Apps", slug: "custom-web-applications" },
  { label: "Website Maintenance", slug: "website-maintenance" },
];

const company = [
  { label: "About", route: "/about", section: null },
  { label: "Portfolio", route: null, section: "portfolio" },
  { label: "Pricing", route: null, section: "pricing" },
  { label: "Blog", route: "/blog", section: null },
  { label: "Careers", route: "/careers", section: null },
];

const socials = [
  { icon: Twitter, href: "https://x.com/TM_Servio", label: "Twitter" },
  { icon: Linkedin, href: "https://www.linkedin.com/company/servio-0/", label: "LinkedIn" },
  { icon: Github, href: "", label: "GitHub" },
  { icon: Instagram, href: "https://www.instagram.com/__servio?utm_source=qr&igsh=MTFnejZxc3NiODFjOQ==", label: "Instagram" },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-background text-muted-foreground border-t border-border">
      {/* Faint jali lattice strip across the top */}
      <Jali className="absolute inset-x-0 top-0 h-40" color="var(--gold)" opacity={0.05} />
      {/* Subtle brand glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-56 w-[42rem] rounded-full bg-grad-brand opacity-10 blur-3xl"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Glass top-rail */}
        <Reveal>
          <GlassPanel
            tier="thin"
            className="relative overflow-hidden rounded-2xl px-6 py-7 sm:px-8 mb-14 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-display text-xl sm:text-2xl font-semibold text-foreground">
                Let's build something that grows your business.
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Free proposal within 24 hours. No upfront payment required.
              </p>
            </div>
            <SmoothLink
              to="contact"
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-grad-brand px-6 py-3 text-sm font-semibold text-white shadow-elev-2 transition-transform duration-200 hover:-translate-y-0.5"
            >
              Start Your Project
            </SmoothLink>
          </GlassPanel>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-grad-brand flex items-center justify-center shadow-elev-2">
                <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <span
                className="text-xl font-bold tracking-tight text-foreground"
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
                  aria-label={`Servio on ${label}`}
                  className="w-9 h-9 rounded-lg bg-foreground/5 hover:bg-primary border border-border hover:border-primary flex items-center justify-center text-muted-foreground hover:text-primary-foreground transition-all duration-200"
                >
                  <Icon className="w-4 h-4" aria-hidden />
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h2 className="text-foreground font-semibold mb-5 text-base">Services</h2>
            <ul className="space-y-3">
              {services.map(({ label, slug }) => (
                <li key={slug}>
                  <Link to={`/services/${slug}`} className="text-sm hover:text-primary transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h2 className="text-foreground font-semibold mb-5 text-base">Company</h2>
            <ul className="space-y-3">
              {company.map(({ label, route, section }) => (
                <li key={label}>
                  {section ? (
                    <SmoothLink to={section} className="text-sm hover:text-primary transition-colors">
                      {label}
                    </SmoothLink>
                  ) : route ? (
                    <Link to={route} className="text-sm hover:text-primary transition-colors">
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
            <h2 className="text-foreground font-semibold mb-5 text-base">Contact</h2>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm">
                <Mail className="w-4 h-4 mt-0.5 text-gold flex-shrink-0" aria-hidden />
                <span>servio873@gmail.com</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Phone className="w-4 h-4 mt-0.5 text-gold flex-shrink-0" aria-hidden />
                <span>+91 8076 703 146</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <MapPin className="w-4 h-4 mt-0.5 text-gold flex-shrink-0" aria-hidden />
                <span>India</span>
              </li>
            </ul>
            <div className="mt-6">
              <SmoothLink
                to="contact"
                className="inline-flex px-5 py-2.5 bg-grad-brand text-white text-sm font-semibold rounded-xl shadow-elev-2 hover:-translate-y-0.5 transition-all duration-200"
              >
                Get Free Quote
              </SmoothLink>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Servio. All rights reserved.
          </p>

          {/* Explicit "Made in India" cue */}
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex gap-1" aria-hidden>
              <span className="h-1.5 w-1.5 rounded-full bg-saffron" />
              <span className="h-1.5 w-1.5 rounded-full bg-foreground/30" />
              <span className="h-1.5 w-1.5 rounded-full bg-peacock" />
            </span>
            Made in India
          </span>

          <div className="flex gap-6 text-sm">
            <Link to="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="/terms-of-service" className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link to="/cookie-policy" className="hover:text-primary transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
