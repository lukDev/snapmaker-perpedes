import { useEffect, useState } from 'react';

export const TRACKED_KEYS = [
    'KeyW',
    'KeyA',
    'KeyS',
    'KeyD',
    'ArrowUp',
    'ArrowDown',
    'Space',
] as const;
export type TrackedKey = (typeof TRACKED_KEYS)[number];

export function useTrackedKeys(
    enabled: boolean,
    onKeyDown: (code: TrackedKey) => void,
    onKeyUp: (code: TrackedKey) => void,
    onStop: () => void
): Set<TrackedKey> {
    const [pressed, setPressed] = useState<Set<TrackedKey>>(new Set());
    const [prevEnabled, setPrevEnabled] = useState(enabled);

    // release everything if the panel becomes disabled mid-press
    if (enabled !== prevEnabled) {
        setPrevEnabled(enabled);
        if (!enabled) setPressed(new Set());
    }

    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (!TRACKED_KEYS.includes(e.code as TrackedKey)) return;
            const code = e.code as TrackedKey;
            if (code === 'Space') {
                e.preventDefault();
                setPressed(new Set(['Space']));
                onStop();
                return;
            }
            setPressed(prev => {
                if (prev.has('Space') || prev.has(code)) return prev;
                const next = new Set(prev);
                next.add(code);
                return next;
            });
            onKeyDown(code);
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (!TRACKED_KEYS.includes(e.code as TrackedKey)) return;
            const code = e.code as TrackedKey;
            setPressed(prev => {
                if (!prev.has(code)) return prev;
                const next = new Set(prev);
                next.delete(code);
                return next;
            });
            onKeyUp(code);
        };

        const engageStop = () => {
            setPressed(new Set(['Space']));
            onStop();
        };
        const releaseAll = () => setPressed(new Set());
        const onVisibilityChange = () => {
            if (document.hidden) engageStop();
            else releaseAll();
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('blur', engageStop);
        window.addEventListener('focus', releaseAll);
        document.addEventListener('visibilitychange', onVisibilityChange);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('blur', engageStop);
            window.removeEventListener('focus', releaseAll);
            document.removeEventListener(
                'visibilitychange',
                onVisibilityChange
            );
        };
    }, [enabled, onKeyDown, onKeyUp, onStop]);

    return pressed;
}
