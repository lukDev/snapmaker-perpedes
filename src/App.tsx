import type { ReactNode } from 'react';
import JogPanel from './components/JogPanel.tsx';
import SpindlePanel from './components/SpindlePanel.tsx';
import StopPanel from './components/StopPanel.tsx';
import ConnectionStatus from './components/ConnectionStatus.tsx';
import StatusBanner from './components/StatusBanner.tsx';
import { SerialProvider } from './context/SerialContext.tsx';
import { useJogPanel } from './hooks/useJogPanel.ts';

function ControlPanels(): ReactNode {
    const {
        connected,
        homed,
        feedRate,
        setFeedRate,
        pressed,
        workPosition,
        machinePosition,
        setWorkOrigin,
    } = useJogPanel();

    return (
        <div className="flex flex-col items-center gap-6">
            <div className="flex items-stretch gap-6">
                <JogPanel
                    connected={connected}
                    homed={homed}
                    feedRate={feedRate}
                    setFeedRate={setFeedRate}
                    pressed={pressed}
                    workPosition={workPosition}
                    machinePosition={machinePosition}
                    setWorkOrigin={setWorkOrigin}
                />
                <SpindlePanel />
            </div>
            <StopPanel
                connected={connected && homed}
                active={pressed.has('Space')}
            />
        </div>
    );
}

export default function App(): ReactNode {
    return (
        <SerialProvider>
            <div className="min-h-screen bg-slate-100">
                <header className="fixed top-0 right-0 left-0 z-10 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-6 shadow-sm">
                    <img src="/icon_detail.svg" alt="" className="h-14 w-14" />
                    <span className="text-lg font-semibold tracking-wide text-slate-700">
                        Snapmaker Per Pedes
                    </span>
                    <ConnectionStatus />
                </header>
                <div className="flex min-h-screen flex-col items-center gap-6 px-6 pt-16 pb-6">
                    <div className="pt-6">
                        <StatusBanner />
                    </div>
                    <div className="flex flex-1 items-center justify-center">
                        <ControlPanels />
                    </div>
                </div>
            </div>
        </SerialProvider>
    );
}
