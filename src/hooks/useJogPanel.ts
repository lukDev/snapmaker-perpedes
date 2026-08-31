import { useState } from 'react';
import { useJogControl } from './jogControl';
import { useTrackedKeys } from './useTrackedKeys';
import { useSerial } from './useSerial';

const DEFAULT_FEED_RATE = 300;

export function useJogPanel() {
    const { connected } = useSerial();
    const [feedRate, setFeedRate] = useState(DEFAULT_FEED_RATE);
    const { keyDown, keyUp } = useJogControl(feedRate);
    const pressed = useTrackedKeys(connected, keyDown, keyUp);

    return { connected, feedRate, setFeedRate, pressed };
}
