namespace gdjs {
  const logger = new gdjs.Logger('Rive Object');

  const fitByName: { [key: string]: keyof typeof RiveNS.Fit } = {
    fill: 'fill',
    contain: 'contain',
    cover: 'cover',
    'fit-width': 'fitWidth',
    'fit-height': 'fitHeight',
    none: 'none',
    'scale-down': 'scaleDown',
  };

  const alignmentGetterByName: {
    [key: string]: keyof RiveNS.AlignmentFactory;
  } = {
    'top-left': 'topLeft',
    'top-center': 'topCenter',
    'top-right': 'topRight',
    'center-left': 'centerLeft',
    center: 'center',
    'center-right': 'centerRight',
    'bottom-left': 'bottomLeft',
    'bottom-center': 'bottomCenter',
    'bottom-right': 'bottomRight',
  };

  /**
   * The renderer for the RiveRuntimeObject, in charge of driving the Rive
   * "advanced" (low-level) API render loop and exposing the result as a
   * PIXI.Sprite so that the animation behaves as a normal game object:
   * respecting layers, Z order, camera, opacity and effects (contrary to a
   * `<canvas>` overlaid on top of the game, which would always stay above
   * everything).
   *
   * The technique is:
   * 1. Create an off-screen `<canvas>` (never inserted in the DOM).
   * 2. Ask Rive to create a (canvas2d) renderer drawing into it.
   * 3. Every frame, advance the Rive State Machine/artboard and redraw into
   *    the off-screen canvas.
   * 4. Use this canvas as the source of a PIXI.Texture (`PIXI.Texture.from`),
   *    applied to a PIXI.Sprite added to the object layer - and call
   *    `texture.update()` after each draw so Pixi re-uploads the canvas
   *    content to the GPU.
   *
   * (Rive's WebGL renderer is deliberately not used here: sharing a WebGL
   * context with Pixi is fragile, while a canvas2d texture upload is simple
   * and robust.)
   *
   * @category Renderers > Rive
   */
  export class RiveRuntimeObjectPixiRenderer {
    private _object: gdjs.RiveRuntimeObject;
    private _instanceContainer: gdjs.RuntimeInstanceContainer;

    private _offscreenCanvas: HTMLCanvasElement;
    private _pixiObject: PIXI.Sprite;

    private _riveCanvas: RiveNS.RiveCanvas | null = null;
    private _riveRenderer: RiveNS.Renderer | null = null;
    private _artboard: RiveNS.Artboard | null = null;
    private _stateMachine: RiveNS.StateMachineInstance | null = null;
    private _booleanInputs = new Map<string, RiveNS.SMIInput>();
    private _numberInputs = new Map<string, RiveNS.SMIInput>();
    private _triggerInputs = new Map<string, RiveNS.SMIInput>();

    private _isLoading = false;
    private _isReady = false;
    private _isPaused = false;

    constructor(
      runtimeObject: gdjs.RiveRuntimeObject,
      instanceContainer: gdjs.RuntimeInstanceContainer
    ) {
      this._object = runtimeObject;
      this._instanceContainer = instanceContainer;

      this._offscreenCanvas = document.createElement('canvas');
      this._offscreenCanvas.width = Math.max(1, Math.floor(runtimeObject.getWidth()));
      this._offscreenCanvas.height = Math.max(1, Math.floor(runtimeObject.getHeight()));

      this._pixiObject = new PIXI.Sprite(
        PIXI.Texture.from(this._offscreenCanvas)
      );
      this._pixiObject.anchor.x = 0.5;
      this._pixiObject.anchor.y = 0.5;

      instanceContainer
        .getLayer('')
        .getRenderer()
        .addRendererObject(this._pixiObject, runtimeObject.getZOrder());

      this.updatePosition();
      this.updateAngle();
      this.updateOpacity();

      this._loadRive();
    }

