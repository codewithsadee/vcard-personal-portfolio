"use client";

import { useEffect } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";

export default function TextRedirect({ phone }: { phone: string }) {
    const smsHref = `sms:${phone.replace(/[^\d+]/g, "")}`;

    useEffect(() => {
        trackEvent("contact_text_redirect");
        window.location.href = smsHref;
    }, [smsHref]);

    return (
        <main className="text-redirect-page">
            <article className="text-redirect-panel active">
                <h2 className="h2 article-title">Opening Messages…</h2>
                <p className="text-redirect__body">
                    If nothing opens, text me at{" "}
                    <a href={smsHref} className="text-redirect__link">
                        {phone}
                    </a>
                </p>
                <Link href="/" className="text-redirect__back">
                    Back to my portfolio
                </Link>
            </article>
        </main>
    );
}
