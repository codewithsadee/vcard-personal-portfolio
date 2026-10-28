import { profile } from "@/lib/data";

// /text opens a new text message to me. GitHub strips sms: links from READMEs,
// so the "Message me" badge on my GitHub profile links here instead.
//
// Phones get an HTTP redirect straight to sms:, which counts as part of the
// tap, so Messages opens without an extra page or an "Open in Messages?"
// prompt. Everything else gets /message, a card showing my number.
const MOBILE = /iPhone|iPad|iPod|Android/i;

export function GET(request: Request) {
    const isPhone = MOBILE.test(request.headers.get("user-agent") ?? "");
    const location = isPhone
        ? `sms:${profile.phone.replace(/[^\d+]/g, "")}`
        : new URL("/message", request.url).toString();

    return new Response(null, {
        status: 307,
        headers: {
            Location: location,
            // The answer depends on the device, so caches must not share it.
            "Cache-Control": "no-store",
            Vary: "User-Agent",
            "X-Robots-Tag": "noindex",
        },
    });
}
