import type { ReactNode } from 'react';
import DiscreteJogControls from './modes/DiscreteJogControls.tsx';
import DrillingControls from './modes/DrillingControls.tsx';
import CircleControls from './modes/CircleControls.tsx';
import ScrollingControls from './modes/ScrollingControls.tsx';
import PositionPanel from './PositionPanel';
import type { TrackedKey } from '../hooks/useTrackedKeys';
import type { Axis, AxisPosition } from '../hooks/snapmakerSerial';
import type { MovementMode } from '../hooks/useMovementPanel';
import type { DrillingStatus } from '../hooks/drillingControl';
import ContinuousJogControls from './modes/ContinuousJogControls.tsx';

const MODES: { mode: MovementMode; label: string }[] = [
    { mode: 'continuous', label: 'Continuous' },
    { mode: 'discrete', label: 'Discrete' },
    { mode: 'circle', label: 'Circle' },
    { mode: 'scrolling', label: 'Scroll' },
    { mode: 'drilling', label: 'Drilling' },
];

function ModeTabs({
    mode,
    setMode,
}: {
    mode: MovementMode;
    setMode: (mode: MovementMode) => void;
}): ReactNode {
    return (
        <div className="flex h-16 w-full items-center justify-between gap-1 border border-slate-200 bg-slate-100 p-1">
            <div />
            {MODES.map(({ mode: candidate, label }) => (
                <button
                    key={candidate}
                    type="button"
                    onClick={() => setMode(candidate)}
                    className={`cursor-pointer rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                        mode === candidate
                            ? 'bg-white text-slate-700 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                    }`}>
                    {label}
                </button>
            ))}
            <div />
        </div>
    );
}

export default function MovementPanel({
    connected,
    homed,
    mode,
    setMode,
    feedRate,
    setFeedRate,
    pressed,
    workPosition,
    machinePosition,
    setWorkOrigin,
    goToOrigin,
    discrete,
    drilling,
    circle,
    scrolling,
}: {
    connected: boolean;
    homed: boolean;
    mode: MovementMode;
    setMode: (mode: MovementMode) => void;
    feedRate: number;
    setFeedRate: (value: number) => void;
    pressed: Set<TrackedKey>;
    workPosition: AxisPosition | null;
    machinePosition: AxisPosition | null;
    setWorkOrigin: (axes: Axis[]) => void;
    goToOrigin: () => void;
    discrete: {
        distance: number;
        setDistance: (value: number) => void;
    };
    drilling: {
        maxDepth: number;
        setMaxDepth: (value: number) => void;
        downSpeed: number;
        setDownSpeed: (value: number) => void;
        upSpeed: number;
        setUpSpeed: (value: number) => void;
        status: DrillingStatus;
        descended: number;
    };
    circle: {
        setOrigin: () => void;
    };
    scrolling: {
        axis: Axis;
        setAxis: (axis: Axis) => void;
        distance: number;
        setDistance: (value: number) => void;
    };
}): ReactNode {
    const ready = connected && homed;

    return (
        <div className="flex h-full flex-col items-center justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <ModeTabs mode={mode} setMode={setMode} />

            <div className="flex h-full flex-col overflow-y-auto p-10">
                <div className="my-auto flex flex-col items-center gap-8">
                    <div className="flex w-full flex-col items-center gap-6">
                        {mode === 'continuous' && (
                            <ContinuousJogControls
                                pressed={pressed}
                                ready={ready}
                                speed={feedRate}
                                setSpeed={setFeedRate}
                            />
                        )}
                        {mode === 'discrete' && (
                            <DiscreteJogControls
                                pressed={pressed}
                                ready={ready}
                                distance={discrete.distance}
                                setDistance={discrete.setDistance}
                                speed={feedRate}
                                setSpeed={setFeedRate}
                            />
                        )}
                        {mode === 'circle' && (
                            <CircleControls
                                pressed={pressed}
                                ready={ready}
                                workPosition={workPosition}
                                setOrigin={circle.setOrigin}
                                speed={feedRate}
                                setSpeed={setFeedRate}
                            />
                        )}
                        {mode === 'scrolling' && (
                            <ScrollingControls
                                ready={ready}
                                axis={scrolling.axis}
                                setAxis={scrolling.setAxis}
                                distance={scrolling.distance}
                                setDistance={scrolling.setDistance}
                                stopSignal={pressed.has('Space')}
                            />
                        )}
                        {mode === 'drilling' && (
                            <DrillingControls
                                pressed={pressed}
                                ready={ready}
                                maxDepth={drilling.maxDepth}
                                setMaxDepth={drilling.setMaxDepth}
                                downSpeed={drilling.downSpeed}
                                setDownSpeed={drilling.setDownSpeed}
                                upSpeed={drilling.upSpeed}
                                setUpSpeed={drilling.setUpSpeed}
                                status={drilling.status}
                                descended={drilling.descended}
                            />
                        )}
                    </div>

                    <div className="h-px w-full bg-slate-200" />

                    <PositionPanel
                        ready={ready}
                        workPosition={workPosition}
                        machinePosition={machinePosition}
                        setWorkOrigin={setWorkOrigin}
                        goToOrigin={goToOrigin}
                    />
                </div>
            </div>
        </div>
    );
}
