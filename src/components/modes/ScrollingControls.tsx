import { useRef, type ReactNode } from 'react';
import NumberField from '../utils/NumberField.tsx';
import { useScrollJogControl } from '../../hooks/scrollJogControl.ts';
import type { Axis } from '../../hooks/jogControl.ts';

const AXES: Axis[] = ['X', 'Y', 'Z'];

function AxisSelector({
    axis,
    setAxis,
}: {
    axis: Axis;
    setAxis: (axis: Axis) => void;
}): ReactNode {
    return (
        <div className="flex rounded-full border border-slate-300 bg-slate-100 p-1">
            {AXES.map(candidate => (
                <button
                    key={candidate}
                    type="button"
                    onClick={() => setAxis(candidate)}
                    className={`h-8 w-10 rounded-full text-sm font-semibold transition-colors disabled:opacity-40 ${
                        axis === candidate
                            ? 'bg-emerald-500 text-emerald-950 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                    }`}>
                    {candidate}
                </button>
            ))}
        </div>
    );
}

function WheelIcon({ className }: { className?: string }): ReactNode {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}>
            <rect x="6" y="2" width="12" height="20" rx="6" />
            <line x1="12" y1="7" x2="12" y2="11" />
        </svg>
    );
}

export default function ScrollingControls({
    ready,
    axis,
    setAxis,
    distance,
    setDistance,
    stopSignal,
}: {
    ready: boolean;
    axis: Axis;
    setAxis: (axis: Axis) => void;
    distance: number;
    setDistance: (value: number) => void;
    stopSignal: boolean;
}): ReactNode {
    const containerRef = useRef<HTMLDivElement>(null);
    useScrollJogControl({
        containerRef,
        enabled: ready,
        axis,
        distance,
        stopSignal,
    });

    return (
        <>
            <div
                ref={containerRef}
                className={`flex h-32 w-64 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-slate-400 transition-opacity select-none ${
                    ready
                        ? 'border-slate-300'
                        : 'pointer-events-none border-slate-200 opacity-40'
                }`}>
                <WheelIcon className="h-8 w-8" />
                <span className="text-sm">Scroll here to jog {axis}</span>
            </div>
            <div className="flex w-full flex-col items-center gap-3">
                <AxisSelector axis={axis} setAxis={setAxis} />
                <NumberField
                    label="Increment"
                    value={distance}
                    onChange={setDistance}
                    unit="mm"
                    min={0.01}
                    max={10}
                    decimals={2}
                />
            </div>
        </>
    );
}
