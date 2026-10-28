const CONTACT_SEND_STORAGE_KEY = "contact-send-enabled";

export const getContactSendEnabled = () => {
    if (typeof window === "undefined") {
        return true;
    }
    const stored = window.localStorage.getItem(CONTACT_SEND_STORAGE_KEY);
    if (!stored) {
        return true;
    }
    return stored !== "false";
};

export const setContactSendEnabled = (enabled: boolean) => {
    if (typeof window === "undefined") {
        return;
    }
    window.localStorage.setItem(CONTACT_SEND_STORAGE_KEY, enabled ? "true" : "false");
};
