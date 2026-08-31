import { createContext } from 'react';
import type { useSnapmakerSerial } from '../hooks/snapmakerSerial';

export type SerialContextValue = ReturnType<typeof useSnapmakerSerial>;

export const SerialContext = createContext<SerialContextValue | null>(null);
