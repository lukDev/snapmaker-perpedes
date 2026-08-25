import { useEffect, useState, type ReactNode } from 'react';
import FeedRateInput from './FeedRateInput';

const TRACKED_KEYS = [
    'KeyW',
    'KeyA',
    'KeyS',
    'KeyD',
    'ArrowUp',
    'ArrowDown',
] as const;
type TrackedKey = (typeof TRACKED_KEYS)[number];

const LABELS: Record<TrackedKey, string> = {
    KeyW: 'Y+',
    KeyA: 'X-',
    KeyS: 'Y-',
    KeyD: 'X+',
    ArrowUp: 'Z+',
    ArrowDown: 'Z-',
};

function useTrackedKeys(): Set<TrackedKey> {
    const [pressed, setPressed] = useState<Set<TrackedKey>>(new Set());

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (!TRACKED_KEYS.includes(e.code as TrackedKey)) return;
            setPressed(prev => {
                if (prev.has(e.code as TrackedKey)) return prev;
                const next = new Set(prev);
                next.add(e.code as TrackedKey);
                return next;
            });
        };

        const onKeyUp = (e: KeyboardEvent) => {
            if (!TRACKED_KEYS.includes(e.code as TrackedKey)) return;
            setPressed(prev => {
                if (!prev.has(e.code as TrackedKey)) return prev;
                const next = new Set(prev);
                next.delete(e.code as TrackedKey);
                return next;
            });
        };

        const onBlur = () => setPressed(new Set());

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        window.addEventListener('blur', onBlur);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
            window.removeEventListener('blur', onBlur);
        };
    }, []);

    return pressed;
}

function Key({
    code,
    active,
}: {
    code: TrackedKey;
    active: boolean;
}): ReactNode {
    return (
        <div
            className={`flex h-16 w-16 items-center justify-center rounded-xl border-2 text-2xl font-semibold transition-all duration-75 select-none ${
                active
                    ? 'scale-95 border-emerald-500 bg-emerald-400 text-emerald-950 shadow-[0_0_20px_rgba(52,211,153,0.5)]'
                    : 'border-slate-300 bg-white text-slate-600 shadow-sm'
            }`}>
            {LABELS[code]}
        </div>
    );
}

export default function KeyPanel(): ReactNode {
    const pressed = useTrackedKeys();

    return (
        <div className="relative flex flex-col items-center gap-6 rounded-2xl border border-slate-200 bg-white p-10 shadow-xl">
            <div className="flex items-center gap-10">
                <div className="flex flex-col items-center gap-2">
                    <Key code="KeyW" active={pressed.has('KeyW')} />
                    <div className="flex gap-2">
                        <Key code="KeyA" active={pressed.has('KeyA')} />
                        <div className="flex h-16 w-16 items-center justify-center">
                            <div className="h-12 w-12 rounded-full border-2 border-slate-300 shadow-sm"></div>
                        </div>
                        <Key code="KeyD" active={pressed.has('KeyD')} />
                    </div>
                    <Key code="KeyS" active={pressed.has('KeyS')} />
                </div>
                <div className="h-24 w-px bg-slate-200" />
                <div className="flex flex-col items-center gap-2">
                    <Key code="ArrowUp" active={pressed.has('ArrowUp')} />
                    <Key code="ArrowDown" active={pressed.has('ArrowDown')} />
                </div>
            </div>
            <div className="absolute right-4 bottom-3">
                <FeedRateInput />
            </div>
        </div>
    );
}
