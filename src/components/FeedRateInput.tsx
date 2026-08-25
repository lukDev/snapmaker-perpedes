import { useEffect, useRef, useState, type ReactNode } from 'react';

const MIN = 10;
const MAX = 1500;

function round1(value: number): number {
    return Math.round(value * 10) / 10;
}

function clamp(value: number): number {
    return Math.min(MAX, Math.max(MIN, value));
}

function stepFor(value: number): number {
    return Math.max(0.1, round1(value * 0.01));
}

export default function FeedRateInput({
    value,
    onChange,
}: {
    value: number;
    onChange: (value: number) => void;
}): ReactNode {
    const [text, setText] = useState(value.toFixed(1));
    const [prevValue, setPrevValue] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);

    if (value !== prevValue) {
        setPrevValue(value);
        setText(value.toFixed(1));
    }

    const commit = (next: number) => {
        onChange(round1(clamp(next)));
    };

    useEffect(() => {
        const el = inputRef.current;
        if (!el) return;

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const direction = e.deltaY < 0 ? -1 : 1;
            onChange(round1(clamp(value + direction * stepFor(value))));
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
                className="w-16 rounded-md border border-slate-300 bg-white px-2 py-1 text-right text-slate-700 tabular-nums focus:border-emerald-400 focus:outline-none"
            />
            <span>mm/min</span>
        </div>
    );
}
