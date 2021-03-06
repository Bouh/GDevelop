/**
 * A dummy object doing showing a text on screen
 *
 * @memberof gdjs
 * @class DummyRuntimeObject
 * @extends RuntimeObject
 */
gdjs.DummyRuntimeObject = function(runtimeScene, objectData) {
  // *ALWAYS* call the base gdjs.RuntimeObject constructor.
  gdjs.RuntimeObject.call(this, runtimeScene, objectData);

  // Load any required data from the object properties.
  this._property1 = objectData.content.property1;

  // Create the renderer (see dummyruntimeobject-pixi-renderer.js)
  if (this._renderer)
    gdjs.DummyRuntimeObjectRenderer.call(this._renderer, this, runtimeScene);
  else this._renderer = new gdjs.DummyRuntimeObjectRenderer(this, runtimeScene);

  // *ALWAYS* call `this.onCreated()` at the very end of your object constructor.
  this.onCreated();
};

gdjs.DummyRuntimeObject.prototype = Object.create(gdjs.RuntimeObject.prototype);
gdjs.DummyRuntimeObject.thisIsARuntimeObjectConstructor =
  "MyDummyExtension::DummyObject"; //Replace by your extension + object name.

gdjs.DummyRuntimeObject.prototype.getRendererObject = function() {
  return this._renderer.getRendererObject();
};

/**
 * Called once during the game loop, before events and rendering.
 * @param {gdjs.RuntimeScene} runtimeScene The gdjs.RuntimeScene the object belongs to.
 */
gdjs.DummyRuntimeObject.prototype.update = function(runtimeScene) {
  // This is an example: typically you want to make sure the renderer
  // is up to date with the object.
  this._renderer.ensureUpToDate();
};

/**
 * Initialize the extra parameters that could be set for an instance.
 * @private
 */
gdjs.DummyRuntimeObject.prototype.extraInitializationFromInitialInstance = function(
  initialInstanceData
) {
  // For example:
  // this.setSomething(initialInstanceData.something);
};

/**
 * Update the object position.
 * @private
 */
gdjs.DummyRuntimeObject.prototype._updatePosition = function() {
  // This is an example: typically you want to tell the renderer to update
  // the position of the object.
  this._renderer.updatePosition();
};

/**
 * Set object position on X axis.
 */
gdjs.DummyRuntimeObject.prototype.setX = function(x) {
  gdjs.RuntimeObject.prototype.setX.call(this, x); // Always call the parent method first.
  this._updatePosition();
};

/**
 * Set object position on Y axis.
 */
gdjs.DummyRuntimeObject.prototype.setY = function(y) {
  gdjs.RuntimeObject.prototype.setY.call(this, y); // Always call the parent method first.
  this._updatePosition();
};

/**
 * Set the angle of the object.
 * @param {number} angle The new angle of the object
 */
gdjs.DummyRuntimeObject.prototype.setAngle = function(angle) {
  gdjs.RuntimeObject.prototype.setAngle.call(this, angle); // Always call the parent method first.
  this._renderer.updateAngle(); // Tell the renderer to update the rendered object
};

/**
 * Set object opacity.
 */
gdjs.DummyRuntimeObject.prototype.setOpacity = function(opacity) {
  if (opacity < 0) opacity = 0;
  if (opacity > 255) opacity = 255;

  this.opacity = opacity;
  this._renderer.updateOpacity(); // Tell the renderer to update the rendered object
};

/**
 * Get object opacity.
 */
gdjs.DummyRuntimeObject.prototype.getOpacity = function() {
  return this.opacity;
};

/**
 * Get the text that must be displayed by the dummy object.
 */
gdjs.DummyRuntimeObject.prototype.getText = function() {
  return this._property1;
};


/**
 * A dummy method that can be called from events
 */
gdjs.DummyRuntimeObject.prototype.myMethod = function(number1, text1) {
  console.log("Congrats, this method was called on a DummyRuntimeObject");
  console.log("Here is the object:", this);
  console.log("Here are the arguments passed from events:", number1, text1);
};
