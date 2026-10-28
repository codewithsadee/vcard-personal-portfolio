import type {
  BlogPost,
  Client,
  Project,
  Service,
  SocialLink,
  Testimonial,
  TimelineItem,
} from './types'

export const profile = {
  name: 'Daniel Rajakumar',
  role: 'Software Engineer',
  tagline:
    'Full-stack software engineer building reliable applications, retrieval systems, and evaluation tooling with Next.js, TypeScript, and PostgreSQL.',
  location: 'Mahwah, NJ',
  email: 'contact@danielrajakumar.com',
  phone: '+1 (609) 388-1811',
  resumeUrl: '/resume.pdf',
  status: {
    label: 'Open to New Grad SWE Roles',
    available: true,
  },
  currentRole: {
    title: 'Software Engineering Intern',
    organization: 'dsm-firmenich',
  },
  avatar: '/assets/images/profile-picture-11.png',
  ogAvatar: '/assets/images/profile-picture-11-og.png',
  about: [
    "I'm a software engineer and a 2026 Computer Science graduate of Ramapo College of New Jersey. Right now I'm a software engineering intern at dsm-firmenich, where I build an internal assessment platform used across the company's manufacturing network.",
    'At dsm-firmenich, I replaced 22 tracking spreadsheets with a Next.js and TypeScript application for 50+ employees across 8 manufacturing sites. I also built an Excel import pipeline for 500+ records per upload, integrated company single sign-on, and deployed the platform to AWS on Amazon RDS for PostgreSQL.',
    'Outside of work, I build and maintain RockyGPT, a source-grounded campus assistant. Most of my time goes into its PostgreSQL and pgvector retrieval pipeline, validation layers, and an evaluation harness with 2,200+ scored queries and 43 automated test suites.',
    "I'm looking for full-time software engineering roles where I can build reliable products with teams that care about strong technical fundamentals.",
  ],
}

