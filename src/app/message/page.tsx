import type { Metadata } from "next";
import TextRedirect from "@/components/TextRedirect";
import { profile } from "@/lib/data";

// Where /text sends computers: a card with my number that also tries to open
// Messages, since a Mac can text too.
export const metadata: Metadata = {
    title: `Message ${profile.name}`,
    robots: { index: false, follow: false },
};

export default function MessagePage() {
    return <TextRedirect phone={profile.phone} />;
}
