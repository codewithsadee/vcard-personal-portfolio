import { ImageResponse } from "next/og";
import { profile } from "@/lib/data";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#22c55e",
                    fontSize: "16px",
                    fontWeight: 700,
                    fontFamily: "Poppins, Arial, sans-serif",
                    border: "1px solid #1f1f1f",
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
