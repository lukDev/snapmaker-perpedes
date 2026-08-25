import { useContext } from 'react';
import {
    SerialContext,
    type SerialContextValue,
} from '../context/serialContext';

export function useSerial(): SerialContextValue {
    const ctx = useContext(SerialContext);
    if (!ctx) {
        throw new Error('useSerial must be used within a SerialProvider');
    }
    return ctx;
}
