/**
 * Minimal type declarations for the vendored Rive "advanced" runtime
 * (`rive_advanced_single.js`, from `@rive-app/canvas-advanced-single`).
 *
 * Only the subset of the API actually used by the Rive extension is
 * declared here. See the full (generated) declarations shipped by the npm
 * package for the complete API surface:
 * https://www.npmjs.com/package/@rive-app/canvas-advanced-single
 */
declare namespace RiveNS {
  interface AABB {
    minX: float;
    minY: float;
    maxX: float;
    maxY: float;
  }

  class Mat2D {}

  enum Fit {
    fill,
    contain,
    cover,
    fitWidth,
    fitHeight,
    none,
    scaleDown,
    layout,
  }

  class Alignment {}
  class AlignmentFactory {
    get topLeft(): Alignment;
    get topCenter(): Alignment;
    get topRight(): Alignment;
    get centerLeft(): Alignment;
    get center(): Alignment;
    get centerRight(): Alignment;
    get bottomLeft(): Alignment;
    get bottomCenter(): Alignment;
    get bottomRight(): Alignment;
  }

  class SMIInput {
    static bool: number;
    static number: number;
    static trigger: number;
    get name(): string;
    get type(): number;
    get value(): boolean | number | undefined;
    set value(val: boolean | number | undefined);
    fire(): void;
  }

  class RiveEvent {
    name(): string;
    type(): number;
  }

  class StateMachineInstance {
    constructor(stateMachine: any, artboard: Artboard);
    get name(): string;
    inputCount(): number;
    input(i: number): SMIInput;
    inputByPath(name: string, path: string): SMIInput;
    advance(sec: number): boolean;
    advanceAndApply(sec: number): boolean;
    stateChangedCount(): number;
    stateChangedNameByIndex(i: number): string;
    reportedEventCount(): number;
    reportedEventAt(i: number): RiveEvent | undefined;
    pointerDown(x: number, y: number, id: number): void;
    pointerMove(x: number, y: number, id: number): void;
    pointerUp(x: number, y: number, id: number): void;
    pointerExit(x: number, y: number, id: number): void;
    delete(): void;
  }

  class TextValueRun {
    get text(): string;
    set text(value: string);
  }

  class Artboard {
    get name(): string;
    get bounds(): AABB;
    get width(): number;
    get height(): number;
    set width(value: number);
    set height(value: number);
    animationCount(): number;
    animationByIndex(index: number): any;
    animationByName(name: string): any;
    stateMachineCount(): number;
    stateMachineByIndex(index: number): any;
    stateMachineByName(name: string): any;
    textRun(name: string): TextValueRun;
    textByPath(name: string, path: string): TextValueRun;
    advance(sec: number): boolean;
    draw(renderer: Renderer): void;
    delete(): void;
  }

  class File {
    defaultArtboard(): Artboard;
    artboardByName(name: string): Artboard;
    artboardByIndex(index: number): Artboard;
    artboardCount(): number;
    unref(): void;
  }

  class Renderer {
    save(): void;
    restore(): void;
    align(
      fit: Fit,
      alignment: Alignment,
      frame: AABB,
      content: AABB,
      scaleFactor?: number
    ): void;
    clear(): void;
    delete(): void;
    flush(): void;
    transform(matrix: Mat2D): void;
    translate(x: number, y: number): void;
  }

  interface RiveCanvas {
    Alignment: AlignmentFactory;
    StateMachineInstance: typeof StateMachineInstance;
    SMIInput: typeof SMIInput;
    Fit: typeof Fit;
    load(
      buffer: Uint8Array,
      assetLoader?: any,
      enableRiveAssetCDN?: boolean
    ): Promise<File>;
    makeRenderer(
      canvas: HTMLCanvasElement | OffscreenCanvas,
      useOffscreenRenderer?: boolean
    ): Renderer;
    computeAlignment(
      fit: Fit,
      alignment: Alignment,
      frame: AABB,
      content: AABB,
      scaleFactor?: number
    ): Mat2D;
    requestAnimationFrame(cb: (timestamp: number) => void): number;
    cancelAnimationFrame(requestID: number): void;
    resolveAnimationFrame(): void;
    cleanup(): void;
  }
}

/**
 * Factory function exposed by the vendored `rive_advanced_single.js` file,
 * either as a CommonJS export (Node.js/webpack) or as `window.RiveCanvasFactory`
 * (classic script, used by the GDJS game runtime).
 *
 * The WASM binary is embedded as a base64 string directly inside this file
 * (this is what the "single" in `@rive-app/canvas-advanced-single` refers
 * to), so no `locateFile`/network fetch is required: the game works
 * completely offline and the WASM is bundled with the rest of the game.
 */
declare function RiveCanvasFactory(options?: {}): Promise<RiveNS.RiveCanvas>;
