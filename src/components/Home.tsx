"use client";

import {
    useEffect,
    useLayoutEffect,
    useMemo,
    useCallback,
    memo,
    useRef,
    useState,
    type MouseEvent as ReactMouseEvent,
    type PointerEvent as ReactPointerEvent,
} from "react";
import {
    animate,
    motion,
    type PanInfo,
    type MotionStyle,
    type ValueAnimationTransition,
    useDragControls,
    useMotionValue,
    useSpring,
    useTransform,
} from "framer-motion";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { TabKey } from "@/lib/types";
import { hasBlogPosts } from "@/lib/data";
import { trackEvent } from "@/lib/analytics";
import Sidebar from "./Sidebar";
import Tabs from "./Tabs";
import CommandPalette from "./CommandPalette";

import About from "@/components/sections/About";
import Resume from "@/components/sections/Resume";
import Portfolio from "@/components/sections/Portfolio";
import Blog from "@/components/sections/Blog";
import Contact from "@/components/sections/Contact";

const BASE_TABS: TabKey[] = ["about", "resume", "portfolio", "blog", "contact"];
const AVAILABLE_TABS: TabKey[] = hasBlogPosts
    ? BASE_TABS
    : BASE_TABS.filter((tab) => tab !== "blog");
const SNAP_DISTANCE_RATIO = 0.25;
const SNAP_VELOCITY_THRESHOLD = 600;
const SNAP_TRANSITION = {
    type: "spring",
    stiffness: 320,
    damping: 32,
    mass: 0.7,
} satisfies ValueAnimationTransition<number>;

type TransitionDirection = -1 | 0 | 1;

type TransitionSource = "click" | "drag";

const MemoAbout = memo(About);
const MemoResume = memo(Resume);
const MemoPortfolio = memo(Portfolio);
const MemoBlog = memo(Blog);
const MemoContact = memo(Contact);

const isProjectModalOpen = () =>
    typeof document !== "undefined" &&
    document.body.classList.contains("is-project-modal-open");

const shouldIgnoreSwipeTarget = (target: EventTarget | null) => {
    if (!(target instanceof Element)) {
        return false;
    }
    return Boolean(target.closest("[data-no-swipe]"));
};

