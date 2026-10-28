"use client";

import Image from "next/image";
import MarkdownIt from "markdown-it";
import { ChevronDown, ChevronLeft, ChevronRight, Eye, Link as LinkIcon, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
    IconAssembly,
    IconBoxModel,
    IconBrain,
    IconBrandCpp,
    IconBrandBootstrap,
    IconBrandCss3,
    IconBrandDocker,
    IconBrandHtml5,
    IconBrandJavascript,
    IconBrandNextjs,
    IconBrandOpenai,
    IconBrandPython,
    IconBrandReact,
    IconBrandTypescript,
    IconChartBar,
    IconCloudUpload,
    IconCoffee,
    IconCode,
    IconCube3dSphere,
    IconDatabase,
    IconDeviceGamepad2,
    IconEye,
    IconPlugConnected,
    IconRefresh,
    IconSql,
    IconTable,
    IconTerminal2,
    IconTools,
    type TablerIcon,
} from "@tabler/icons-react";
import { projects } from "@/lib/data";
import type { Project } from "@/lib/types";
import { trackEvent } from "@/lib/analytics";

const categories = ["All", "Web development", "Web design", "Applications", "Other"] as const;
const markdown = new MarkdownIt({ html: true, linkify: true, typographer: true });
const techIconRules: Array<{ test: RegExp; Icon: TablerIcon }> = [
    { test: /next\.?js/i, Icon: IconBrandNextjs },
    { test: /typescript/i, Icon: IconBrandTypescript },
    { test: /react/i, Icon: IconBrandReact },
    { test: /javascript|js\b/i, Icon: IconBrandJavascript },
    { test: /html\/css|html/i, Icon: IconBrandHtml5 },
    { test: /\bcss\b/i, Icon: IconBrandCss3 },
    { test: /bootstrap/i, Icon: IconBrandBootstrap },
    { test: /\bjava\b/i, Icon: IconCoffee },
    { test: /c\+\+|cplusplus/i, Icon: IconBrandCpp },
    { test: /python/i, Icon: IconBrandPython },
    { test: /pandas/i, Icon: IconTable },
    { test: /scikit|sklearn/i, Icon: IconBrain },
    { test: /postgres|pgvector|redis/i, Icon: IconDatabase },
    { test: /openai|gpt/i, Icon: IconBrandOpenai },
    { test: /netlify/i, Icon: IconCloudUpload },
    { test: /sql/i, Icon: IconSql },
    { test: /docker/i, Icon: IconBrandDocker },
    { test: /socket|websocket/i, Icon: IconPlugConnected },
    { test: /three/i, Icon: IconCube3dSphere },
    { test: /mediapipe|computer vision/i, Icon: IconEye },
    { test: /systems|assembly/i, Icon: IconTerminal2 },
    { test: /\bmake\b/i, Icon: IconTools },
    { test: /assembler/i, Icon: IconAssembly },
    { test: /agile/i, Icon: IconRefresh },
    { test: /oop|object/i, Icon: IconBoxModel },
    { test: /game/i, Icon: IconDeviceGamepad2 },
    { test: /data|analysis|analytics/i, Icon: IconChartBar },
];
const getTechIcon = (label: string): TablerIcon => {
    const rule = techIconRules.find((item) => item.test.test(label));
    return rule ? rule.Icon : IconCode;
};

