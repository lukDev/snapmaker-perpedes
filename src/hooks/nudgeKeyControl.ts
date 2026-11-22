import { useCallback, useEffect, useRef } from 'react';
import { useSerial } from './useSerial';
import { MAX_FEED_RATE, type Direction } from './jogControl';

// includes the rotary B axis, which none of the other movers drive
type NudgeAxis = 'X' | 'Y' | 'Z' | 'B';

// mm for linear axes, degrees for B
const INCREMENTS: Record<NudgeAxis, number> = {
    X: 0.1,
    Y: 0.1,
    Z: 0.1,
    B: 0.2,
};

const DIGIT_TO_MOVE: Record<string, { axis: NudgeAxis; direction: Direction }> =
    {
        '1': { axis: 'X', direction: 1 },
        '2': { axis: 'X', direction: -1 },
        '3': { axis: 'Y', direction: 1 },
        '4': { axis: 'Y', direction: -1 },
        '5': { axis: 'Z', direction: 1 },
        '6': { axis: 'Z', direction: -1 },
        '7': { axis: 'B', direction: 1 },
        '8': { axis: 'B', direction: -1 },
    };

// accept both the digit row and the numpad
function moveForCode(code: string) {
    const match = /^(?:Digit|Numpad)([1-8])$/.exec(code);
    return match ? DIGIT_TO_MOVE[match[1]] : undefined;
}

// digits are legitimate input in number fields and the G-code console
function isTypingTarget(target: EventTarget | null): boolean {
    return (
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLInputElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
    );
}

type QueuedMove = { axis: NudgeAxis; direction: Direction };

// always-on background listener: each keystroke on 1-8 nudges one axis by a
// fixed increment, regardless of the active movement mode
export function useNudgeKeyControl(enabled: boolean) {
    const { sendGcodeAndWaitForAck, ensureRelativeMode } = useSerial();

    const queueRef = useRef<QueuedMove[]>([]);
    const drainingRef = useRef(false);

    // event-driven drain: fires as fast as the machine acks, so faster
    // keystrokes (or held-key auto-repeat) queue and execute more increments
    const drain = useCallback(async () => {
        if (drainingRef.current) return;
        drainingRef.current = true;
        try {
            while (queueRef.current.length > 0) {
                const move = queueRef.current.shift();
                if (!move) break;
                await ensureRelativeMode();
                const delta = INCREMENTS[move.axis] * move.direction;
                await sendGcodeAndWaitForAck(
                    `G1 ${move.axis}${delta.toFixed(3)} F${MAX_FEED_RATE}`
                );
            }
        } finally {
            drainingRef.current = false;
        }
    }, [sendGcodeAndWaitForAck, ensureRelativeMode]);

    useEffect(() => {
        if (!enabled) return;

        const onKeyDown = (e: KeyboardEvent) => {
            const move = moveForCode(e.code);
            if (!move) return;
            if (isTypingTarget(e.target)) return;
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            e.preventDefault();
            queueRef.current.push(move);
            void drain();
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [enabled, drain]);

    // drop pending increments once disabled (disconnect, ...)
    useEffect(() => {
        if (!enabled) queueRef.current = [];
    }, [enabled]);

    // clears anything not yet sent; in-flight sends can't be recalled
    const cancel = useCallback(() => {
        queueRef.current = [];
    }, []);

    return { cancel };
}
