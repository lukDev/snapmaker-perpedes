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
        <div className="flex w-full items-center gap-3">
            <div className="flex w-2/5 justify-end text-slate-500">{label}</div>
            <div className="flex w-3/5 items-center justify-start gap-1.5">
                {input}
                <span className="text-slate-400">{unit}</span>
            </div>
        </div>
    );
}
