# Gesturoids

A camera-controlled Asteroids-style game built for GitHub Pages with MediaPipe hand gesture recognition.

## Controls

| Hand | Gesture | Action |
| --- | --- | --- |
| Pilot (left side) | Open palm | Thrust |
| Pilot (left side) | Closed fist | Brake |
| Pilot (left side) | Thumb up | Turn right |
| Pilot (left side) | Thumb down | Turn left |
| Gunner (right side) | Open palm | Fire laser |
| Gunner (right side) | Victory sign | Launch missile |

## Structure

- `js/config.js` — tuning values and landmark connections
- `js/state.js` — the single runtime state store
- `js/hand-input.js` — pure MediaPipe-result mapping and palm detection
- `js/controls.js` — model and webcam lifecycle
- `js/entities.js` — player, asteroid, projectile, and particle models
- `js/game.js` — gameplay updates, spawning, scoring, and collisions
- `js/render.js` — canvas and camera-preview drawing
- `js/ui.js` — DOM collection and UI state updates
- `js/main.js` — application lifecycle and orchestration

## Tests

With Node.js installed:

```sh
npm test
```

The site itself has no build step or runtime package dependencies and can be served directly as a static GitHub Pages site.
