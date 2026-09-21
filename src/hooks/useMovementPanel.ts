import { useCallback, useState } from 'react';
import {
    useJogControl,
    MAX_FEED_RATE,
    type Axis,
    type Direction,
} from './jogControl';
import { useDiscreteJogControl } from './discreteJogControl';
import { useDrillingControl } from './drillingControl';
import { useCircleControl } from './circleControl';
import { useTrackedKeys, type TrackedKey } from './useTrackedKeys';
import { useSerial } from './useSerial';

export type MovementMode =
    'continuous' | 'discrete' | 'drilling' | 'circle' | 'scrolling';

const DEFAULT_FEED_RATE = 300;
const DEFAULT_DISCRETE_DISTANCE = 1;
const DEFAULT_CIRCLE_ANGLE = 15;
const DEFAULT_MAX_DEPTH = 5;
const DEFAULT_DOWN_SPEED = 100;
const DEFAULT_UP_SPEED = 300;
const DEFAULT_SCROLL_AXIS: Axis = 'X';
const DEFAULT_SCROLL_DISTANCE = 0.1;

const KEY_TO_AXIS: Partial<
    Record<TrackedKey, { axis: Axis; direction: Direction }>
> = {
    KeyD: { axis: 'X', direction: 1 },
    KeyA: { axis: 'X', direction: -1 },
    KeyW: { axis: 'Y', direction: -1 },
    KeyS: { axis: 'Y', direction: 1 },
    ArrowUp: { axis: 'Z', direction: 1 },
    ArrowDown: { axis: 'Z', direction: -1 },
};

export function useMovementPanel() {
    const {
        connected,
        homed,
        workPosition,
        machinePosition,
        setWorkOrigin,
        goToOrigin,
        setSpindleOn,
    } = useSerial();
    const ready = connected && homed;

    const [mode, setModeState] = useState<MovementMode>('continuous');
    const [feedRate, setFeedRate] = useState(DEFAULT_FEED_RATE);
    const [discreteDistance, setDiscreteDistance] = useState(
        DEFAULT_DISCRETE_DISTANCE
    );
    const [circleAngle, setCircleAngle] = useState(DEFAULT_CIRCLE_ANGLE);
    const [maxDepth, setMaxDepth] = useState(DEFAULT_MAX_DEPTH);
    const [downSpeed, setDownSpeed] = useState(DEFAULT_DOWN_SPEED);
    const [upSpeed, setUpSpeed] = useState(DEFAULT_UP_SPEED);
    const [scrollAxis, setScrollAxis] = useState<Axis>(DEFAULT_SCROLL_AXIS);
    const [scrollDistance, setScrollDistance] = useState(
        DEFAULT_SCROLL_DISTANCE
    );

    // continuous jog engine backs both the "continuous" mode and XY/Z
    // repositioning within "circle" mode
    const continuousEnabled =
        ready && (mode === 'continuous' || mode === 'circle');
    const {
        startMove: jogStart,
        stopMove: jogStop,
        cancelAll: jogCancelAll,
    } = useJogControl(feedRate, continuousEnabled);

    const discreteEnabled = ready && mode === 'discrete';
    const { trigger: discreteTrigger, cancel: discreteCancel } =
        useDiscreteJogControl(discreteEnabled, discreteDistance, feedRate);

    const drillingEnabled = ready && mode === 'drilling';
    const {
        start: drillingStart,
        stop: drillingStop,
        cancel: drillingCancel,
        status: drillingStatus,
        descended: drillingDescended,
    } = useDrillingControl(drillingEnabled, maxDepth, downSpeed, upSpeed);

    const circleEnabled = ready && mode === 'circle';
    const { trigger: circleTrigger, cancel: circleCancel } = useCircleControl({
        enabled: circleEnabled,
        feedRate,
        angle: circleAngle,
        workPosition,
    });

    const stopAll = useCallback(() => {
        jogCancelAll();
        discreteCancel();
        drillingCancel();
        circleCancel();
        setSpindleOn(false);
    }, [
        jogCancelAll,
        discreteCancel,
        drillingCancel,
        circleCancel,
        setSpindleOn,
    ]);

    const setMode = useCallback(
        (next: MovementMode) => {
            stopAll();
            setModeState(next);
        },
        [stopAll]
    );

    const onKeyDown = useCallback(
        (code: TrackedKey) => {
            switch (mode) {
                case 'continuous': {
                    const mapping = KEY_TO_AXIS[code];
                    if (mapping) jogStart(mapping.axis, mapping.direction);
                    break;
                }
                case 'discrete': {
                    const mapping = KEY_TO_AXIS[code];
                    if (mapping)
                        discreteTrigger(mapping.axis, mapping.direction);
                    break;
                }
                case 'drilling':
                    if (code === 'ArrowDown') drillingStart();
                    break;
                case 'circle': {
                    const mapping = KEY_TO_AXIS[code];
                    if (mapping) jogStart(mapping.axis, mapping.direction);
                    else if (code === 'KeyQ') circleTrigger('ccw');
                    else if (code === 'KeyE') circleTrigger('cw');
                    break;
                }
                case 'scrolling':
                    break;
            }
        },
        [mode, jogStart, discreteTrigger, drillingStart, circleTrigger]
    );

    const onKeyUp = useCallback(
        (code: TrackedKey) => {
            switch (mode) {
                case 'continuous': {
                    const mapping = KEY_TO_AXIS[code];
                    if (mapping) jogStop(mapping.axis, mapping.direction);
                    break;
                }
                case 'drilling':
                    if (code === 'ArrowDown') drillingStop();
                    break;
                case 'circle': {
                    const mapping = KEY_TO_AXIS[code];
                    if (mapping) jogStop(mapping.axis, mapping.direction);
                    break;
                }
                case 'discrete':
                case 'scrolling':
                    break;
            }
        },
        [mode, jogStop, drillingStop]
    );

    const pressed = useTrackedKeys(ready, onKeyDown, onKeyUp, stopAll);

    const goToOriginAtFeedRate = useCallback(
        () => goToOrigin(MAX_FEED_RATE),
        [goToOrigin]
    );

    const setCircleOrigin = useCallback(
        () => setWorkOrigin(['X', 'Y']),
        [setWorkOrigin]
    );

    return {
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
        goToOrigin: goToOriginAtFeedRate,
        discrete: {
            distance: discreteDistance,
            setDistance: setDiscreteDistance,
            speed: feedRate,
            setSpeed: setFeedRate,
        },
        drilling: {
            maxDepth,
            setMaxDepth,
            downSpeed,
            setDownSpeed,
            upSpeed,
            setUpSpeed,
            status: drillingStatus,
            descended: drillingDescended,
        },
        circle: {
            setOrigin: setCircleOrigin,
            angle: circleAngle,
            setAngle: setCircleAngle,
        },
        scrolling: {
            axis: scrollAxis,
            setAxis: setScrollAxis,
            distance: scrollDistance,
            setDistance: setScrollDistance,
        },
    };
}
