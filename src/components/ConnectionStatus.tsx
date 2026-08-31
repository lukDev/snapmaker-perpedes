import { useState, type ReactNode } from 'react';
import { useSerial } from '../hooks/useSerial';

export default function ConnectionStatus(): ReactNode {
    const { connected, homed, connect, disconnect, home } = useSerial();
    const [homing, setHoming] = useState(false);

    const handleHome = async () => {
        setHoming(true);
        try {
            await home();
        } finally {
            setHoming(false);
        }
    };

    return (
        <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
                <span
                    className={`h-2.5 w-2.5 rounded-full ${
                        connected
                            ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]'
                            : 'bg-slate-300'
                    }`}
                />
                {connected ? 'Connected' : 'Disconnected'}
            </div>
            {connected && !homed && (
                <button
                    type="button"
                    onClick={handleHome}
                    disabled={homing}
                    className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-50">
                    {homing ? 'Homing…' : 'Home'}
                </button>
            )}
            <button
                type="button"
                onClick={() => (connected ? disconnect() : connect())}
                className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                    connected
                        ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}>
                {connected ? 'Disconnect' : 'Connect'}
            </button>
        </div>
    );
}
