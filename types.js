'use strict'
var loadPackages = require('./isopacks.js');
var findTypesEntry = require('./types-entry.js');
var Writer = require('./writer.js');
const ProjectContext = require('./tools-imports.js').ProjectContext;

var appPath = process.cwd();
var writer = new Writer(appPath);

var catalog;
var setupFinished = false;

const oldGetProjectLocalDirectory = ProjectContext.prototype.getProjectLocalDirectory;
// Meteor calls getProjectLocalDirectory at the beginning of every build
ProjectContext.prototype.getProjectLocalDirectory = function () {
  catalog = this.projectCatalog;

  return oldGetProjectLocalDirectory.apply(this, arguments);
};

Plugin.registerLinter({
  // TODO: Meteor seems to be unable to start if the app has a main module 
  // with a different file extension than listed here??
  // TODO: reduce the number of extensions to make linting faster
  extensions: ['ts', 'js', 'tsx', 'jsx'],
}, () => new Linter());

class Linter {
  processFilesForPackage(files) {
    var isApp = files[0].getPackageName() === null;

    if (!isApp) {
      return;
    }

    if (!catalog) {
      console.warn('Linter ran before we had access to package catalog');
      console.warn('Please create a GitHub issue for zodern:types');
    }

    if (!setupFinished) {
      writer.setup();
      setupFinished = true;
    }

    var packages = loadPackages(appPath, catalog);

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
