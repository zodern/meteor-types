'use strict'
var loadPackages = require('./isopacks.js');
var findTypesEntry = require('./types-entry.js');
var Writer = require('./writer.js');

var appPath = process.cwd();
var writer = new Writer(appPath);

var setupFinished = false;

Plugin.registerLinter({
  // TODO: Meteor seems to be unable to start if the app has a main module 
  // with a different file extension than listed here??
  // TODO: reduce the number of extensions to make linting faster
  extensions: ['ts', 'js', 'tsx', 'jsx'],
}, () => new Linter);

class Linter {
  processFilesForPackage(files) {
    var isApp = files[0].getPackageName() === null;

    if (!isApp) {
      return;
    }

    if (!setupFinished) {
      writer.setup();
      setupFinished = true;
    }

    var packages = loadPackages(appPath);

    for(var entry of Object.entries(packages)) {
      var name = entry[0];
      var packagePath = entry[1].path;
      var isopack = entry[1].isopack;
      var remote = entry[1].remote;

      var typesEntry = findTypesEntry(packagePath, isopack, remote);

      if (typesEntry) {
        writer.addPackage(
          name,
          packagePath,
          typesEntry
        );
      }
    }

    writer.writeToDisk();
  }
}
