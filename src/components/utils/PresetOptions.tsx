import type { CSSProperties, ReactNode } from 'react';

export const ANGLE_PRESETS = [0.2, 1, 5, 15, 30, 45, 90, 180, 360];
export const DISTANCE_PRESETS = [0.1, 0.5, 1, 5, 10, 100];

export function PresetButton({
    preset,
    onChange,
    disabled = false,
    className = '',
    style,
}: {
    preset: number;
    onChange: (value: number) => void;
    disabled?: boolean;
    className?: string;
    style?: CSSProperties;
}): ReactNode {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(preset)}
            style={style}
            className={`rounded cursor-pointer disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400 px-1 font-mono text-[11px] leading-4 text-slate-400 tabular-nums transition-colors hover:bg-slate-100 hover:text-slate-600 ${className}`}>
            {preset}
        </button>
    );
}

export default function PresetOptions({
    presets,
    onChange,
}: {
    presets: number[];
    onChange: (value: number) => void;
}): ReactNode {
    return (
        <div className="ml-1 flex flex-wrap items-center gap-0.5">
            {presets.map(preset => (
                <PresetButton
                    key={preset}
                    preset={preset}
                    onChange={onChange}
                />
            ))}
        </div>
    );
}
