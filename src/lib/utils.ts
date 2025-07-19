/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * A simple logger utility that prefixes messages with a given name.
 * @param name - The name of the logger (e.g., component name).
 * @returns A logger function.
 */
export const logger = (name: string) => {
    const log = (...args: any[]) => {
        console.log(`[${name}]`, ...args);
    };
    log.error = (...args: any[]) => {
        console.error(`[${name}]`, ...args);
    };
    log.warn = (...args: any[]) => {
        console.warn(`[${name}]`, ...args);
    };
    return log;
};

/**
 * Debounces a function, ensuring it's only called after a certain amount of time has passed without it being called.
 * @param func - The function to debounce.
 * @param delay - The debounce delay in milliseconds.
 * @returns A debounced function.
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number,
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null;
    return (...args: Parameters<T>) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            func(...args);
        }, delay);
    };
}

/**
 * Throttles a function, ensuring it's called at most once in a given time frame.
 * @param func - The function to throttle.
 * @param limit - The throttle limit in milliseconds.
 * @returns A throttled function.
 */
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number,
): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    let lastResult: ReturnType<T>;

    return function (this: any, ...args: Parameters<T>): void {
        if (!inThrottle) {
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
            lastResult = func.apply(this, args);
        }
    };
}
