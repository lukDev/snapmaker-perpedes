import type { ReactNode } from 'react';
import type {
    GcodePacket,
    GcodePacketStatus,
} from '../../hooks/gcodeConsole.ts';

const STATUS_LABEL: Record<GcodePacketStatus, string> = {
    new: 'New',
    executing: 'In Execution',
    executed: 'Executed',
    failed: 'Failed',
};

const STATUS_CLASS: Record<GcodePacketStatus, string> = {
    new: 'bg-slate-100 text-slate-500',
    executing: 'animate-pulse bg-amber-100 text-amber-700',
    executed: 'bg-emerald-100 text-emerald-700',
    failed: 'bg-red-100 text-red-700',
};

function PacketItem({
    packet,
    isDraft,
    onReuse,
}: {
    packet: GcodePacket;
    isDraft: boolean;
    onReuse: () => void;
}): ReactNode {
    return (
        <button
            type="button"
            onClick={onReuse}
            disabled={isDraft}
            title={isDraft ? undefined : 'Copy into editor'}
            className={`flex w-full flex-col gap-1 rounded-lg border px-2 py-1.5 text-left transition-colors ${
                isDraft
                    ? 'border-dashed border-slate-300 bg-white'
                    : 'cursor-pointer border-slate-200 bg-slate-50 hover:bg-slate-100'
            }`}>
            <span
                className={`self-start rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_CLASS[packet.status]}`}>
                {STATUS_LABEL[packet.status]}
            </span>
            <pre className="font-mono text-xs break-all whitespace-pre-wrap text-slate-700">
                {packet.code || (
                    <span className="text-slate-400 italic">empty</span>
                )}
            </pre>
            {packet.error && (
                <span className="font-mono text-xs break-all text-red-600">
                    {packet.error}
                </span>
            )}
        </button>
    );
}

export default function GcodeControls({
    ready,
    packets,
    draftCode,
    setDraftCode,
    canSend,
    send,
    reuse,
}: {
    ready: boolean;
    packets: GcodePacket[];
    draftCode: string;
    setDraftCode: (code: string) => void;
    canSend: boolean;
    send: () => void;
    reuse: (id: number) => void;
}): ReactNode {
    const draftId = packets[packets.length - 1].id;

    return (
        <div
            className={`flex h-80 w-xl gap-4 transition-opacity ${ready ? '' : 'pointer-events-none opacity-40'}`}>
            <div className="flex w-48 flex-col gap-2">
                <span className="text-sm font-semibold text-slate-500">
                    History
                </span>
                <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
                    {[...packets].reverse().map(packet => (
                        <PacketItem
                            key={packet.id}
                            packet={packet}
                            isDraft={packet.id === draftId}
                            onReuse={() => reuse(packet.id)}
                        />
                    ))}
                </div>
            </div>
            <div className="flex flex-1 flex-col gap-2">
                <span className="text-sm font-semibold text-slate-500">
                    G-Code
                </span>
                <textarea
                    value={draftCode}
                    onChange={e => setDraftCode(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            e.preventDefault();
                            if (canSend) send();
                        }
                    }}
                    placeholder={'G0 X10 Y10\nG1 Z-1 F100'}
                    spellCheck={false}
                    className="flex-1 resize-none rounded-lg border border-slate-300 bg-white p-2 font-mono text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
                />
                <button
                    type="button"
                    disabled={!canSend}
                    onClick={send}
                    className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-emerald-950 shadow-sm transition-colors hover:bg-emerald-400 disabled:pointer-events-none disabled:opacity-40">
                    Send
                    <span className="text-xs font-normal">⌘/Ctrl + Enter</span>
                </button>
            </div>
        </div>
    );
}
