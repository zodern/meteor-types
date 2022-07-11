let enabled = process.env.DEBUG_ZODERN_TYPES === 'true';

export default function log(...args) {
  if (!enabled) {
    return;
  }

  console.log('[zodern:types]', ...args);
}
