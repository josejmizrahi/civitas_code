type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  module?: string
  data?: Record<string, unknown>
  timestamp: string
  error?: { message: string; stack?: string }
}

type LogSink = (entry: LogEntry) => void

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV === true
const minLevel: LogLevel = isDev ? 'debug' : 'warn'

const sinks: LogSink[] = []

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[minLevel]
}

function createEntry(level: LogLevel, message: string, module?: string, data?: Record<string, unknown>, error?: Error): LogEntry {
  return {
    level,
    message,
    module,
    data,
    timestamp: new Date().toISOString(),
    error: error ? { message: error.message, stack: error.stack } : undefined,
  }
}

function emit(entry: LogEntry): void {
  if (isDev) {
    const prefix = entry.module ? `[${entry.module}]` : ''
    const method = entry.level === 'error' ? 'error' : entry.level === 'warn' ? 'warn' : 'log'
    console[method](`${prefix} ${entry.message}`, entry.data ?? '', entry.error ?? '')
  } else {
    // Structured JSON for production log aggregators
    console.log(JSON.stringify(entry))
  }

  for (const sink of sinks) {
    try {
      sink(entry)
    } catch {
      // Sinks must not throw
    }
  }
}

function createModuleLogger(module?: string) {
  return {
    log(message: string, ...args: unknown[]) {
      if (!shouldLog('debug')) return
      emit(createEntry('debug', message, module, args.length ? { args } : undefined))
    },
    debug(message: string, data?: Record<string, unknown>) {
      if (!shouldLog('debug')) return
      emit(createEntry('debug', message, module, data))
    },
    info(message: string, data?: Record<string, unknown>) {
      if (!shouldLog('info')) return
      emit(createEntry('info', message, module, data))
    },
    warn(message: string, ...args: unknown[]) {
      if (!shouldLog('warn')) return
      const data = typeof args[0] === 'object' && args[0] !== null ? args[0] as Record<string, unknown> : args.length ? { args } : undefined
      emit(createEntry('warn', message, module, data))
    },
    error(message: string, error?: Error | unknown, data?: Record<string, unknown>) {
      if (!shouldLog('error')) return
      const err = error instanceof Error ? error : error ? new Error(String(error)) : undefined
      emit(createEntry('error', message, module, data, err))
    },
  }
}

/**
 * Register an external log sink (e.g. Sentry, Datadog, Supabase audit log).
 * Sinks receive every log entry that passes the minimum level filter.
 */
export function registerLogSink(sink: LogSink): () => void {
  sinks.push(sink)
  return () => {
    const idx = sinks.indexOf(sink)
    if (idx >= 0) sinks.splice(idx, 1)
  }
}

/** Default logger (backwards-compatible with previous API) */
export const logger = createModuleLogger()

export { createModuleLogger }