    private async _loadRive(): Promise<void> {
      if (this._isLoading || this._isReady) return;
      this._isLoading = true;

      const game = this._instanceContainer.getGame();
      const riveManager = game.getRiveManager && game.getRiveManager();
      if (!riveManager) {
        logger.error('The Rive extension runtime could not be found.');
        return;
      }

      try {
        const [riveCanvas, file] = await Promise.all([
          riveManager.getRiveCanvas(),
          riveManager.getOrLoadRiveFile(this._object.riveResourceName),
        ]);
        if (!file) return;

        this._riveCanvas = riveCanvas;
        this._riveRenderer = riveCanvas.makeRenderer(this._offscreenCanvas);

        this._artboard = this._object.artboardName
          ? file.artboardByName(this._object.artboardName)
          : file.defaultArtboard();
        if (!this._artboard) {
          logger.error(
            `Artboard "${this._object.artboardName}" not found in the Rive file.`
          );
          return;
        }

        if (this._object.stateMachineName) {
          const stateMachine = this._artboard.stateMachineByName(
            this._object.stateMachineName
          );
          if (stateMachine) {
            this._stateMachine = new riveCanvas.StateMachineInstance(
              stateMachine,
              this._artboard
            );
          }
        } else if (this._artboard.stateMachineCount() > 0) {
          this._stateMachine = new riveCanvas.StateMachineInstance(
            this._artboard.stateMachineByIndex(0),
            this._artboard
          );
        }

        if (this._stateMachine) {
          for (let i = 0; i < this._stateMachine.inputCount(); i++) {
            const input = this._stateMachine.input(i);
            if (input.type === riveCanvas.SMIInput.bool) {
              this._booleanInputs.set(input.name, input);
            } else if (input.type === riveCanvas.SMIInput.number) {
              this._numberInputs.set(input.name, input);
            } else if (input.type === riveCanvas.SMIInput.trigger) {
              this._triggerInputs.set(input.name, input);
            }
          }
        }

        this._isReady = true;
        // Draw a first frame immediately, so the object is not blank while
        // waiting for the next `update()` call.
        this._draw();
      } catch (error) {
        logger.error(
          `Error while loading Rive object (resource: "${this._object.riveResourceName}"): ${error}`
        );
      } finally {
        this._isLoading = false;
      }
    }

    private _draw(): void {
      if (!this._riveCanvas || !this._riveRenderer || !this._artboard) return;

      const renderer = this._riveRenderer;
      const frame: RiveNS.AABB = {
        minX: 0,
        minY: 0,
        maxX: this._offscreenCanvas.width,
        maxY: this._offscreenCanvas.height,
      };

      renderer.clear();
      renderer.save();
      renderer.align(
        this._riveCanvas.Fit[fitByName[this._object.fit] || 'contain'],
        this._riveCanvas.Alignment[
          alignmentGetterByName[this._object.alignment] || 'center'
        ],
        frame,
        this._artboard.bounds
      );
      this._artboard.draw(renderer);
      renderer.restore();
      renderer.flush();

      // Re-upload the offscreen canvas content to the GPU as a texture.
      this._pixiObject.texture.update();
    }

    updateAnimation(timeDelta: float): void {
      if (!this._isReady || this._isPaused || !this._artboard) return;

      if (this._stateMachine) {
        this._stateMachine.advance(timeDelta);
        this._artboard.advance(timeDelta);
        this._stateMachine.advanceAndApply(0);
      } else {
        this._artboard.advance(timeDelta);
      }

      this._draw();
    }

    getRendererObject(): PIXI.Sprite {
      return this._pixiObject;
    }

    onDestroy(): void {
      if (this._stateMachine) this._stateMachine.delete();
      if (this._artboard) this._artboard.delete();
      if (this._riveRenderer) this._riveRenderer.delete();
      this._pixiObject.destroy();
    }

    updatePosition(): void {
      this._pixiObject.position.x = this._object.getX() + this._object.getWidth() / 2;
      this._pixiObject.position.y = this._object.getY() + this._object.getHeight() / 2;
    }

    updateAngle(): void {
      this._pixiObject.rotation = gdjs.toRad(this._object.getAngle());
    }

    updateOpacity(): void {
      this._pixiObject.alpha = this._object.getOpacity() / 255;
    }

    updateSize(): void {
      this._offscreenCanvas.width = Math.max(1, Math.floor(this._object.getWidth()));
      this._offscreenCanvas.height = Math.max(1, Math.floor(this._object.getHeight()));
      this._pixiObject.texture.update();
      this.updatePosition();
      // Redraw immediately with the new canvas size, if ready.
      if (this._isReady) this._draw();
    }

    setPaused(paused: boolean): void {
      this._isPaused = paused;
    }

    isPaused(): boolean {
      return this._isPaused;
    }

    setBooleanInput(inputName: string, value: boolean): void {
      const input = this._booleanInputs.get(inputName);
      if (input) input.value = value;
    }

    getBooleanInput(inputName: string): boolean {
      const input = this._booleanInputs.get(inputName);
      return !!input && !!input.value;
    }

    setNumberInput(inputName: string, value: float): void {
      const input = this._numberInputs.get(inputName);
      if (input) input.value = value;
    }

    getNumberInput(inputName: string): float {
      const input = this._numberInputs.get(inputName);
      return input && typeof input.value === 'number' ? input.value : 0;
    }

