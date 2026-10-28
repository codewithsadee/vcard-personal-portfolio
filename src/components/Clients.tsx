"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { clients } from "@/lib/data";

export default function Clients() {
    if (clients.length === 0) {
        return null;
    }

    const [activeIndex, setActiveIndex] = useState(0);
    const listRef = useRef<HTMLUListElement | null>(null);
    const scrollRaf = useRef<number | null>(null);

    const scrollToIndex = (index: number) => {
        const list = listRef.current;
        if (!list) return;
        const items = Array.from(list.children) as HTMLElement[];
        const target = items[index];
        if (!target) return;
        target.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    };

    const updateActiveFromScroll = () => {
        const list = listRef.current;
        if (!list) return;
        const items = Array.from(list.children) as HTMLElement[];
        if (!items.length) return;
        const listRect = list.getBoundingClientRect();
        const listCenter = listRect.left + listRect.width / 2;
        let closestIndex = 0;
        let closestDistance = Infinity;

        items.forEach((item, index) => {
            const rect = item.getBoundingClientRect();
            const itemCenter = rect.left + rect.width / 2;
            const distance = Math.abs(listCenter - itemCenter);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestIndex = index;
            }
        });

        setActiveIndex(closestIndex);
    };

    const handleScroll = () => {
        if (scrollRaf.current !== null) {
            cancelAnimationFrame(scrollRaf.current);
        }
        scrollRaf.current = requestAnimationFrame(updateActiveFromScroll);
    };

    useEffect(() => {
        const list = listRef.current;
        if (!list) return;
        list.addEventListener("scroll", handleScroll, { passive: true });
        updateActiveFromScroll();
        const handleResize = () => updateActiveFromScroll();
        window.addEventListener("resize", handleResize);
        return () => {
            list.removeEventListener("scroll", handleScroll);
            window.removeEventListener("resize", handleResize);
            if (scrollRaf.current !== null) {
                cancelAnimationFrame(scrollRaf.current);
            }
        };
    }, []);

    return (
        <section className="clients">
            <h3 className="h3 clients-title">Clients</h3>
            <ul
                className="clients-list has-scrollbar"
                ref={listRef}
                tabIndex={0}
                aria-label="Clients carousel"
                onKeyDown={(event) => {
                    if (event.key === "ArrowRight") {
                        event.preventDefault();
                        const next = Math.min(activeIndex + 1, clients.length - 1);
                        setActiveIndex(next);
                        scrollToIndex(next);
                    }
                    if (event.key === "ArrowLeft") {
                        event.preventDefault();
                        const prev = Math.max(activeIndex - 1, 0);
                        setActiveIndex(prev);
                        scrollToIndex(prev);
                    }
                    if (event.key === "Home") {
                        event.preventDefault();
                        setActiveIndex(0);
                        scrollToIndex(0);
                    }
                    if (event.key === "End") {
                        event.preventDefault();
                        const last = clients.length - 1;
                        setActiveIndex(last);
                        scrollToIndex(last);
                    }
                }}
            >
                {clients.map((client) => (
                    <li className="clients-item" key={client.name}>
                        <a href="#">
                            <Image
                                src={client.logo}
                                alt={client.name}
                                width={160}
                                height={160}
                                sizes="(max-width: 580px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            />
                        </a>
                    </li>
                ))}
            </ul>

            {clients.length > 1 ? (
                <div className="clients-dots" role="tablist" aria-label="Clients navigation">
                    {clients.map((client, index) => (
                        <button
                            key={client.name}
                            type="button"
                            className={`clients-dot${index === activeIndex ? " is-active" : ""}`}
                            onClick={() => {
                                setActiveIndex(index);
                                scrollToIndex(index);
                            }}
                            aria-label={`Show client ${index + 1} of ${clients.length}`}
                            aria-pressed={index === activeIndex}
                        />
                    ))}
                </div>
            ) : null}
        </section>
    );
}
