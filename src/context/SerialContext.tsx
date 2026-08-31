import type { ReactNode } from 'react';
import { useSnapmakerSerial } from '../hooks/snapmakerSerial';
import { SerialContext } from './serialContext';

export function SerialProvider({
    children,
}: {
    children: ReactNode;
}): ReactNode {
    const serial = useSnapmakerSerial();
    return (
        <SerialContext.Provider value={serial}>
            {children}
        </SerialContext.Provider>
    );
}
