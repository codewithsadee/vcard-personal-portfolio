"use client";

import { useEffect, useState } from "react";
import {
    BookOpen,
    BriefcaseBusiness,
    ChevronDown,
    Code2,
    Users,
    Wrench,
    type LucideIcon,
} from "lucide-react";
import {
    IconApi,
    IconAuth2fa,
    IconBrandAws,
    IconBrandCpp,
    IconBrandGithub,
    IconBrandHtml5,
    IconBrandJavascript,
    IconBrandNextjs,
    IconBrandNodejs,
    IconBrandOpenai,
    IconBrandPython,
    IconBrandReact,
    IconBrandTailwind,
    IconBrandTypescript,
    IconCoffee,
    IconDatabase,
    IconFileSpreadsheet,
    IconShieldLock,
    IconSparkles,
    IconSql,
    IconTestPipe2,
    IconVector,
    type TablerIcon,
} from "@tabler/icons-react";
import {
    education,
    leadership,
    professionalExperience,
    profile,
    resumeProjects,
    resumeSkillGroups,
} from "@/lib/data";
import { trackEvent } from "@/lib/analytics";
import type { TimelineItem } from "@/lib/types";

type SectionKey = "experience" | "projects" | "education" | "leadership";
type ResumeAnchor = SectionKey | "skills";

type TimelineSection = {
    key: SectionKey;
    title: string;
    items: TimelineItem[];
    Icon: LucideIcon;
};

const sections: TimelineSection[] = [
    {
        key: "experience",
        title: "Experience",
        items: professionalExperience,
        Icon: BriefcaseBusiness,
    },
    {
        key: "projects",
        title: "Projects",
        items: resumeProjects,
        Icon: Code2,
    },
    {
        key: "leadership",
        title: "Leadership",
        items: leadership,
        Icon: Users,
    },
    { key: "education", title: "Education", items: education, Icon: BookOpen },
];

const resumeSkills = resumeSkillGroups.flatMap((group) => group.items);

const resumeAnchors: ResumeAnchor[] = [
    "experience",
    "projects",
    "leadership",
    "education",
    "skills",
];

const skillIcons: Record<string, TablerIcon> = {
    TypeScript: IconBrandTypescript,
    JavaScript: IconBrandJavascript,
    Python: IconBrandPython,
    "C++": IconBrandCpp,
    Java: IconCoffee,
    SQL: IconSql,
    "HTML/CSS": IconBrandHtml5,
    "Next.js": IconBrandNextjs,
    React: IconBrandReact,
    "Node.js": IconBrandNodejs,
    NextAuth: IconAuth2fa,
    "Tailwind CSS": IconBrandTailwind,
    Playwright: IconTestPipe2,
    ExcelJS: IconFileSpreadsheet,
    PostgreSQL: IconDatabase,
    pgvector: IconVector,
    Redis: IconDatabase,
    "AWS RDS": IconBrandAws,
    "Microsoft Entra ID": IconShieldLock,
    "Git/GitHub": IconBrandGithub,
    "OpenAI API": IconBrandOpenai,
    "REST APIs": IconApi,
    "embeddings/RAG": IconSparkles,
};

function Timeline({
    sectionKey,
    title,
    items,
    Icon,
    open,
    onToggle,
}: {
    sectionKey: SectionKey;
    title: string;
    items: TimelineItem[];
    Icon: LucideIcon;
    open: boolean;
    onToggle: (key: SectionKey) => void;
}) {
    const panelId = `${sectionKey}-panel`;

    return (
        <section className="timeline" id={sectionKey}>
            <div className="title-wrapper">
                <button
                    type="button"
                    className="timeline-toggle"
                    onClick={() => onToggle(sectionKey)}
                    aria-expanded={open}
                    aria-controls={panelId}
                >
                    <div className="icon-box">
                        <Icon aria-hidden="true" />
                    </div>
                    <h3 className="h3">{title}</h3>
                    <ChevronDown
                        className={`timeline-chevron${open ? " is-open" : ""}`}
                        size={18}
                        aria-hidden="true"
                    />
                </button>
            </div>

            <div className={`timeline-panel${open ? "" : " is-collapsed"}`} id={panelId}>
                <ol className="timeline-list">
                    {items.map((it) => (
                        <li className="timeline-item" key={it.title + it.org}>
                            <h4 className="h4 timeline-item-title">{it.title}</h4>
                            <span>{it.range}</span>
                            {Array.isArray(it.details) ? (
                                <>
                                    <p className="timeline-text timeline-org">{it.org}</p>
                                    <ul className="timeline-bullets">
                                        {it.details.map((detail, index) => (
                                            <li key={`${detail}-${index}`}>{detail}</li>
                                        ))}
                                    </ul>
                                    {it.coursework?.length ? (
                                        <p className="timeline-text coursework-inline">
                                            <strong className="coursework-label">Relevant coursework:</strong>{" "}
                                            <span className="coursework-courses">
                                                {it.coursework.join(" | ")}
                                            </span>
                                        </p>
                                    ) : null}
                                </>
                            ) : (
                                <p className="timeline-text">{`${it.org} - ${it.details}`}</p>
                            )}
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}

export default function Resume() {
    const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
        experience: true,
        projects: true,
        education: true,
        leadership: true,
    });

    useEffect(() => {
        const applyHash = () => {
            const hash = window.location.hash.replace("#", "");
            if (resumeAnchors.includes(hash as ResumeAnchor)) {
                if (hash !== "skills") {
                    setOpenSections((prev) => ({ ...prev, [hash as SectionKey]: true }));
                }
                const el = document.getElementById(hash);
                if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "start" });
                }
            }
        };

        applyHash();
        window.addEventListener("hashchange", applyHash);
        return () => window.removeEventListener("hashchange", applyHash);
    }, []);

    const toggleSection = (key: SectionKey) => {
        setOpenSections((prev) => {
            const nextOpen = !prev[key];
            trackEvent("timeline_toggle", { section: key, open: nextOpen });
            const next = { ...prev, [key]: nextOpen };
            if (next[key]) {
                const url = new URL(window.location.href);
                url.hash = key;
                window.history.replaceState(null, "", url.toString());
            }
            return next;
        });
    };

    return (
        <>
            <header>
                <h2 className="h2 article-title">Resume</h2>
            </header>

            <a
                className="resume-btn resume-btn--spaced"
                href={profile.resumeUrl}
                download
                onClick={() => trackEvent("resume_download")}
            >
                Download Resume
            </a>

            {sections.map((section) => (
                <Timeline
                    key={section.key}
                    sectionKey={section.key}
                    title={section.title}
                    items={section.items}
                    Icon={section.Icon}
                    open={openSections[section.key]}
                    onToggle={toggleSection}
                />
            ))}

            <section className="resume-skills" id="skills">
                <div className="title-wrapper">
                    <div className="icon-box">
                        <Wrench aria-hidden="true" />
                    </div>
                    <h3 className="h3">Skills</h3>
                </div>

                <ul className="skills-list content-card">
                    {resumeSkills.map((name) => {
                        const SkillIcon = skillIcons[name] ?? IconDatabase;
                        return (
                            <li key={name} className="skills-item">
                                <div className="skills-logo">
                                    <SkillIcon aria-hidden="true" size={24} />
                                </div>
                                <span className="skills-name">{name}</span>
                            </li>
                        );
                    })}
                </ul>
            </section>
        </>
    );
}
