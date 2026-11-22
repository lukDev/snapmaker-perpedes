import { useState, type ReactNode } from 'react';
import { useSerial } from '../hooks/useSerial';
import { SUPPORTED_SPINDLE_TOOLHEAD } from '../hooks/snapmakerSerial';

const MIN_SPINDLE_SPEED_RPM = 8000;
const MAX_SPINDLE_SPEED_RPM = 18000;

function SpeedControl({
    value,
    onChange,
    disabled,
}: {
    value: number;
    onChange: (value: number) => void;
    disabled: boolean;
}): ReactNode {
    const [text, setText] = useState(String(value));
    const [prevValue, setPrevValue] = useState(value);

    if (value !== prevValue) {
        setPrevValue(value);
        setText(String(value));
    }

    const commit = () => {
        const parsed = parseInt(text.replace(/\D/g, ''), 10);
        const next = Number.isNaN(parsed)
            ? value
            : Math.min(
                  MAX_SPINDLE_SPEED_RPM,
                  Math.max(MIN_SPINDLE_SPEED_RPM, parsed)
              );
        setText(String(next));
        if (next !== value) onChange(next);
    };

    return (
        <div className="flex w-64 flex-col items-center gap-2">
            <span className="text-sm font-medium text-slate-500">
                Spindle Speed
            </span>
            <input
                type="range"
                min={MIN_SPINDLE_SPEED_RPM}
                max={MAX_SPINDLE_SPEED_RPM}
                step={1}
                value={value}
                disabled={disabled}
                onChange={e => onChange(Number(e.target.value))}
                className="w-full accent-emerald-700 disabled:opacity-40"
            />
            <div className="flex items-baseline gap-1.5 font-mono text-lg text-slate-700 tabular-nums">
                <input
                    type="text"
                    inputMode="numeric"
                    value={text}
                    disabled={disabled}
                    onChange={e => setText(e.target.value.replace(/\D/g, ''))}
                    onBlur={commit}
                    onKeyDown={e => {
                        if (e.key === 'Enter') e.currentTarget.blur();
                    }}
                    className="w-20 rounded-md border border-slate-300 bg-white px-2 py-1 text-right focus:border-emerald-700 focus:outline-none disabled:opacity-40"
                />
                <span className="text-sm text-slate-400">rpm</span>
            </div>
        </div>
    );
}

function OnOffSwitch({
    on,
    onToggle,
    disabled,
}: {
    on: boolean;
    onToggle: () => void;
    disabled: boolean;
}): ReactNode {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={on}
            disabled={disabled}
            onClick={onToggle}
            className={`flex h-10 w-20 items-center rounded-full border p-1 transition-colors disabled:opacity-40 ${
                on
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-slate-300 bg-slate-100'
            }`}>
            <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold shadow-sm transition-transform ${
                    on
                        ? 'translate-x-10 bg-emerald-500 text-emerald-950'
                        : 'translate-x-0 bg-white text-slate-500'
                }`}>
                {on ? 'ON' : 'OFF'}
            </span>
        </button>
    );
}

export default function SpindlePanel(): ReactNode {
    const {
        connected,
        homed,
        spindleOn,
        spindleSpeed,
        setSpindleOn,
        setSpindleSpeed,
        spindleSupported,
        toolhead,
    } = useSerial();

    const unsupported = connected && toolhead !== null && !spindleSupported;

    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-12 rounded-2xl border border-slate-200 bg-white p-10 shadow-xl">
            {unsupported ? (
                <p className="max-w-48 text-center text-sm text-slate-400">
                    Spindle controls are only available with the{' '}
                    {SUPPORTED_SPINDLE_TOOLHEAD} toolhead.
                </p>
            ) : (
                <>
                    <SpeedControl
                        value={spindleSpeed}
                        onChange={setSpindleSpeed}
                        disabled={!connected || !homed}
                    />
                    <OnOffSwitch
                        on={spindleOn}
                        onToggle={() => setSpindleOn(!spindleOn)}
                        disabled={!connected || !homed}
                    />
                </>
            )}
        </div>
    );
}
