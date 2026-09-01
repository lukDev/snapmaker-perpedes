import type { ReactNode } from 'react';
import { useSerial } from '../hooks/useSerial';

const MIN_SPINDLE_SPEED_RPM = 8000;
const MAX_SPINDLE_SPEED_RPM = 18000;

function SpeedControl({
    value,
    onChange,
}: {
    value: number;
    onChange: (value: number) => void;
}): ReactNode {
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
                onChange={e => onChange(Number(e.target.value))}
                className="w-full accent-emerald-700"
            />
            <div className="flex items-baseline gap-1.5 font-mono text-lg text-slate-700 tabular-nums">
                <input
                    type="text"
                    inputMode="numeric"
                    value={value}
                    onChange={e => {
                        const parsed = Number(
                            e.target.value.replace(/\D/g, '')
                        );
                        onChange(
                            Math.min(
                                MAX_SPINDLE_SPEED_RPM,
                                Math.max(
                                    MIN_SPINDLE_SPEED_RPM,
                                    Number.isNaN(parsed) ? value : parsed
                                )
                            )
                        );
                    }}
                    className="w-20 rounded-md border border-slate-300 bg-white px-2 py-1 text-right focus:border-emerald-700 focus:outline-none"
                />
                <span className="text-sm text-slate-400">rpm</span>
            </div>
        </div>
    );
}

function OnOffSwitch({
    on,
    onToggle,
}: {
    on: boolean;
    onToggle: () => void;
}): ReactNode {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={on}
            onClick={onToggle}
            className={`flex h-10 w-20 items-center rounded-full border p-1 transition-colors ${
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
    const { spindleOn, spindleSpeed, setSpindleOn, setSpindleSpeed } =
        useSerial();

    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-12 rounded-2xl border border-slate-200 bg-white p-10 shadow-xl">
            <SpeedControl value={spindleSpeed} onChange={setSpindleSpeed} />
            <OnOffSwitch
                on={spindleOn}
                onToggle={() => setSpindleOn(!spindleOn)}
            />
        </div>
    );
}
