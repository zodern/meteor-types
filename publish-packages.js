import path from 'path';
import fs from 'fs';
import { spawnSync } from 'child_process';

// During publishing packages, this handles:
//
// 1) Ensuring published packages have .d.ts and package-types.json files
// 2) Generate types if needed
// 3) Uninstall npm dev dependencies, and reinstall them after publishing

Plugin.registerCompiler({
  // These aren't used by the compiler
  // This ensures meteor includes these files when building or publishing
  // the package
  extensions: ['d.ts'],
  filenames: ['package-types.json']
}, () => new PackageCompiler());

class PackageCompiler {
  processFilesForTarget(files) {
    // Do nothing
    // Meteor Typescript compilers usually ignore .d.ts files
    // and package-types.json are not used during runtime
  }
}

// Probably isn't completely reliable, but is close enough
const isPublish = process.argv.includes('publish');
const packagePath = process.cwd();
let prepared = false;

const mainModule = global.process.mainModule;
const absPath = mainModule.filename.split(path.sep).slice(0, -1).join(path.sep);
const toolsRequire = function (filePath) {
  return mainModule.require(path.resolve(absPath, filePath));
};

const PackageSource = toolsRequire('isobuild/package-source');
const originalFindSources = PackageSource.prototype._findSources;

PackageSource.prototype._findSources = function (options) {
  if (
    !prepared &&
    isPublish &&
    this.sourceRoot === packagePath &&

    // If _findSources is called for a linter, then _allowConflicts will be true
    // and we can't call getByFilename
    !options?.sourceProcessorSet._allowConflicts &&
    options?.sourceProcessorSet?.getByFilename('package-types.json')
  ) {
    preparePackageForPublish(this.sourceRoot);
    prepared = true;
  }

  return originalFindSources.apply(this, arguments);
}

function preparePackageForPublish(packageDir) {
  const packageTypesPath = path.resolve(packageDir, 'package-types.json');
  const content = fs.readFileSync(packageTypesPath);
  const config = JSON.parse(content);

  if (!config.typesEntry) {
    throw new Error('Package\'s package-types.json file does not have an typesEntry option');
  }

  let typesEntryPath = path.resolve(
    packagePath,
    config.typesEntry
  );

  console.log('[zodern:types] => Cleaning old generated types');
  const typesPath = path.resolve(packageDir, '__types');

  if (fs.existsSync(typesPath)) {
    fs.rmSync(typesPath, {
      recursive: true
    });
  }

  // Generate types
  const args = [
    '--no-install',
    'tsc',
    '--declaration',
    '--emitDeclarationOnly',
    '--noEmit',
    'false',
    '--declarationDir',
    typesPath,
    '--declarationMap',
  ]

  console.log('[zodern:types] => Generating package type declaration files');
  const result = spawnSync('npx', args, {
    cwd: packageDir,
    stdio: 'inherit',
  });

  if (result.status > 0) {
    console.log('Ran: ', 'npx', args.join(' '))
    throw 'Generating package types failed';
  }

  fs.writeFileSync(
    path.resolve(typesPath, 'package-types.json'),
    JSON.stringify({
      typesEntry: path.relative(packageDir, typesEntryPath).replace('.ts', '.d.ts')
    }, null, 2),
    'utf-8'
  );

  fs.writeFileSync(
    path.resolve(typesPath, '.gitignore'),
    '*',
    'utf-8'
  );

  // Remove dev npm dependencies
  console.log('[zodern:types] => Uninstalling package\'s dev dependencies');

  let npmResult = spawnSync('npm', ['prune', '--production'], {
    cwd: packageDir,
    stdio: 'inherit'
  });

  if (npmResult.status > 0) {
    throw new Error('Failed uninstalling production npm deps');
  }

  process.on('exit', () => {
    console.log('[zodern:types] => Re-installing package\'s dev dependencies');
    spawnSync('npm', ['install'], {
      cwd: packageDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'development'
      }
    });
  });
}
