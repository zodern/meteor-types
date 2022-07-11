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
