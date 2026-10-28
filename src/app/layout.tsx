import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";
import { Poppins } from "next/font/google";
import { profile } from "@/lib/data";

const poppins = Poppins({
    subsets: ["latin"],
    weight: ["300", "400", "500", "600"],
    display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
const plausibleSrc = process.env.NEXT_PUBLIC_PLAUSIBLE_SRC ?? "https://plausible.io/js/script.js";
const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
const umamiSrc = process.env.NEXT_PUBLIC_UMAMI_SRC ?? "https://us.umami.is/script.js";
const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "G-59Y72241LD";
const gaDebug = process.env.NEXT_PUBLIC_GA_DEBUG === "true" || process.env.NODE_ENV !== "production";
const title = `${profile.name} | ${profile.role}`;
const description = profile.tagline;

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title,
    description,
    icons: {
        icon: [{ url: "/icon?v=2" }],
        apple: [{ url: "/apple-icon?v=2" }],
    },
    openGraph: {
        title,
        description,
        type: "website",
        url: siteUrl,
    },
    twitter: {
        card: "summary_large_image",
        title,
        description,
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className={poppins.className}>
                {plausibleDomain ? (
                    <Script
                        src={plausibleSrc}
                        data-domain={plausibleDomain}
                        strategy="afterInteractive"
                    />
                ) : null}
                {umamiWebsiteId ? (
                    <Script
                        src={umamiSrc}
                        data-website-id={umamiWebsiteId}
                        strategy="afterInteractive"
                    />
                ) : null}
                {gaMeasurementId ? (
                    <>
                        <Script
                            src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
                            strategy="afterInteractive"
                        />
                        <Script id="ga4-init" strategy="afterInteractive">
                            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaMeasurementId}', { debug_mode: ${gaDebug ? "true" : "false"} });`}
                        </Script>
                    </>
                ) : null}
                {children}
            </body>
        </html>
    );
}
