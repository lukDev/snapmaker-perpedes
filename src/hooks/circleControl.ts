import { useCallback, useEffect, useRef } from 'react';
import { useSerial } from './useSerial';
import type { AxisPosition } from './snapmakerSerial';

const PULSE_INTERVAL_MS = 100;
const MAX_UNACKED = 2; // simple flow-control cap
const MIN_RADIUS = 0.01; // mm — below this there's no defined angle to rotate around

export type RotateDirection = 'cw' | 'ccw';

export function useCircleControl({
    enabled,
    feedRate,
    workPosition,
}: {
    enabled: boolean;
    feedRate: number;
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

    const activeDirections = useRef<Set<RotateDirection>>(new Set());
    const radiusRef = useRef(0);
    const angleRef = useRef(0);
    const unackedRef = useRef(0);

    // main pulse loop — advances angle around the fixed origin/radius and
    // sends the resulting arc segment as a relative G2/G3 move
    useEffect(() => {
        if (!enabled) return;

        const interval = setInterval(async () => {
            if (activeDirections.current.size === 0) return;
            if (unackedRef.current >= MAX_UNACKED) return;

            let net = 0;
            if (activeDirections.current.has('ccw')) net += 1;
            if (activeDirections.current.has('cw')) net -= 1;
            if (net === 0) return; // opposing directions cancel out

            const radius = radiusRef.current;
            if (radius <= 0) return;

            const currentFeedRate = feedRateRef.current;
            const deltaTheta =
                (currentFeedRate * (PULSE_INTERVAL_MS / 60000)) / radius;
            const angle = angleRef.current;
            const newAngle = angle + net * deltaTheta;
            // committed synchronously, before any await: MAX_UNACKED lets a
            // later tick fire while this one's send is still in flight, and
            // if that tick read a stale angleRef it would recompute this
            // same delta and send it again — doubling the physical move
            // while software only advanced once, walking the arc's true
            // center away from the origin
            angleRef.current = newAngle;

            // computed parametrically from the fixed radius/angle rather than
            // accumulated, so drift can't build up over a long hold
            const dx = radius * (Math.cos(newAngle) - Math.cos(angle));
            const dy = radius * (Math.sin(newAngle) - Math.sin(angle));
            // Marlin arcs: I/J are always relative to the arc's start point,
            // regardless of G90/G91
            const i = -radius * Math.cos(angle);
            const j = -radius * Math.sin(angle);

            await ensureRelativeMode();
            unackedRef.current += 1;
            const gcode = net > 0 ? 'G3' : 'G2'; // ccw = G3, cw = G2
            await sendGcodeAndWaitForAck(
                `${gcode} X${dx.toFixed(3)} Y${dy.toFixed(3)} I${i.toFixed(3)} J${j.toFixed(3)} F${currentFeedRate}`
            );
            unackedRef.current = Math.max(0, unackedRef.current - 1);
        }, PULSE_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [enabled, sendGcodeAndWaitForAck, ensureRelativeMode]);

    // stop rotating once disabled (mode switch, disconnect, ...)
    useEffect(() => {
        if (!enabled) activeDirections.current.clear();
    }, [enabled]);

    // the circle's center is always the work origin (0,0) — radius/angle
    // are simply the current work position's polar coordinates
    const seedFromCurrentPosition = useCallback(() => {
        const pos = workPositionRef.current;
        if (!pos) return false;
        const radius = Math.hypot(pos.x, pos.y);
        if (radius < MIN_RADIUS) return false;
        radiusRef.current = radius;
        angleRef.current = Math.atan2(pos.y, pos.x);
        return true;
    }, []);

    const startRotate = useCallback(
        (direction: RotateDirection) => {
            const wasIdle = activeDirections.current.size === 0;
            if (wasIdle && !seedFromCurrentPosition()) return;
            activeDirections.current.add(direction);
        },
        [seedFromCurrentPosition]
    );

    const stopRotate = useCallback((direction: RotateDirection) => {
        activeDirections.current.delete(direction);
    }, []);

    // hard abort (global stop) — clears both directions at once
    const cancel = useCallback(() => {
        activeDirections.current.clear();
    }, []);

    return { startRotate, stopRotate, cancel };
}
