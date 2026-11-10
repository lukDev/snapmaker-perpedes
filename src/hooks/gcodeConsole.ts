import { useCallback, useRef, useState } from 'react';
import { useSerial } from './useSerial';

export type GcodePacketStatus = 'new' | 'executing' | 'executed' | 'failed';

export type GcodePacket = {
    id: number;
    code: string;
    status: GcodePacketStatus;
    response: string[];
    error: string | null;
};

// strips ";" and "(...)" comments, drops blank lines
function parseLines(code: string): string[] {
    return code
        .split('\n')
        .map(line =>
            line
                .replace(/;.*$/, '')
                .replace(/\([^)]*\)/g, '')
                .trim()
        )
        .filter(line => line.length > 0);
}

function newPacket(id: number, code = ''): GcodePacket {
    return { id, code, status: 'new', response: [], error: null };
}

// session-only history of manually entered G-code; the last packet is
// always the editable draft
export function useGcodeConsole(enabled: boolean) {
    const { connected, sendManualGcode } = useSerial();
    const nextIdRef = useRef(1);
    const [packets, setPackets] = useState<GcodePacket[]>([newPacket(0)]);
    const [prevConnected, setPrevConnected] = useState(connected);

    const draft = packets[packets.length - 1];
    const busy = packets.some(p => p.status === 'executing');

    const updatePacket = (id: number, patch: Partial<GcodePacket>) =>
        setPackets(prev => prev.map(p => (p.id === id ? { ...p, ...patch } : p)));

    // a disconnect drops pending acks, so whatever was in flight never resolves
    if (connected !== prevConnected) {
        setPrevConnected(connected);
        if (!connected && busy) {
            setPackets(prev =>
                prev.map(p =>
                    p.status === 'executing'
                        ? { ...p, status: 'failed', error: 'Disconnected.' }
                        : p
                )
            );
        }
    }

    const setDraftCode = useCallback((code: string) => {
        setPackets(prev => [
            ...prev.slice(0, -1),
            { ...prev[prev.length - 1], code },
        ]);
    }, []);

    const send = useCallback(async () => {
        const lines = parseLines(draft.code);
        if (!enabled || busy || lines.length === 0) return;

        const id = draft.id;
        setPackets(prev => [
            ...prev.slice(0, -1),
            { ...draft, status: 'executing' },
            newPacket(nextIdRef.current++),
        ]);

        const response: string[] = [];
        try {
            for (const line of lines) {
                response.push(...(await sendManualGcode(line)));
            }
            updatePacket(id, { status: 'executed', response });
        } catch (err) {
            updatePacket(id, {
                status: 'failed',
                response,
                error: err instanceof Error ? err.message : String(err),
            });
        }
    }, [draft, enabled, busy, sendManualGcode]);

    // copy a previous packet's code into the draft for re-sending/editing
    const reuse = useCallback(
        (id: number) => {
            const packet = packets.find(p => p.id === id);
            if (packet && packet.id !== draft.id) setDraftCode(packet.code);
        },
        [packets, draft.id, setDraftCode]
    );

    return {
        packets,
        draftCode: draft.code,
        setDraftCode,
        canSend: enabled && !busy && parseLines(draft.code).length > 0,
        send,
        reuse,
    };
}
