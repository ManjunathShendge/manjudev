export const profile = {
  name: "Manjunath P Shendge",
  first: "Manjunath",
  last: "Shendge",
  role: "Software Engineer",
  location: "Bengaluru, India",
  email: "shendgemanoj878@gmail.com",
  phone: "+91 81809 50332",
  phoneHref: "+918180950332",
  github: "https://github.com/ManjunathShendge",
  githubLabel: "github.com/ManjunathShendge",
  linkedin: "https://www.linkedin.com/in/manjunath-shendge-0a440b250/",
  linkedinLabel: "linkedin.com/in/manjunath-shendge",
  status: "Open to roles & freelance work",
} as const

/** Fixed left rail. Order here is the order of the story. */
export const chapters = [
  { id: "origin", n: "01", title: "Origin" },
  { id: "path", n: "02", title: "The Path" },
  { id: "proof", n: "03", title: "Proof" },
  { id: "hard", n: "04", title: "The Hard Part" },
  { id: "toolkit", n: "05", title: "Toolkit" },
  { id: "writing", n: "06", title: "Writing" },
  { id: "services", n: "07", title: "Services" },
  { id: "next", n: "08", title: "What's Next" },
] as const

/** Chapter 06 — the teaser that hands the reader over to /blog. */
export const writing = {
  kicker:
    "Building something and explaining it are different skills, and the second one is how the first gets better. This is where I write the explanations down.",
  lines: [
    "Architecture decisions and what they cost later.",
    "Frontend craft — animation, accessibility, the details nobody notices until they are wrong.",
    "Post-mortems from real projects, including the parts that went badly.",
  ],
  cta: "Read the writing",
  contribute:
    "It is not only mine. Sign up and the editor is yours straight away — drafts, images, your own byline. Every post is read before it goes live, but nobody has to be let in first.",
  contributeCta: "Start writing →",
}

export const origin = {
  kicker: "How it started",
  /* Read one word at a time as you scroll. Keep it tight — this is scrubbed. */
  script:
    "I started where most people start: a browser, a text editor, and something that would not center. What kept me there was not the CSS. It was the moment a form I wrote saved a row I could go and look at. Software stopped being a subject and became a thing that happens to real people.",
  paras: [
    "Three years later the questions have moved underneath the surface. How should this table be shaped so it survives the feature nobody has asked for yet? What happens to this request when the network is slow and the user taps twice?",
    "I am early in my career and I know it. What I want is guided ownership — a team where review is real, the system is bigger than I can hold in my head on day one, and the bar is production rather than demo.",
  ],
}

export const timeline = [
  {
    when: "Oct 2022 — Dec 2022",
    kind: "Internship",
    role: "Web Development & Digital Marketing Intern",
    org: "Ask System",
    beat: "The first time code left my laptop.",
    points: [
      "Contributed to web development work alongside SEO and social media initiatives.",
    ],
  },
  {
    when: "May 2023 — Jun 2023",
    kind: "Internship",
    role: "Web Developer Intern",
    org: "Fab Coders",
    beat: "Learned that a senior developer's feedback is the fastest compiler there is.",
    points: [
      "Built and maintained web pages in HTML, CSS, JavaScript and PHP against SQL backends.",
      "Worked with senior developers, folding their review into each iteration.",
    ],
  },
  {
    when: "May 2025 — Jul 2025",
    kind: "Detour",
    role: "Market Research Executive",
    org: "Previous Employer",
    beat: "A short step sideways — and the first time I saw why a product gets built at all.",
    points: [
      "Analysed market data and turned it into insight product and business decisions could act on.",
    ],
  },
  {
    when: "Aug 2025 — Present",
    kind: "Current",
    role: "Frontend Developer",
    org: "Tier2 Digital",
    beat: "Back in the codebase, this time with the shipping deadline attached.",
    points: [
      "Build and maintain React.js components and features with designers and product managers.",
      "Integrate the frontend with RESTful APIs, keeping data flow reliable end to end.",
      "Give and apply code review to keep the codebase maintainable.",
      "Work in Git and an agile cycle alongside the rest of the team.",
    ],
  },
] as const

/**
 * Gallery images are real screenshots captured from the live deployments —
 * nothing mocked up. Recapture them any time the sites change; see the README.
 * The attendance system is internal, so it has no shots and falls back to a
 * generated graphic rather than a fabricated screenshot.
 */