    fireTriggerInput(inputName: string): void {
      const input = this._triggerInputs.get(inputName);
      if (input) input.fire();
    }

    setTextRunValue(textRunName: string, text: string): void {
      if (!this._artboard) return;
      const textRun = this._artboard.textRun(textRunName);
      if (textRun) textRun.text = text;
    }

    /**
     * Reproduce (in plain JS) how Rive's `Fit`/`Alignment` map the artboard
     * bounds onto the frame (canvas) bounds, so that pointer coordinates can
     * be converted from canvas space to artboard space without relying on
     * Rive's opaque `Mat2D` (the advanced API does not expose an `invert()`,
     * nor public accessors on the matrix).
     */
    private _computeArtboardToFrameTransform(): {
      scaleX: float;
      scaleY: float;
      offsetX: float;
      offsetY: float;
    } {
      const frameWidth = this._object.getWidth();
      const frameHeight = this._object.getHeight();
      const content = this._artboard!.bounds;
      const contentWidth = content.maxX - content.minX;
      const contentHeight = content.maxY - content.minY;

      let scaleX = contentWidth === 0 ? 1 : frameWidth / contentWidth;
      let scaleY = contentHeight === 0 ? 1 : frameHeight / contentHeight;

      switch (this._object.fit) {
        case 'fill':
          break;
        case 'cover':
          scaleX = scaleY = Math.max(scaleX, scaleY);
          break;
        case 'none':
          scaleX = scaleY = 1;
          break;
        case 'fit-width':
          scaleY = scaleX;
          break;
        case 'fit-height':
          scaleX = scaleY;
          break;
        case 'scale-down':
          scaleX = scaleY = Math.min(1, Math.min(scaleX, scaleY));
          break;
        case 'contain':
        default:
          scaleX = scaleY = Math.min(scaleX, scaleY);
          break;
      }

      const scaledWidth = contentWidth * scaleX;
      const scaledHeight = contentHeight * scaleY;
      const extraX = frameWidth - scaledWidth;
      const extraY = frameHeight - scaledHeight;

      const alignment = this._object.alignment;
      const alignFactorX = alignment.indexOf('left') !== -1
        ? 0
        : alignment.indexOf('right') !== -1
        ? 1
        : 0.5;
      const alignFactorY = alignment.indexOf('top') !== -1
        ? 0
        : alignment.indexOf('bottom') !== -1
        ? 1
        : 0.5;

      return {
        scaleX,
        scaleY,
        offsetX: extraX * alignFactorX - content.minX * scaleX,
        offsetY: extraY * alignFactorY - content.minY * scaleY,
      };
    }

    /**
     * Convert a position in scene ("world") coordinates into artboard-space
     * coordinates, taking into account the object position/size and how the
     * artboard is fitted/aligned inside it, then forward it to the State
     * Machine (as Rive's own DOM-based pointer listeners never fire since we
     * never attach the canvas to the page).
     */
    private _forwardPointerEvent(
      method: 'pointerDown' | 'pointerMove' | 'pointerUp',
      sceneX: float,
      sceneY: float,
      pointerId: integer
    ): void {
      if (!this._isReady || !this._stateMachine || !this._artboard) return;

      // World -> object (canvas) local coordinates.
      // Note: this does not account for the object's rotation - callers
      // should un-rotate the coordinates beforehand if the object can be
      // rotated and precise hit-testing on rotated Rive objects is needed.
      const localX = sceneX - this._object.getX();
      const localY = sceneY - this._object.getY();

      const { scaleX, scaleY, offsetX, offsetY } =
        this._computeArtboardToFrameTransform();
      const artboardX = scaleX === 0 ? 0 : (localX - offsetX) / scaleX;
      const artboardY = scaleY === 0 ? 0 : (localY - offsetY) / scaleY;

      this._stateMachine[method](artboardX, artboardY, pointerId);
    }

    pointerDown(sceneX: float, sceneY: float, pointerId: integer): void {
      this._forwardPointerEvent('pointerDown', sceneX, sceneY, pointerId);
    }

    pointerMove(sceneX: float, sceneY: float, pointerId: integer): void {
      this._forwardPointerEvent('pointerMove', sceneX, sceneY, pointerId);
    }

    pointerUp(sceneX: float, sceneY: float, pointerId: integer): void {
      this._forwardPointerEvent('pointerUp', sceneX, sceneY, pointerId);
    }
  }

  gdjs.RiveRuntimeObjectRenderer = gdjs.RiveRuntimeObjectPixiRenderer;
}
