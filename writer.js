'use strict';

const fs = require('fs');
const path = require('path');
const log = require('./log.js');

// Manages the files and folders in .meteor/local/types
module.exports = class Writer {
  constructor(appPath) {
    this.appPath = appPath;
    this.typesPath = path.resolve(appPath, '.meteor/local/types');
    this.npmPackagePath = path.resolve(this.typesPath, 'node_modules/package-types');

    this.existingPackages = new Map();
    this.packages = new Map();
  }

  setup() {
    log('starting setup');
    this.mkdirIfMIssing(this.typesPath, { recursive: true });
    this.mkdirIfMIssing(this.npmPackagePath, { recursive: true });

    fs.writeFileSync(
      path.resolve(this.npmPackagePath, 'package.json'),
      JSON.stringify(
        {
          "name": "package-types"
        },
        null,
        2
      )
    );

    const dirents = fs.readdirSync(this.npmPackagePath, { withFileTypes: true });

    dirents.forEach(dirent => {
      if (dirent.isDirectory()) {
        log('checking', dirent.name);
        let nodeModulesPath = this.readlinkOrNull(
          path.resolve(
            this.npmPackagePath,
            dirent.name,
            'node_modules'
          )
        );
        let packagePath = this.readlinkOrNull(
          path.resolve(
            this.npmPackagePath,
            dirent.name,
            'package'
          )
        );

        if (nodeModulesPath === null || packagePath === null) {
          log('partial - cleaning', dirent.name);
          this.cleanPackage(path.resolve(this.npmPackagePath, dirent.name));
          return;
        }

        this.existingPackages.set(dirent.name, {
          path: path.resolve(this.npmPackagePath, dirent.name),
          nodeModulesPath,
          packagePath
        });
        log('add existing', dirent.name);
      }
    });
    log('finish setup');
  }

  addPackage(name, packagePath, typesPath) {
    log('adding package', name);
    this.packages.set(this.normalizeName(name), { packagePath, typesPath });
  }

  normalizeName(name) {
    return name.replace(':', '_');
  }

  writeToDisk() {
    log('writing to disk');
    for (const entry of this.packages.entries()) {
      let name = entry[0];
      let packagePath = entry[1].packagePath;
      let existing = this.existingPackages.get(name);

      let nodeModulesPath = this.findNodeModulesPath(packagePath);

      let upToDate = existing && existing.nodeModulesPath === nodeModulesPath
        && existing.packagePath === packagePath;

      if (upToDate) {
        log('up to date', name);
        continue;
      }

      if (existing) {
        log('has existing - is cleaning', name);
        this.cleanPackage(existing.path);
      }

      log('writing', name);
      let packageTypesPath = path.resolve(this.npmPackagePath, name);
      this.mkdirIfMIssing(packageTypesPath);
      fs.symlinkSync(
        nodeModulesPath,
        path.resolve(packageTypesPath, 'node_modules'),
        'junction'
      );
      fs.symlinkSync(
        packagePath,
        path.resolve(packageTypesPath, 'package'),
        'junction'
      );

      this.existingPackages.set(name, {
        path: packageTypesPath,
        nodeModulesPath,
        packagePath
      });
    }

    for (const name of this.existingPackages.keys()) {
      if (this.packages.has(name)) {
        continue;
      }

      this.cleanPackage(this.existingPackages.get(name).path);
    }

    let declaration = this.generateDeclaration();

    fs.writeFileSync(
      path.resolve(this.typesPath, 'packages.d.ts'),
      declaration
    );

    this.packages.clear();
  }

  generateDeclaration() {
    let content = '';

    for (const entry of this.packages.entries()) {
      let name = entry[0];
      let typesPath = entry[1].typesPath;
      let standardName = name.replace('_', ':');
      // When typescript resolves the file, it assumes the path doesn't
      // have the extension.
      let finalTypesPath = typesPath.replace('.ts', '');
      content += `
declare module 'meteor/${standardName}' {
  import exports = require('package-types/${name}/package/${finalTypesPath}');
  export = exports;
}
`;
    }

    return content;
  }

  findNodeModulesPath(packagePath) {
    return path.resolve(packagePath, 'npm/node_modules');
  }

  cleanPackage(packageTypesPath) {
    log('cleaning', packageTypesPath);

    [
      path.resolve(packageTypesPath, 'node_modules'),
      path.resolve(packageTypesPath, 'package'),
    ].forEach(pathToUnlink => {
      try {
        fs.unlinkSync(pathToUnlink);
      } catch (e) {
        if (e.code !== 'ENOENT') {
          throw e;
        }
      }
    });

    try {
      fs.rmdirSync(packageTypesPath);
    } catch (e) {
      if (e.code !== 'ENOENT') {
        throw e;       
      }
    }
  }

  mkdirIfMIssing(dirPath, options) {
    try {
      fs.mkdirSync(dirPath, options);
    } catch (e) {
      if (e.code == 'EEXIST') {
        return;
      }

      throw e;
    }
  }

  readlinkOrNull(linkPath) {
    try {
      return fs.readlinkSync(linkPath);
    } catch (e) {
      if (e.code === 'ENOENT') {
        return null;
      }

      throw e;
    }
  }
}
