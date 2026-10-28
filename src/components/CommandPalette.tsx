"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType } from "react";
import {
    Briefcase,
    Clipboard,
    Download,
    FileText,
    Github,
    Instagram,
    Linkedin,
    Link2,
    Mail,
    PenSquare,
    Phone,
    Search,
    UserCircle2,
} from "lucide-react";
import type { TabKey } from "@/lib/types";
import { hasBlogPosts, profile, socials } from "@/lib/data";
import { trackEvent } from "@/lib/analytics";

type Action = {
    id: string;
    label: string;
    hint: string;
    icon: ComponentType<{ size?: number }>;
    run: () => void;
};

const navItems: Array<{ key: TabKey; label: string }> = [
    { key: "about", label: "About" },
    { key: "resume", label: "Resume" },
    { key: "portfolio", label: "Portfolio" },
    { key: "contact", label: "Contact" },
];

const navItemsWithBlog: Array<{ key: TabKey; label: string }> = [
    ...navItems,
    { key: "blog", label: "Blog" },
];

const navIcons: Record<TabKey, ComponentType<{ size?: number }>> = {
    about: UserCircle2,
    resume: FileText,
    portfolio: Briefcase,
    blog: PenSquare,
    contact: Mail,
};

const socialIcons: Record<string, ComponentType<{ size?: number }>> = {
    GitHub: Github,
    LinkedIn: Linkedin,
    Instagram: Instagram,
};

export default function CommandPalette({ onNavigate }: { onNavigate: (tab: TabKey) => void }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const copyToClipboard = async (value: string) => {
        try {
            await navigator.clipboard.writeText(value);
        } catch {
            const textarea = document.createElement("textarea");
            textarea.value = value;
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            textarea.remove();
        }
    };

    const actions = useMemo<Action[]>(() => {
        const visibleNavItems = hasBlogPosts ? navItemsWithBlog : navItems;
        const navActions = visibleNavItems.map((item) => ({
            id: `nav-${item.key}`,
            label: `Go to ${item.label}`,
            hint: "Navigation",
            icon: navIcons[item.key],
            run: () => onNavigate(item.key),
        }));

        const socialActions = socials.map((social) => ({
            id: `social-${social.label.toLowerCase()}`,
            label: `Open ${social.label}`,
            hint: "Social",
            icon: socialIcons[social.label] ?? Link2,
            run: () => window.open(social.href, "_blank", "noreferrer"),
        }));

        return [
            ...navActions,
            {
                id: "resume-download",
                label: "Download Resume",
                hint: "File",
                icon: Download,
                run: () => {
                    const link = document.createElement("a");
                    link.href = profile.resumeUrl;
                    link.download = "";
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                },
            },
            {
                id: "contact-email",
                label: "Email Me",
                hint: profile.email,
                icon: Mail,
                run: () => {
                    window.location.href = `mailto:${profile.email}`;
                },
            },
            {
                id: "copy-email",
                label: "Copy Email",
                hint: profile.email,
                icon: Clipboard,
                run: () => copyToClipboard(profile.email),
            },
            {
                id: "copy-phone",
                label: "Copy Phone",
                hint: profile.phone,
                icon: Phone,
                run: () => copyToClipboard(profile.phone),
            },
            ...socialActions,
        ];
    }, [onNavigate]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return actions;
        return actions.filter((action) => action.label.toLowerCase().includes(q) || action.hint.toLowerCase().includes(q));
    }, [actions, query]);

    const showHint = query.trim().length === 0;

    useEffect(() => {
        const handleKey = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                setOpen((prev) => !prev);
            } else if (event.key === "Escape") {
                setOpen(false);
            }
        };

        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, []);

    useEffect(() => {
        const handleOpen = () => setOpen(true);
        window.addEventListener("open-command-palette", handleOpen);
        return () => window.removeEventListener("open-command-palette", handleOpen);
    }, []);

    useEffect(() => {
        if (open) {
            setQuery("");
            setActiveIndex(0);
            requestAnimationFrame(() => inputRef.current?.focus());
            trackEvent("command_palette_open");
        }
    }, [open]);

    useEffect(() => {
        if (activeIndex >= filtered.length) {
            setActiveIndex(0);
        }
    }, [activeIndex, filtered.length]);

    const runAction = (action: Action) => {
        trackEvent("command_palette_action", { action: action.id, label: action.label });
        action.run();
        setOpen(false);
    };

    return (
        <>
            <button
                type="button"
                className="command-palette__trigger"
                aria-label="Open quick actions"
                aria-keyshortcuts="Meta+K Control+K"
                aria-expanded={open}
                onClick={() => setOpen(true)}
            >
                <Search size={18} aria-hidden="true" />
            </button>

            {open ? (
                <div className="command-palette" role="dialog" aria-modal="true" aria-label="Quick actions">
                    <div className="command-palette__backdrop" onClick={() => setOpen(false)} />

                    <div className="command-palette__panel">
                        <div className="command-palette__input">
                            <Search size={18} aria-hidden="true" />
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Type a command..."
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === "ArrowDown") {
                                        event.preventDefault();
                                        setActiveIndex((prev) => Math.min(prev + 1, filtered.length - 1));
                                    }
                                    if (event.key === "ArrowUp") {
                                        event.preventDefault();
                                        setActiveIndex((prev) => Math.max(prev - 1, 0));
                                    }
                                    if (event.key === "Enter") {
                                        event.preventDefault();
                                        const action = filtered[activeIndex];
                                        if (action) runAction(action);
                                    }
                                }}
                            />
                            <span className="command-palette__kbd">Esc</span>
                        </div>

                        <ul className="command-palette__list" role="listbox">
                            {filtered.length === 0 ? (
                                <li className="command-palette__empty">No results</li>
                            ) : (
                                filtered.map((action, index) => {
                                    const Icon = action.icon;
                                    return (
                                        <li key={action.id} role="option" aria-selected={index === activeIndex}>
                                            <button
                                                type="button"
                                                className={`command-palette__item${index === activeIndex ? " is-active" : ""}`}
                                                onClick={() => runAction(action)}
                                                onMouseEnter={() => setActiveIndex(index)}
                                            >
                                                <span className="command-palette__icon">
                                                    <Icon size={18} aria-hidden="true" />
                                                </span>
                                                <span className="command-palette__text">
                                                    <span className="command-palette__label">{action.label}</span>
                                                    <span className={`command-palette__hint${showHint ? "" : " is-hidden"}`}>
                                                        {action.hint}
                                                    </span>
                                                </span>
                                                <span className="command-palette__enter">Enter</span>
                                            </button>
                                        </li>
                                    );
                                })
                            )}
                        </ul>
                    </div>
                </div>
            ) : null}
        </>
    );
}
