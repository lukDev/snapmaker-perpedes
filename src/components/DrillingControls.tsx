import type { ReactNode } from 'react';
import { Key } from './KeyBadge';
import NumberField from './NumberField';
import { MAX_FEED_RATE } from '../hooks/jogControl';
import type { TrackedKey } from '../hooks/useTrackedKeys';
import type { DrillingStatus } from '../hooks/drillingControl';

const STATUS_LABEL: Record<DrillingStatus, string> = {
    idle: 'Idle',
    descending: 'Descending…',
    holding: 'Holding…',
    retracting: 'Retracting…',
};

export default function DrillingControls({
    pressed,
    ready,
    maxDepth,
    setMaxDepth,
    downSpeed,
    setDownSpeed,
    upSpeed,
    setUpSpeed,
    status,
    descended,
}: {
    pressed: Set<TrackedKey>;
    ready: boolean;
    maxDepth: number;
    setMaxDepth: (value: number) => void;
    downSpeed: number;
    setDownSpeed: (value: number) => void;
    upSpeed: number;
    setUpSpeed: (value: number) => void;
    status: DrillingStatus;
    descended: number;
}): ReactNode {
    return (
        <div className="flex flex-col items-center gap-6">
            <div
                className={`flex flex-col items-center gap-6 transition-opacity ${ready ? '' : 'pointer-events-none opacity-40'}`}>
                <Key code="ArrowDown" active={pressed.has('ArrowDown')} />
                <div className="flex flex-col items-center gap-1 text-sm text-slate-500">
                    <span>{STATUS_LABEL[status]}</span>
                    <span className="font-mono text-xs text-slate-400 tabular-nums">
                        {descended.toFixed(2)} / {maxDepth.toFixed(2)} mm
                    </span>
                </div>
            </div>
            <div className="flex w-full flex-col gap-2">
                <NumberField
                    label="Max Depth"
                    value={maxDepth}
                    onChange={setMaxDepth}
                    unit="mm"
                    min={0.01}
                    max={200}
                    decimals={2}
                />
                <NumberField
                    label="Down Speed"
                    value={downSpeed}
                    onChange={setDownSpeed}
                    unit="mm/min"
                    min={1}
                    max={MAX_FEED_RATE}
                    decimals={1}
                />
                <NumberField
                    label="Up Speed"
                    value={upSpeed}
                    onChange={setUpSpeed}
                    unit="mm/min"
                    min={1}
                    max={MAX_FEED_RATE}
                    decimals={1}
                />
            </div>
        </div>
    );
}
