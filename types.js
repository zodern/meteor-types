'use strict'
var loadPackages = require('./isopacks.js');
var findTypesEntry = require('./types-entry.js');
var Writer = require('./writer.js');
const ProjectContext = require('./tools-imports.js').ProjectContext;
const path = require('path');
const fs = require('fs');

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

const isLinting = process.argv.includes('lint');

const packageJsonPath = path.resolve(process.cwd(), 'package.json');
let filenames = [ 'tsconfig.json' ];

// Meteor has a bug that requires linters to lint any main modules
try {
  let content = JSON.parse(
    fs.readFileSync(packageJsonPath, 'utf-8')
  );

  if (content.meteor && content.meteor.mainModule) {
    Object.keys(content.meteor.mainModule).forEach(key => {
      let modulePath = content.meteor.mainModule[key];
      let fileName = path.basename(modulePath);
      filenames.push(fileName);
    });
  }
} catch (e) {
}

Plugin.registerLinter({
  filenames: filenames
}, () => new Linter());

class Linter {
  processFilesForPackage(files) {
    var isApp = files[0].getPackageName() === null;

    if (!isApp) {
      return;
    }

    if (!catalog) {
      // When using the published version of zodern:types
      // the catalog will never be available during the initial build
      // since this build plugin is loaded too late
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

    if (isLinting) {
      console.log('');
      console.log('[zodern:types] Updated types');
      console.log('[zodern:types] Exiting "meteor lint" early');
      process.exit(0);
    }
  }
}
