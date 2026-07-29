# Rive object (experimental)

This extension adds a `Rive` object to GDevelop, able to display and play
back [Rive](https://rive.app) animations (`.riv` files) exported from the
Rive editor.

## Architecture

Unlike a "store" extension (events only, no new object type/rendering), this
is a source extension: it declares a genuine new object type with its own
runtime and rendering code, the same way `Spine`, `BBText` or `3D/Model3D`
do. This is required because Rive needs to rasterize vector content every
frame - something that cannot be expressed with events/behaviors alone.

At runtime (`riveruntimeobject-pixi-renderer.ts`), the object:

1. Uses Rive's "advanced" (low-level) WASM API instead of letting Rive attach
   itself to a DOM `<canvas>`. This gives full control over the render loop.
2. Draws into an off-screen `<canvas>` (never inserted into the page).
3. Uses that canvas as the source of a `PIXI.Texture`, applied to a
   `PIXI.Sprite` added to the object's layer.

This makes the Rive animation behave like a normal GDevelop object: it
respects layers, Z order, the camera, opacity and effects - contrary to a
`<canvas>` overlaid on top of the game (simpler, but always staying on top
of everything, which rules it out for an actual game object).

The canvas2d renderer is used (not WebGL): sharing a WebGL context with Pixi
is fragile, while uploading a canvas2d source as a texture is simple and
robust.

## Files

- `JsExtension.js` - editor-side declaration: object properties (`.riv`
  file, artboard, state machine, fit/alignment), actions, conditions and
  expressions.
- `riveruntimeobject.ts` / `riveruntimeobject-pixi-renderer.ts` - the game
  runtime described above.
- `managers/rive-manager.ts` - loads the Rive WASM runtime exactly once and
  caches parsed `.riv` files (so several objects referencing the same
  resource share the same in-memory Rive `File`).
- `rive_advanced_single.js` - vendored Rive "advanced" WASM runtime (see
  below).
- `rive_advanced.d.ts` - hand-written TypeScript declarations for the subset
  of the runtime API used by this extension.

## Vendored WASM runtime

`rive_advanced_single.js` is vendored from the npm package
[`@rive-app/canvas-advanced-single`](https://www.npmjs.com/package/@rive-app/canvas-advanced-single)
(version 2.39.1), published by Rive from
https://github.com/rive-app/rive-wasm. It is MIT licensed, same as
GDevelop, so redistributing it here is not an issue.

The "single" in the package name means the WASM binary is embedded as a
base64 string directly inside the JS file - there is therefore no
`locateFile`/CDN fetch to configure, and no separate `.wasm` file to ship:
everything is bundled with the rest of the GDJS runtime and works fully
offline (important for games exported to desktop/mobile or played without a
network connection).

The only change made to the vendored file is replacing its trailing
`export default Rive;` (ES module syntax) with a small CommonJS/global
export, so it can be loaded as a classic script by the game runtime.

## What is implemented

- Play/Pause the state machine, with `IsPlaying`/`IsPaused` conditions.
- Read/write State Machine inputs: booleans, numbers, and triggers.
- React to Rive Events reported by the state machine (`HasReportedEvent`
  condition), checked once per frame (via `reportedEventCount()`/
  `reportedEventAt()`).
- Change the value of Rive text runs at runtime.
- Forward pointer down/move/up events to the state machine, after
  converting scene (world) coordinates into object-local, then
  artboard-space coordinates (this is required: since the Rive canvas is
  never attached to the DOM, Rive's own native pointer listeners never
  fire).

## Known limitations

- **No animated preview in the scene editor.** The IDE does not currently
  load the Rive WASM runtime, so `RenderedRiveInstance` (in `JsExtension.js`)
  only shows a placeholder/icon sized to the object, not the actual
  animation. A full preview would require loading the same "advanced" Rive
  runtime inside the scene editor - left as a follow-up.
- **Rotation is not accounted for in pointer coordinate conversion.** The
  scene-to-object conversion assumes an axis-aligned object; callers needing
  precise hit-testing on a rotated Rive object should un-rotate the
  coordinates themselves before calling the pointer actions.
- **Performance.** Rive's canvas2d renderer rasterizes vector content on the
  CPU, plus a GPU texture upload per instance and per frame. This is fine
  for a handful of animated instances (characters, animated UI); it is not
  meant for dozens of simultaneously animated instances. Consider capping
  the frame rate of very large scenes, or pausing off-screen instances,
  if this becomes a bottleneck.
