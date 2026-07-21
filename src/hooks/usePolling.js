import { useEffect, useRef } from "react";

/**
 * Custom hook: gọi `fn` mỗi `interval` ms khi `active = true`.
 * Tự dọn dẹp khi component unmount hoặc active đổi thành false.
 *
 * @param {() => void} fn        - Callback cần chạy định kỳ
 * @param {number}     interval  - Khoảng cách giữa các lần gọi (ms)
 * @param {boolean}    active    - Chỉ poll khi true
 */
export function usePolling(fn, interval = 3000, active = true) {
    const savedFn = useRef(fn);

    useEffect(() => {
        savedFn.current = fn;
    }, [fn]);

    useEffect(() => {
        if (!active) return;
        const id = setInterval(() => savedFn.current(), interval);
        return () => clearInterval(id);
    }, [active, interval]);
}
