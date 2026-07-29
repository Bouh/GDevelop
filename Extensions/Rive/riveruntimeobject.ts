namespace gdjs {
  /** @category Objects > Rive */
  export type RiveObjectDataType = {
    content: {
      opacity: float;
      width: float;
      height: float;
      riveResourceName: string;
      artboardName: string;
      stateMachineName: string;
      fit: string;
      alignment: string;
    };
  };
  /** @category Objects > Rive */
  export type RiveObjectData = ObjectData & RiveObjectDataType;

  /** @category Objects > Rive */
  export type RiveNetworkSyncDataType = {
    op: float;
    w: float;
    h: float;
  };

  /** @category Objects > Rive */
  export type RiveNetworkSyncData = ObjectNetworkSyncData &
    RiveNetworkSyncDataType;

  /**
   * An object displaying and playing back a Rive (https://rive.app) animation.
   *
   * The animation is a State Machine (the same concept Rive uses in its
   * editor): actions/conditions of this object let events change the value of
   * the State Machine inputs (booleans, numbers, triggers), and read back the
   * Rive Events reported by the animation. This is the same architecture as
   * the official Rive runtimes (web, Unity, Flutter...): the game code does
   * not know about the internal states of the animation, it only exchanges
   * data with the State Machine through its inputs/outputs.
   *
   * @category Objects > Rive
   */
  export class RiveRuntimeObject
    extends gdjs.RuntimeObject
    implements gdjs.Resizable, gdjs.OpacityHandler
  {
    private _opacity: float = 255;
    private _width: float;
    private _height: float;
    private _renderer: gdjs.RiveRuntimeObjectPixiRenderer;

    readonly riveResourceName: string;
    readonly artboardName: string;
    readonly stateMachineName: string;
    readonly fit: string;
    readonly alignment: string;

    /**
     * Names of the Rive Events reported during the last `update`. Cleared and
     * refilled every frame.
     */
    _lastReportedEventNames: string[] = [];

    /**
     * @param instanceContainer The container the object belongs to.
     * @param objectData The object data used to initialize the object
     */
    constructor(
      instanceContainer: gdjs.RuntimeInstanceContainer,
      objectData: RiveObjectData,
      instanceData?: InstanceData
    ) {
      super(instanceContainer, objectData, instanceData);

      this._opacity = objectData.content.opacity;
      this._width = objectData.content.width || 100;
      this._height = objectData.content.height || 100;
      this.riveResourceName = objectData.content.riveResourceName;
      this.artboardName = objectData.content.artboardName || '';
      this.stateMachineName = objectData.content.stateMachineName || '';
      this.fit = objectData.content.fit || 'contain';
      this.alignment = objectData.content.alignment || 'center';

      this._renderer = new gdjs.RiveRuntimeObjectRenderer(
        this,
        instanceContainer
      );

      // *ALWAYS* call `this.onCreated()` at the very end of your object constructor.
      this.onCreated();
    }

    getRendererObject() {
      return this._renderer.getRendererObject();
    }

    extraInitializationFromInitialInstance(
      initialInstanceData: InstanceData
    ): void {
      if (initialInstanceData.customSize) {
        this.setWidth(initialInstanceData.width);
        this.setHeight(initialInstanceData.height);
      }
    }

    update(instanceContainer: gdjs.RuntimeInstanceContainer): void {
      const elapsedTime = this.getElapsedTime() / 1000;
      this._renderer.updateAnimation(elapsedTime);
    }

    onDestroyFromScene(instanceContainer: gdjs.RuntimeInstanceContainer): void {
      super.onDestroyFromScene(instanceContainer);
      this._renderer.onDestroy();
    }

    setX(x: float): void {
      super.setX(x);
      this._renderer.updatePosition();
    }

    setY(y: float): void {
      super.setY(y);
      this._renderer.updatePosition();
    }

    setAngle(angle: float): void {
      super.setAngle(angle);
      this._renderer.updateAngle();
    }

    setOpacity(opacity: float): void {
      this._opacity = gdjs.evtTools.common.clamp(opacity, 0, 255);
      this._renderer.updateOpacity();
    }

    getOpacity(): float {
      return this._opacity;
    }

    setWidth(width: float): void {
      this._width = width;
      this._renderer.updateSize();
    }

    setHeight(height: float): void {
      this._height = height;
      this._renderer.updateSize();
    }

    setSize(width: float, height: float): void {
      this._width = width;
      this._height = height;
      this._renderer.updateSize();
    }

    getWidth(): float {
      return this._width;
    }

    getHeight(): float {
      return this._height;
    }

    getDrawableY(): float {
      return this.getY();
    }

    /**
     * Play the state machine (resumes advancing it every frame).
     */
    play(): void {
      this._renderer.setPaused(false);
    }

    /**
     * Pause the state machine (it stops being advanced, keeping its
     * current visual state).
     */
    pause(): void {
      this._renderer.setPaused(true);
    }

    isPlayed(): boolean {
      return !this._renderer.isPaused();
    }

    isPaused(): boolean {
      return this._renderer.isPaused();
    }

    /**
     * Set the value of a boolean input of the State Machine.
     */
    setBooleanInput(inputName: string, value: boolean): void {
      this._renderer.setBooleanInput(inputName, value);
    }

    /**
     * Get the value of a boolean input of the State Machine.
     */
    getBooleanInput(inputName: string): boolean {
      return this._renderer.getBooleanInput(inputName);
    }

    /**
     * Set the value of a number input of the State Machine.
     */
    setNumberInput(inputName: string, value: float): void {
      this._renderer.setNumberInput(inputName, value);
    }

    /**
     * Get the value of a number input of the State Machine.
     */
    getNumberInput(inputName: string): float {
      return this._renderer.getNumberInput(inputName);
    }

    /**
     * Fire (trigger) a trigger input of the State Machine.
     */
    fireTriggerInput(inputName: string): void {
      this._renderer.fireTriggerInput(inputName);
    }

    /**
     * Change the text of a Rive text run (a piece of text set up in the Rive
     * editor and exposed for run-time modification).
     */
    setTextRunValue(textRunName: string, text: string): void {
      this._renderer.setTextRunValue(textRunName, text);
    }

    /**
     * Check if a Rive Event with the given name was reported by the State
     * Machine during the last frame.
     */
    hasReportedEvent(eventName: string): boolean {
      return this._lastReportedEventNames.indexOf(eventName) !== -1;
    }

    /**
     * Notify the State Machine that the pointer/finger is now down at the
     * given position (in scene/world coordinates). The coordinates are
     * converted from world space to the Rive artboard space internally.
     */
    pointerDown(sceneX: float, sceneY: float, pointerId: integer = 0): void {
      this._renderer.pointerDown(sceneX, sceneY, pointerId);
    }

    /**
     * Notify the State Machine that the pointer/finger moved to the given
     * position (in scene/world coordinates).
     */
    pointerMove(sceneX: float, sceneY: float, pointerId: integer = 0): void {
      this._renderer.pointerMove(sceneX, sceneY, pointerId);
    }

    /**
     * Notify the State Machine that the pointer/finger is now up at the given
     * position (in scene/world coordinates).
     */
    pointerUp(sceneX: float, sceneY: float, pointerId: integer = 0): void {
      this._renderer.pointerUp(sceneX, sceneY, pointerId);
    }
  }

  gdjs.registerObject('Rive::RiveObject', gdjs.RiveRuntimeObject);
}
