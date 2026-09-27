# Snapmaker Per Pedes

Manual control application for Snapmaker machines.

> "per pedes" = "on foot"

## How to use

1. Spin up the server.
2. Connect your computer to your Snapmaker machine via USB.
3. In the UI, click "Connect" and choose the USB port that is connected to the Snapmaker.
4. Click "Home" (skips actual homing if that has already happened).
5. Enjoy your manual control :)

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

#### Scroll

Scrolling moves the machine by the configured increment along the selected axis.
Can be used with a regular mouse wheel, but is actually intended to be used with a CNC jog wheel.

#### Drilling

Allows for drill-press-like behaviour.
After setting the max depth and up and down speeds, pressing Z- moves the toolhead down and releasing it automatically moves it back up.

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
