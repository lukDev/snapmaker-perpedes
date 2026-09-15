import { useState, type ReactNode } from 'react';

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

export default function NumberField({
    label,
    value,
    onChange,
    unit,
    min,
    max,
    decimals = 2,
}: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    unit: string;
    min: number;
    max: number;
    decimals?: number;
}): ReactNode {
    const [text, setText] = useState(value.toFixed(decimals));
    const [prevValue, setPrevValue] = useState(value);

    if (value !== prevValue) {
        setPrevValue(value);
        setText(value.toFixed(decimals));
    }

    const commit = (next: number) => {
        onChange(clamp(next, min, max));
    };

    return (
        <label className="flex items-center justify-between gap-3 text-sm text-slate-500">
            <span>{label}</span>
            <span className="flex items-center gap-1.5">
                <input
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
                <span className="text-slate-400">{unit}</span>
            </span>
        </label>
    );
}
