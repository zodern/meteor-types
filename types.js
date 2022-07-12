import { loadPackages } from './isopacks.js';
import { findTypesEntry } from './types-entry.js';
import { Writer } from './writer.js';

let appPath = process.cwd();
let writer = new Writer(appPath);

let setupFinished = false;

Plugin.registerLinter({
  // TODO: Meteor seems to be unable to start if the app has a main module 
  // with a different file extension than listed here??
  // TODO: reduce the number of extensions to make linting faster
  extensions: ['ts', 'js', 'tsx', 'jsx'],
}, () => new MyLinter);

class MyLinter {
  processFilesForPackage(files) {
    let isApp = files[0].getPackageName() === null;

    if (!isApp) {
      return;
    }

    if (!setupFinished) {
      writer.setup();
      setupFinished = true;
    }

    let packages = loadPackages(appPath);

    for(const [name, { path: packagePath, isopack, remote }] of Object.entries(packages)) {
      let typesEntry = findTypesEntry(packagePath, isopack, remote);

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
