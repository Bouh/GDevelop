# README

This folder contains sources to embed Piskel editor \([https://www.piskelapp.com/](https://www.piskelapp.com/)\) so that it can be used directly from GDevelop to edit images.

GD uses an updated version of piskel from [https://github.com/blurymind/piskel/tree/piskel-plus](https://github.com/blurymind/piskel/tree/piskel-plus) It contains a number of advanced color manipulation features and improvements to aid artists. commit number: a300d17eb88d2b9d1fa2bbe3a810ad1bb76f1f81

Piskel sources are downloaded by `import-zipped-editor.js` script. They are raw, unchanged sources of the Piskel editor build. Sources will be stored in `piskel-editor` folder. See `piskel-main.js` for the code running the editor. See `ModalWindow.js` and `LocalPiskelBridge.js` files for the bridge that open the Window and pass data from GDevelop to Piskel.