export default function Portfolio() {
    const [cat, setCat] = useState<(typeof categories)[number]>("All");
    const [selectOpen, setSelectOpen] = useState(false);
    const [selected, setSelected] = useState<Project | null>(null);
    const [loadedShots, setLoadedShots] = useState<Record<string, boolean>>({});
    const [shotIndex, setShotIndex] = useState(0);
    const [caseStudyHtml, setCaseStudyHtml] = useState("");
    const [caseStudyStatus, setCaseStudyStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
    const [caseStudyOpen, setCaseStudyOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const touchStartRef = useRef<{ x: number; y: number } | null>(null);
    const touchDeltaRef = useRef(0);
    const scrollLockRef = useRef<{
        scrollY: number;
        position: string;
        top: string;
        width: string;
        overflow: string;
    } | null>(null);
    const shots = useMemo(() => {
        if (!selected) return [];
        return selected.screenshots?.length ? selected.screenshots : [{ src: selected.image }];
    }, [selected]);
    const singleShot = shots.length <= 1;
    const activeShot = shots[shotIndex];
    const advanceShot = (direction: -1 | 1) => {
        if (shots.length <= 1) {
            return;
        }
        setShotIndex((prev) => (prev + direction + shots.length) % shots.length);
    };

    const handleCategory = (next: (typeof categories)[number]) => {
        if (next !== cat) {
            trackEvent("portfolio_filter", { category: next });
        }
        setCat(next);
    };

    const openProject = (project: Project) => {
        trackEvent("project_modal_open", { project: project.title, category: project.category });
        setLoadedShots({});
        setShotIndex(0);
        setCaseStudyOpen(false);
        setSelected(project);
    };

    const closeProject = () => {
        if (selected) {
            trackEvent("project_modal_close", { project: selected.title });
        }
        setCaseStudyOpen(false);
        setSelected(null);
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!selected) return;
        const handleKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                closeProject();
            }
            if (event.key === "ArrowRight" && shots.length > 1) {
                advanceShot(1);
            }
            if (event.key === "ArrowLeft" && shots.length > 1) {
                advanceShot(-1);
            }
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [selected, shots.length]);

    useEffect(() => {
        if (!selected) return;
        const { body } = document;
        const scrollY = window.scrollY;
        scrollLockRef.current = {
            scrollY,
            position: body.style.position,
            top: body.style.top,
            width: body.style.width,
            overflow: body.style.overflow,
        };
        body.classList.add("is-project-modal-open");
        body.style.position = "fixed";
        body.style.top = `-${scrollY}px`;
        body.style.width = "100%";
        body.style.overflow = "hidden";
        return () => {
            body.classList.remove("is-project-modal-open");
            const snapshot = scrollLockRef.current;
            if (!snapshot) {
                return;
            }
            body.style.position = snapshot.position;
            body.style.top = snapshot.top;
            body.style.width = snapshot.width;
            body.style.overflow = snapshot.overflow;
            window.scrollTo(0, snapshot.scrollY);
        };
    }, [selected]);

    useEffect(() => {
        const path = selected?.caseStudyPath;
        if (!path) {
            setCaseStudyHtml("");
            setCaseStudyStatus("idle");
            return;
        }
        let active = true;
        setCaseStudyStatus("loading");
        fetch(path)
            .then((res) => {
                if (!res.ok) {
                    throw new Error("Failed to load case study");
                }
                return res.text();
            })
            .then((text) => {
                if (!active) return;
                setCaseStudyHtml(markdown.render(text));
                setCaseStudyStatus("ready");
            })
            .catch(() => {
                if (!active) return;
                setCaseStudyHtml("");
                setCaseStudyStatus("error");
            });
        return () => {
            active = false;
        };
    }, [selected?.caseStudyPath]);

    useEffect(() => {
        if (!shots.length) {
            return;
        }
        if (shotIndex >= shots.length) {
            setShotIndex(0);
        }
    }, [shots.length, shotIndex]);

    return (
        <>
            <header>
                <h2 className="h2 article-title">Portfolio</h2>
            </header>

            <section className="projects">
                <ul className="filter-list">
                    {categories.map((c) => (
                        <li className="filter-item" key={c}>
                            <button
                                type="button"
                                data-filter-btn
                                className={c === cat ? "active" : ""}
                                onClick={() => handleCategory(c)}
                            >
                                {c}
                            </button>
                        </li>
                    ))}
                </ul>

                <div className="filter-select-box">
                    <button
                        type="button"
                        className={`filter-select${selectOpen ? " active" : ""}`}
                        data-select
                        onClick={() => setSelectOpen((v) => !v)}
                    >
                        <div className="select-value" data-selecct-value>
                            {cat}
                        </div>

                        <div className="select-icon">
                            <ChevronDown aria-hidden="true" />
                        </div>
                    </button>

                    <ul className="select-list">
                        {categories.map((c) => (
                            <li className="select-item" key={c}>
                                <button
                                    type="button"
                                    data-select-item
                                    onClick={() => {
                                        handleCategory(c);
                                        setSelectOpen(false);
                                    }}
                                >
                                    {c}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                <ul className="project-list">
                    {projects.map((p) => {
                        const isActive = cat === "All" || p.category === cat;
                        return (
                            <li
                                className={`project-item${isActive ? " active" : ""}`}
                                key={p.title}
                                data-filter-item
                                data-category={p.category.toLowerCase()}
                            >
                                <button
                                    type="button"
                                    className="project-card"
                                    data-allow-swipe
                                    onClick={() => openProject(p)}
                                    aria-label={`Open project details for ${p.title}`}
                                >
                                    <figure className="project-img">
                                        {p.status ? (
                                            <span
                                                className="project-badge"
                                                data-status={p.status
                                                    .toLowerCase()
                                                    .replace(/\s+/g, "-")}
                                            >
                                                {p.status}
                                            </span>
                                        ) : null}
                                        {p.caseStudyPath ? (
                                            <span className="project-badge project-badge--case-study">
                                                Case Study
                                            </span>
                                        ) : null}
                                        <div className="project-item-icon-box">
                                            <Eye aria-hidden="true" />
                                        </div>
                                        <Image
                                            src={p.image}
                                            alt={p.title}
                                            fill
                                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        />
                                    </figure>

                                    <h3 className="project-title">{p.title}</h3>
                                    <p className="project-category">
                                        {p.category}
                                        {p.period ? ` · ${p.period}` : ""}
                                    </p>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </section>

            {mounted && selected ? createPortal(
                <div className="project-modal-overlay" role="dialog" aria-modal="true">
                    <div className="project-modal-backdrop" onClick={closeProject} />
                    <div className={`project-modal${selected.caseStudyPath ? " has-case-study" : ""}`}>
                        <div className="project-modal__scroll">
                            <header className="project-modal__header">
                                <div>
                                    <h3 className="h3">{selected.title}</h3>
                                    <p className="project-modal__meta">
                                        {selected.category}
                                        {selected.period ? ` · ${selected.period}` : ""}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="project-modal__close"
                                    onClick={closeProject}
                                    aria-label="Close project details"
                                >
                                    <X aria-hidden="true" />
                                </button>
                            </header>

                            <div className="project-modal__body">
                                <p className="project-modal__description">{selected.description}</p>

                            <div className={`project-modal__gallery${singleShot ? " is-single" : ""}`}>
                                <div
                                    className="project-modal__carousel"
                                    onTouchStart={(event) => {
                                        if (shots.length <= 1) {
                                            return;
                                        }
                                        const touch = event.touches[0];
                                        touchStartRef.current = { x: touch.clientX, y: touch.clientY };
                                        touchDeltaRef.current = 0;
                                    }}
                                    onTouchMove={(event) => {
                                        if (!touchStartRef.current || shots.length <= 1) {
                                            return;
                                        }
                                        const touch = event.touches[0];
                                        const deltaX = touch.clientX - touchStartRef.current.x;
                                        const deltaY = touch.clientY - touchStartRef.current.y;
                                        touchDeltaRef.current = deltaX;
                                        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 8) {
                                            event.preventDefault();
                                        }
                                    }}
                                    onTouchEnd={() => {
                                        if (shots.length <= 1) {
                                            touchStartRef.current = null;
                                            touchDeltaRef.current = 0;
                                            return;
                                        }
                                        const deltaX = touchDeltaRef.current;
                                        if (Math.abs(deltaX) > 40) {
                                            if (deltaX < 0) {
                                                setShotIndex((prev) => (prev + 1) % shots.length);
                                            } else {
                                                setShotIndex((prev) => (prev - 1 + shots.length) % shots.length);
                                            }
                                        }
                                        touchStartRef.current = null;
                                        touchDeltaRef.current = 0;
                                    }}
                                    onTouchCancel={() => {
                                        touchStartRef.current = null;
                                        touchDeltaRef.current = 0;
                                    }}
                                >
                                    <div
                                        className="project-modal__track"
                                        style={{ transform: `translateX(-${shotIndex * 100}%)` }}
                                    >
                                        {shots.map((shot, index) => {
                                            const shotKey = `${shot.src}-${index}`;
                                            const isLoaded = loadedShots[shotKey];
                                            return (
                                                <div className="project-modal__slide" key={shotKey}>
                                                    <div
                                                        className={`project-modal__shot${
                                                            isLoaded ? " is-loaded" : " is-loading"
                                                        }`}
                                                    >
                                                        <Image
                                                            src={shot.src}
                                                            alt={`${selected.title} screenshot ${index + 1}`}
                                                            fill
                                                            sizes="(max-width: 768px) 100vw, 50vw"
                                                            className="project-modal__img"
                                                            onLoadingComplete={() =>
                                                                setLoadedShots((prev) => ({
                                                                    ...prev,
                                                                    [shotKey]: true,
                                                                }))
                                                            }
                                                            onError={() =>
                                                                setLoadedShots((prev) => ({
                                                                    ...prev,
                                                                    [shotKey]: true,
                                                                }))
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {!singleShot ? (
                                        <div className="project-modal__controls">
                                            <button
                                                type="button"
                                                className="project-modal__nav project-modal__nav--prev"
                                                onClick={() => advanceShot(-1)}
                                                aria-label="Previous screenshot"
                                            >
                                                <ChevronLeft aria-hidden="true" />
                                            </button>
                                            <button
                                                type="button"
                                                className="project-modal__nav project-modal__nav--next"
                                                onClick={() => advanceShot(1)}
                                                aria-label="Next screenshot"
                                            >
                                                <ChevronRight aria-hidden="true" />
                                            </button>
                                        </div>
                                    ) : null}
                                </div>

                                {activeShot?.caption ? (
                                    <p className="project-modal__caption">{activeShot.caption}</p>
                                ) : null}

                            {!singleShot ? (
                                <div className="project-modal__dots" role="tablist" aria-label="Screenshot slides">
                                    {shots.map((shot, index) => (
                                        <button
                                            key={`${shot.src}-${index}`}
                                                type="button"
                                                className={`project-modal__dot${
                                                    index === shotIndex ? " is-active" : ""
                                                }`}
                                                onClick={() => setShotIndex(index)}
                                                aria-label={`Go to screenshot ${index + 1}`}
                                                aria-current={index === shotIndex ? "true" : undefined}
                                            />
                                        ))}
                                    </div>
                                ) : null}
                            </div>

                            <div className="project-modal__meta-row">
                                <div>
                                    <h4 className="h4">Tech stack</h4>
                                    <ul className="project-modal__tech">
                                        {selected.tech.map((t) => {
                                            const Icon = getTechIcon(t);
                                            return (
                                                <li key={t}>
                                                    <span className="project-modal__tech-icon-wrap">
                                                        <Icon
                                                            aria-hidden="true"
                                                            className="project-modal__tech-icon"
                                                        />
                                                    </span>
                                                    <span className="project-modal__tech-label">{t}</span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="h4">Links</h4>
                                    <div className="project-modal__links">
                                        {selected.links?.length ? (
                                            selected.links.map((l) => (
                                                <a
                                                    key={l.href}
                                                    href={l.href}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    onClick={() =>
                                                        trackEvent("project_link_click", {
                                                            project: selected.title,
                                                            label: l.label,
                                                            href: l.href,
                                                        })
                                                    }
                                                >
                                                    <span className="project-modal__link-icon-wrap">
                                                        <LinkIcon
                                                            aria-hidden="true"
                                                            className="project-modal__link-icon"
                                                        />
                                                    </span>
                                                    <span className="project-modal__link-label">{l.label}</span>
                                                </a>
                                            ))
                                        ) : (
                                            <span className="project-modal__muted">Links coming soon</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                                {selected.caseStudyPath ? (
                                    <section className="project-modal__case-study">
                                        <div
                                            id="project-case-study-panel"
                                            className={`project-modal__case-panel${
                                                caseStudyOpen ? " is-open" : ""
                                            }`}
                                            hidden={!caseStudyOpen}
                                            aria-hidden={!caseStudyOpen}
                                        >
                                            {caseStudyStatus === "ready" ? (
                                                <div
                                                    className="project-modal__case-content"
                                                    dangerouslySetInnerHTML={{ __html: caseStudyHtml }}
                                                />
                                            ) : (
                                                <p className="project-modal__case-muted">
                                                    {caseStudyStatus === "loading"
                                                        ? "Loading case study..."
                                                        : "Case study unavailable."}
                                                </p>
                                            )}
                                        </div>
                                    </section>
                                ) : null}
                            </div>
                        </div>
                        {selected.caseStudyPath && !caseStudyOpen ? (
                            <div className="project-modal__case-toggle-row">
                                <button
                                    type="button"
                                    className="project-modal__case-toggle"
                                    onClick={() => setCaseStudyOpen(true)}
                                    aria-expanded={false}
                                    aria-controls="project-case-study-panel"
                                    aria-label="Expand case study"
                                >
                                    <span className="project-modal__case-toggle-content">
                                        <span className="project-modal__case-toggle-title">Case Study</span>
                                        <span className="project-modal__case-toggle-hint">Click to expand</span>
                                    </span>
                                    <ChevronDown
                                        className="project-modal__case-toggle-icon"
                                        aria-hidden="true"
                                    />
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>
                ,
                document.body
            ) : null}
        </>
    );
}
