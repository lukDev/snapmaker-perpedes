# Snapmaker Per Pedes

Manual control application for Snapmaker machines.

> "per pedes" = "on foot"

## How to use

1. Spin up the server.
2. Connect your computer to your Snapmaker machine via USB.
3. In the UI, click "Connect" and choose the USB port that is connected to the Snapmaker.
4. Click "Home" (skips actual homing if that has already happened).
5. Enjoy your manual control :)

### Nudge Keys

Independent of the selected mode, the keys 1-8 (digit row or numpad) always nudge the machine by a fixed increment:

| Key | Movement | Key | Movement |
| --- | -------- | --- | -------- |
| 1   | X+ 0.1mm | 2   | X- 0.1mm |
| 3   | Y+ 0.1mm | 4   | Y- 0.1mm |
| 5   | Z+ 0.1mm | 6   | Z- 0.1mm |
| 7   | B+ 0.2°  | 8   | B- 0.2°  |

Each keystroke (including auto-repeat while holding a key) queues one increment.
Intended for use with a CNC jog wheel / macro pad that emits these keys.

### Modes

#### Continuous

By holding the button(s) shown in the UI, the machine will move in the specified directions at the set speed.

#### Discrete

Set the speed and distance in the UI.
By pressing a button, the machine will move the set distance at the set speed in the corresponding direction.

#### Circle

Like discrete mode, but circular.
After setting the angle and speed and pressing CCW or CW, the machine will move along an arc around the work origin (in X and Y).
The current radius (calculated based on the work origin and current position) is shown in the UI.

#### Drilling

Allows for drill-press-like behaviour.
After setting the max depth and up and down speeds, pressing Z- moves the toolhead down and releasing it automatically moves it back up.

#### G-Code

Enter G-Code manually (one or more lines) and send it with the button or Cmd/Ctrl+Enter.
Everything sent during the current session is listed on the left along with its state (new / in execution / executed / failed).
Clicking a previous entry copies its code back into the editor.

### Disclaimer

This code has been tested on a Snapmaker 2.0 A350T.
It should also work on other 2.0 machines and the Artisan, but this has never been verified.

In general:

> Use at your own risk!

## Technical Details

### Stack

- React with TypeScript
- built with Vite
- Tailwind for CSS

### Development

Dev Server:

```shell
npm run dev
```

Formatting:

```shell
npx prettier . --write
```

Build:

```shell
npm run build
```
