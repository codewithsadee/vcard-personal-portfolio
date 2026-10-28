"use client";

import { Search } from "lucide-react";
import type { TabKey } from "@/lib/types";
import { hasBlogPosts } from "@/lib/data";
import { trackEvent } from "@/lib/analytics";

const labels: Record<TabKey, string> = {
    about: "About",
    resume: "Resume",
    portfolio: "Portfolio",
    blog: "Blog",
    contact: "Contact",
};

export default function Tabs({
    active,
    onChange,
}: {
    active: TabKey;
    onChange: (t: TabKey) => void;
}) {
    const items: TabKey[] = ["about", "resume", "portfolio", "blog", "contact"];
    const visibleItems = hasBlogPosts ? items : items.filter((item) => item !== "blog");

    return (
        <nav className="navbar">
            <ul className="navbar-list">
                <li className="navbar-item navbar-item--quick">
                    <button
                        type="button"
                        className="navbar-link navbar-link--icon"
                        onClick={() => {
                            trackEvent("quick_actions_click");
                            window.dispatchEvent(new Event("open-command-palette"));
                        }}
                        aria-label="Quick actions"
                    >
                        <Search aria-hidden="true" />
                    </button>
                </li>
                {visibleItems.map((t) => {
                    const isActive = t === active;
                    return (
                        <li className="navbar-item" key={t}>
                            <button
                                type="button"
                                data-nav-link
                                onClick={() => {
                                    trackEvent("tab_nav_click", { tab: t });
                                    onChange(t);
                                }}
                                className={`navbar-link${isActive ? " active" : ""}`}
                            >
                                {labels[t]}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
