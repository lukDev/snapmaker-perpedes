import type { ReactNode } from 'react';
import FeedRateInput from './FeedRateInput';
import type { TrackedKey } from '../hooks/useTrackedKeys';
import type { Axis, AxisPosition } from '../hooks/snapmakerSerial';

const AXES: Axis[] = ['X', 'Y', 'Z'];

function formatCoord(value: number | undefined): string {
    return value === undefined ? '?' : value.toFixed(2);
}

function CrosshairIcon({ className }: { className?: string }): ReactNode {
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

function PositionColumn({
    axis,
    machinePosition,
    workPosition,
    ready,
    onSetOrigin,
}: {
    axis: Axis;
    machinePosition: AxisPosition | null;
    workPosition: AxisPosition | null;
    ready: boolean;
    onSetOrigin: () => void;
}): ReactNode {
    const key = axis.toLowerCase() as keyof AxisPosition;
    return (
        <div className="flex min-w-30 flex-1 items-center justify-center gap-2">
            <span className="text-2xl font-semibold text-slate-500">
                {axis}
            </span>
            <div className="flex flex-col items-start justify-center gap-0.5">
                <span className="font-mono text-sm text-slate-700 tabular-nums">
                    {formatCoord(workPosition?.[key])}
                </span>
                <span className="font-mono text-xs text-slate-400 tabular-nums">
                    {formatCoord(machinePosition?.[key])}
                </span>
            </div>
            <button
                type="button"
                aria-label={`Set ${axis} work origin`}
                disabled={!ready || !workPosition}
                onClick={onSetOrigin}
                className="rounded-md border border-slate-300 bg-white p-1 text-slate-600 shadow-sm transition-colors hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40">
                <CrosshairIcon className="h-4 w-4" />
            </button>
        </div>
    );
}

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
    workPosition,
    machinePosition,
    setWorkOrigin,
}: {
    connected: boolean;
    homed: boolean;
    feedRate: number;
    setFeedRate: (feedRate: number) => void;
    pressed: Set<TrackedKey>;
    workPosition: AxisPosition | null;
    machinePosition: AxisPosition | null;
    setWorkOrigin: (axes: Axis[]) => void;
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

            <div className="h-px w-full bg-slate-200" />

            <div className="flex w-full flex-col gap-4">
                <div className="flex w-full items-center justify-center gap-8">
                    {AXES.map(axis => (
                        <PositionColumn
                            key={axis}
                            axis={axis}
                            machinePosition={machinePosition}
                            workPosition={workPosition}
                            ready={ready}
                            onSetOrigin={() => setWorkOrigin([axis])}
                        />
                    ))}
                </div>
                <button
                    type="button"
                    disabled={!ready || !workPosition}
                    onClick={() => setWorkOrigin(AXES)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40">
                    <CrosshairIcon className="h-4 w-4" />
                    Set Work Origin
                </button>
            </div>
        </div>
    );
}
