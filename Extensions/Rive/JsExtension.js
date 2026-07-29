// @ts-check
/// <reference path="../JsExtensionTypes.d.ts" />
/**
 * This is a declaration of an extension for GDevelop 5.
 *
 * ℹ️ Changes in this file are watched and automatically imported if the editor
 * is running. You can also manually run `node import-GDJS-Runtime.js` (in newIDE/app/scripts).
 *
 * The file must be named "JsExtension.js", otherwise GDevelop won't load it.
 * ⚠️ If you make a change and the extension is not loaded, open the developer console
 * and search for any errors.
 *
 * More information on https://github.com/4ian/GDevelop/blob/master/newIDE/README-extensions.md
 */

/** @type {ExtensionModule} */
module.exports = {
  createExtension: function (_, gd) {
    const extension = new gd.PlatformExtension();
    extension
      .setExtensionInformation(
        'Rive',
        _('Rive (experimental)'),
        _(
          'Displays and plays back a Rive (https://rive.app) animation. Rive files are State Machines: use actions/conditions to read and write the values of their inputs (booleans, numbers, triggers), read the events they report, and change their text runs.'
        ),
        'GDevelop',
        'Open source (MIT License)'
      )
      .setShortDescription(
        'Rive object: play interactive, State Machine driven vector animations exported from the Rive editor.'
      )
      .setDimension('2D')
      .setExtensionHelpPath('/objects/rive')
      .setCategory('Advanced');

    extension
      .addInstructionOrExpressionGroupMetadata(_('Rive'))
      .setIcon('JsPlatform/Extensions/rive.svg');

    var riveObject = new gd.ObjectJsImplementation();
    riveObject.updateProperty = function (propertyName, newValue) {
      if (propertyName === 'riveResource') {
        this.content.riveResourceName = newValue;
        return true;
      }
      if (propertyName === 'ArtboardName') {
        this.content.artboardName = newValue;
        return true;
      }
      if (propertyName === 'StateMachineName') {
        this.content.stateMachineName = newValue;
        return true;
      }
      if (propertyName === 'Fit') {
        this.content.fit = newValue;
        return true;
      }
      if (propertyName === 'Alignment') {
        this.content.alignment = newValue;
        return true;
      }
      return false;
    };
    riveObject.getProperties = function () {
      var objectProperties = new gd.MapStringPropertyDescriptor();

      objectProperties
        .getOrCreate('riveResource')
        .setValue(this.content.riveResourceName)
        .setType('resource')
        .addExtraInfo('rive')
        .setLabel(_('Rive file (.riv)'))
        .setGroup(_('Rive file'));
      objectProperties
        .getOrCreate('ArtboardName')
        .setValue(this.content.artboardName)
        .setType('string')
        .setLabel(_('Artboard'))
        .setDescription(
          _('Name of the artboard to display (leave empty to use the default one).')
        )
        .setGroup(_('Rive file'));
      objectProperties
        .getOrCreate('StateMachineName')
        .setValue(this.content.stateMachineName)
        .setType('string')
        .setLabel(_('State machine'))
        .setDescription(
          _(
            'Name of the state machine to play (leave empty to use the first one of the artboard).'
          )
        )
        .setGroup(_('Rive file'));
      objectProperties
        .getOrCreate('Fit')
        .setValue(this.content.fit)
        .setType('choice')
        .addExtraInfo('fill')
        .addExtraInfo('contain')
        .addExtraInfo('cover')
        .addExtraInfo('fit-width')
        .addExtraInfo('fit-height')
        .addExtraInfo('none')
        .addExtraInfo('scale-down')
        .setLabel(_('Fit'))
        .setDescription(_('How the artboard is scaled to fit the object size.'))
        .setGroup(_('Layout'));
      objectProperties
        .getOrCreate('Alignment')
        .setValue(this.content.alignment)
        .setType('choice')
        .addExtraInfo('top-left')
        .addExtraInfo('top-center')
        .addExtraInfo('top-right')
        .addExtraInfo('center-left')
        .addExtraInfo('center')
        .addExtraInfo('center-right')
        .addExtraInfo('bottom-left')
        .addExtraInfo('bottom-center')
        .addExtraInfo('bottom-right')
        .setLabel(_('Alignment'))
        .setDescription(
          _('How the artboard is aligned inside the object size.')
        )
        .setGroup(_('Layout'));

      return objectProperties;
    };
    riveObject.content = {
      opacity: 255,
      width: 100,
      height: 100,
      riveResourceName: '',
      artboardName: '',
      stateMachineName: '',
      fit: 'contain',
      alignment: 'center',
    };

    riveObject.updateInitialInstanceProperty = function (
      instance,
      propertyName,
      newValue
    ) {
      return false;
    };
    riveObject.getInitialInstanceProperties = function (instance) {
      var instanceProperties = new gd.MapStringPropertyDescriptor();
      return instanceProperties;
    };

    const object = extension
      .addObject(
        'RiveObject',
        _('Rive (experimental)'),
        _(
          'Display and play back a Rive animation (a State Machine exported from the Rive editor).'
        ),
        'JsPlatform/Extensions/rive.svg',
        // @ts-ignore - TODO: Fix riveObject being an ObjectJsImplementation instead of an ObjectConfiguration
        riveObject
      )
      .addDefaultBehavior('EffectCapability::EffectBehavior')
      .addDefaultBehavior('ResizableCapability::ResizableBehavior')
      .addDefaultBehavior('OpacityCapability::OpacityBehavior')
      .setIncludeFile('Extensions/Rive/rive_advanced_single.js')
      .addIncludeFile('Extensions/Rive/managers/rive-manager.js')
      .addIncludeFile('Extensions/Rive/riveruntimeobject.js')
      .addIncludeFile('Extensions/Rive/riveruntimeobject-pixi-renderer.js')
      .setCategory('Advanced')
      .setOpenFullEditorLabel(_('Edit animations'));

    object
      .addAction(
        'Play',
        _('Play'),
        _('Resume playing (advancing) the Rive state machine.'),
        _('Play _PARAM0_'),
        _('Playback'),
        'JsPlatform/Extensions/rive.svg',
        'JsPlatform/Extensions/rive.svg'
      )
      .addParameter('object', _('Rive object'), 'RiveObject', false)
      .getCodeExtraInformation()
      .setFunctionName('play');

    object
      .addAction(
        'Pause',
        _('Pause'),
        _('Pause the Rive state machine.'),
        _('Pause _PARAM0_'),
        _('Playback'),
        'JsPlatform/Extensions/rive.svg',
        'JsPlatform/Extensions/rive.svg'
      )
      .addParameter('object', _('Rive object'), 'RiveObject', false)
      .getCodeExtraInformation()
      .setFunctionName('pause');

    object
      .addCondition(
        'IsPlayed',
        _('Is playing'),
        _('Check if the Rive animation is playing.'),
        _('_PARAM0_ is playing'),
        _('Playback'),
        'JsPlatform/Extensions/rive.svg',
        'JsPlatform/Extensions/rive.svg'
      )
      .addParameter('object', _('Rive object'), 'RiveObject', false)
      .getCodeExtraInformation()
      .setFunctionName('isPlayed');

    object
      .addCondition(
        'IsPaused',
        _('Is paused'),
        _('Check if the Rive animation is paused.'),
        _('_PARAM0_ is paused'),
        _('Playback'),
        'JsPlatform/Extensions/rive.svg',
        'JsPlatform/Extensions/rive.svg'
      )
      .addParameter('object', _('Rive object'), 'RiveObject', false)
      .getCodeExtraInformation()
      .setFunctionName('isPaused');

    object
      .addAction(
        'SetBooleanInput',
        _('Set boolean input'),
        _('Set the value of a boolean input of the state machine.'),
        _('Set boolean input _PARAM1_ of _PARAM0_ to _PARAM2_'),
        _('State machine inputs'),
        'JsPlatform/Extensions/rive.svg',
        'JsPlatform/Extensions/rive.svg'
      )
      .addParameter('object', _('Rive object'), 'RiveObject', false)
      .addParameter('string', _('Input name'), '', false)
      .addParameter('yesorno', _('New value'), '', false)
      .getCodeExtraInformation()
      .setFunctionName('setBooleanInput');

    object
      .addCondition(
        'BooleanInput',
        _('Boolean input'),
        _('Compare the value of a boolean input of the state machine.'),
        _('Boolean input _PARAM1_ of _PARAM0_ is _PARAM2_'),
        _('State machine inputs'),
        'JsPlatform/Extensions/rive.svg',
        'JsPlatform/Extensions/rive.svg'
      )
      .addParameter('object', _('Rive object'), 'RiveObject', false)
      .addParameter('string', _('Input name'), '', false)
      .addParameter('yesorno', _('Value to compare to'), '', false)
      .getCodeExtraInformation()
      .setFunctionName('getBooleanInput');

    object
      .addAction(
        'SetNumberInput',
        _('Set number input'),
        _('Set the value of a number input of the state machine.'),
        _('the value of number input _PARAM1_ of _PARAM0_'),
        _('State machine inputs'),
        'JsPlatform/Extensions/rive.svg',
        'JsPlatform/Extensions/rive.svg'
      )
      .addParameter('object', _('Rive object'), 'RiveObject', false)
      .addParameter('string', _('Input name'), '', false)
      .useStandardParameters('number', gd.ParameterOptions.makeNewOptions())
      .getCodeExtraInformation()
      .setFunctionName('setNumberInput')
      .setGetter('getNumberInput');

    object
      .addExpression(
        'NumberInput',
        _('Number input'),
        _('Get the value of a number input of the state machine.'),
        _('State machine inputs'),
        'JsPlatform/Extensions/rive.svg'
      )
      .addParameter('object', _('Rive object'), 'RiveObject', false)
      .addParameter('string', _('Input name'), '', false)
      .getCodeExtraInformation()
      .setFunctionName('getNumberInput');

    object
      .addCondition(
        'NumberInput',
        _('Number input'),
        _('Compare the value of a number input of the state machine.'),
        _('the value of number input _PARAM1_ of _PARAM0_'),
        _('State machine inputs'),
        'JsPlatform/Extensions/rive.svg',
        'JsPlatform/Extensions/rive.svg'
      )
      .addParameter('object', _('Rive object'), 'RiveObject', false)
      .addParameter('string', _('Input name'), '', false)
      .useStandardRelationalOperatorParameters(
        'number',
        gd.ParameterOptions.makeNewOptions()
      )
      .getCodeExtraInformation()
      .setFunctionName('getNumberInput');

    object
      .addAction(
        'FireTriggerInput',
        _('Fire trigger input'),
        _('Fire (trigger) a trigger input of the state machine.'),
        _('Fire trigger input _PARAM1_ of _PARAM0_'),
        _('State machine inputs'),
        'JsPlatform/Extensions/rive.svg',
        'JsPlatform/Extensions/rive.svg'
      )
      .addParameter('object', _('Rive object'), 'RiveObject', false)
      .addParameter('string', _('Input name'), '', false)
      .getCodeExtraInformation()
      .setFunctionName('fireTriggerInput');

    object
      .addCondition(
        'HasReportedEvent',
        _('Rive event triggered'),
        _(
          'Check if a Rive Event with the given name was reported by the state machine during the last frame.'
        ),
        _('_PARAM0_ reported event _PARAM1_'),
        _('Events'),
        'JsPlatform/Extensions/rive.svg',
        'JsPlatform/Extensions/rive.svg'
      )
      .addParameter('object', _('Rive object'), 'RiveObject', false)
      .addParameter('string', _('Event name'), '', false)
      .getCodeExtraInformation()
      .setFunctionName('hasReportedEvent');

    object
      .addAction(
        'SetTextRunValue',
        _('Set text run'),
        _('Change the text of a Rive text run.'),
        _('Set text run _PARAM1_ of _PARAM0_ to _PARAM2_'),
        _('Text runs'),
        'JsPlatform/Extensions/rive.svg',
        'JsPlatform/Extensions/rive.svg'
      )
      .addParameter('object', _('Rive object'), 'RiveObject', false)
      .addParameter('string', _('Text run name'), '', false)
      .addParameter('string', _('New text'), '', false)
      .getCodeExtraInformation()
      .setFunctionName('setTextRunValue');

    object
      .addAction(
        'PointerDown',
        _('Simulate pointer down'),
        _(
          'Notify the state machine that a pointer/finger is now down at the given position (in scene coordinates).'
        ),
        _('Simulate pointer down on _PARAM0_ at _PARAM1_;_PARAM2_'),
        _('Pointer'),
        'JsPlatform/Extensions/rive.svg',
        'JsPlatform/Extensions/rive.svg'
      )
      .addParameter('object', _('Rive object'), 'RiveObject', false)
      .addParameter('expression', _('X position (scene coordinates)'), '', false)
      .addParameter('expression', _('Y position (scene coordinates)'), '', false)
      .getCodeExtraInformation()
      .setFunctionName('pointerDown');

    object
      .addAction(
        'PointerMove',
        _('Simulate pointer move'),
        _(
          'Notify the state machine that the pointer/finger moved to the given position (in scene coordinates).'
        ),
        _('Simulate pointer move on _PARAM0_ at _PARAM1_;_PARAM2_'),
        _('Pointer'),
        'JsPlatform/Extensions/rive.svg',
        'JsPlatform/Extensions/rive.svg'
      )
      .addParameter('object', _('Rive object'), 'RiveObject', false)
      .addParameter('expression', _('X position (scene coordinates)'), '', false)
      .addParameter('expression', _('Y position (scene coordinates)'), '', false)
      .getCodeExtraInformation()
      .setFunctionName('pointerMove');

    object
      .addAction(
        'PointerUp',
        _('Simulate pointer up'),
        _(
          'Notify the state machine that a pointer/finger is now up at the given position (in scene coordinates).'
        ),
        _('Simulate pointer up on _PARAM0_ at _PARAM1_;_PARAM2_'),
        _('Pointer'),
        'JsPlatform/Extensions/rive.svg',
        'JsPlatform/Extensions/rive.svg'
      )
      .addParameter('object', _('Rive object'), 'RiveObject', false)
      .addParameter('expression', _('X position (scene coordinates)'), '', false)
      .addParameter('expression', _('Y position (scene coordinates)'), '', false)
      .getCodeExtraInformation()
      .setFunctionName('pointerUp');

    return extension;
  },
  runExtensionSanityTests: function (gd, extension) {
    return [];
  },
  registerEditorConfigurations: function (objectsEditorService) {
    objectsEditorService.registerEditorConfiguration(
      'Rive::RiveObject',
      objectsEditorService.getDefaultObjectJsImplementationPropertiesEditor({
        helpPagePath: '/objects/rive',
      })
    );
  },
  registerInstanceRenderers: function (objectsRenderingService) {
    const RenderedInstance = objectsRenderingService.RenderedInstance;
    const PIXI = objectsRenderingService.PIXI;

    /**
     * Renderer for instances of RiveObject inside the IDE.
     *
     * The IDE does not load the Rive WASM runtime, so this renderer only
     * shows a placeholder (icon) with the object's size: a real preview of
     * the animation is out of scope for now (this would require loading the
     * same "advanced" Rive runtime inside the scene editor, similarly to
     * what is done for the game itself - see riveruntimeobject-pixi-renderer.ts).
     *
     * @extends RenderedInstance
     */
    class RenderedRiveInstance extends RenderedInstance {
      constructor(
        project,
        layout,
        instance,
        associatedObject,
        pixiContainer,
        pixiResourcesLoader
      ) {
        super(
          project,
          layout,
          instance,
          associatedObject,
          pixiContainer,
          pixiResourcesLoader
        );

        this._pixiObject = new PIXI.Sprite(
          pixiResourcesLoader.getInvalidPIXITexture()
        );
        this._pixiObject.anchor.x = 0.5;
        this._pixiObject.anchor.y = 0.5;
        this._pixiContainer.addChild(this._pixiObject);
        this.update();
      }

      static getThumbnail(project, resourcesLoader, object) {
        return 'JsPlatform/Extensions/rive.svg';
      }

      update() {
        this._pixiObject.position.x =
          this._instance.getX() + this._pixiObject.width / 2;
        this._pixiObject.position.y =
          this._instance.getY() + this._pixiObject.height / 2;
        this._pixiObject.rotation = RenderedInstance.toRad(
          this._instance.getAngle()
        );

        if (this._instance.hasCustomSize()) {
          this._pixiObject.width = this._instance.getCustomWidth();
          this._pixiObject.height = this._instance.getCustomHeight();
        }
      }

      getDefaultWidth() {
        return 100;
      }

      getDefaultHeight() {
        return 100;
      }
    }

    objectsRenderingService.registerInstanceRenderer(
      'Rive::RiveObject',
      RenderedRiveInstance
    );
  },
};
