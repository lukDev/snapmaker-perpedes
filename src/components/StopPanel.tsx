import type { ReactNode } from 'react';

export default function StopPanel({
    active,
    connected,
}: {
    active: boolean;
    connected: boolean;
}): ReactNode {
    return (
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
            <div
                className={`transition-opacity ${
                    connected ? '' : 'pointer-events-none opacity-40'
                }`}>
                <div
                    className={`flex flex-col py-3 w-full items-center justify-center rounded-xl border-2 text-2xl font-bold tracking-wide transition-all duration-75 select-none ${
                        active
                            ? 'scale-99 border-red-600 bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                            : 'border-red-300 bg-red-50 text-red-600 shadow-sm'
                    }`}>
                    STOP
                    <span
                        className={`text-xs font-normal ${active ? 'text-white' : 'text-slate-400'}`}>
                        Space
                    </span>
                </div>
            </div>
        </div>
    );
}
