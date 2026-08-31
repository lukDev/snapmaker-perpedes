import type { ReactNode } from 'react';
import FeedRateInput from './FeedRateInput';
import type { TrackedKey } from '../hooks/useTrackedKeys';

const LABELS: Record<TrackedKey, string> = {
    KeyW: 'Y-',
    KeyA: 'X-',
    KeyS: 'Y+',
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

function Key({
    code,
    active,
}: {
    code: TrackedKey;
    active: boolean;
}): ReactNode {
    return (
        <div
            className={`flex h-16 w-16 flex-col items-center justify-center rounded-xl border-2 text-2xl font-semibold transition-all duration-75 select-none ${
                active
                    ? 'scale-95 border-emerald-500 bg-emerald-400 text-emerald-950 shadow-[0_0_20px_rgba(52,211,153,0.5)]'
                    : 'border-slate-300 bg-white text-slate-600 shadow-sm'
            }`}>
            {LABELS[code]}
            <div className="text-xs text-slate-400">{KEY_NAMES[code]}</div>
        </div>
    );
}

export default function JogPanel({
    connected,
    homed,
    feedRate,
    setFeedRate,
    pressed,
}: {
    connected: boolean;
    homed: boolean;
    feedRate: number;
    setFeedRate: (feedRate: number) => void;
    pressed: Set<TrackedKey>;
}): ReactNode {
    const ready = connected && homed;
    return (
        <div className="relative flex flex-col items-center gap-6 rounded-2xl border border-slate-200 bg-white p-10 shadow-xl">
            <div className="absolute top-4 right-4">
                <FeedRateInput value={feedRate} onChange={setFeedRate} />
            </div>
            <div
                className={`flex items-center gap-10 transition-opacity ${
                    ready ? '' : 'pointer-events-none opacity-40'
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
            {!connected && (
                <p className="text-sm text-slate-400">
                    Connect to the machine to enable jog controls.
                </p>
            )}
            {connected && !homed && (
                <p className="text-sm text-slate-400">
                    Home the machine to enable jog controls.
                </p>
            )}
        </div>
    );
}