export const projects = [
  {
    id: "tripnexus",
    index: "01",
    name: "TripNexus",
    status: "Live",
    kind: "Personal build",
    shots: [
      { src: "/projects/tripnexus-1.jpg", caption: "Homepage — trip-first discovery" },
      { src: "/projects/tripnexus-2.jpg", caption: "Category hub across places, transport, food and stays" },
      { src: "/projects/tripnexus-3.jpg", caption: "Featured places and vendor entry points" },
    ],
    line: "A B2B travel and vendor discovery platform — restaurants, transport, stays and local businesses under one traveller-facing surface.",
    points: [
      "Built the full stack: vendors register, list services and take orders end to end — cart, checkout and payment.",
      "Designed a multi-vendor architecture where distinct business types share one discovery experience without forking the data model.",
      "Deployed to production and running against real vendor and user workflows.",
    ],
    stack: ["Next.js", "Supabase", "Razorpay", "REST APIs"],
    href: "https://tripnexus.netlify.app",
    label: "tripnexus.netlify.app",
  },
  {
    id: "anl",
    index: "02",
    name: "All New Launches",
    status: "In progress",
    kind: "Client work",
    shots: [
      { src: "/projects/anl-1.jpg", caption: "Homepage — property search across cities" },
      { src: "/projects/anl-2.jpg", caption: "Discovery sections built on the migrated schema" },
      { src: "/projects/anl-3.jpg", caption: "Listings rendered from Supabase, ~350k rows behind them" },
    ],
    line: "A real estate portal rebuilt on Next.js and Supabase, migrating off a legacy WordPress/WPL stack.",
    points: [
      "Moved a ~350,000-row WordPress/WPL database into Supabase through a full Python migration pipeline.",
      "Designed the Supabase schema and wrote the TypeScript migration scripts, including lifting WordPress users into Supabase Auth.",
      "Built a role-based agent dashboard with a multi-step listing form, a blog system, auth flows and animated homepage sections.",
    ],
    stack: ["Next.js", "TypeScript", "Tailwind", "Supabase", "Razorpay", "Python"],
    href: "https://allnewlaunches.netlify.app",
    label: "allnewlaunches.netlify.app",
  },
  {
    id: "attendance",
    index: "03",
    name: "Attendance System",
    status: "Shipped",
    kind: "Academic",
    shots: [],
    line: "An app-based attendance tracker for a college, built on Firebase as a real-time database.",
    points: [
      "Automated attendance recording and reporting, cutting the manual load on teachers substantially.",
      "First real exposure to cloud databases, async data sync and workflows with actual users on the other end.",
    ],
    stack: ["Python", "Firebase", "Realtime DB"],
    href: null,
    label: "Internal · not public",
  },
] as const

/**
 * Shorter builds, shown as a grid under the three featured cards. Six of these
 * in the stacked-card format would put ~30rem of tab strips on screen before
 * any content — the compact grid is what that volume of work needs.
 *
 * Screenshots come from the live deployments where there is one. The two
 * repo-only projects use `shot: null` and fall back to a generated panel until
 * an image is dropped into public/projects/ under the name in `shotSlot`.
 * Tech tags marked below are inferred from the running app, not from the repo —
 * correct any that are wrong in this file.
 */
export const moreProjects = [
  {
    id: "syniaa",
    name: "Syniaa",
    blurb:
      "Marketing site for a B2B data platform selling verified, real-time US business leads — long-scroll landing page with feature, blog and support sections.",
    stack: ["React", "Tailwind CSS", "Framer Motion"],
    shot: "/projects/syniaa.jpg",
    shotSlot: null,
    href: "https://syniaa.netlify.app/",
    label: "syniaa.netlify.app",
    repo: null,
  },
  {
    id: "nxdigi",
    name: "NxDigi",
    blurb:
      "Agency site for Nexus Digital covering services, portfolio and testimonials, with animated client-count stats and a quote-request flow.",
    stack: ["React", "Tailwind CSS", "Framer Motion"],
    shot: "/projects/nxdigi.jpg",
    shotSlot: null,
    href: "https://nxdigi.netlify.app/",
    label: "nxdigi.netlify.app",
    repo: null,
  },
  {
    id: "dpsfloral",
    name: "DPS Floral Flowers",
    blurb:
      "Portfolio site for a florist — a filterable bouquet gallery with featured arrangements, services and testimonials.",
    stack: ["React", "Tailwind CSS", "CSS Grid"],
    shot: "/projects/dpsfloral.jpg",
    shotSlot: null,
    href: "https://dpsfloralflowers.netlify.app/",
    label: "dpsfloralflowers.netlify.app",
    repo: null,
  },
  {
    id: "jsonbuilder",
    name: "Custom JSON Builder",
    blurb:
      "A visual JSON schema builder: compose nested fields on the left, watch the document build itself on the right, then copy or download it.",
    stack: ["React", "TypeScript", "Recursive components"],
    shot: "/projects/jsonbuilder.jpg",
    shotSlot: null,
    href: "https://custome-json-builder.netlify.app/",
    label: "custome-json-builder.netlify.app",
    repo: null,
  },
  {
    id: "gym",
    name: "Gym Class Booking",
    blurb:
      "BeastMode — a gym platform with member accounts, class scheduling and booking, trainer profiles, membership tiers and a free-trial signup.",
    stack: ["React", "Tailwind CSS", "Auth", "REST API"],
    shot: null,
    shotSlot: "/projects/gym.jpg",
    href: null,
    label: "Source on GitHub",
    repo: "https://github.com/ManjunathShendge/gym-class-booking",
  },
  {
    id: "taskmanager",
    name: "Task Manager",
    blurb:
      "Full CRUD task tracker with per-user sessions, priorities, due dates, tag filtering, search, sorting and completed/incomplete views — plus a dark mode toggle.",
    stack: ["Python", "SQL", "Jinja", "Bootstrap"],
    shot: null,
    shotSlot: "/projects/taskmanager.jpg",
    href: null,
    label: "Source on GitHub",
    repo: "https://github.com/ManjunathShendge/TaskManager",
  },
] as const

