import { useCallback, useState } from 'react';
import { useJogControl, type Axis, type Direction } from './jogControl';
import { useTrackedKeys, type TrackedKey } from './useTrackedKeys';
import { useSerial } from './useSerial';

const DEFAULT_FEED_RATE = 300;

const KEY_TO_AXIS: Partial<
    Record<TrackedKey, { axis: Axis; direction: Direction }>
> = {
    KeyD: { axis: 'X', direction: 1 },
    KeyA: { axis: 'X', direction: -1 },
    KeyW: { axis: 'Y', direction: -1 },
    KeyS: { axis: 'Y', direction: 1 },
    ArrowUp: { axis: 'Z', direction: 1 },
    ArrowDown: { axis: 'Z', direction: -1 },
};

export function useJogPanel() {
    const { connected, homed } = useSerial();
    const ready = connected && homed;
    const [feedRate, setFeedRate] = useState(DEFAULT_FEED_RATE);
    const { startMove, stopMove, cancelAll } = useJogControl(feedRate);

    const onKeyDown = useCallback(
        (code: TrackedKey) => {
            const mapping = KEY_TO_AXIS[code];
            if (mapping) startMove(mapping.axis, mapping.direction);
        },
        [startMove]
    );

    const onKeyUp = useCallback(
        (code: TrackedKey) => {
            const mapping = KEY_TO_AXIS[code];
            if (mapping) stopMove(mapping.axis, mapping.direction);
        },
        [stopMove]
    );

    const pressed = useTrackedKeys(ready, onKeyDown, onKeyUp, cancelAll);

    return { connected, homed, feedRate, setFeedRate, pressed };
}
