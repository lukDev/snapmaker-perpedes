import { useCallback, useEffect, useRef, useState } from 'react';
import { useSerial } from './useSerial';

const PULSE_INTERVAL_MS = 100;
const MAX_UNACKED = 2; // simple flow-control cap

export type DrillingStatus = 'idle' | 'descending' | 'holding' | 'retracting';

export function useDrillingControl(
    enabled: boolean,
    maxDepth: number,
    downSpeed: number,
    upSpeed: number
) {
    const { sendGcodeAndWaitForAck, ensureRelativeMode } = useSerial();
    const statusRef = useRef<DrillingStatus>('idle');
    const [status, setStatus] = useState<DrillingStatus>('idle');
    const descendedRef = useRef(0);
    const [descended, setDescended] = useState(0);
    const unackedRef = useRef(0);
    // bumped by any hard reset (cancel / disable) so an in-flight tick's
    // post-await bookkeeping can detect it shouldn't touch descendedRef
    // anymore — otherwise it could re-increment right after a reset zeroed it
    const epochRef = useRef(0);

    const maxDepthRef = useRef(maxDepth);
    const downSpeedRef = useRef(downSpeed);
    const upSpeedRef = useRef(upSpeed);
    useEffect(() => {
        maxDepthRef.current = maxDepth;
    }, [maxDepth]);
    useEffect(() => {
        downSpeedRef.current = downSpeed;
    }, [downSpeed]);
    useEffect(() => {
        upSpeedRef.current = upSpeed;
    }, [upSpeed]);

    const setStatusBoth = useCallback((next: DrillingStatus) => {
        statusRef.current = next;
        setStatus(next);
    }, []);

    // main pulse loop — descends to at most maxDepth, retracts once stop() is called
    useEffect(() => {
        if (!enabled) return;

        const interval = setInterval(async () => {
            const phase = statusRef.current;
            if (phase === 'idle' || phase == 'holding') return;
            if (unackedRef.current >= MAX_UNACKED) return;
            const epoch = epochRef.current;

            const speed =
                phase === 'descending'
                    ? downSpeedRef.current
                    : upSpeedRef.current;
            const step = speed * (PULSE_INTERVAL_MS / 60000);
            const remaining =
                phase === 'descending'
                    ? maxDepthRef.current - descendedRef.current
                    : descendedRef.current;
            const delta = Math.min(step, remaining);
            if (delta <= 0) {
                setStatusBoth(phase === 'descending' ? 'retracting' : 'idle');
                return;
            }

            await ensureRelativeMode();
            unackedRef.current += 1;
            const signedDelta = phase === 'descending' ? -delta : delta;
            await sendGcodeAndWaitForAck(
                `G1 Z${signedDelta.toFixed(3)} F${speed}`
            );
            unackedRef.current = Math.max(0, unackedRef.current - 1);
            // a hard reset happened while this move was in flight — the
            // physical move already happened, but descendedRef has since
            // been zeroed for a fresh cycle, so don't re-increment it
            if (epochRef.current !== epoch) return;

            descendedRef.current += phase === 'descending' ? delta : -delta;
            setDescended(descendedRef.current);
            if (
                phase === 'descending' &&
                descendedRef.current >= maxDepthRef.current
            ) {
                setStatusBoth('holding');
            } else if (phase === 'retracting' && descendedRef.current <= 0) {
                setStatusBoth('idle');
            }
        }, PULSE_INTERVAL_MS);

        // reset once disabled (mode switch, disconnect, ...) — in-flight
        // commands already on the wire can't be recalled, mirroring
        // continuous jog's cancelAll
        return () => {
            clearInterval(interval);
            epochRef.current += 1;
            statusRef.current = 'idle';
            setStatus('idle');
            descendedRef.current = 0;
            setDescended(0);
        };
    }, [enabled, sendGcodeAndWaitForAck, ensureRelativeMode, setStatusBoth]);

    const start = useCallback(() => {
        if (statusRef.current === 'idle') setStatusBoth('descending');
    }, [setStatusBoth]);

    const stop = useCallback(() => {
        setStatusBoth('retracting');
    }, [setStatusBoth]);

    // hard abort (global stop) — unlike stop(), skips the retract phase
    const cancel = useCallback(() => {
        epochRef.current += 1;
        setStatusBoth('idle');
        descendedRef.current = 0;
        setDescended(0);
    }, [setStatusBoth]);

    return { start, stop, cancel, status, descended };
}
