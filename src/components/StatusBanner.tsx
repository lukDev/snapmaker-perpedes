import { useState, type ReactNode } from 'react';
import { useSerial } from '../hooks/useSerial';

export default function StatusBanner(): ReactNode {
    const { connected, homed, connect, home } = useSerial();
    const [homing, setHoming] = useState(false);

    if (connected && homed) {
        return null;
    }

    const handleHome = async () => {
        setHoming(true);
        try {
            await home();
        } finally {
            setHoming(false);
        }
    };

    return (
        <div className="flex items-center justify-between gap-8 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4 text-amber-800 shadow-sm">
            {!connected ? (
                <>
                    <span className="text-sm font-medium">
                        Connect to the machine to enable controls.
                    </span>
                    <button
                        type="button"
                        onClick={connect}
                        className="shrink-0 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100">
                        Connect
                    </button>
                </>
            ) : (
                <>
                    <span className="text-sm font-medium">
                        Home the machine to enable controls.
                    </span>
                    <button
                        type="button"
                        onClick={handleHome}
                        disabled={homing}
                        className="shrink-0 rounded-md border border-amber-200 bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-200 disabled:opacity-50">
                        {homing ? 'Homing…' : 'Home'}
                    </button>
                </>
            )}
        </div>
    );
}
