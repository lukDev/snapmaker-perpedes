import { useEffect, useRef, useCallback } from 'react';
import { useSerial } from './useSerial';

const JOG_INTERVAL_MS = 100;
const MAX_UNACKED = 2; // simple flow-control cap

// ceiling shared by the feed-rate input and scroll (trim-wheel) mode's fixed speed
export const MAX_FEED_RATE = 1500;

export type Axis = 'X' | 'Y' | 'Z';
export type Direction = 1 | -1;

const AXES: Axis[] = ['X', 'Y', 'Z'];

export function useJogControl(feedRate: number, enabled: boolean) {
    const { sendGcodeAndWaitForAck, ensureRelativeMode } = useSerial();
    const activeMoves = useRef<Map<Axis, Set<Direction>>>(new Map());
    const unacked = useRef(0);
    const feedRateRef = useRef(feedRate);
    useEffect(() => {
        feedRateRef.current = feedRate;
    }, [feedRate]);

    // main pulse loop
    useEffect(() => {
        if (!enabled) return;

        const interval = setInterval(async () => {
            if (activeMoves.current.size === 0) return;
            if (unacked.current >= MAX_UNACKED) return; // back off if backed up

            const currentFeedRate = feedRateRef.current;
            const distancePerPulse =
                currentFeedRate * (JOG_INTERVAL_MS / 60000);

            const rawDelta: Record<Axis, number> = { X: 0, Y: 0, Z: 0 };
            for (const [axis, directions] of activeMoves.current) {
                for (const direction of directions) {
                    rawDelta[axis] += direction;
                }
            }

            const magnitude = Math.sqrt(
                rawDelta.X ** 2 + rawDelta.Y ** 2 + rawDelta.Z ** 2
            );
            if (magnitude === 0) return;

            // scale so the combined vector always covers distancePerPulse,
            // regardless of how many axes are active — otherwise a multi-axis
            // move covers more ground than F implies and overruns the pulse
            // interval, letting commands pile up in the machine's motion buffer
            const scale = distancePerPulse / magnitude;
            const delta: Record<Axis, number> = {
                X: rawDelta.X * scale,
                Y: rawDelta.Y * scale,
                Z: rawDelta.Z * scale,
            };

            await ensureRelativeMode();
            unacked.current += 1;
            const parts = ['G1'];
            for (const axis of AXES) {
                if (delta[axis] !== 0)
                    parts.push(`${axis}${delta[axis].toFixed(3)}`);
            }
            parts.push(`F${currentFeedRate}`);
            await sendGcodeAndWaitForAck(parts.join(' '));
            unacked.current = Math.max(0, unacked.current - 1); // decrement once write completes
        }, JOG_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [enabled, sendGcodeAndWaitForAck, ensureRelativeMode]);

    // clear active moves once disabled (mode switch, disconnect, ...) so a
    // stale held direction doesn't resume jogging when re-enabled
    useEffect(() => {
        if (!enabled) activeMoves.current.clear();
    }, [enabled]);

    const startMove = useCallback((axis: Axis, direction: Direction) => {
        let directions = activeMoves.current.get(axis);
        if (!directions) {
            directions = new Set();
            activeMoves.current.set(axis, directions);
        }
        directions.add(direction);
    }, []);

    const stopMove = useCallback((axis: Axis, direction: Direction) => {
        const directions = activeMoves.current.get(axis);
        if (!directions) return;
        directions.delete(direction);
        if (directions.size === 0) activeMoves.current.delete(axis);
    }, []);

    const cancelAll = useCallback(() => {
        activeMoves.current.clear();
    }, []);

    return { startMove, stopMove, cancelAll };
}
