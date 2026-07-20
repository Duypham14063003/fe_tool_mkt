// device_id / device_name are optional per the login API, but useful for
// per-device session management (see section 4.1 of the integration guide).
// We generate a stable per-browser id once and cache it in localStorage.

const DEVICE_ID_KEY = "19t_device_id";

export function getDeviceId() {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
        id =
            typeof crypto !== "undefined" && crypto.randomUUID
                ? crypto.randomUUID()
                : `web-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
}

export function getDeviceName() {
    const ua = navigator.userAgent || "";
    if (/Windows/i.test(ua)) return "Windows - Trình duyệt Web";
    if (/Macintosh|Mac OS/i.test(ua)) return "macOS - Trình duyệt Web";
    if (/Android/i.test(ua)) return "Android - Trình duyệt Web";
    if (/iPhone|iPad|iPod/i.test(ua)) return "iOS - Trình duyệt Web";
    return "Trình duyệt Web";
}