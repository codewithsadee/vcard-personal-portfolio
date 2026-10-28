export type TabKey = "about" | "resume" | "portfolio" | "blog" | "contact";

export type SocialLink = {
    label: string;
    href: string;
};

export type Project = {
    title: string;
    category: "Web development" | "Web design" | "Applications" | "Other";
    period?: string;
    description: string;
    caseStudyPath?: string;
    tech: string[];
    image: string;
    screenshots?: ProjectScreenshot[];
    links?: { label: string; href: string }[];
    status?: "In Progress" | "Shipped" | "Paused";
};

export type ProjectScreenshot = {
    src: string;
    caption?: string;
};

export type TimelineItem = {
    title: string;
    org: string;
    range: string;
    details: string | string[];
    coursework?: string[];
};

export type Skill = { name: string };

export type Service = {
    title: string;
    description: string;
    icon: "design" | "dev" | "app" | "photo" | "data" | "leadership" | "systems";
};

export type Testimonial = {
    name: string;
    avatar: string;
    text: string;
    date: string;
};

export type Client = {
    name: string;
    logo: string;
};

export type BlogPost = {
    title: string;
    date: string;
    category: string;
    excerpt: string;
    image: string;
};
