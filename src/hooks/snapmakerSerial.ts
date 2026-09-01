import { useCallback, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

export type Axis = 'X' | 'Y' | 'Z';
export type AxisPosition = { x: number; y: number; z: number };

const POSITION_REPORT_RE =
    /^X:(-?\d+\.?\d*)\s+Y:(-?\d+\.?\d*)\s+Z:(-?\d+\.?\d*)/;

const ZERO_POSITION: AxisPosition = { x: 0, y: 0, z: 0 };

// Snapmaker's firmware doesn't implement M154 (position auto-report), so
// position updates are obtained by polling M114 on an interval instead.
const POSITION_POLL_INTERVAL_MS = 1000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useSnapmakerSerial() {
    const portRef = useRef<SerialPort | null>(null);
    const writerRef = useRef<WritableStreamDefaultWriter<string> | null>(null);
    const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null);
    const writableClosedRef = useRef<Promise<void> | null>(null);
    const readableClosedRef = useRef<Promise<void> | null>(null);
    const ackQueueRef = useRef<Array<() => void>>([]);
    const isDebugPortRef = useRef(false);
    const positionPollActiveRef = useRef(false);
    const workOffsetRef = useRef<AxisPosition>(ZERO_POSITION);
    const workPositionRef = useRef<AxisPosition | null>(null);
    const [connected, setConnected] = useState(false);
    const [homed, setHomed] = useState(false);
    const [log, setLog] = useState<string[]>([]);
    const [workPosition, setWorkPosition] = useState<AxisPosition | null>(null);
    const [machinePosition, setMachinePosition] = useState<AxisPosition | null>(
        null
    );

    const appendLog = (line: string) =>
        setLog(prev => [...prev.slice(-199), line]); // keep last 200 lines

    const applyPositionReport = (line: string) => {
        const match = POSITION_REPORT_RE.exec(line);
        if (!match) return;
        const work: AxisPosition = {
            x: parseFloat(match[1]),
            y: parseFloat(match[2]),
            z: parseFloat(match[3]),
        };
        const offset = workOffsetRef.current;
        workPositionRef.current = work;
        // Runs from the detached background read loop, outside any React
        // event, so a plain setState can sit pending until something else
        // (e.g. a click) forces a render. flushSync makes each report paint
        // immediately.
        flushSync(() => {
            setWorkPosition(work);
            setMachinePosition({
                x: work.x + offset.x,
                y: work.y + offset.y,
                z: work.z + offset.z,
            });
        });
    };

    const connect = useCallback(async () => {
        if (!('serial' in navigator)) {
            appendLog('Web Serial API not supported in this browser.');
            return;
        }

        if (portRef.current) return;

        try {
            const port = await navigator.serial.requestPort();
            await port.open({ baudRate: 115200 });
            portRef.current = port;

            if (!port.writable || !port.readable) {
                throw new Error('Serial port is not readable/writable.');
            }

            // Ports without USB vendor/product info (e.g. macOS's cu.debug-console)
            // aren't a real Snapmaker, so simulate instant acks for testing without hardware.
            const info = port.getInfo();
            isDebugPortRef.current = !info.usbVendorId && !info.usbProductId;

            // --- writer ---
            const textEncoder = new TextEncoderStream();
            writableClosedRef.current = textEncoder.readable.pipeTo(
                port.writable as unknown as WritableStream<Uint8Array>
            );
            writerRef.current = textEncoder.writable.getWriter();

            // --- reader (decode incoming bytes as text, split into lines) ---
            const textDecoder = new TextDecoderStream();
            readableClosedRef.current = (
                port.readable as unknown as ReadableStream<Uint8Array>
            ).pipeTo(
                textDecoder.writable as unknown as WritableStream<Uint8Array>
            );
            const lineStream =
                textDecoder.readable.pipeThrough(makeLineSplitter());
            const reader = lineStream.getReader();
            readerRef.current = reader;

            setConnected(true);
            setHomed(false);
            workOffsetRef.current = ZERO_POSITION;
            workPositionRef.current = null;
            setWorkPosition(null);
            setMachinePosition(null);

            // background read loop
            (async () => {
                try {
                    while (true) {
                        const { value, done } = await reader.read();
                        if (done) break;
                        if (value) {
                            appendLog(`<< ${value}`);
                            if (/^ok\b/i.test(value)) {
                                ackQueueRef.current.shift()?.();
                            }
                            applyPositionReport(value);
                        }
                    }
                } catch (err) {
                    appendLog(`Read error: ${String(err)}`);
                }
            })();
        } catch (err) {
            appendLog(`Connect error: ${String(err)}`);
            portRef.current = null;
        }
    }, []);

    const sendGcode = useCallback(async (line: string) => {
        if (!writerRef.current) return;
        appendLog(`>> ${line}`);
        await writerRef.current.write(line + '\n');
    }, []);

    const sendGcodeAndWaitForAck = useCallback(
        async (line: string) => {
            if (!writerRef.current) return;
            if (isDebugPortRef.current) {
                await sendGcode(line);
                appendLog('<< ok (simulated, debug port)');
                return;
            }
            const acked = new Promise<void>(resolve => {
                ackQueueRef.current.push(resolve);
            });
            await sendGcode(line);
            await acked;
        },
        [sendGcode]
    );

    const startPositionPolling = useCallback(() => {
        if (positionPollActiveRef.current) return;
        positionPollActiveRef.current = true;
        (async () => {
            while (positionPollActiveRef.current) {
                await sendGcodeAndWaitForAck('M114');
                await sleep(POSITION_POLL_INTERVAL_MS);
            }
        })();
    }, [sendGcodeAndWaitForAck]);

    const home = useCallback(async () => {
        if (!writerRef.current) return;
        await sendGcodeAndWaitForAck('G28 O'); // O: skip homing if already homed
        workOffsetRef.current = ZERO_POSITION;
        setHomed(true);
        startPositionPolling();
    }, [sendGcodeAndWaitForAck, startPositionPolling]);

    const setWorkOrigin = useCallback(
        async (axes: Axis[]) => {
            const current = workPositionRef.current;
            if (!writerRef.current || !current || axes.length === 0) return;

            const offset = workOffsetRef.current;
            const newOffset = { ...offset };
            for (const axis of axes) {
                const key = axis.toLowerCase() as keyof AxisPosition;
                newOffset[key] = offset[key] + current[key];
            }
            workOffsetRef.current = newOffset;

            const newWork = { ...current };
            for (const axis of axes)
                newWork[axis.toLowerCase() as keyof AxisPosition] = 0;
            workPositionRef.current = newWork;
            setWorkPosition(newWork);

            await sendGcodeAndWaitForAck(
                ['G92', ...axes.map(axis => `${axis}0`)].join(' ')
            );
        },
        [sendGcodeAndWaitForAck]
    );

    const disconnect = useCallback(async () => {
        positionPollActiveRef.current = false;
        try {
            await readerRef.current?.cancel();
            await readableClosedRef.current?.catch(() => {});

            await writerRef.current?.close();
            await writableClosedRef.current?.catch(() => {});

            await portRef.current?.close();
        } catch (err) {
            appendLog(`Disconnect error: ${String(err)}`);
        } finally {
            portRef.current = null;
            writerRef.current = null;
            readerRef.current = null;
            writableClosedRef.current = null;
            readableClosedRef.current = null;
            ackQueueRef.current = [];
            isDebugPortRef.current = false;
            workOffsetRef.current = ZERO_POSITION;
            workPositionRef.current = null;
            setConnected(false);
            setHomed(false);
            setWorkPosition(null);
            setMachinePosition(null);
        }
    }, []);

    return {
        connect,
        disconnect,
        sendGcode,
        home,
        setWorkOrigin,
        connected,
        homed,
        log,
        workPosition,
        machinePosition,
    };
}

// Splits an incoming text stream into discrete lines (Snapmaker responds line-by-line)
function makeLineSplitter() {
    let buffer = '';
    return new TransformStream<string, string>({
        transform(chunk, controller) {
            buffer += chunk;
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';
            for (const line of lines) {
                if (line.trim()) controller.enqueue(line.trim());
            }
        },
    });
}
