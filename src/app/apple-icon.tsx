import { ImageResponse } from "next/og";
import { profile } from "@/lib/data";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
    const initials = profile.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();

    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    background: "#111111",
                    borderRadius: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#22c55e",
                    fontSize: "72px",
                    fontWeight: 700,
                    fontFamily: "Poppins, Arial, sans-serif",
                    border: "2px solid #1f1f1f",
                }}
            >
                {initials}
            </div>
        ),
        {
            width: size.width,
            height: size.height,
        }
    );
}
