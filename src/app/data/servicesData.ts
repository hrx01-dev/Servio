import { FileText, Globe, Briefcase, ShoppingCart, Code, Settings, type LucideIcon } from 'lucide-react';

export interface ServiceData {
  slug: string;
  icon: LucideIcon;
  title: string;
  tagline: string;
  description: string;
  color: string;
  heroGradient: string;
  whatIsIt: string;
  includes: string[];
  idealFor: string[];
  process: { step: number; title: string; description: string }[];
  highlights: { title: string; description: string }[];
  faqs: { question: string; answer: string }[];
}

export const services: ServiceData[] = [
  {
    slug: 'landing-pages',
    icon: FileText,
    title: 'Landing Pages',
    tagline: 'Convert visitors into customers from the first click.',
    description: 'High-converting landing pages designed to capture leads and drive conversions.',
    color: 'from-indigo-500 to-blue-500',
    heroGradient: 'from-indigo-600 to-blue-600',
    whatIsIt:
      'A landing page is a standalone web page built with a single focused goal — capturing email signups, selling a product, or registering event attendees. Unlike a full website, every element is purpose-built to guide the visitor toward one action.',
    includes: [
      'Custom hero section with compelling headline & CTA',
      'Social proof — testimonials, trust badges, logos',
      'Feature / benefit sections with icons or illustrations',
      'Lead capture form with email integration',
      'Mobile-first responsive design',
      'SEO meta tags & Open Graph setup',
      'Analytics integration (Google Analytics / Pixel)',
      'A/B testing–ready structure',
    ],
    idealFor: [
      'Product launches & pre-launch waitlists',
      'Ad campaign destinations (Google, Meta, LinkedIn)',
      'Event registrations & webinars',
      'SaaS free trial or demo signups',
      'Local business lead generation',
    ],
    process: [
      { step: 1, title: 'Discovery Call', description: 'We learn your goal, audience, and offer to shape the page strategy.' },
      { step: 2, title: 'Wireframe & Copy', description: 'We draft the page structure and persuasive copy before any design begins.' },
      { step: 3, title: 'Design & Build', description: 'Pixel-perfect design is coded into a fast, accessible, production-ready page.' },
      { step: 4, title: 'Review & Launch', description: 'You review, we refine, then go live with full QA across devices and browsers.' },
    ],
    highlights: [
      { title: 'Conversion-First Design', description: 'Every layout decision is informed by CRO principles, not just aesthetics.' },
      { title: 'Sub-2s Load Time', description: 'Optimised assets, lazy loading, and CDN delivery keep bounce rates low.' },
      { title: 'Integrates Everywhere', description: 'Works with Mailchimp, HubSpot, ActiveCampaign, Zapier, and any CRM you already use.' },
      { title: 'GDPR Ready', description: 'Cookie consent, privacy-compliant forms, and secure data handling out of the box.' },
    ],
    faqs: [
      { question: 'How long does it take to build a landing page?', answer: 'Typically 5–10 business days from approved copy/wireframe to launch-ready page.' },
      { question: 'Can I update the page myself after launch?', answer: 'Yes — we deliver with a CMS option or simple editable sections so you stay in control.' },
      { question: 'Do you write the copy?', answer: 'Yes, copywriting is included. We research your audience and offer before writing.' },
      { question: 'Will it work with my existing domain?', answer: 'Absolutely. We deploy to any subdomain or path on your existing domain.' },
    ],
  },
  {
    slug: 'business-websites',
    icon: Globe,
    title: 'Business Websites',
    tagline: 'Your brand online — professional, fast, and built to grow.',
    description: 'Professional multi-page websites that establish your online presence.',
    color: 'from-purple-500 to-pink-500',
    heroGradient: 'from-purple-600 to-pink-600',
    whatIsIt:
      'A business website is your 24/7 digital storefront. It communicates who you are, what you offer, and why clients should choose you — then makes it easy for them to act. We build multi-page sites that balance brand storytelling with clear conversion paths.',
    includes: [
      'Home, About, Services, Contact pages (+ more)',
      'Custom brand-aligned design system',
      'Blog / news section with CMS',
      'Contact forms with email routing',
      'Google Maps integration',
      'On-page SEO foundation — meta, schema, sitemap',
      'Social media link integration',
      'HTTPS, domain, and hosting setup guidance',
    ],
    idealFor: [
      'Small to medium-sized businesses going online',
      'Service providers — agencies, consultants, law firms',
      'Local businesses wanting to rank in their city',
      'Startups building their first credibility hub',
      'Established brands refreshing an outdated site',
    ],
    process: [
      { step: 1, title: 'Brand Intake', description: 'Colors, fonts, tone of voice, competitors — we gather everything that shapes your identity.' },
      { step: 2, title: 'Sitemap & Architecture', description: 'We plan the page hierarchy and user journeys before writing a line of code.' },
      { step: 3, title: 'Design System', description: 'A reusable component library is built so every page looks cohesive and scales easily.' },
      { step: 4, title: 'Build, Test & Launch', description: 'Full-stack build with cross-browser QA, accessibility audit, and performance checks before going live.' },
    ],
    highlights: [
      { title: 'Brand-True Design', description: 'We design around your existing visual identity — or create one from scratch if you need it.' },
      { title: 'SEO Foundation', description: 'Semantic HTML, structured data, page speed, and a clean sitemap so Google can find and rank you.' },
      { title: 'CMS-Powered', description: 'Update your own content — blog posts, team bios, service pages — without touching code.' },
      { title: 'Scales With You', description: 'Architecture planned for future pages, languages, or features without costly rewrites.' },
    ],
    faqs: [
      { question: 'How many pages are included?', answer: 'Standard packages include 5–8 pages. Additional pages are available at a flat rate per page.' },
      { question: 'Do you handle hosting?', answer: 'We can deploy to your preferred host or recommend and set up a managed host for you.' },
      { question: 'What CMS do you use?', answer: "We typically use Sanity, Contentful, or headless WordPress — chosen based on your team's comfort level." },
      { question: 'Can I see examples of your work?', answer: 'Yes — check our Portfolio section for recent business website projects.' },
    ],
  },
  {
    slug: 'portfolio-websites',
    icon: Briefcase,
    title: 'Portfolio Websites',
    tagline: 'Make your work impossible to ignore.',
    description: 'Showcase your work with stunning portfolio designs that impress clients.',
    color: 'from-cyan-500 to-teal-500',
    heroGradient: 'from-cyan-600 to-teal-600',
    whatIsIt:
      "A portfolio website is your personal brand in digital form. It's the first thing prospective clients, employers, or collaborators look at — and it needs to communicate your skill, taste, and personality at a glance. We craft portfolios that feel as impressive as the work inside them.",
    includes: [
      'Curated project gallery with case study pages',
      'Animated hero / personal introduction',
      'Skills, services, or expertise section',
      'Filterable project categories',
      'Downloadable CV / resume integration',
      'Contact form with calendar booking option',
      'Dark / light mode toggle',
      'Open Graph cards for social sharing',
    ],
    idealFor: [
      'Designers, illustrators, and photographers',
      'Developers and engineers',
      'Architects and interior designers',
      'Writers, journalists, and content creators',
      'Filmmakers and motion designers',
    ],
    process: [
      { step: 1, title: 'Content Audit', description: 'We review your existing work and select pieces that best represent your range and depth.' },
      { step: 2, title: 'Personal Brand Direction', description: 'Typography, color palette, and voice are chosen to reflect your style authentically.' },
      { step: 3, title: 'Gallery & Case Study Design', description: 'Each project gets a micro-page with context, process, and outcome — not just a screenshot.' },
      { step: 4, title: 'Launch & Optimise', description: 'We optimise for page speed, social sharing, and discoverability before handing over the keys.' },
    ],
    highlights: [
      { title: 'First-Impression Animation', description: 'Tasteful motion on load and scroll that feels premium without slowing the page down.' },
      { title: 'Case Study Depth', description: 'Individual project pages that show your thinking process, not just the final deliverable.' },
      { title: 'Easy Self-Updating', description: 'Add new projects yourself without a developer — drag, upload, publish.' },
      { title: 'Recruiter & Client Tested', description: 'Layouts informed by what hiring managers and buyers actually look for when evaluating portfolios.' },
    ],
    faqs: [
      { question: 'How many projects can I showcase?', answer: "There's no hard cap. We typically design for 6–12 featured projects with room to grow." },
      { question: 'Can I use my own domain?', answer: 'Yes. We help you connect your custom domain (e.g. yourname.com) and set up email forwarding.' },
      { question: 'What if my work is under NDA?', answer: 'We can create password-protected case study pages viewable only by invited visitors.' },
      { question: 'Do you help with writing project descriptions?', answer: 'Yes — copywriting for project summaries and the About page is included in all portfolio packages.' },
    ],
  },
  {
    slug: 'e-commerce-stores',
    icon: ShoppingCart,
    title: 'E-Commerce Stores',
    tagline: 'Sell online with confidence. From first click to checkout.',
    description: 'Full-featured online stores with secure payment processing and inventory management.',
    color: 'from-orange-500 to-red-500',
    heroGradient: 'from-orange-600 to-red-600',
    whatIsIt:
      'An e-commerce store is a fully operational online shop — product listings, shopping cart, secure payments, order management, and customer accounts, all in one place. We build stores that are fast, trustworthy, and optimised to turn browsers into buyers.',
    includes: [
      'Product catalog with categories & filters',
      'Shopping cart & wishlist functionality',
      'Secure checkout — Stripe / PayPal / Razorpay',
      'Customer accounts & order history',
      'Inventory & stock management dashboard',
      'Discount codes & promotional engine',
      'Abandoned cart email recovery',
      'Order fulfilment & shipping integrations',
    ],
    idealFor: [
      'Brands launching direct-to-consumer (DTC)',
      'Artisans, creators, and small batch makers',
      'B2B businesses wanting an online order portal',
      'Brick-and-mortar stores expanding online',
      'Digital product sellers — courses, templates, files',
    ],
    process: [
      { step: 1, title: 'Store Strategy', description: 'We map your catalog, pricing model, payment providers, and shipping rules before touching design.' },
      { step: 2, title: 'UX & Catalog Design', description: 'Product pages, collection pages, and checkout are designed to minimise friction and build trust.' },
      { step: 3, title: 'Integration & Testing', description: 'Payment gateways, inventory systems, and email automations are wired and stress-tested.' },
      { step: 4, title: 'Launch & Handover', description: 'Full store walkthrough, staff training, and a post-launch support window.' },
    ],
    highlights: [
      { title: 'Conversion-Optimised Checkout', description: 'Guest checkout, one-click upsells, and trust signals at every friction point to maximise completed orders.' },
      { title: 'Mobile-First Shopping', description: 'Over 60% of purchases happen on mobile — every interaction is thumb-friendly and fast.' },
      { title: 'Inventory Intelligence', description: 'Real-time stock tracking, low-stock alerts, and multi-location inventory management.' },
      { title: 'Marketing-Ready', description: 'Built-in SEO, product schema, social shopping feeds (Meta, Google), and email list capture.' },
    ],
    faqs: [
      { question: 'Which payment gateways do you support?', answer: 'Stripe, PayPal, Razorpay, Square, and most regional gateways. We set up and test the integration for you.' },
      { question: 'Can I manage products myself?', answer: 'Yes — you get a full admin dashboard to add, edit, and remove products, run promotions, and process orders.' },
      { question: 'Do you build on Shopify or custom?', answer: 'Both. We recommend Shopify for most retail scenarios, and custom builds for complex B2B or subscription models.' },
      { question: 'Is the store PCI-compliant?', answer: "Yes. Payment data never touches our servers — all card processing is handled by certified payment processors." },
    ],
  },
  {
    slug: 'custom-web-applications',
    icon: Code,
    title: 'Custom Web Applications',
    tagline: 'Software that fits your workflow, not the other way around.',
    description: 'Tailored web applications built to solve your unique business challenges.',
    color: 'from-green-500 to-emerald-500',
    heroGradient: 'from-green-600 to-emerald-600',
    whatIsIt:
      "A custom web application is purpose-built software that runs in the browser and solves a specific business problem — a client portal, an internal tool, a SaaS dashboard, an automated workflow. Unlike off-the-shelf software, it does exactly what your business needs and nothing it doesn't.",
    includes: [
      'Requirements discovery & technical architecture',
      'User authentication & role-based access control',
      'Custom dashboard & data visualisation',
      'REST or GraphQL API design & development',
      'Third-party API & webhook integrations',
      'Database design — relational or document',
      'Real-time features — live updates, notifications',
      'Automated testing suite & CI/CD pipeline',
    ],
    idealFor: [
      'Businesses replacing manual spreadsheet workflows',
      'SaaS founders building their MVP',
      'Teams needing an internal operations tool',
      'Companies automating client-facing processes',
      'Organisations requiring custom data reporting',
    ],
    process: [
      { step: 1, title: 'Requirements Workshop', description: 'We map every user role, workflow, and edge case before committing to an architecture.' },
      { step: 2, title: 'Technical Architecture', description: 'Stack selection, data models, and API contracts are documented and reviewed with your team.' },
      { step: 3, title: 'Agile Build', description: 'Development in 2-week sprints with working software delivered and demoed after each sprint.' },
      { step: 4, title: 'QA, Deploy & Support', description: 'Automated tests, load testing, staged rollout, and a 90-day post-launch support window.' },
    ],
    highlights: [
      { title: 'Scalable by Design', description: "Architecture decisions are made with your 10× growth scenario in mind, not just today's load." },
      { title: 'Security First', description: 'OWASP-compliant, with input validation, rate limiting, encrypted storage, and audit logging built in.' },
      { title: 'Integrates with Your Stack', description: 'We connect to your existing ERP, CRM, accounting software, or any API-enabled tool.' },
      { title: 'Full Source Ownership', description: 'You own the code. No vendor lock-in, no per-seat licensing — yours from day one.' },
    ],
    faqs: [
      { question: 'How long does a custom app take to build?', answer: 'MVPs typically take 6–12 weeks. Full-featured applications range from 3–9 months depending on complexity.' },
      { question: 'What tech stack do you use?', answer: 'React + TypeScript on the frontend, Node.js or Python on the backend, PostgreSQL or MongoDB for data — chosen for your specific needs.' },
      { question: 'Can you take over an existing codebase?', answer: "Yes. We'll audit the existing code, document what's there, and take responsibility for ongoing development." },
      { question: 'Do you offer ongoing maintenance?', answer: 'Yes — monthly retainer plans cover bug fixes, dependency updates, feature additions, and priority support.' },
    ],
  },
  {
    slug: 'website-maintenance',
    icon: Settings,
    title: 'Website Maintenance',
    tagline: 'Your website, always healthy. You focus on your business.',
    description: 'Ongoing support and updates to keep your website running smoothly.',
    color: 'from-violet-500 to-purple-500',
    heroGradient: 'from-violet-600 to-purple-600',
    whatIsIt:
      "Website maintenance is the ongoing care that keeps your site secure, fast, and up to date. Without it, outdated plugins create security holes, broken links erode trust, and slow load times cost you visitors. Our maintenance plans handle all of it so you don't have to.",
    includes: [
      'CMS, plugin & dependency updates',
      'Daily automated backups — 30-day retention',
      'Uptime monitoring with instant alerts',
      'Monthly performance & Core Web Vitals report',
      'Security scanning & malware removal',
      'Broken link & 404 error fixes',
      'Content updates — text, images, blog posts',
      'Priority support — response within 4 hours',
    ],
    idealFor: [
      'Business owners without in-house tech teams',
      'Agencies needing white-label maintenance for clients',
      'Sites running WordPress, Webflow, or custom CMS',
      'E-commerce stores where downtime = lost revenue',
      'Any business that launched a site and needs ongoing care',
    ],
    process: [
      { step: 1, title: 'Site Audit', description: 'We review your current site health — speed, security, plugins, errors — and baseline everything.' },
      { step: 2, title: 'Onboarding', description: 'Access handover, backup system setup, and monitoring alerts configured within 24 hours.' },
      { step: 3, title: 'Monthly Maintenance', description: 'Scheduled updates, backups, and a monthly report lands in your inbox every month.' },
      { step: 4, title: 'On-Demand Requests', description: 'Content updates, small fixes, and feature tweaks handled within your monthly hours.' },
    ],
    highlights: [
      { title: '99.9% Uptime Target', description: 'Proactive monitoring catches issues before your visitors do — often before you even know about them.' },
      { title: 'Zero Surprise Bills', description: 'Flat monthly pricing. No per-update fees, no emergency call-out charges.' },
      { title: 'Monthly Transparency Report', description: "A plain-English report every month showing what was done, your site's speed, and any issues resolved." },
      { title: 'Instant Security Response', description: 'If your site is ever compromised, we respond and restore within hours — not days.' },
    ],
    faqs: [
      { question: 'What\'s included in the "content updates" allowance?', answer: 'Text edits, image swaps, blog publishing, and minor layout tweaks — up to 2 hours per month on standard plans.' },
      { question: 'Can I cancel anytime?', answer: 'Yes — plans are month-to-month. Cancel with 30 days notice, no penalties.' },
      { question: "Do you maintain sites you didn't build?", answer: 'Absolutely. We onboard any existing site after a technical audit to make sure we understand it fully.' },
      { question: 'What happens if something breaks?', answer: 'We fix it, no questions asked. Emergency fixes are included in all plans with a 4-hour response SLA.' },
    ],
  },
];
