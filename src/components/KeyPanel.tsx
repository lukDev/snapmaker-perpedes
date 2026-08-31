import { useEffect, useState, type ReactNode } from 'react';
import FeedRateInput from './FeedRateInput';
import { useJogControl } from '../hooks/jogControl';
import { useSerial } from '../hooks/useSerial';

const DEFAULT_FEED_RATE = 300;

const TRACKED_KEYS = [
    'KeyW',
    'KeyA',
    'KeyS',
    'KeyD',
    'ArrowUp',
    'ArrowDown',
    'Space',
] as const;
type TrackedKey = (typeof TRACKED_KEYS)[number];

const LABELS: Record<TrackedKey, string> = {
    KeyW: 'Y+',
    KeyA: 'X-',
    KeyS: 'Y-',
    KeyD: 'X+',
    ArrowUp: 'Z+',
    ArrowDown: 'Z-',
    Space: 'STOP',
};

const KEY_NAMES: Record<TrackedKey, string> = {
    KeyW: 'W',
    KeyA: 'A',
    KeyS: 'S',
    KeyD: 'D',
    ArrowUp: 'Up',
    ArrowDown: 'Down',
    Space: 'Space',
};

function useTrackedKeys(
    enabled: boolean,
    onKeyDown: (code: TrackedKey) => void,
    onKeyUp: (code: TrackedKey) => void
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
            for (const key of TRACKED_KEYS) onKeyUp(key);
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
    }, [enabled, onKeyDown, onKeyUp]);

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
            className={`flex flex-col h-16 w-16 items-center justify-center rounded-xl border-2 text-2xl font-semibold transition-all duration-75 select-none ${
                active
                    ? 'scale-95 border-emerald-500 bg-emerald-400 text-emerald-950 shadow-[0_0_20px_rgba(52,211,153,0.5)]'
                    : 'border-slate-300 bg-white text-slate-600 shadow-sm'
            }`}>
            {LABELS[code]}
            <div className="text-xs text-slate-400">{KEY_NAMES[code]}</div>
        </div>
    );
}

function StopKey({ active }: { active: boolean }): ReactNode {
    return (
        <div
            className={`flex flex-col h-16 w-full items-center justify-center rounded-xl border-2 text-2xl font-bold tracking-wide transition-all duration-75 select-none ${
                active
                    ? 'scale-95 border-red-600 bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                    : 'border-red-300 bg-red-50 text-red-600 shadow-sm'
            }`}>
            {LABELS.Space}
            <div className={`text-xs ${active ? 'text-white' : 'text-slate-400'}`}>{KEY_NAMES.Space}</div>
        </div>
    );
}

export default function KeyPanel(): ReactNode {
    const { connected } = useSerial();
    const [feedRate, setFeedRate] = useState(DEFAULT_FEED_RATE);
    const { keyDown, keyUp } = useJogControl(feedRate);
    const pressed = useTrackedKeys(connected, keyDown, keyUp);

    return (
        <div className="relative flex flex-col items-center gap-6 rounded-2xl border border-slate-200 bg-white p-10 shadow-xl">
            <div className="absolute top-4 right-4">
                <FeedRateInput value={feedRate} onChange={setFeedRate} />
            </div>
            <div
                className={`flex items-center gap-10 transition-opacity ${
                    connected ? '' : 'pointer-events-none opacity-40'
                }`}>
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
            <div className="h-px w-full bg-slate-200" />
            <div
                className={`w-full transition-opacity ${
                    connected ? '' : 'pointer-events-none opacity-40'
                }`}>
                <StopKey active={pressed.has('Space')} />
            </div>
            {!connected && (
                <p className="text-sm text-slate-400">
                    Connect to the machine to enable jog controls.
                </p>
            )}
        </div>
    );
}
