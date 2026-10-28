"use client";

type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

type PlausibleFn = (event: string, options?: { props?: AnalyticsProps }) => void;
type UmamiFn = (event: string, props?: AnalyticsProps) => void;
type GtagFn = (...args: unknown[]) => void;

export function trackEvent(event: string, props?: AnalyticsProps) {
    if (typeof window === "undefined") return;

    const plausible = (window as typeof window & { plausible?: PlausibleFn }).plausible;
    if (typeof plausible === "function") {
        plausible(event, props ? { props } : undefined);
    }

    const umami = (window as typeof window & { umami?: { track?: UmamiFn } }).umami;
    if (typeof umami?.track === "function") {
        umami.track(event, props);
    }

    const gtag = (window as typeof window & { gtag?: GtagFn }).gtag;
    if (typeof gtag === "function") {
        gtag("event", event, props ?? {});
    }
}