export default function Home() {
    const sp = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const dragX = useMotionValue(0);
    const smoothX = useSpring(dragX, { stiffness: 420, damping: 48, mass: 0.8 });
    const dragControls = useDragControls();
    const panelsRef = useRef<HTMLDivElement | null>(null);
    const panelWidthRef = useRef(0);
    const isTransitioningRef = useRef(false);
    const dragActiveRef = useRef(false);
    const dragDirectionRef = useRef<TransitionDirection>(0);
    const pendingResetRef = useRef(false);
    const pendingUrlTabRef = useRef<TabKey | null>(null);
    const suppressClickRef = useRef(false);
    const suppressClickTimeoutRef = useRef<ReturnType<typeof setTimeout> | number | null>(null);

    const urlTab = useMemo<TabKey>(() => {
        const t = sp.get("tab") as TabKey | null;
        return t && AVAILABLE_TABS.includes(t) ? t : "about";
    }, [sp]);

    const [currentTab, setCurrentTab] = useState<TabKey>(urlTab);
    const [backTab, setBackTab] = useState<TabKey | null>(null);
    const [dragTab, setDragTab] = useState<TabKey | null>(null);
    const [panelWidth, setPanelWidth] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const [dragDirection, setDragDirection] = useState<TransitionDirection>(0);

    const currentIndex = AVAILABLE_TABS.indexOf(currentTab);
    const prevTab = currentIndex > 0 ? AVAILABLE_TABS[currentIndex - 1] : null;
    const nextTab = currentIndex < AVAILABLE_TABS.length - 1 ? AVAILABLE_TABS[currentIndex + 1] : null;
    const frontTab = dragTab ?? currentTab;
    const updateDragDirection = useCallback((direction: TransitionDirection) => {
        if (dragDirectionRef.current === direction) {
            return;
        }
        dragDirectionRef.current = direction;
        setDragDirection(direction);
    }, []);
    const frontX = useTransform(smoothX, (x) => (dragDirection === 1 ? x : 0));
    const backX = useTransform(smoothX, (x) =>
        dragDirection === -1 ? x - panelWidthRef.current : 0
    );

    useLayoutEffect(() => {
        if (!panelsRef.current) {
            return;
        }
        const updateWidth = () => {
            if (!panelsRef.current) {
                return;
            }
            const nextWidth = panelsRef.current.getBoundingClientRect().width;
            panelWidthRef.current = nextWidth;
            setPanelWidth(nextWidth);
        };
        updateWidth();

        const resizeObserver =
            typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateWidth) : null;
        if (resizeObserver) {
            resizeObserver.observe(panelsRef.current);
        }
        window.addEventListener("resize", updateWidth);
        return () => {
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
            window.removeEventListener("resize", updateWidth);
        };
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }
        const media = window.matchMedia("(max-width: 1023px)");
        const update = () => setIsMobile(media.matches);
        update();
        media.addEventListener("change", update);
        return () => media.removeEventListener("change", update);
    }, []);

    useEffect(() => {
        if (isMobile) {
            return;
        }
        dragX.set(0);
        setBackTab(null);
        setDragTab(null);
        dragActiveRef.current = false;
        updateDragDirection(0);
    }, [isMobile, dragX, updateDragDirection]);

    useLayoutEffect(() => {
        if (!pendingResetRef.current) {
            return;
        }
        pendingResetRef.current = false;
        dragX.set(0);
    }, [currentTab, dragX]);

    useEffect(() => {
        const pending = pendingUrlTabRef.current;
        if (pending) {
            if (urlTab === pending) {
                pendingUrlTabRef.current = null;
            } else if (currentTab === pending) {
                return;
            } else {
                pendingUrlTabRef.current = null;
            }
        }
        if (isTransitioningRef.current) {
            return;
        }
        if (urlTab !== currentTab) {
            setCurrentTab(urlTab);
            setBackTab(null);
            setDragTab(null);
            dragX.set(0);
            dragActiveRef.current = false;
            updateDragDirection(0);
        }
    }, [urlTab, currentTab, dragX, updateDragDirection]);

    useEffect(() => {
        trackEvent("tab_view", { tab: currentTab });
    }, [currentTab]);

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }
        if (isProjectModalOpen()) {
            return;
        }
        let raf1 = 0;
        let raf2 = 0;
        raf1 = window.requestAnimationFrame(() => {
            raf2 = window.requestAnimationFrame(() => {
                const doc = document.documentElement;
                const max = doc.scrollHeight - window.innerHeight;
                if (max <= 0) {
                    return;
                }
                if (window.scrollY > max) {
                    window.scrollTo({ top: max, left: 0, behavior: "smooth" });
                }
            });
        });
        return () => {
            if (raf1) {
                window.cancelAnimationFrame(raf1);
            }
            if (raf2) {
                window.cancelAnimationFrame(raf2);
            }
        };
    }, [currentTab]);

    useEffect(() => {
        return () => {
            if (suppressClickTimeoutRef.current) {
                clearTimeout(suppressClickTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const thresholds = [25, 50, 75, 100];
        const fired = new Set<number>();

        const handleScroll = () => {
            const doc = document.documentElement;
            const max = doc.scrollHeight - window.innerHeight;
            const percent = max > 0 ? Math.min(100, Math.round((window.scrollY / max) * 100)) : 100;

            thresholds.forEach((mark) => {
                if (percent >= mark && !fired.has(mark)) {
                    fired.add(mark);
                    trackEvent("scroll_depth", { percent: mark, tab: currentTab });
                }
            });
        };

        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [currentTab]);

    const updateUrl = (tab: TabKey) => {
        pendingUrlTabRef.current = tab;
        const next = new URLSearchParams(sp.toString());
        next.set("tab", tab);
        router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    };

    const finalizeTab = (tab: TabKey, from: TabKey, source: TransitionSource) => {
        setCurrentTab(tab);
        setBackTab(null);
        setDragTab(null);
        updateDragDirection(0);
        pendingResetRef.current = true;
        isTransitioningRef.current = false;
        updateUrl(tab);
        if (source === "drag") {
            trackEvent("tab_swipe", { from, to: tab });
        }
    };

    const startTransition = (tab: TabKey, source: TransitionSource) => {
        if (!AVAILABLE_TABS.includes(tab)) {
            return;
        }
        if (tab === currentTab) {
            return;
        }
        if (isProjectModalOpen()) {
            return;
        }
        if (isTransitioningRef.current) {
            return;
        }
        const from = currentTab;
        const fromIndex = AVAILABLE_TABS.indexOf(from);
        const toIndex = AVAILABLE_TABS.indexOf(tab);
        if (fromIndex === -1 || toIndex === -1) {
            finalizeTab(tab, from, source);
            return;
        }
        const direction: TransitionDirection = toIndex > fromIndex ? 1 : -1;
        if (!isMobile || panelWidth <= 0) {
            finalizeTab(tab, from, source);
            return;
        }
        setDragTab(from);
        setBackTab(tab);
        updateDragDirection(direction);
        isTransitioningRef.current = true;
        const targetX = direction > 0 ? -panelWidth : panelWidth;
        const controls = animate(dragX, targetX, SNAP_TRANSITION);
        controls.then(() => finalizeTab(tab, from, source));
    };

    const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
        if (!isMobile) {
            return;
        }
        if (isProjectModalOpen()) {
            return;
        }
        if (shouldIgnoreSwipeTarget(event.target)) {
            return;
        }
        if (!prevTab && !nextTab) {
            return;
        }
        if (isTransitioningRef.current) {
            return;
        }
        if (suppressClickTimeoutRef.current) {
            clearTimeout(suppressClickTimeoutRef.current);
        }
        suppressClickRef.current = false;
        dragControls.start(event.nativeEvent);
    };

    const handleDragStart = () => {
        dragActiveRef.current = true;
        updateDragDirection(0);
        setDragTab(currentTab);
        setBackTab(null);
    };

    const handleDrag = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (!dragActiveRef.current) {
            return;
        }
        const offsetX = info.offset.x;
        if (!suppressClickRef.current) {
            const offsetY = info.offset.y;
            if (Math.abs(offsetX) > 6 && Math.abs(offsetX) > Math.abs(offsetY)) {
                suppressClickRef.current = true;
            }
        }
        const direction = offsetX < 0 ? 1 : offsetX > 0 ? -1 : 0;
        const nextDirection: TransitionDirection =
            direction === 1 && nextTab
                ? 1
                : direction === -1 && prevTab
                  ? -1
                  : 0;
        if (nextDirection === dragDirectionRef.current) {
            return;
        }
        updateDragDirection(nextDirection);
        if (nextDirection === 1) {
            setBackTab(nextTab ?? null);
        } else if (nextDirection === -1) {
            setBackTab(prevTab ?? null);
        } else {
            setBackTab(null);
        }
    };

    const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (!dragActiveRef.current) {
            return;
        }
        dragActiveRef.current = false;
        if (suppressClickRef.current) {
            if (suppressClickTimeoutRef.current) {
                clearTimeout(suppressClickTimeoutRef.current);
            }
            suppressClickTimeoutRef.current = window.setTimeout(() => {
                suppressClickRef.current = false;
            }, 120);
        }
        const offsetX = info.offset.x;
        const velocityX = info.velocity.x;
        const direction = offsetX < 0 ? 1 : offsetX > 0 ? -1 : 0;
        const targetTab = direction === 1 ? nextTab : direction === -1 ? prevTab : null;
        const threshold = panelWidth * SNAP_DISTANCE_RATIO;
        const shouldCommit =
            Boolean(targetTab) &&
            (Math.abs(offsetX) > threshold || Math.abs(velocityX) > SNAP_VELOCITY_THRESHOLD);

        if (shouldCommit && targetTab) {
            isTransitioningRef.current = true;
            setBackTab(targetTab);
            const targetX = direction > 0 ? -panelWidth : panelWidth;
            const from = currentTab;
            const controls = animate(dragX, targetX, SNAP_TRANSITION);
            controls.then(() => finalizeTab(targetTab, from, "drag"));
            return;
        }

        const controls = animate(dragX, 0, SNAP_TRANSITION);
        controls.then(() => {
            setBackTab(null);
            setDragTab(null);
            updateDragDirection(0);
        });
    };

    const handleClickCapture = (event: ReactMouseEvent<HTMLDivElement>) => {
        if (!suppressClickRef.current) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
    };

    return (
        <>
            <main>
                <Sidebar />

                <div className="main-content">
                    <Tabs active={currentTab} onChange={(tab) => startTransition(tab, "click")} />

                    <div
                        className="tab-panels"
                        ref={panelsRef}
                        onPointerDownCapture={handlePointerDown}
                        onClickCapture={handleClickCapture}
                    >
                        <motion.div
                            aria-hidden="true"
                            drag={isMobile ? "x" : false}
                            dragControls={dragControls}
                            dragListener={false}
                            dragConstraints={{
                                left: nextTab ? -panelWidth : 0,
                                right: prevTab ? panelWidth : 0,
                            }}
                            dragElastic={0.12}
                            dragMomentum={false}
                            onDragStart={handleDragStart}
                            onDrag={handleDrag}
                            onDragEnd={handleDragEnd}
                            style={{
                                position: "absolute",
                                inset: 0,
                                opacity: 0,
                                pointerEvents: "none",
                                x: dragX,
                            }}
                        />
                        {AVAILABLE_TABS.map((tab) => {
                            const isFront = tab === frontTab;
                            const isBack = tab === backTab;
                            const isVisible = isFront || isBack;
                            const frontZ = dragDirection === -1 ? 1 : 2;
                            const backZ = dragDirection === -1 ? 2 : 1;
                            const content =
                                tab === "about" ? (
                                    <MemoAbout />
                                ) : tab === "resume" ? (
                                    <MemoResume />
                                ) : tab === "portfolio" ? (
                                    <MemoPortfolio />
                                ) : tab === "blog" ? (
                                    <MemoBlog />
                                ) : (
                                    <MemoContact />
                                );
                            const baseStyle: MotionStyle = {
                                display: isVisible ? "block" : "none",
                                position: isFront ? "relative" : "absolute",
                                inset: isFront ? undefined : 0,
                                pointerEvents: isFront ? "auto" : "none",
                                zIndex: isFront ? frontZ : isBack ? backZ : 0,
                                willChange: isVisible ? "transform" : "auto",
                            };
                            const motionProps = isFront
                                ? {
                                      style: {
                                          ...baseStyle,
                                          x: frontX,
                                          touchAction: "pan-y",
                                      },
                                  }
                                : isBack
                                  ? {
                                        style: {
                                            ...baseStyle,
                                            x: backX,
                                        },
                                    }
                                  : { style: baseStyle };

                            return (
                                <motion.article
                                    key={tab}
                                    className={`${tab}${tab === currentTab ? " active" : ""}`}
                                    data-page={tab}
                                    aria-hidden={!isFront}
                                    {...motionProps}
                                >
                                    {content}
                                </motion.article>
                            );
                        })}
                    </div>
                </div>
            </main>

            <CommandPalette onNavigate={(tab) => startTransition(tab, "click")} />
        </>
    );
}
