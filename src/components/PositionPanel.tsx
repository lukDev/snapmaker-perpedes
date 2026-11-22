import type { ReactNode } from 'react';
import { CrosshairIcon } from './utils/KeyBadge.tsx';
import type { Axis, AxisPosition } from '../hooks/snapmakerSerial';

const AXES: Axis[] = ['X', 'Y', 'Z'];

function formatCoord(value: number | undefined): string {
    return value === undefined ? '?' : value.toFixed(2);
}

function PinIcon({ className }: { className?: string }): ReactNode {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}>
            <path d="M12 21s-7-6.5-7-11a7 7 0 0 1 14 0c0 4.5-7 11-7 11z" />
            <circle cx="12" cy="10" r="2.5" />
        </svg>
    );
}

function PositionColumn({
    axis,
    workPosition,
    ready,
    onSetOrigin,
    onGoToOrigin,
}: {
    axis: Axis;
    workPosition: AxisPosition | null;
    ready: boolean;
    onSetOrigin: () => void;
    onGoToOrigin: () => void;
}): ReactNode {
    const key = axis.toLowerCase() as keyof AxisPosition;
    return (
        <div className="flex min-w-30 flex-1 items-center justify-center gap-2">
            <span className="text-2xl font-semibold text-slate-500">
                {axis}
            </span>
            <span className="font-mono text-sm text-slate-700 tabular-nums">
                {formatCoord(workPosition?.[key])}
            </span>
            <button
                type="button"
                aria-label={`Set ${axis} work origin`}
                disabled={!ready || !workPosition}
                onClick={onSetOrigin}
                title={`Set ${axis} origin`}
                className="rounded-md border border-slate-300 bg-white p-1 text-slate-600 shadow-sm transition-colors hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40">
                <CrosshairIcon className="h-4 w-4" />
            </button>
            <button
                type="button"
                aria-label={`Go to ${axis} work origin`}
                title={`Go to ${axis} origin`}
                disabled={!ready || !workPosition}
                onClick={onGoToOrigin}
                className="rounded-md border border-slate-300 bg-white p-1 text-slate-600 shadow-sm transition-colors hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40">
                <PinIcon className="h-4 w-4" />
            </button>
        </div>
    );
}

export default function PositionPanel({
    ready,
    workPosition,
    setWorkOrigin,
    goToOrigin,
}: {
    ready: boolean;
    workPosition: AxisPosition | null;
    setWorkOrigin: (axes: Axis[]) => void;
    goToOrigin: (axes?: Axis[]) => void;
}): ReactNode {
    const originActionsDisabled = !ready || !workPosition;
    return (
        <div className="flex w-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex w-full items-center justify-center gap-4">
                {AXES.map(axis => (
                    <PositionColumn
                        key={axis}
                        axis={axis}
                        workPosition={workPosition}
                        ready={ready}
                        onSetOrigin={() => setWorkOrigin([axis])}
                        onGoToOrigin={() => goToOrigin([axis])}
                    />
                ))}
            </div>
            <div className="flex w-full gap-2">
                <button
                    type="button"
                    disabled={originActionsDisabled}
                    onClick={() => setWorkOrigin(AXES)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40">
                    <CrosshairIcon className="h-4 w-4" />
                    Set Work Origin
                </button>
                <button
                    type="button"
                    disabled={originActionsDisabled}
                    onClick={() => goToOrigin()}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40">
                    <PinIcon className="h-4 w-4" />
                    Go to Origin
                </button>
            </div>
        </div>
    );
}
