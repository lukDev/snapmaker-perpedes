import type { ReactNode } from 'react';
import FeedRateInput from './FeedRateInput';
import { WasdArrowGrid } from './KeyBadge';
import DiscreteJogControls from './DiscreteJogControls';
import DrillingControls from './DrillingControls';
import CircleControls from './CircleControls';
import ScrollingControls from './ScrollingControls';
import PositionPanel from './PositionPanel';
import type { TrackedKey } from '../hooks/useTrackedKeys';
import type { Axis, AxisPosition } from '../hooks/snapmakerSerial';
import type { MovementMode } from '../hooks/useMovementPanel';
import type { CircleOrigin } from '../hooks/circleControl';
import type { DrillingStatus } from '../hooks/drillingControl';

const MODES: { mode: MovementMode; label: string }[] = [
    { mode: 'continuous', label: 'Continuous' },
    { mode: 'discrete', label: 'Discrete' },
    { mode: 'drilling', label: 'Drilling' },
    { mode: 'circle', label: 'Circle' },
    { mode: 'scrolling', label: 'Scroll' },
];

function ModeTabs({
    mode,
    setMode,
}: {
    mode: MovementMode;
    setMode: (mode: MovementMode) => void;
}): ReactNode {
    return (
        <div className="flex gap-1 rounded-full border border-slate-200 bg-slate-100 p-1">
            {MODES.map(({ mode: candidate, label }) => (
                <button
                    key={candidate}
                    type="button"
                    onClick={() => setMode(candidate)}
                    className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                        mode === candidate
                            ? 'bg-white text-slate-700 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                    }`}>
                    {label}
                </button>
            ))}
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
        speed: number;
        setSpeed: (value: number) => void;
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
        origin: CircleOrigin | null;
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
    const showFeedRate = mode === 'continuous' || mode === 'circle';

    return (
        <div className="flex flex-col items-center gap-6 rounded-2xl border border-slate-200 bg-white p-10 shadow-xl">
            <div className="flex w-full items-center justify-between gap-4">
                <ModeTabs mode={mode} setMode={setMode} />
                {showFeedRate && (
                    <FeedRateInput value={feedRate} onChange={setFeedRate} />
                )}
            </div>

            <div className="flex min-h-52 items-center justify-center">
                {mode === 'continuous' && (
                    <div
                        className={`transition-opacity ${ready ? '' : 'pointer-events-none opacity-40'}`}>
                        <WasdArrowGrid pressed={pressed} />
                    </div>
                )}
                {mode === 'discrete' && (
                    <DiscreteJogControls
                        pressed={pressed}
                        ready={ready}
                        distance={discrete.distance}
                        setDistance={discrete.setDistance}
                        speed={discrete.speed}
                        setSpeed={discrete.setSpeed}
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
                {mode === 'circle' && (
                    <CircleControls
                        pressed={pressed}
                        ready={ready}
                        workPosition={workPosition}
                        origin={circle.origin}
                        setOrigin={circle.setOrigin}
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
    );
}
