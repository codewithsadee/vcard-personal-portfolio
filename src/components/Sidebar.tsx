"use client";

import Image from "next/image";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
    BriefcaseBusiness,
    Github,
    Instagram,
    Linkedin,
    Mail,
    MapPin,
    Phone,
    UserRound,
} from "lucide-react";
import { profile, socials } from "@/lib/data";
import { trackEvent } from "@/lib/analytics";

const socialIcons: Record<string, typeof Github> = {
    GitHub: Github,
    LinkedIn: Linkedin,
    Instagram: Instagram,
};

export default function Sidebar() {
    const sidebarRef = useRef<HTMLElement | null>(null);
    const infoRef = useRef<HTMLDivElement | null>(null);
    const infoMoreInnerRef = useRef<HTMLDivElement | null>(null);
    const openHeightRef = useRef<number | null>(null);
    const infoMoreHeightRef = useRef<number | null>(null);
    const [open, setOpen] = useState(false);
    const [openHeight, setOpenHeight] = useState<number | null>(null);
    const [infoMoreHeight, setInfoMoreHeight] = useState<number | null>(null);
    const available = useMemo(() => profile.status.available, []);

    const updateOpenHeight = useCallback(() => {
        if (!sidebarRef.current || !infoRef.current || !infoMoreInnerRef.current) {
            return;
        }
        const headerHeight = infoRef.current.getBoundingClientRect().height;
        const moreHeight = infoMoreInnerRef.current.scrollHeight;
        const styles = window.getComputedStyle(sidebarRef.current);
        const paddingTop = Number.parseFloat(styles.paddingTop) || 0;
        const paddingBottom = Number.parseFloat(styles.paddingBottom) || 0;
        const next = Math.ceil(headerHeight + moreHeight + paddingTop + paddingBottom);
        const nextMore = Math.ceil(moreHeight);
        if (openHeightRef.current !== next) {
            openHeightRef.current = next;
            setOpenHeight(next);
        }
        if (infoMoreHeightRef.current !== nextMore) {
            infoMoreHeightRef.current = nextMore;
            setInfoMoreHeight(nextMore);
        }
    }, []);

    useLayoutEffect(() => {
        updateOpenHeight();
        if (typeof document !== "undefined" && "fonts" in document) {
            void (document as Document & { fonts?: FontFaceSet }).fonts?.ready?.then(() => {
                updateOpenHeight();
            });
        }
        const resizeObserver =
            typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateOpenHeight) : null;
        if (resizeObserver) {
            if (infoRef.current) {
                resizeObserver.observe(infoRef.current);
            }
            if (infoMoreInnerRef.current) {
                resizeObserver.observe(infoMoreInnerRef.current);
            }
        }
        window.addEventListener("resize", updateOpenHeight);
        return () => {
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
            window.removeEventListener("resize", updateOpenHeight);
        };
    }, [updateOpenHeight]);

    useLayoutEffect(() => {
        updateOpenHeight();
        const frame = window.requestAnimationFrame(updateOpenHeight);
        return () => window.cancelAnimationFrame(frame);
    }, [open, updateOpenHeight]);

    const sidebarStyle = useMemo<
        | (CSSProperties & {
              "--sidebar-open-height"?: string;
              "--sidebar-info-more-height"?: string;
          })
        | undefined
    >(() => {
        if (!openHeight && !infoMoreHeight) {
            return undefined;
        }
        const style: CSSProperties & {
            "--sidebar-open-height"?: string;
            "--sidebar-info-more-height"?: string;
        } = {};
        if (openHeight) {
            style["--sidebar-open-height"] = `${openHeight}px`;
        }
        if (infoMoreHeight) {
            style["--sidebar-info-more-height"] = `${infoMoreHeight}px`;
        }
        return style;
    }, [openHeight, infoMoreHeight]);
    return (
        <aside
            className={`sidebar${open ? " active" : ""}`}
            data-sidebar
            style={sidebarStyle}
            ref={sidebarRef}
            onClick={(event) => {
                if (window.matchMedia("(min-width: 1250px)").matches) {
                    return;
                }
                const target = event.target as HTMLElement;
                if (target.closest("a, button, input, textarea, select, [data-no-sidebar-toggle]")) {
                    return;
                }
                setOpen((v) => !v);
            }}
        >
            <div className="sidebar-info" ref={infoRef}>
                <figure className="avatar-box">
                    <Image
                        src={profile.avatar}
                        alt={profile.name}
                        width={96}
                        height={96}
                        sizes="(min-width: 1250px) 160px, (min-width: 768px) 130px, (min-width: 580px) 104px, 96px"
                        priority
                        quality={100}
                        unoptimized
                    />
                </figure>

                <div className="info-content">
                    <h1 className="name" title={profile.name}>
                        {profile.name}
                    </h1>
                    <p className="title">{profile.role}</p>
                    <div className="status-row">
                        <span className={`status-chip${available ? " is-open" : " is-closed"}`}>
                            {profile.status.label}
                        </span>
                    </div>
                </div>

                <button
                    type="button"
                    className="info_more-btn"
                    data-sidebar-btn
                    aria-expanded={open}
                    onClick={(event) => {
                        event.stopPropagation();
                        trackEvent("sidebar_contacts_toggle", { open: !open });
                        setOpen((v) => !v);
                    }}
                >
                    <span className="info_more-btn__icon" aria-hidden="true">
                        <UserRound size={16} />
                    </span>
                    <span className="info_more-btn__label">Show Contacts</span>
                </button>
            </div>

            <div className="sidebar-info_more">
                <div className="sidebar-info_more-inner" ref={infoMoreInnerRef}>
                    <div className="separator"></div>

                    <ul className="contacts-list">
                        <li className="contact-item">
                            <div className="icon-box">
                                <Mail aria-hidden="true" />
                            </div>
                            <div className="contact-info">
                                <p className="contact-title">Email</p>
                                <a
                                    href={`mailto:${profile.email}`}
                                    className="contact-link"
                                    onClick={() => trackEvent("contact_email_click")}
                                >
                                    {profile.email}
                                </a>
                            </div>
                        </li>

                        <li className="contact-item">
                            <div className="icon-box">
                                <Phone aria-hidden="true" />
                            </div>
                            <div className="contact-info">
                                <p className="contact-title">Phone</p>
                                <a
                                    href={`tel:${profile.phone}`}
                                    className="contact-link"
                                    onClick={() => trackEvent("contact_phone_click")}
                                >
                                    {profile.phone}
                                </a>
                            </div>
                        </li>

                        <li className="contact-item">
                            <div className="icon-box">
                                <BriefcaseBusiness aria-hidden="true" />
                            </div>
                            <div className="contact-info">
                                <p className="contact-title">Current role</p>
                                <span className="contact-link contact-link--stacked">
                                    <span>{profile.currentRole.title}</span>
                                    <span>{profile.currentRole.organization}</span>
                                </span>
                            </div>
                        </li>

                        <li className="contact-item">
                            <div className="icon-box">
                                <MapPin aria-hidden="true" />
                            </div>
                            <div className="contact-info">
                                <p className="contact-title">Location</p>
                                <address>{profile.location}</address>
                            </div>
                        </li>
                    </ul>

                    <div className="separator"></div>

                    <ul className="social-list">
                        {socials.map((s) => {
                            const Icon = socialIcons[s.label] ?? Github;
                            return (
                                <li className="social-item" key={s.label}>
                                    <a
                                        className="social-link"
                                        href={s.href}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={() => trackEvent("social_click", { network: s.label })}
                                    >
                                        <Icon aria-label={s.label} size={18} />
                                    </a>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </aside>
    );
}
