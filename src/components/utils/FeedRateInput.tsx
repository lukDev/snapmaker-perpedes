import { useState, type ReactNode } from 'react';
import { MAX_FEED_RATE } from '../../hooks/jogControl.ts';
import NamedUnitField from './NamedUnitField.tsx';

const PRESETS = [50, 100, 300, 500, 1000, MAX_FEED_RATE];
const MIN = 10;

function round1(value: number): number {
    return Math.round(value * 10) / 10;
}

function clamp(value: number): number {
    return Math.min(MAX_FEED_RATE, Math.max(MIN, value));
}

function FeedRateNumberInput({
    value,
    onChange,
}: {
    value: number;
    onChange: (value: number) => void;
}): ReactNode {
    const [text, setText] = useState(value.toFixed(1));
    const [prevValue, setPrevValue] = useState(value);

    if (value !== prevValue) {
        setPrevValue(value);
        setText(value.toFixed(1));
    }

    const commit = (next: number) => {
        onChange(round1(clamp(next)));
    };

    return (
        <input
            type="text"
            inputMode="decimal"
            value={text}
            onChange={e => setText(e.target.value)}
            onBlur={() => commit(parseFloat(text.replace(',', '.')) || value)}
            onKeyDown={e => {
                if (e.key === 'Enter') e.currentTarget.blur();
            }}
            className="w-18 rounded-md border border-slate-300 bg-white px-2 py-1 text-right font-mono text-sm text-slate-700 tabular-nums focus:border-emerald-400 focus:outline-none"
        />
    );
}

function FeedRatePresets({
    onChange,
}: {
    onChange: (value: number) => void;
}): ReactNode {
    return (
        <div className="ml-1 flex items-center gap-0.5">
            {PRESETS.map(preset => (
                <button
                    key={preset}
                    type="button"
                    onClick={() => onChange(preset)}
                    className="rounded cursor-pointer px-1 font-mono text-[11px] leading-4 text-slate-400 tabular-nums transition-colors hover:bg-slate-100 hover:text-slate-600">
                    {preset}
                </button>
            ))}
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
            below={<FeedRatePresets onChange={onChange} />}
        />
    );
}
