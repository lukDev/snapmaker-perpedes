import { useCallback, useEffect, useRef, useState } from 'react';
import { useSerial } from './useSerial';
import type { AxisPosition } from './snapmakerSerial';

const PULSE_INTERVAL_MS = 100;
const MAX_UNACKED = 2; // simple flow-control cap
const MIN_RADIUS = 0.01; // mm — below this there's no defined angle to rotate around

export type RotateDirection = 'cw' | 'ccw';
export type CircleOrigin = { x: number; y: number };

export function useCircleControl({
    enabled,
    ready,
    feedRate,
    workPosition,
}: {
    enabled: boolean;
    ready: boolean;
    feedRate: number;
    workPosition: AxisPosition | null;
}) {
    const { sendGcodeAndWaitForAck, ensureRelativeMode } = useSerial();
    const [origin, setOriginState] = useState<CircleOrigin | null>(null);
    const originRef = useRef<CircleOrigin | null>(null);

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

    const setOrigin = useCallback(() => {
        const pos = workPositionRef.current;
        if (!pos) return;
        const next = { x: pos.x, y: pos.y };
        originRef.current = next;
        setOriginState(next);
    }, []);

    // main pulse loop — advances angle around the fixed origin/radius and
    // sends the resulting arc segment as a relative G2/G3 move
    useEffect(() => {
        if (!enabled) return;

        const interval = setInterval(async () => {
            if (!originRef.current) return;
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
            angleRef.current = newAngle;
        }, PULSE_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [enabled, sendGcodeAndWaitForAck, ensureRelativeMode]);

    // stop rotating once disabled (mode switch, disconnect, ...); origin
    // itself only clears when the connection/homing state resets, so
    // switching away from circle mode and back keeps it
    useEffect(() => {
        if (!enabled) activeDirections.current.clear();
    }, [enabled]);

    // clears whenever `ready` is about to change (or on unmount) — the
    // no-op case (already null) is harmless, and this is what fires the
    // clear on the true -> false transition we actually care about
    useEffect(() => {
        return () => {
            originRef.current = null;
            setOriginState(null);
        };
    }, [ready]);

    const seedFromCurrentPosition = useCallback(() => {
        const origin = originRef.current;
        const pos = workPositionRef.current;
        if (!origin || !pos) return false;
        const dx = pos.x - origin.x;
        const dy = pos.y - origin.y;
        const radius = Math.hypot(dx, dy);
        if (radius < MIN_RADIUS) return false;
        radiusRef.current = radius;
        angleRef.current = Math.atan2(dy, dx);
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

    return { origin, setOrigin, startRotate, stopRotate, cancel };
}
