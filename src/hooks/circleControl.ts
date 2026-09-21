import { useCallback, useEffect, useRef } from 'react';
import { useSerial } from './useSerial';
import type { AxisPosition } from './snapmakerSerial';

const MIN_RADIUS = 0.01; // mm — below this there's no defined angle to rotate around

export type RotateDirection = 'cw' | 'ccw';

export function useCircleControl({
    enabled,
    feedRate,
    angle,
    workPosition,
}: {
    enabled: boolean;
    feedRate: number;
    angle: number;
    workPosition: AxisPosition | null;
}) {
    const { sendGcodeAndWaitForAck, ensureRelativeMode } = useSerial();

    const workPositionRef = useRef(workPosition);
    useEffect(() => {
        workPositionRef.current = workPosition;
    }, [workPosition]);
    const feedRateRef = useRef(feedRate);
    useEffect(() => {
        feedRateRef.current = feedRate;
    }, [feedRate]);
    const angleRef = useRef(angle);
    useEffect(() => {
        angleRef.current = angle;
    }, [angle]);

    // chains sends so rapid presses don't interleave writes on the wire
    const queueRef = useRef(Promise.resolve());

    // the circle's center is always the work origin (0,0) — radius/angle
    // are simply the current work position's polar coordinates
    const trigger = useCallback(
        (direction: RotateDirection) => {
            if (!enabled) return;
            const pos = workPositionRef.current;
            if (!pos) return;
            const radius = Math.hypot(pos.x, pos.y);
            if (radius < MIN_RADIUS) return;
            const startAngle = Math.atan2(pos.y, pos.x);

            const net = direction === 'ccw' ? 1 : -1;
            const deltaTheta = (angleRef.current * Math.PI) / 180;
            const newAngle = startAngle + net * deltaTheta;

            // computed parametrically from the fixed radius/start angle
            const dx = radius * (Math.cos(newAngle) - Math.cos(startAngle));
            const dy = radius * (Math.sin(newAngle) - Math.sin(startAngle));
            // Marlin arcs: I/J are always relative to the arc's start point,
            // regardless of G90/G91
            const i = -radius * Math.cos(startAngle);
            const j = -radius * Math.sin(startAngle);

            const currentFeedRate = feedRateRef.current;
            const gcode = net > 0 ? 'G3' : 'G2'; // ccw = G3, cw = G2

            queueRef.current = queueRef.current.then(async () => {
                await ensureRelativeMode();
                await sendGcodeAndWaitForAck(
                    `${gcode} X${dx.toFixed(3)} Y${dy.toFixed(3)} I${i.toFixed(3)} J${j.toFixed(3)} F${currentFeedRate}`
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
