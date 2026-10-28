import { NextResponse } from "next/server";

const RESEND_API_URL = "https://api.resend.com/emails";
const EMAIL_PATTERN = /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9-]+(?:\.[A-Z0-9-]+)+$/i;

type ContactPayload = {
    name: string;
    email: string;
    message: string;
    company?: string;
};

const escapeHtml = (value: string) =>
    value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

const sendResendEmail = async ({
    apiKey,
    from,
    to,
    subject,
    text,
    html,
    replyTo,
}: {
    apiKey: string;
    from: string;
    to: string | string[];
    subject: string;
    text: string;
    html: string;
    replyTo?: string;
}) => {
    const response = await fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from,
            to: Array.isArray(to) ? to : [to],
            subject,
            text,
            html,
            ...(replyTo ? { reply_to: replyTo } : {}),
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => null);
        return { ok: false, message: error?.message || "Failed to send message." };
    }

    return { ok: true };
};

export async function POST(request: Request) {
    try {
        const payload = (await request.json()) as ContactPayload;
        const name = payload.name?.trim();
        const email = payload.email?.trim();
        const message = payload.message?.trim();
        const company = payload.company?.trim();

        if (company) {
            return NextResponse.json({ ok: true });
        }

        if (!name || !email || !message) {
            return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
        }

        if (!EMAIL_PATTERN.test(email)) {
            return NextResponse.json({ message: "Invalid email address." }, { status: 400 });
        }

        if (message.length > 5000) {
            return NextResponse.json({ message: "Message is too long." }, { status: 400 });
        }

        const apiKey = process.env.RESEND_API_KEY;
        const to = process.env.CONTACT_TO_EMAIL;
        const from = process.env.CONTACT_FROM_EMAIL;

        if (!apiKey || !to || !from) {
            return NextResponse.json(
                { message: "Contact form is not configured yet." },
                { status: 500 }
            );
        }

        const subject = `Portfolio contact from ${name}`;
        const text = `Name: ${name}\nEmail: ${email}\n\n${message}`;
        const safeName = escapeHtml(name);
        const safeEmail = escapeHtml(email);
        const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");
        const html = `<p><strong>Name:</strong> ${safeName}</p>
<p><strong>Email:</strong> ${safeEmail}</p>
<p><strong>Message:</strong></p>
<p>${safeMessage}</p>`;

        const primaryResult = await sendResendEmail({
            apiKey,
            from,
            to,
            subject,
            text,
            html,
            replyTo: email,
        });

        if (!primaryResult.ok) {
            return NextResponse.json(
                { message: primaryResult.message || "Failed to send message." },
                { status: 502 }
            );
        }

        const replySubject = "Thanks for reaching out!";
        const replyText = `Hi ${name},\n\nThanks for your message — I received it and will get back to you soon.\n\nDaniel`;
        const replyHtml = `<p>Hi ${safeName},</p>
<p>Thanks for your message — I received it and will get back to you soon.</p>
<p>Daniel</p>`;

        const autoReplyResult = await sendResendEmail({
            apiKey,
            from,
            to: email,
            subject: replySubject,
            text: replyText,
            html: replyHtml,
            replyTo: to,
        });

        return NextResponse.json({ ok: true, autoReplySent: autoReplyResult.ok });
    } catch {
        return NextResponse.json({ message: "Invalid request." }, { status: 400 });
    }
}
