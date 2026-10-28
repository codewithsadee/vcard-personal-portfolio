import { notFound } from "next/navigation";
import DevSettings from "@/components/DevSettings";

export default function DevPage() {
    const allowDevSettings = process.env.DEV_SETTINGS_ENABLED === "true";

    if (!allowDevSettings) {
        notFound();
    }

    return (
        <main className="dev-settings-page">
            <article className="dev-settings-panel active">
                <DevSettings />
            </article>
        </main>
    );
}
