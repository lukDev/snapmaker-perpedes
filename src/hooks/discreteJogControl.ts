import { useCallback, useEffect, useRef } from 'react';
import { useSerial } from './useSerial';
import type { Axis, Direction } from './jogControl';

export function useDiscreteJogControl(
    enabled: boolean,
    distance: number,
    speed: number
) {
    const { sendGcodeAndWaitForAck, ensureRelativeMode } = useSerial();
    const distanceRef = useRef(distance);
    const speedRef = useRef(speed);
    useEffect(() => {
        distanceRef.current = distance;
    }, [distance]);
    useEffect(() => {
        speedRef.current = speed;
    }, [speed]);

    // chains sends so rapid presses don't interleave writes on the wire
    const queueRef = useRef(Promise.resolve());

    const trigger = useCallback(
        (axis: Axis, direction: Direction) => {
            if (!enabled) return;
            queueRef.current = queueRef.current.then(async () => {
                const delta = distanceRef.current * direction;
                await ensureRelativeMode();
                await sendGcodeAndWaitForAck(
                    `G1 ${axis}${delta.toFixed(3)} F${speedRef.current}`
                );
            });
        },
        [enabled, sendGcodeAndWaitForAck, ensureRelativeMode]
    );

    // drop any not-yet-started moves once disabled (mode switch, disconnect, ...)
    useEffect(() => {
        if (!enabled) queueRef.current = Promise.resolve();
    }, [enabled]);

    // hard abort (global stop) — drops anything not yet sent
    const cancel = useCallback(() => {
        queueRef.current = Promise.resolve();
    }, []);

    return { trigger, cancel };
}
