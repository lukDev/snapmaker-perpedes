import { useCallback, useRef, useState } from 'react';

export function useSnapmakerSerial() {
    const portRef = useRef<SerialPort | null>(null);
    const writerRef = useRef<WritableStreamDefaultWriter<string> | null>(null);
    const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null);
    const writableClosedRef = useRef<Promise<void> | null>(null);
    const readableClosedRef = useRef<Promise<void> | null>(null);
    const [connected, setConnected] = useState(false);
    const [log, setLog] = useState<string[]>([]);

    const appendLog = (line: string) =>
        setLog(prev => [...prev.slice(-199), line]); // keep last 200 lines

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

            // background read loop
            (async () => {
                try {
                    while (true) {
                        const { value, done } = await reader.read();
                        if (done) break;
                        if (value) appendLog(`<< ${value}`);
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

    const disconnect = useCallback(async () => {
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
            setConnected(false);
        }
    }, []);

    return { connect, disconnect, sendGcode, connected, log };
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
