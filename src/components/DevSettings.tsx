"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import { getContactSendEnabled, setContactSendEnabled } from "@/lib/contact-settings";

export default function DevSettings() {
    const [sendEnabled, setSendEnabled] = useState(true);

    useEffect(() => {
        setSendEnabled(getContactSendEnabled());
    }, []);

    const handleToggle = () => {
        const next = !sendEnabled;
        setSendEnabled(next);
        setContactSendEnabled(next);
        trackEvent("dev_contact_send_toggle", { enabled: next });
    };

    return (
        <div className="dev-settings">
            <header className="dev-settings__header">
                <div>
                    <h2 className="h2 article-title">Developer Settings</h2>
                    <p className="dev-settings__subtitle">Local toggles for testing the site.</p>
                </div>
                <Link className="dev-settings__back" href="/">
                    Back to site
                </Link>
            </header>

            <div className="dev-settings__card">
                <div className="dev-settings__row">
                    <div>
                        <p className="dev-settings__label">Send contact emails</p>
                        <p className="dev-settings__hint">
                            Disable to avoid using API credits while testing.
                        </p>
                    </div>
                    <button
                        type="button"
                        className={`dev-toggle${sendEnabled ? " is-on" : ""}`}
                        role="switch"
                        aria-checked={sendEnabled}
                        onClick={handleToggle}
                    >
                        <span className="dev-toggle__track">
                            <span className="dev-toggle__thumb" />
                        </span>
                        <span className="dev-toggle__text">{sendEnabled ? "On" : "Off"}</span>
                    </button>
                </div>

                <p className="dev-settings__note">
                    {sendEnabled
                        ? "Emails will be sent when the contact form submits."
                        : "Emails are disabled. The form will show a dry-run popup only."}
                </p>
            </div>
        </div>
    );
}
