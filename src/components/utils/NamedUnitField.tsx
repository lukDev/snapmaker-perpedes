import type { ReactNode } from 'react';

export default function NamedUnitField({
    label,
    unit,
    input,
    below,
}: {
    label: string;
    unit: string;
    input: ReactNode;
    below?: ReactNode;
}): ReactNode {
    return (
        <div className="grid w-full grid-cols-[2fr_3fr] items-center gap-x-3 gap-y-1">
            <div className="flex justify-end text-slate-500">{label}</div>
            <div className="flex items-center justify-start gap-1.5">
                {input}
                <span className="text-slate-400">{unit}</span>
            </div>
            {below && <div className="col-start-2">{below}</div>}
        </div>
    );
}
