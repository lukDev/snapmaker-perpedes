import { useEffect, useRef, useCallback } from 'react';
import { useSerial } from './useSerial';

const JOG_INTERVAL_MS = 100;
const MAX_UNACKED = 2; // simple flow-control cap

type Axis = 'X' | 'Y' | 'Z';

const KEY_TO_AXIS: Record<string, { axis: Axis; sign: 1 | -1 }> = {
    KeyD: { axis: 'X', sign: 1 },
    KeyA: { axis: 'X', sign: -1 },
    KeyW: { axis: 'Y', sign: 1 },
    KeyS: { axis: 'Y', sign: -1 },
    ArrowUp: { axis: 'Z', sign: 1 },
    ArrowDown: { axis: 'Z', sign: -1 },
};

export function useJogControl(feedRate: number) {
    const { sendGcode, connected } = useSerial();
    const heldKeys = useRef<Set<string>>(new Set());
    const unacked = useRef(0);
    const relativeModeSet = useRef(false);
    const feedRateRef = useRef(feedRate);
    useEffect(() => {
        feedRateRef.current = feedRate;
    }, [feedRate]);

    const ensureRelativeMode = useCallback(async () => {
        if (!relativeModeSet.current) {
            await sendGcode('G91');
            relativeModeSet.current = true;
        }
    }, [sendGcode]);

    // main pulse loop
    useEffect(() => {
        if (!connected) return;

        const interval = setInterval(async () => {
            if (heldKeys.current.size === 0) return;
            if (unacked.current >= MAX_UNACKED) return; // back off if backed up

            let dx = 0;
            let dy = 0;
            let dz = 0;
            const currentFeedRate = feedRateRef.current;
            const distancePerPulse =
                currentFeedRate * (JOG_INTERVAL_MS / 60000);

            for (const key of heldKeys.current) {
                const mapping = KEY_TO_AXIS[key];
                if (!mapping) continue;
                if (mapping.axis === 'X') dx += mapping.sign * distancePerPulse;
                if (mapping.axis === 'Y') dy += mapping.sign * distancePerPulse;
                if (mapping.axis === 'Z') dz += mapping.sign * distancePerPulse;
            }

            if (dx === 0 && dy === 0 && dz === 0) return;

            await ensureRelativeMode();
            unacked.current += 1;
            const parts = ['G1'];
            if (dx !== 0) parts.push(`X${dx.toFixed(3)}`);
            if (dy !== 0) parts.push(`Y${dy.toFixed(3)}`);
            if (dz !== 0) parts.push(`Z${dz.toFixed(3)}`);
            parts.push(`F${currentFeedRate}`);
            await sendGcode(parts.join(' '));
            unacked.current = Math.max(0, unacked.current - 1); // decrement once write completes
        }, JOG_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [connected, sendGcode, ensureRelativeMode]);

    // clear held keys once the connection drops so a stale key doesn't jog on reconnect
    useEffect(() => {
        if (!connected) heldKeys.current.clear();
    }, [connected]);

    const keyDown = useCallback((key: string) => {
        if (!(key in KEY_TO_AXIS)) return false;
        heldKeys.current.add(key);
        return true;
    }, []);

    const keyUp = useCallback((key: string) => {
        if (!(key in KEY_TO_AXIS)) return false;
        heldKeys.current.delete(key);
        return true;
    }, []);

    const clearKeys = useCallback(() => {
        heldKeys.current.clear();
    }, []);

    return { connected, keyDown, keyUp, clearKeys };
}
