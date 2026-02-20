import { createModuleLogger } from '@/shared/lib/logger'

const log = createModuleLogger('errors')

export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION'
  | 'CONFLICT'
  | 'NETWORK'
  | 'SUPABASE'
  | 'UNKNOWN'

export class AppError extends Error {
  readonly code: ErrorCode
  readonly context?: Record<string, unknown>
  readonly original?: unknown

  constructor(
    message: string,
    code: ErrorCode = 'UNKNOWN',
    options?: { context?: Record<string, unknown>; cause?: unknown }
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.context = options?.context
    this.original = options?.cause
  }

  get userMessage(): string {
    switch (this.code) {
      case 'UNAUTHORIZED': return 'Tu sesión ha expirado. Inicia sesión de nuevo.'
      case 'FORBIDDEN': return 'No tienes permisos para realizar esta acción.'
      case 'NOT_FOUND': return 'El recurso solicitado no existe.'
      case 'VALIDATION': return this.message
      case 'CONFLICT': return 'Conflicto: el recurso ya existe o fue modificado.'
      case 'NETWORK': return 'Error de conexión. Verifica tu red e intenta de nuevo.'
      default: return 'Ocurrió un error inesperado. Intenta de nuevo.'
    }
  }
}

/**
 * Normalize any error into an AppError.
 * Handles Supabase errors, network errors, and unknown throwables.
 */
export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) return error

  // Supabase PostgREST errors
  if (isSupabaseError(error)) {
    const msg = error.message || 'Error de base de datos'
    const code = mapSupabaseCode(error.code)
    return new AppError(msg, code, { cause: error, context: { supabaseCode: error.code } })
  }

  // Standard Error
  if (error instanceof Error) {
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return new AppError(error.message, 'NETWORK', { cause: error })
    }
    return new AppError(error.message, 'UNKNOWN', { cause: error })
  }

  return new AppError(String(error), 'UNKNOWN', { cause: error })
}

/**
 * Global error handler for service calls.
 * Logs the error, normalizes it, and returns a user-friendly AppError.
 */
export function handleServiceError(error: unknown, module?: string): AppError {
  const appError = normalizeError(error)
  log.error(`[${module ?? 'service'}] ${appError.message}`, appError.original as Error, appError.context)
  return appError
}

interface SupabaseErrorShape {
  message: string
  code?: string
  details?: string
  hint?: string
}

function isSupabaseError(error: unknown): error is SupabaseErrorShape {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as any).message === 'string'
  )
}

function mapSupabaseCode(code?: string): ErrorCode {
  if (!code) return 'SUPABASE'
  switch (code) {
    case '42501': return 'FORBIDDEN'
    case '23505': return 'CONFLICT'
    case 'PGRST301':
    case '401': return 'UNAUTHORIZED'
    case 'PGRST116': return 'NOT_FOUND'
    default: return 'SUPABASE'
  }
}