export const socials: SocialLink[] = [
  { label: 'GitHub', href: 'https://github.com/daniel-rajakumar' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/daniel-rajakumar/' },
]

export const education: TimelineItem[] = [
  {
    title: 'B.S. in Computer Science',
    org: 'Ramapo College of New Jersey',
    range: 'Jun 2026',
    details: [
      'Presidential Scholarship Recipient (full-tuition merit award)',
    ],
    coursework: [
      'Computer Vision',
      'Data Analysis & Visualization',
      'Machine Learning',
      'Web App Development',
    ],
  },
]

export const professionalExperience: TimelineItem[] = [
  {
    title: 'Manufacturing Excellence Intern, Software Engineering',
    org: 'dsm-firmenich – Plainsboro, NJ',
    range: 'Jun 2026 — Present',
    details: [
      'Replaced 22 tracking spreadsheets with a Next.js and TypeScript application for 50+ employees across 7 business units and 8 manufacturing sites, centralizing assessment rubrics, element scoring, and reviewer submissions.',
      'Cut data-entry time by 2 hours per assessment cycle and reduced invalid records by 40% by designing an Excel import pipeline with ExcelJS that validates and migrates 500+ records per upload.',
      'Integrated Microsoft Entra ID through NextAuth v5 for company single sign-on, removing the need for a separate user store, and enforced email-driven manager/reviewer role gating on every protected route.',
      'Resolved an Edge-runtime auth failure by splitting provider config out of the middleware, and deployed the app to an AWS sandbox on Amazon RDS for PostgreSQL, which I maintain through ongoing releases.',
    ],
  },
]

export const resumeProjects: TimelineItem[] = [
  {
    title: 'RockyGPT – Campus AI Chatbot',
    org: 'rockygpt.danielrajakumar.com',
    range: 'Jan 2026 — Present',
    details: [
      'Built a full-stack campus assistant with Next.js 16, React 19, and TypeScript that answers questions on dining, events, directories, transit, housing, and safety, returning every answer with linked sources at a 2.1s median response time.',
      'Eliminated redundant embedding cost by engineering a PostgreSQL/pgvector retrieval pipeline with 1,536-dimension embeddings and content-addressed chunk storage that re-embeds only when source text or model changes.',
      'Raised intent-classification accuracy from 72.6% to 83.9% and outcome accuracy to 100% by building an eval harness spanning 2,200+ scored queries and 43 automated test suites covering retrieval safety, privacy, and rate limiting.',
    ],
  },
  {
    title: 'VC370 Assembler and Emulator',
    org: 'github.com/daniel-rajakumar/VC370',
    range: 'Oct 2024 — Dec 2024',
    details: [
      'Built a two-pass assembler and emulator in C++17 for the VC370, a 13-opcode accumulator architecture, translating symbolic assembly into 6-digit machine words executed across a 10,000-word memory space.',
      'Implemented a symbol table resolving forward references on the second pass, with four assembler directives (ORG, DC, DS, END) handling program origin, constants, and storage reservation.',
      'Structured the toolchain into 7 components with assemble-time and runtime error detection spanning illegal opcodes, undefined and multiply-defined labels, reserved-word collisions, memory-bound violations, and division by zero.',
    ],
  },
]

export const leadership: TimelineItem[] = [
  {
    title: 'Lead, Google Developer Student Club',
    org: 'Ramapo College',
    range: 'Aug 2023 — May 2025',
    details: [
      "Organized the college's first DevFest for 50+ students, coordinating a keynote and hands-on technical workshops.",
      'Directed a team of 8 to deliver 4+ coding events reaching 100+ total attendees, including a Java workshop.',
    ],
  },
  {
    title: 'Founding President, Computer Science Club',
    org: 'Ramapo College',
    range: 'Apr 2023 — May 2024',
    details: [
      'Founded the club and organized 10+ workshops on React, portfolio development, and collaborative software practices.',
      'Built and maintained the club website in HTML, CSS, and JavaScript, serving events and resources to 200+ students.',
    ],
  },
]

export const resumeSkillGroups = [
  {
    label: 'Languages',
    items: ['TypeScript', 'JavaScript', 'Python', 'C++', 'Java', 'SQL', 'HTML/CSS'],
  },
  {
    label: 'Frameworks & Libraries',
    items: ['Next.js', 'React', 'Node.js', 'NextAuth', 'Tailwind CSS', 'Playwright', 'ExcelJS'],
  },
  {
    label: 'Databases & Cloud',
    items: ['PostgreSQL', 'pgvector', 'Redis', 'AWS RDS', 'Microsoft Entra ID'],
  },
  {
    label: 'Tools & APIs',
    items: ['Git/GitHub', 'OpenAI API', 'REST APIs', 'embeddings/RAG'],
  },
]

export const services: Service[] = [
  {
    title: 'Full-stack applications',
    description:
      'Build end-to-end products with Next.js, React, TypeScript, Node.js, and PostgreSQL.',
    icon: 'dev',
  },
  {
    title: 'Retrieval & evaluation systems',
    description:
      'Create source-grounded AI workflows with pgvector, OpenAI APIs, automated evaluations, and regression testing.',
    icon: 'data',
  },
  {
    title: 'Secure internal platforms',
    description:
      'Integrate SSO, role-based access, data imports, and PostgreSQL on AWS into dependable business tools.',
    icon: 'systems',
  },
  {
    title: 'Technical leadership',
    description:
      'Lead teams, organize developer events, and make complex technical work clear and collaborative.',
    icon: 'leadership',
  },
]

export const testimonials: Testimonial[] = [
  // { name: "Daniel Lewis", avatar: "/assets/images/avatar-1.svg", date: "2021-06-14", text: "Daniel was hired to create a corporate identity. We were very pleased with the work done. He has a lot of experience and is very concerned about the needs of the client.", },
  // { name: "Jessica Miller", avatar: "/assets/images/avatar-2.svg", date: "2021-05-28", text: "Daniel took a complex brief and turned it into a clean product experience. The process was collaborative and the outcome was better than expected.", },
  // { name: "Emily Evans", avatar: "/assets/images/avatar-3.svg", date: "2021-04-18", text: "The attention to detail was impressive, and the final site loads fast while looking sharp on every screen.", },
  // { name: "Henry William", avatar: "/assets/images/avatar-4.svg", date: "2021-03-09", text: "Reliable, organized, and thoughtful. Delivered on time and made the whole build feel smooth.", },
]

export const clients: Client[] = [
  // { name: "client-1", logo: "/assets/images/logo-1.svg" },
  // { name: "client-2", logo: "/assets/images/logo-2.svg" },
  // { name: "client-3", logo: "/assets/images/logo-3.svg" },
  // { name: "client-4", logo: "/assets/images/logo-4.svg" },
  // { name: "client-5", logo: "/assets/images/logo-5.svg" },
  // { name: "client-6", logo: "/assets/images/logo-6.svg" },
]

export const projects: Project[] = [
  {
    title: 'RockyGPT: Campus AI Chatbot',
    category: 'Web development',
    period: 'Jan 2026 — Present',
    description:
      'Built a source-grounded campus assistant with Next.js 16, React 19, and TypeScript that answers questions on dining, events, directories, transit, housing, and safety, returning every answer with linked sources at a 2.1s median response time. Its PostgreSQL and pgvector retrieval pipeline uses 1,536-dimension embeddings and content-addressed chunk storage, while an evaluation harness spanning 2,200+ scored queries and 43 automated test suites raised intent-classification accuracy from 72.6% to 83.9% and outcome accuracy to 100%.',
    tech: [
      'Next.js 16',
      'TypeScript',
      'PostgreSQL',
      'pgvector',
      'OpenAI API',
      'Redis',
    ],
    image: '/assets/images/projects/RockyGPT/thumbnail.png',
    status: 'In Progress',
    links: [
      {
        label: 'Live site',
        href: 'https://rockygpt.danielrajakumar.com/',
      },
    ],
  },
  {
    title: 'Bubble PoppAR',
    category: 'Applications',
    period: 'Feb 2026',
    description:
      'Finished runner-up at HackRamapo 2026, an MLH Official 2026 Season event, with a six-hour prototype built with one teammate, then rebuilt and expanded it solo. This two-player webcam game uses MediaPipe for hand and eye gesture tracking, Three.js for rendering, and Socket.IO for real-time multiplayer with server-authoritative scoring.',
    tech: [
      'TypeScript',
      'Next.js',
      'React',
      'MediaPipe',
      'Three.js',
      'Socket.IO',
      'Docker',
    ],
    image: '/assets/images/projects/BubblePoppAR/thumbnail_v16.png',
    links: [
      {
        label: 'Live site',
        href: 'https://ramapohack2026.onrender.com',
      },
      {
        label: 'Source code',
        href: 'https://github.com/daniel-rajakumar/Bubble-PoppAR',
      },
    ],
    screenshots: [
      {
        src: '/assets/images/projects/BubblePoppAR/screenshot_3.png',
        caption: 'Match Lobby & Camera Connection',
      },
      {
        src: '/assets/images/projects/BubblePoppAR/screenshot_2.png',
        caption: 'Mission Setup Room',
      },
      {
        src: '/assets/images/projects/BubblePoppAR/screenshot_1.png',
        caption: 'Live Gameplay - Target Hunt',
      },
    ],
  },
  {
    title: 'VC370 Assembler and Emulator',
    category: 'Applications',
    period: 'Oct 2024 — Dec 2024',
    description:
      'Built a two-pass assembler and emulator in C++17 for the VC370, a 13-opcode accumulator architecture, translating symbolic assembly into 6-digit machine words across a 10,000-word memory space. The seven-component toolchain resolves forward references and detects illegal opcodes, undefined and multiply-defined labels, memory-bound violations, and division by zero.',
    caseStudyPath: '/case-study/assembler-emulator.md',
    tech: ['C++17', 'Assembly', 'Systems Programming', 'Make'],
    image: '/assets/images/projects/VC370Assem/thumbnail.png',
    links: [
      {
        label: 'Source code',
        href: 'https://github.com/daniel-rajakumar/VC370',
      },
    ],
    screenshots: [
      {
        src: '/assets/images/projects/VC370Assem/one.png',
        caption: 'Assembler output view',
      },
      {
        src: '/assets/images/projects/VC370Assem/two.png',
        caption: 'Emulator run results',
      },
      {
        src: '/assets/images/projects/VC370Assem/three.png',
        caption: 'Assembler output view',
      },
      {
        src: '/assets/images/projects/VC370Assem/four.png',
        caption: 'Emulator run results',
      },
    ],
  },
  {
    title: 'Canoga Game',
    category: 'Applications',
    period: 'Feb 2025 — May 2025',
    description:
      'Built a multi-platform implementation of the Canoga dice and strategy game with three clients: a browser UI in JavaScript, a command-line version in C++, and a native Android app in Java. Supports multiplayer and a computer opponent.',
    tech: ['Java', 'C++', 'JavaScript', 'Android'],
    image: '/assets/images/projects/CanogaGame/thumbnail.png',
    links: [
      {
        label: 'Live site',
        href: 'https://projects.canogagame.danielrajakumar.com/',
      },
      {
        label: 'Source code',
        href: 'https://github.com/daniel-rajakumar/CanogaGame',
      },
    ],
    screenshots: [
      {
        src: '/assets/images/projects/CanogaGame/one.png',
        caption: 'Game board view',
      },
      {
        src: '/assets/images/projects/CanogaGame/two.png',
        caption: 'Multiplayer mode',
      },
      {
        src: '/assets/images/projects/CanogaGame/three.png',
        caption: 'Multiplayer mode',
      },
      {
        src: '/assets/images/projects/CanogaGame/four.png',
        caption: 'Multiplayer mode',
      },
      {
        src: '/assets/images/projects/CanogaGame/five.png',
        caption: 'Multiplayer mode',
      },
      {
        src: '/assets/images/projects/CanogaGame/six.png',
        caption: 'Multiplayer mode',
      },
    ],
  },
  {
    title: 'Ramapo International Street Food Festival 2025 Website',
    category: 'Web development',
    period: 'Apr 2025',
    description:
      'Built a static single-page event site in HTML, CSS, and JavaScript with Bootstrap 4. The site covers the agenda, check-in and token system, food booths, activities, sponsors, and a live countdown banner, and is hosted on Netlify.',
    tech: ['HTML/CSS', 'JavaScript', 'Bootstrap', 'jQuery', 'Netlify'],
    image: '/assets/images/projects/ISFF25/thumbnail.png',
    links: [
      {
        label: 'Live site',
        href: 'https://projects.isff25.danielrajakumar.com/',
      },
      {
        label: 'Source code',
        href: 'https://github.com/RCNJ-Computer-Science-Club/ISFF25',
      },
    ],
    screenshots: [
      {
        src: '/assets/images/projects/ISFF25/one.png',
        caption: 'Homepage view',
      },
      {
        src: '/assets/images/projects/ISFF25/two.png',
        caption: 'Event schedule section',
      },
      {
        src: '/assets/images/projects/ISFF25/three.png',
        caption: 'Vendor information page',
      },
      {
        src: '/assets/images/projects/ISFF25/four.png',
        caption: 'Contact form view',
      },
      {
        src: '/assets/images/projects/ISFF25/five.png',
        caption: 'Responsive design on mobile',
      },
    ],
  },
  {
    title: 'Social Media Engagement Analysis',
    category: 'Other',
    period: 'Fall 2024',
    description:
      'Analyzed 250+ Instagram posts with Random Forest, Gradient Boosting, and KNN models, reaching up to 88% classification accuracy and visualizing the posting patterns that most influenced engagement.',
    tech: ['Python', 'Pandas', 'Scikit-learn'],
    image:
      '/assets/images/projects/SocialMediaEngagementAnalysis/thumbnail.png',
    links: [
      {
        label: 'Jupyter Notebook',
        href: 'https://colab.research.google.com/drive/1hl8U_H2wvaPor3S9I9ANfC1QrbbEEJK-?usp=sharing',
      },
    ],
    screenshots: [
      {
        src: '/assets/images/projects/SocialMediaEngagementAnalysis/one.png',
        caption: 'Project screenshot',
      },
      {
        src: '/assets/images/projects/SocialMediaEngagementAnalysis/two.png',
        caption: 'Data visualization example',
      },
      {
        src: '/assets/images/projects/SocialMediaEngagementAnalysis/three.png',
        caption: 'Model accuracy results',
      },
      {
        src: '/assets/images/projects/SocialMediaEngagementAnalysis/four.png',
        caption: 'Feature importance analysis',
      },
      {
        src: '/assets/images/projects/SocialMediaEngagementAnalysis/five.png',
        caption: 'Engagement prediction results',
      },
    ],
  },
]

export const blogPosts: BlogPost[] = [
  // { title: "Design conferences in 2025", category: "Design", date: "2025-02-23", excerpt: "A quick rundown of the events I am tracking this year.", image: "/assets/images/blog-1.svg", },
  // { title: "Best fonts every designer uses", category: "Design", date: "2025-02-16", excerpt: "A short list of typefaces that work across web and print.", image: "/assets/images/blog-2.svg", },
  // { title: "Building with intent", category: "Product", date: "2025-01-30", excerpt: "How I keep projects tight, useful, and easy to ship.", image: "/assets/images/blog-3.svg", },
]

export const hasBlogPosts = blogPosts.length > 0
