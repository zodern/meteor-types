'use strict';

let enabled = process.env.DEBUG_ZODERN_TYPES === 'true';

module.exports = function log() {
  if (!enabled) {
    return;
  }

  let args = Array.from(arguments);

  console.log.apply(
    console,
    ['[zodern:types]'].concat(args)
  );
}
