import { headers } from "next/headers";
import { createOgImage, ogContentType, ogSize } from "./og-utils";

export const runtime = "edge";
export const size = ogSize;
export const contentType = ogContentType;

export default async function TwitterImage() {
    const headerStore = await headers();
    const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
    const proto = headerStore.get("x-forwarded-proto") ?? "http";
    const baseUrl = host ? `${proto}://${host}` : undefined;
    return createOgImage(baseUrl);
}
