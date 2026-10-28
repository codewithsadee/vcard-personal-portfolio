import type { Metadata } from "next";
import TextRedirect from "@/components/TextRedirect";
import { profile } from "@/lib/data";

// /text opens a new text message to me. GitHub strips sms: links from READMEs,
// so the "Text" badge on my GitHub profile links here instead.
export const metadata: Metadata = {
    title: `Text ${profile.name}`,
    robots: { index: false, follow: false },
};

export default function TextPage() {
    return <TextRedirect phone={profile.phone} />;
}
