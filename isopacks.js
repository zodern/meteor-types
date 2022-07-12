'use strict';

const fs = require('fs');
const path = require('path');

// TODO: add support for running Meteor from checkout
let meteorParentDir = process.platform === 'win32' ?
  process.env.LOCALAPPDATA :
  process.env.HOME;

let remoteCatalogPath = path.join(meteorParentDir, '.meteor', 'packages');

module.exports = function loadPackages(appPath, catalog) {
  var contents;
  try {
    contents = fs.readFileSync(path.resolve(appPath, '.meteor/versions'), 'utf-8');
  } catch (e) {
    // Check if running for a package, such as `meteor test-packages`
    // In that case, there will never be a .meteor/versions file
    throw new Error('Unable to read .meteor/versions:' + e.message);
  }

  var lines = contents.split(/\r*\n\r*/);
  var packages = Object.create(null);

  // based on https://github.com/meteor/meteor/blob/d9db4f52f2ea6d706a25156768ea42e1fbb8f599/tools/project-context.js#L1171
  lines.forEach(line => {
    line = line.replace(/^\s+|\s+$/g, '');

    if (line === '')
      return;

    var packageVersion = parsePackageAndVersion(line);
    if (!packageVersion)
      return;

    // If a package is in the file multiple times, Meteor only uses the first entry
    if (packageVersion.package in packages)
      return;

    var result = findPackagePath(appPath, packageVersion.package, packageVersion.version, catalog);
    packages[packageVersion.package] = {
      remote: result.remote,
      version: packageVersion.version,
      path: result.packagePath,
      isopack: readIsopack(result.packagePath)
    };
  });

  return packages;
}

// Based on https://github.com/meteor/meteor/blob/d9db4f52f2ea6d706a25156768ea42e1fbb8f599/tools/utils/utils.js#L250
function parsePackageAndVersion(packageAtVersionString) {
  var separatorPos = Math.max(packageAtVersionString.lastIndexOf(' '),
    packageAtVersionString.lastIndexOf('@'));

  if (separatorPos < 0) {
    return;
  }

  var packageName = packageAtVersionString.slice(0, separatorPos);
  var version = packageAtVersionString.slice(separatorPos + 1);

  return { package: packageName, version: version };
}

function exists(path) {
  try {
    return !!fs.statSync(path);
  } catch (e) {
    return false;
  }
}

function readIsopack(packagePath) {
  let content = fs.readFileSync(packagePath + '/isopack.json', 'utf-8');
  let config = JSON.parse(content)['isopack-2'];

  if (!config) {
    throw new Error(`Unsupported isopack format for ${packagePath}`);
  }

  config.unibuilds = config.builds.map(build => {
    return JSON.parse(fs.readFileSync(path.resolve(packagePath, build.path), 'utf-8'));
  });

  return config;
}

function findPackagePath(appPath, name, version, catalog) {
  let checkLocal = true;
  
  if (catalog) {
    let entry = catalog.getVersion(name, version);
    log('Catalog result:', name, version, `entry: ${!!entry}`, `published: ${entry && entry.published}`);
    if (entry && entry.published) {
      // We know the package is not local
      // Checking the local isopacks could lead to incorrect results since
      // Meteor doesn't remove isopacks if a package was local, then becomes remote
      checkLocal = false;
    }
  }

  // Check if local package
  let localPath = path.resolve(appPath, '.meteor/local/isopacks', name.replace(':', '_'));
  if (exists(localPath)) {
    return { packagePath: localPath, remote: false };
  }

  let remotePath = path.join(
    remoteCatalogPath,
    name.replace(':', '_'),
    version
  );

  if (exists(remotePath)) {
    return { packagePath: remotePath, remote: true };
  }

  throw new Error(`Unable to find package: ${name}@${version}`);
}
