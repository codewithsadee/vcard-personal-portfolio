import { ImageResponse } from "next/og";
import { profile, services } from "@/lib/data";

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

const ACCENT = "#25c26a";
const TEXT_PRIMARY = "#f5f5f5";
const TEXT_MUTED = "#b0b0b0";
const TEXT_SOFT = "#8a8a8a";
const CARD_BG = "#151515";
const CARD_BORDER = "#2b2b2b";
const CHIP_BG = "#1f1f1f";
const CHIP_BORDER = "#343434";

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        binary += String.fromCharCode(...chunk);
    }
    return btoa(binary);
};

const resolveBaseUrl = (override?: string) => {
    if (override) {
        return override.startsWith("http") ? override : `https://${override}`;
    }
    const explicit = process.env.NEXT_PUBLIC_SITE_URL;
    if (explicit) {
        return explicit.startsWith("http") ? explicit : `https://${explicit}`;
    }
    const vercelUrl = process.env.VERCEL_URL;
    if (vercelUrl) {
        return `https://${vercelUrl}`;
    }
    return "http://localhost:3000";
};

const getDomain = () => {
    const email = profile.email ?? "";
    if (email.includes("@")) {
        return email.split("@")[1];
    }
    return "portfolio";
};

export const createOgImage = async (baseUrl?: string) => {
    const initials = profile.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();

    const avatarPath = profile.ogAvatar ?? profile.avatar;
    let avatarSrc: string | null = null;
    try {
        const avatarUrl = new URL(avatarPath, resolveBaseUrl(baseUrl));
        const response = await fetch(avatarUrl);
        const contentType = response.headers.get("content-type") ?? "";
        if (response.ok && contentType.startsWith("image/")) {
            const buffer = await response.arrayBuffer();
            const base64 = arrayBufferToBase64(buffer);
            avatarSrc = `data:${contentType};base64,${base64}`;
        }
    } catch {
        avatarSrc = null;
    }

    const highlights = services.slice(0, 3).map((service) => service.title);
    const domain = getDomain();

    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "64px",
                    backgroundColor: "#0b0b0c",
                    backgroundImage:
                        "radial-gradient(circle at top left, rgba(37,194,106,0.18), transparent 45%), radial-gradient(circle at bottom right, rgba(37,194,106,0.12), transparent 40%)",
                    fontFamily: "Poppins, Arial, sans-serif",
                }}
            >
                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        padding: "0px",
                        borderRadius: "0px",
                        backgroundColor: CARD_BG,
                        border: `1px solid ${CARD_BORDER}`,
                        boxShadow: "0 30px 70px rgba(0,0,0,0.45)",
                        display: "flex",
                        color: TEXT_PRIMARY,
                    }}
                >
                    <div
                        style={{
                            width: "38%",
                            height: "100%",
                            backgroundColor: CARD_BG,
                            display: "flex",
                            alignItems: "stretch",
                            justifyContent: "center",
                            padding: "28px",
                        }}
                    >
                        <div
                            style={{
                                width: "100%",
                                height: "100%",
                                borderRadius: "20px",
                                backgroundColor: CARD_BG,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                overflow: "hidden",
                            }}
                        >
                            {avatarSrc ? (
                                <img
                                    src={avatarSrc}
                                    width={480}
                                    height={600}
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                            ) : (
                                <span
                                    style={{
                                        fontSize: "76px",
                                        fontWeight: 700,
                                        color: ACCENT,
                                    }}
                                >
                                    {initials}
                                </span>
                            )}
                        </div>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            flex: 1,
                            padding: "40px",
                            gap: "16px",
                            justifyContent: "center",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "33px",
                                letterSpacing: "0.3em",
                                textTransform: "uppercase",
                                color: ACCENT,
                            }}
                        >
                            Portfolio
                        </div>
                        <div style={{ fontSize: "56px", fontWeight: 700, lineHeight: 1.05 }}>
                            {profile.name}
                        </div>
                        <div style={{ fontSize: "24px", color: TEXT_MUTED }}>{profile.role}</div>

                        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                            {highlights.map((title) => (
                                <div
                                    key={title}
                                    style={{
                                        padding: "8px 14px",
                                        borderRadius: "999px",
                                        border: `1px solid ${CHIP_BORDER}`,
                                        backgroundColor: CHIP_BG,
                                        color: TEXT_MUTED,
                                        fontSize: "15px",
                                    }}
                                >
                                    {title}
                                </div>
                            ))}
                        </div>

                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                flexWrap: "nowrap",
                            }}
                        >
                            <div style={{ fontSize: "18px", color: TEXT_MUTED }}>{profile.location}</div>
                            <div
                                style={{
                                    flex: 1,
                                    height: "6px",
                                    backgroundColor: ACCENT,
                                    borderRadius: "999px",
                                }}
                            />
                            <div style={{ fontSize: "16px", color: ACCENT, whiteSpace: "nowrap" }}>
                                {domain}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        ),
        {
            width: ogSize.width,
            height: ogSize.height,
        }
    );
};
