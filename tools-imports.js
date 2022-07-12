const path = require('path');

const mainModule = global.process.mainModule;
const absPath = mainModule.filename.split(path.sep).slice(0, -1).join(path.sep);
const toolsRequire = function (filePath) {
  return mainModule.require(path.resolve(absPath, filePath));
};

module.exports = {
  PackageSource: toolsRequire('isobuild/package-source'),
  ProjectContext: toolsRequire('./project-context').ProjectContext
}