/** Freelance offer. Build services first, then the growth services. */
export const services = {
  status: "Available for freelance projects",
  intro:
    "I take on freelance builds alongside my full-time role — usually product work with a real deadline attached rather than throwaway marketing pages. Below is what I build, and what I can run around it.",
  build: [
    { name: "Websites", note: "Marketing sites and portfolios that load fast and rank." },
    { name: "Web Apps", note: "Dashboards, portals and internal tools with real auth." },
    { name: "Landing Pages", note: "Single-purpose pages built to convert and measure." },
    { name: "CRM Software", note: "Pipelines, contacts and follow-ups shaped to your process." },
    { name: "ERP Software", note: "Inventory, orders and operations in one schema." },
    { name: "Company Software", note: "Bespoke internal tools for how your team actually works." },
    { name: "SaaS Products", note: "Multi-tenant products with billing and role-based access." },
    { name: "Agentic Platforms", note: "Systems where agents plan, call tools and report back." },
    { name: "AI Bots", note: "Task-specific bots wired into your existing data." },
    { name: "Chatbots", note: "Support and sales chat grounded in your own content." },
    { name: "AI Agents", note: "Autonomous workflows that act, not just answer." },
  ],
  growth: [
    { abbr: "SEO", name: "Search Engine Optimization", note: "Technical SEO, structure and speed." },
    { abbr: "GEO", name: "Generative Engine Optimization", note: "Being the answer AI search cites." },
    { abbr: "SMM", name: "Social Media Marketing", note: "Content and campaigns that compound." },
  ],
} as const

/** Options in the lead form's service picker. */
export const serviceOptions = [
  "Website",
  "Web App",
  "Landing Page",
  "CRM Software",
  "ERP Software",
  "Specific Company Software",
  "SaaS Product",
  "Agentic Platform",
  "AI Bots",
  "Chatbots",
  "AI Agents",
] as const

/** The set-piece. Numbers are scrubbed against scroll progress. */
export const hardPart = {
  chapter: "The hard part",
  title: "350,000 rows had to move, and none of them could break.",
  intro:
    "All New Launches ran on WordPress. Years of listings, agents and users lived in a WPL schema that was never designed to be read by anything else. The rebuild only mattered if every row arrived.",
  steps: [
    {
      k: "Read",
      t: "Map the legacy schema",
      d: "WPL spreads a single listing across meta tables. Step one was working out what a property actually was.",
    },
    {
      k: "Move",
      t: "Python migration pipeline",
      d: "Batched extraction and transformation, re-runnable, so a failure halfway through was not a restart from zero.",
    },
    {
      k: "Shape",
      t: "Design the Supabase schema",
      d: "Typed tables and relations built for the product being written, not the one being replaced.",
    },
    {
      k: "Keep",
      t: "Lift users into Supabase Auth",
      d: "Accounts carried across so existing agents kept their listings and their login.",
    },
  ],
  outcome:
    "The portal now runs on Postgres with typed access, row-level security and an agent dashboard that writes directly to the schema it was designed for.",
}

export const toolkit = [
  {
    group: "Backend",
    note: "Where I want to spend the next few years.",
    items: [
      "Python",
      "Node.js",
      "Express.js",
      "REST API Design",
      "PostgreSQL",
      "MySQL",
      "Supabase",
      "Firebase",
      "MongoDB",
    ],
  },
  {
    group: "Frontend",
    note: "What I ship with today.",
    items: [
      "React.js",
      "Next.js",
      "TypeScript",
      "Redux",
      "React Query",
      "Tailwind CSS",
      "HTML / CSS",
      "Bootstrap",
    ],
  },
  {
    group: "Systems & Tools",
    note: "The parts around the code.",
    items: ["Git", "Postman", "API Testing", "CI/CD", "Docker", "AWS (basics)"],
  },
  {
    group: "Concepts",
    note: "Studied, and being put to use.",
    items: [
      "HTTP & Client–Server",
      "OOP",
      "Data Structures",
      "Algorithms",
      "Microservices",
      "Scalable System Design",
    ],
  },
] as const

export const education = [
  {
    when: "2021 — 2024",
    title: "Bachelor of Computer Applications",
    where: "SES Sridora Caculo College of Commerce and Management Studies",
  },
  {
    when: "2019 — 2021",
    title: "Higher Secondary Certificate",
    where: "Purushottam Walawalkar Higher Secondary School",
  },
] as const

export const certifications = [
  "Full Stack Web Development with Docker, Node.js and React.js",
  "Data Science Foundations — Great Learning",
] as const

export const languages = ["English", "Hindi", "Marathi", "Konkani", "Kannada"] as const
