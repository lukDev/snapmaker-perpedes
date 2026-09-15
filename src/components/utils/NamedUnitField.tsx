import type { ReactNode } from 'react';

export default function NamedUnitField({
    label,
    unit,
    input,
}: {
    label: string;
    unit: string;
    input: ReactNode;
}): ReactNode {
    return (
        <label className="flex items-center justify-between gap-3 text-sm text-slate-500">
            <span>{label}</span>
            <span className="flex items-center gap-1.5">
                {input}
                <span className="text-slate-400">{unit}</span>
            </span>
        </label>
    );
}
