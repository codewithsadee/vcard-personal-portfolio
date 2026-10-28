"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { testimonials } from "@/lib/data";

const quoteIcon = "/assets/images/icon-quote.svg";

const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }
    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(date);
};

export default function Testimonials() {
    if (testimonials.length === 0) {
        return null;
    }

    const [modalOpen, setModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState({
        avatar: "",
        name: "",
        text: "",
        date: "",
    });
    const [activeIndex, setActiveIndex] = useState(0);
    const listRef = useRef<HTMLUListElement | null>(null);
    const scrollRaf = useRef<number | null>(null);

    const openModal = (avatar: string, name: string, text: string, date: string) => {
        setModalContent({ avatar, name, text, date });
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
    };

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
        <section className="testimonials">
            <h3 className="h3 testimonials-title">Testimonials</h3>

            <ul
                className="testimonials-list has-scrollbar"
                ref={listRef}
                tabIndex={0}
                aria-label="Testimonials carousel"
                onKeyDown={(event) => {
                    if (event.key === "ArrowRight") {
                        event.preventDefault();
                        const next = Math.min(activeIndex + 1, testimonials.length - 1);
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
                        const last = testimonials.length - 1;
                        setActiveIndex(last);
                        scrollToIndex(last);
                    }
                }}
            >
                {testimonials.map((testimonial) => (
                    <li
                        className="testimonials-item"
                        key={testimonial.name}
                        onClick={() =>
                            openModal(
                                testimonial.avatar,
                                testimonial.name,
                                testimonial.text,
                                testimonial.date
                            )
                        }
                    >
                        <div className="content-card" data-testimonials-item>
                            <figure className="testimonials-avatar-box">
                                <Image
                                    src={testimonial.avatar}
                                    alt={testimonial.name}
                                    width={60}
                                    height={60}
                                    sizes="(min-width: 580px) 80px, 60px"
                                />
                            </figure>

                            <h4 className="h4 testimonials-item-title" data-testimonials-title>
                                {testimonial.name}
                            </h4>

                            <div className="testimonials-text" data-testimonials-text>
                                <p>{testimonial.text}</p>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>

            <div className="testimonials-dots" role="tablist" aria-label="Testimonials navigation">
                {testimonials.map((testimonial, index) => (
                    <button
                        key={testimonial.name}
                        type="button"
                        className={`testimonials-dot${index === activeIndex ? " is-active" : ""}`}
                        onClick={() => {
                            setActiveIndex(index);
                            scrollToIndex(index);
                        }}
                        aria-label={`Show testimonial ${index + 1} of ${testimonials.length}`}
                        aria-pressed={index === activeIndex}
                    />
                ))}
            </div>

            {modalOpen && (
                <div className="modal-container active" data-modal-container>
                    <div className="overlay active" data-overlay onClick={closeModal}></div>

                    <section className="testimonials-modal">
                        <button
                            type="button"
                            className="modal-close-btn"
                            data-modal-close-btn
                            onClick={closeModal}
                        >
                            <X aria-hidden="true" />
                        </button>

                        <div className="modal-img-wrapper">
                            <figure className="modal-avatar-box">
                                <Image
                                    src={modalContent.avatar}
                                    alt={modalContent.name}
                                    width={80}
                                    height={80}
                                    sizes="80px"
                                />
                            </figure>
                            <Image
                                src={quoteIcon}
                                alt="Quote icon"
                                width={32}
                                height={32}
                                className="quote-icon"
                            />
                        </div>

                        <div className="modal-content">
                            <h4 className="h4 modal-title" data-modal-title>
                                {modalContent.name}
                            </h4>

                            {modalContent.date ? (
                                <time dateTime={modalContent.date}>{formatDate(modalContent.date)}</time>
                            ) : null}

                            <div data-modal-text>
                                <p>{modalContent.text}</p>
                            </div>
                        </div>
                    </section>
                </div>
            )}
        </section>
    );
}
