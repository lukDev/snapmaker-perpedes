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

export const DEFAULT_SPINDLE_SPEED_RPM = 12000;

// Debounce spindle RPM changes while the slider is being dragged, so we
// don't flood the machine with an M3 for every intermediate value.
const SPINDLE_RPM_DEBOUNCE_MS = 1000;

export const SUPPORTED_SPINDLE_TOOLHEAD = '200W CNC';

// M1006's response starts with a "Tool Head: <name>" line, followed by
// several detail lines we don't care about, then "ok".
const TOOL_HEAD_LINE_RE = /^Tool Head:\s*(.+)$/i;

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
    const spindleOnRef = useRef(false);
    const spindleSpeedRef = useRef(DEFAULT_SPINDLE_SPEED_RPM);
    const spindleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
        null
    );
    const toolheadCaptureRef = useRef<string[] | null>(null);
    const [connected, setConnected] = useState(false);
    const [homed, setHomed] = useState(false);
    const [log, setLog] = useState<string[]>([]);
    const [workPosition, setWorkPosition] = useState<AxisPosition | null>(null);
    const [machinePosition, setMachinePosition] = useState<AxisPosition | null>(
        null
    );
    const [spindleOn, setSpindleOnState] = useState(false);
    const [spindleSpeed, setSpindleSpeedState] = useState(
        DEFAULT_SPINDLE_SPEED_RPM
    );
    const [toolhead, setToolhead] = useState<string | null>(null);
    const spindleSupported = toolhead === SUPPORTED_SPINDLE_TOOLHEAD;

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

    const sendGcode = useCallback(async (line: string) => {
        if (!writerRef.current) return;
        appendLog(`>> ${line}`);
        await writerRef.current.write(line + '\n');
    }, []);

    const clearSpindleDebounce = () => {
        if (spindleDebounceRef.current !== null) {
            clearTimeout(spindleDebounceRef.current);
            spindleDebounceRef.current = null;
        }
    };

    const setSpindleOn = useCallback(
        (on: boolean) => {
            spindleOnRef.current = on;
            setSpindleOnState(on);
            clearSpindleDebounce();
            void sendGcode(on ? `M3 S${spindleSpeedRef.current}` : 'M5');
        },
        [sendGcode]
    );

    const setSpindleSpeed = useCallback(
        (rpm: number) => {
            spindleSpeedRef.current = rpm;
            setSpindleSpeedState(rpm);
            clearSpindleDebounce();
            if (!spindleOnRef.current) return;
            spindleDebounceRef.current = setTimeout(() => {
                spindleDebounceRef.current = null;
                void sendGcode(`M3 S${spindleSpeedRef.current}`);
            }, SPINDLE_RPM_DEBOUNCE_MS);
        },
        [sendGcode]
    );

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

    const queryToolhead = useCallback(async () => {
        if (isDebugPortRef.current) {
            appendLog(
                `<< Tool Head: ${SUPPORTED_SPINDLE_TOOLHEAD} (simulated, debug port)`
            );
            return SUPPORTED_SPINDLE_TOOLHEAD;
        }
        toolheadCaptureRef.current = [];
        await sendGcodeAndWaitForAck('M1006');
        const lines = toolheadCaptureRef.current;
        toolheadCaptureRef.current = null;
        const match = lines?.[0] ? TOOL_HEAD_LINE_RE.exec(lines[0]) : null;
        return match?.[1]?.trim() ?? null;
    }, [sendGcodeAndWaitForAck]);

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
            spindleOnRef.current = false;
            setSpindleOnState(false);
            clearSpindleDebounce();

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
                            } else {
                                toolheadCaptureRef.current?.push(value);
                            }
                            applyPositionReport(value);
                        }
                    }
                } catch (err) {
                    appendLog(`Read error: ${String(err)}`);
                }
            })();

            await sendGcode('M5');
            setToolhead(await queryToolhead());
        } catch (err) {
            appendLog(`Connect error: ${String(err)}`);
            portRef.current = null;
        }
    }, [sendGcode, queryToolhead]);

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
            clearSpindleDebounce();
            spindleOnRef.current = false;
            toolheadCaptureRef.current = null;
            setConnected(false);
            setHomed(false);
            setWorkPosition(null);
            setMachinePosition(null);
            setSpindleOnState(false);
            setToolhead(null);
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
        spindleOn,
        spindleSpeed,
        setSpindleOn,
        setSpindleSpeed,
        toolhead,
        spindleSupported,
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
