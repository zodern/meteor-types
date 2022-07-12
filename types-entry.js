import path from 'path';
import fs from 'fs';
import log from './log';

export function findTypesEntry(packagePath, isopack, remote) {
  const {
    mainModules,
    definitionFiles,
    packageTypesConfigs
  } = analyzeResources(isopack, remote);

  log('examining', packagePath);

  if (!remote && mainModules.size === 1) {
    let mainModule = getFirstValue(mainModules);

    // Unlike remote packages, for local packages we are okay with using
    // a ts file as the types entry. Typescript can't be configured to ignore
    // problems with types in ts files, but for local packages you probably
    // want to know about problems.
    if (mainModule.path.endsWith('.ts')) {
      log('can use main module directly - local');
      return mainModule.file;
    }

  }

  if (packageTypesConfigs.length > 0) {
    let configResource = packageTypesConfigs[0];
    let config = readTypesConfig(packagePath, configResource);
    log('read config', config);
    if (
      config.typesEntry &&
      fs.existsSync(config.typesEntry)
    ) {
      log('can use types entry');
      let relative = path.relative(packagePath, config.typesEntry);
      if (
        relative.startsWith('..') ||
        relative.startsWith('/')
      ) {
        throw new Error(`typesEntry is not inside of package. package: ${packagePath}, typesEntry: ${config.typesEntry}`)
      }

      // TODO: warn if published package, and file is a ts file instead of d.ts

      return relative;
    } else {
      log('not exists', config.typesEntry);
    }
  }

  if (definitionFiles.size === 1) {
    log('can use definition file', packagePath);
    return getFirstValue(definitionFiles).file;
  } else if (mainModules.size === 1 && definitionFiles.size > 0) {
    let mainModule = getFirstValue(mainModules);
    let name = mainModule.path.slice(0, mainModule.path.lastIndexOf('.'));
    let definitionNames = [
      name + '.d.ts'
    ];
    if (name.startsWith('src/')) {
      definitionNames.push(
        name.replace('src/', 'lib/') + '.d.ts'
      )
    }
    // Check if definition file for the main module
    for (const [, resource] of definitionFiles) {
      if (definitionNames.includes(resource.path)) {
        log('found matching definitions', resource);
        log('can use main module definition', packagePath);
        return resource.file;
      }
    }
  }

  return null;
}

function getFirstValue(map) {
  return map.values().next().value;
}

function analyzeResources(isopack, remote) {
  let mainModules = new Map();
  let definitionFiles = new Map();
  let rootPackageTypes = null;
  let generatedPackageTypes = null;

  for (const unibuild of isopack.unibuilds) {
    for (const resource of unibuild.resources) {
      if (resource.fileOptions.mainModule) {
        mainModules.set(resource.path, resource);
      }

      if (resource.file.endsWith('.d.ts')) {
        definitionFiles.set(resource.hash, resource);
      }

      if (resource.path === 'package-types.json') {
        rootPackageTypes = resource;
      }

      if (resource.path === '__types/package-types.json') {
        generatedPackageTypes = resource;
      }
    }
  }

  let packageTypesConfigs = remote ?
    [generatedPackageTypes, rootPackageTypes] :
    [rootPackageTypes, generatedPackageTypes];

  return {
    mainModules,
    definitionFiles,
    // Sort in order of priority
    // .types/package-types.json overrides package-types.json
    // TODO: verify this works
    packageTypesConfigs: packageTypesConfigs.filter(c => c)
  };
}

function readTypesConfig(packagePath, resource) {
  let fullPath = path.resolve(packagePath, resource.file);
  let content = fs.readFileSync(fullPath, 'utf-8');
  let config = JSON.parse(content);

  if (config.typesEntry) {
    config.typesEntry = path.resolve(
      packagePath,
      path.dirname(resource.file),
      config.typesEntry
    )
  }

  return config;
}
