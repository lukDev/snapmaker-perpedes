import type { ReactNode } from 'react';
import { Key, WasdArrowGrid, CrosshairIcon } from '../utils/KeyBadge.tsx';
import type { TrackedKey } from '../../hooks/useTrackedKeys.ts';
import type { AxisPosition } from '../../hooks/snapmakerSerial.ts';
import FeedRateInput from '../utils/FeedRateInput.tsx';
import NumberField from '../utils/NumberField.tsx';

// the circle's center is always the work origin (0,0) — radius is just the
// current work position's distance from it
function formatRadius(workPosition: AxisPosition | null): string {
    if (!workPosition) return '—';
    return `${Math.hypot(workPosition.x, workPosition.y).toFixed(2)} mm`;
}

export default function CircleControls({
    pressed,
    ready,
    workPosition,
    setOrigin,
    angle,
    setAngle,
    speed,
    setSpeed,
}: {
    pressed: Set<TrackedKey>;
    ready: boolean;
    workPosition: AxisPosition | null;
    setOrigin: () => void;
    angle: number;
    setAngle: (value: number) => void;
    speed: number;
    setSpeed: (value: number) => void;
}): ReactNode {
    return (
        <>
            <div
                className={`flex flex-col items-center gap-6 transition-opacity ${ready ? '' : 'pointer-events-none opacity-40'}`}>
                <WasdArrowGrid pressed={pressed} />
                <div className="flex items-center gap-2">
                    <Key code="KeyQ" active={pressed.has('KeyQ')} />
                    <Key code="KeyE" active={pressed.has('KeyE')} />
                </div>
            </div>
            <div className="flex w-full flex-col items-center gap-3">
                <span className="text-sm text-slate-500">
                    Radius:{' '}
                    <span className="font-mono text-slate-700 tabular-nums">
                        {formatRadius(workPosition)}
                    </span>
                </span>
                <button
                    type="button"
                    disabled={!ready || !workPosition}
                    onClick={setOrigin}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40">
                    <CrosshairIcon className="h-4 w-4" />
                    Set Circle Origin
                </button>
            </div>
            <div className="flex w-full flex-col gap-2">
                <NumberField
                    label="Angle"
                    value={angle}
                    onChange={setAngle}
                    unit="deg"
                    min={0.1}
                    max={360}
                    decimals={1}
                />
                <FeedRateInput value={speed} onChange={setSpeed} />
            </div>
        </>
    );
}
