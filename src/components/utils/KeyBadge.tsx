import type { ReactNode } from 'react';
import {
    KEY_LABELS,
    KEY_NAMES,
    type TrackedKey,
} from '../../hooks/useTrackedKeys.ts';

export function CrosshairIcon({
    className,
}: {
    className?: string;
}): ReactNode {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className={className}>
            <circle cx="12" cy="12" r="7" />
            <line x1="12" y1="1" x2="12" y2="5" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="1" y1="12" x2="5" y2="12" />
            <line x1="19" y1="12" x2="23" y2="12" />
        </svg>
    );
}

export function Key({
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
            {KEY_LABELS[code]}
            <div className="text-xs text-slate-400">{KEY_NAMES[code]}</div>
        </div>
    );
}

// shared WASD (X/Y) + arrow (Z) layout, reused by continuous/discrete/circle
// jog controls — they only differ in what pressing a key does
export function WasdArrowGrid({
    pressed,
}: {
    pressed: Set<TrackedKey>;
}): ReactNode {
    return (
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
    );
}
