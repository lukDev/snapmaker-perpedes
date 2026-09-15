import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { useSerial } from './useSerial';
import { MAX_FEED_RATE, type Axis, type Direction } from './jogControl';

// mirrors FeedRateInput's wheel-notch threshold
const WHEEL_THRESHOLD = 80;

type QueuedMove = { axis: Axis; distance: number; direction: Direction };

export function useScrollJogControl({
    containerRef,
    enabled,
    axis,
    distance,
    stopSignal,
}: {
    containerRef: RefObject<HTMLElement | null>;
    enabled: boolean;
    axis: Axis;
    distance: number;
    stopSignal: boolean;
}) {
    const { sendGcodeAndWaitForAck, ensureRelativeMode } = useSerial();
    const axisRef = useRef(axis);
    const distanceRef = useRef(distance);
    useEffect(() => {
        axisRef.current = axis;
    }, [axis]);
    useEffect(() => {
        distanceRef.current = distance;
    }, [distance]);

    const queueRef = useRef<QueuedMove[]>([]);
    const drainingRef = useRef(false);
    const accumRef = useRef(0);

    // event-driven drain: fires as fast as the machine acks, so scrolling
    // faster queues (and thus executes) more increments per second — the
    // apparent speed tracks scroll speed even though each segment is always
    // commanded at the fixed max feed rate, like a hardware trim wheel
    const drain = useCallback(async () => {
        if (drainingRef.current) return;
        drainingRef.current = true;
        try {
            while (queueRef.current.length > 0) {
                const move = queueRef.current.shift();
                if (!move) break;
                await ensureRelativeMode();
                const delta = move.distance * move.direction;
                await sendGcodeAndWaitForAck(
                    `G1 ${move.axis}${delta.toFixed(3)} F${MAX_FEED_RATE}`
                );
            }
        } finally {
            drainingRef.current = false;
        }
    }, [sendGcodeAndWaitForAck, ensureRelativeMode]);

    useEffect(() => {
        const el = containerRef.current;
        if (!el || !enabled) return;

        // React's synthetic onWheel is passive and can't preventDefault, so
        // bind natively — same reason FeedRateInput does this by hand
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const accum = accumRef.current + e.deltaY;
            if (Math.abs(accum) < WHEEL_THRESHOLD) {
                accumRef.current = accum;
                return;
            }
            accumRef.current = 0;
            const direction: Direction = accum < 0 ? 1 : -1;
            queueRef.current.push({
                axis: axisRef.current,
                distance: distanceRef.current,
                direction,
            });
            void drain();
        };

        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, [containerRef, enabled, drain]);

    // drop pending increments once disabled (mode switch, disconnect, ...)
    useEffect(() => {
        if (!enabled) {
            queueRef.current = [];
            accumRef.current = 0;
        }
    }, [enabled]);

    // global stop clears anything not yet sent; in-flight sends can't be recalled
    useEffect(() => {
        if (stopSignal) queueRef.current = [];
    }, [stopSignal]);
}
