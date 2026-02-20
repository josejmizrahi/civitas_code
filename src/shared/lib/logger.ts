/**
 * Dev-only logger. In production all methods are no-ops to avoid leaking debug info.
 * Uses Vite's import.meta.env.DEV (true in dev, false in production build).
 */
const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV === true

function noop(_message?: unknown, ..._args: unknown[]) {}

export const logger = {
  log: isDev ? (...args: unknown[]) => console.log(...args) : noop,
  info: isDev ? (...args: unknown[]) => console.info(...args) : noop,
  warn: isDev ? (...args: unknown[]) => console.warn(...args) : noop,
  error: isDev ? (...args: unknown[]) => console.error(...args) : noop,
  debug: isDev ? (...args: unknown[]) => console.debug(...args) : noop,
}
