import type { TrackedKey } from '../../hooks/useTrackedKeys.ts';
import type { ReactNode } from 'react';
import { WasdArrowGrid } from '../utils/KeyBadge.tsx';
import FeedRateInput from '../utils/FeedRateInput.tsx';

export default function ContinuousJogControls({
    pressed,
    ready,
    speed,
    setSpeed,
}: {
    pressed: Set<TrackedKey>;
    ready: boolean;
    speed: number;
    setSpeed: (value: number) => void;
}): ReactNode {
    return (
        <div className="flex flex-col items-center gap-6">
            <div
                className={`transition-opacity ${ready ? '' : 'pointer-events-none opacity-40'}`}>
                <WasdArrowGrid pressed={pressed} />
            </div>
            <div className="flex w-full flex-col gap-2">
                <FeedRateInput value={speed} onChange={setSpeed} />
            </div>
        </div>
    );
}
