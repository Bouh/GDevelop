/*
 * GDevelop JS Platform
 * Copyright 2013-present Florian Rival (Florian.Rival@gmail.com). All rights reserved.
 * This project is released under the MIT License.
 */
namespace gdjs {
  const logger = new gdjs.Logger('Rive Manager');

  const resourceKinds: Array<ResourceKind> = ['rive'];

  /**
   * RiveManager loads Rive (`.riv`) files, using the "rive" resources
   * registered in the game resources.
   *
   * It is responsible for:
   * - loading the Rive WASM runtime (`rive_advanced_single.js`) exactly once,
   *   whichever the number of Rive objects/resources in the game (the WASM
   *   binary is embedded as base64 directly inside that file, so this does
   *   not require any network/CDN access),
   * - downloading and parsing `.riv` files into `RiveNS.File` instances during
   *   the loading screen (`loadResource`/`processResource`), and caching them
   *   so that the same file is only downloaded/parsed once: the same
   *   underlying `File` is shared by every `RiveRuntimeObject` using it (this
   *   mirrors how `gdjs.Model3DManager`/`gdjs.SpineManager` cache their
   *   parsed assets).
   *
   * @category Resources > Rive
   */
  export class RiveManager implements gdjs.ResourceManager {
    private _resourceLoader: gdjs.ResourceLoader;

    /** The Rive WASM runtime instance. Loaded lazily, only once. */
    private _riveCanvas: RiveNS.RiveCanvas | null = null;
    private _riveCanvasLoadingPromise: Promise<RiveNS.RiveCanvas> | null = null;

    /** Downloaded `.riv` bytes, cached by resource. */
    private _downloadedArrayBuffers = new gdjs.ResourceCache<ArrayBuffer>();
    /** Parsed Rive files, cached by resource. */
    private _loadedRiveFiles = new gdjs.ResourceCache<RiveNS.File>();

    constructor(resourceLoader: gdjs.ResourceLoader) {
      this._resourceLoader = resourceLoader;
    }

    getResourceKinds(): Array<ResourceKind> {
      return resourceKinds;
    }

    /**
     * Load (once) and return the Rive WASM runtime ("advanced"/low-level
     * canvas2d API). This lets the caller fully control the render loop
     * (drawing to an offscreen canvas that is then used as a Pixi texture)
     * instead of Rive attaching itself to a DOM canvas - which is required
     * to have the Rive animation behave as a normal game object (respecting
     * layers, Z order, camera, opacity and effects).
     */
    getRiveCanvas(): Promise<RiveNS.RiveCanvas> {
      if (this._riveCanvas) return Promise.resolve(this._riveCanvas);
      if (this._riveCanvasLoadingPromise) return this._riveCanvasLoadingPromise;

      if (typeof RiveCanvasFactory === 'undefined') {
        return Promise.reject(
          new Error(
            'The Rive WASM runtime (rive_advanced_single.js) could not be found.'
          )
        );
      }

      // No `locateFile` option is needed: the WASM binary is embedded as
      // base64 directly inside rive_advanced_single.js, so everything is
      // bundled with the game and works fully offline.
      this._riveCanvasLoadingPromise = RiveCanvasFactory().then(
        (riveCanvas) => {
          this._riveCanvas = riveCanvas;
          return riveCanvas;
        }
      );
      return this._riveCanvasLoadingPromise;
    }

    /**
     * Download the raw bytes of the `.riv` file for the given resource.
     * Called during the loading screen, before `processResource`.
     */
    async loadResource(resourceName: string): Promise<void> {
      const resource = this._getRiveResource(resourceName);
      if (!resource) {
        logger.error(`Unable to find rive resource "${resourceName}".`);
        return;
      }
      if (this._downloadedArrayBuffers.get(resource)) return;

      try {
        const url = this._resourceLoader.getFullUrl(resource.file);
        const response = await fetch(url, {
          credentials: this._resourceLoader.checkIfCredentialsRequired(url)
            ? 'include'
            : 'omit',
        });
        if (!response.ok) {
          throw new Error(
            `HTTP error ${response.status} (${response.statusText})`
          );
        }
        this._downloadedArrayBuffers.set(resource, await response.arrayBuffer());
      } catch (error) {
        logger.error(
          `Unable to download rive file for resource "${resourceName}": ${error}`
        );
      }
    }

    /**
     * Parse the downloaded `.riv` bytes into a Rive `File` (this also ensures
     * the WASM runtime is loaded). Called during the loading screen, after
     * `loadResource`. This is the heavy part (native/WASM memory allocation
     * and parsing), so doing it upfront avoids a stall the first time a Rive
     * object appears in a scene.
     */
    async processResource(resourceName: string): Promise<void> {
      const resource = this._getRiveResource(resourceName);
      if (!resource) return;
      if (this._loadedRiveFiles.get(resource)) return;

      const arrayBuffer = this._downloadedArrayBuffers.get(resource);
      if (!arrayBuffer) return;

      try {
        const riveCanvas = await this.getRiveCanvas();
        const file = await riveCanvas.load(new Uint8Array(arrayBuffer));
        this._loadedRiveFiles.set(resource, file);
      } catch (error) {
        logger.error(
          `Unable to parse rive file for resource "${resourceName}": ${error}`
        );
      }
    }

    /**
     * Check if the given rive resource is fully loaded (downloaded and
     * parsed) and ready to be used to create artboards/state machines.
     */
    isRiveFileLoaded(resourceName: string): boolean {
      const resource = this._getRiveResource(resourceName);
      return !!(resource && this._loadedRiveFiles.get(resource));
    }

    /**
     * Get the parsed Rive `File` for the given resource name, loading it (and
     * the WASM runtime) on the fly if it was not preloaded already. The same
     * `File` instance is shared by all the objects using this resource.
     */
    async getOrLoadRiveFile(resourceName: string): Promise<RiveNS.File | null> {
      const resource = this._getRiveResource(resourceName);
      if (!resource) {
        logger.error(`Unable to find rive resource "${resourceName}".`);
        return null;
      }

      const existingFile = this._loadedRiveFiles.get(resource);
      if (existingFile) return existingFile;

      await this.loadResource(resourceName);
      await this.processResource(resourceName);
      return this._loadedRiveFiles.get(resource);
    }

    private _getRiveResource(resourceName: string): ResourceData | null {
      const resource = this._resourceLoader.getResource(resourceName);
      return resource && this.getResourceKinds().includes(resource.kind)
        ? resource
        : null;
    }

    dispose(): void {
      // Note: the parsed `RiveNS.File` instances are not explicitly `unref`-ed
      // here (ResourceCache does not expose enumeration of its values), but
      // this is only called when the whole game/runtime is disposed, so the
      // WASM module memory is reclaimed anyway.
      this._loadedRiveFiles.clear();
      this._downloadedArrayBuffers.clear();
    }

    unloadResource(resourceData: ResourceData): void {
      const file = this._loadedRiveFiles.get(resourceData);
      if (file) {
        file.unref();
        this._loadedRiveFiles.delete(resourceData);
      }
      this._downloadedArrayBuffers.delete(resourceData);
    }
  }
}
