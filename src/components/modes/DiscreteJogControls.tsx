import type { ReactNode } from 'react';
import { WasdArrowGrid } from '../utils/KeyBadge.tsx';
import NumberField from '../utils/NumberField.tsx';
import type { TrackedKey } from '../../hooks/useTrackedKeys.ts';
import FeedRateInput from '../utils/FeedRateInput.tsx';

export default function DiscreteJogControls({
    pressed,
    ready,
    distance,
    setDistance,
    speed,
    setSpeed,
}: {
    pressed: Set<TrackedKey>;
    ready: boolean;
    distance: number;
    setDistance: (value: number) => void;
    speed: number;
    setSpeed: (value: number) => void;
}): ReactNode {
    return (
        <>
            <div
                className={`transition-opacity ${ready ? '' : 'pointer-events-none opacity-40'}`}>
                <WasdArrowGrid pressed={pressed} />
            </div>
            <div className="flex w-full flex-col gap-2">
                <NumberField
                    label="Distance"
                    value={distance}
                    onChange={setDistance}
                    unit="mm"
                    min={0.01}
                    max={100}
                    decimals={2}
                />
                <FeedRateInput value={speed} onChange={setSpeed} />
            </div>
        </>
    );
}
