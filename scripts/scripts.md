# Scripts files for GDevelop

* **ReleaseProcedure.bat**: this script compiles, generate documentation \(see **GenerateAllDocs.bat**\) and package GDevelop for Windows in an installer and an archive.
* **ReleaseProcedure.sh**: compiles and package GD for Ubuntu \(see _Binaries/Packaging_\).
* **CopyWindowsToLinuxReleaseFiles.sh**: Copy all files in _Binaries/Output/Release\_Windows_ to _Binaries/Output/Release\_Linux_. Call it after any change in _Binaries/Output/Release\_Windows_.
* **GenerateAllDocs.\[bat\|sh\]**: Call doxygen and yuidoc to generate all the documentations into _docs_ folder.
* **ExtractTranslations.\[bat\|sh\]**: Create the _source.pot_ file containing the strings to be translated using [Crowdin](https://crowdin.com/project/gdevelop).

