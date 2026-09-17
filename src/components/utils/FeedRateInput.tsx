import { useEffect, useRef, useState, type ReactNode } from 'react';
import { MAX_FEED_RATE } from '../../hooks/jogControl.ts';
import NamedUnitField from './NamedUnitField.tsx';

const STEPS = [10, 20, 50, 100, 200, 300, 500, 750, 1000, 1200, MAX_FEED_RATE];
const MIN = STEPS[0];

function round1(value: number): number {
    return Math.round(value * 10) / 10;
}

function clamp(value: number): number {
    return Math.min(MAX_FEED_RATE, Math.max(MIN, value));
}

function nextStep(value: number, direction: 1 | -1): number {
    if (direction < 0) {
        const next = STEPS.find(step => step > value);
        return next ?? MAX_FEED_RATE;
    }
    const prev = [...STEPS].reverse().find(step => step < value);
    return prev ?? MIN;
}

const WHEEL_THRESHOLD = 80;

function FeedRateNumberInput({
    value,
    onChange,
}: {
    value: number;
    onChange: (value: number) => void;
}): ReactNode {
    const [text, setText] = useState(value.toFixed(1));
    const [prevValue, setPrevValue] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);
    const wheelAccumRef = useRef(0);

    if (value !== prevValue) {
        setPrevValue(value);
        setText(value.toFixed(1));
        wheelAccumRef.current = 0;
    }

    const commit = (next: number) => {
        onChange(round1(clamp(next)));
    };

    useEffect(() => {
        const el = inputRef.current;
        if (!el) return;

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const accum = wheelAccumRef.current + e.deltaY;
            if (Math.abs(accum) < WHEEL_THRESHOLD) {
                wheelAccumRef.current = accum;
                return;
            }
            wheelAccumRef.current = 0;
            const direction = accum < 0 ? 1 : -1;
            onChange(round1(clamp(nextStep(value, direction))));
        };

        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, [value, onChange]);

    return (
        <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <input
                ref={inputRef}
                type="text"
                inputMode="decimal"
                value={text}
                onChange={e => setText(e.target.value)}
                onBlur={() =>
                    commit(parseFloat(text.replace(',', '.')) || value)
                }
                onKeyDown={e => {
                    if (e.key === 'Enter') e.currentTarget.blur();
                }}
                className="w-18 rounded-md border border-slate-300 bg-white px-2 py-1 text-right font-mono text-slate-700 tabular-nums focus:border-emerald-400 focus:outline-none"
            />
        </div>
    );
}

export default function FeedRateInput({
    value,
    onChange,
}: {
    value: number;
    onChange: (value: number) => void;
}): ReactNode {
    return (
        <NamedUnitField
            label="Speed"
            unit="mm/min"
            input={<FeedRateNumberInput value={value} onChange={onChange} />}
        />
    );
}
