// Service-layer error type, exception class, and RPC error mapper.
// ServiceException is thrown by all service functions on business-rule failures.
// mapRpcError translates Supabase/PostgreSQL SQLSTATE codes from the hold/status
// RPCs into safe, user-facing ServiceErrors. Internal codes and raw messages are
// never forwarded to callers.

export interface ServiceError {
  code: string
  message: string
  statusHint: 400 | 403 | 404 | 409 | 422 | 500
}

export class ServiceException extends Error {
  readonly serviceError: ServiceError

  constructor(error: ServiceError) {
    super(error.message)
    this.name = 'ServiceException'
    this.serviceError = error
  }
}

// Maps PostgreSQL SQLSTATE codes raised by transition_diamond_status and
// extend_diamond_hold to structured ServiceErrors.
export function mapRpcError(err: unknown): ServiceError {
  const code = (err as { code?: string })?.code ?? ''
  const msg  = (err as { message?: string })?.message ?? ''

  switch (code) {
    case 'P0001': return { code: 'not_staff',            message: "You don't have permission to perform this action",          statusHint: 403 }
    case 'P0002': return { code: 'not_found',            message: 'Diamond not found',                                         statusHint: 404 }
    case 'P0003': return {
      code: 'terminal_status',
      message: msg.includes('sold') ? 'This diamond cannot be changed: it has been sold'
                                    : 'This diamond cannot be changed: it has been removed',
      statusHint: 409,
    }
    case 'P9004': return { code: 'already_in_status',    message: 'The diamond is already in the requested status',            statusHint: 409 }
    case 'P0005': return { code: 'invalid_transition',   message: 'This transition is not allowed from the current status',    statusHint: 422 }
    case 'P0006': return { code: 'insufficient_role',    message: "You don't have permission for this action",                 statusHint: 403 }
    case 'P0007': return { code: 'hold_expiry_required', message: 'Hold expiry date is required',                              statusHint: 400 }
    case 'P0008': return { code: 'hold_reason_required', message: 'Hold reason is required',                                   statusHint: 400 }
    case 'P0009': return {
      code: 'expiry_must_be_future',
      message: msg.includes('new_expiry') ? 'New expiry date must be in the future'
                                          : 'Hold expiry must be in the future',
      statusHint: 400,
    }
    case 'P0010': return { code: 'duration_exceeded',    message: 'Diamond buyers may not hold beyond 7 days',                 statusHint: 422 }
    case 'P0011': return { code: 'duration_exceeded',    message: 'Sales advisers may not hold beyond 48 hours',               statusHint: 422 }
    case 'P0012': return { code: 'not_your_hold',        message: 'You can only release your own holds',                       statusHint: 403 }
    case 'P0013': return { code: 'invalid_status',       message: 'Invalid target status',                                     statusHint: 400 }
    case 'P0014': return { code: 'expired_hold',         message: 'This hold has expired — release it first',                  statusHint: 409 }
    case 'P0015': return { code: 'not_on_hold',          message: 'Diamond is not currently on hold',                          statusHint: 409 }
    case 'P0016': return { code: 'hold_expired',         message: 'This hold has already expired',                             statusHint: 409 }
    case 'P0017': return { code: 'expiry_required',      message: 'New expiry date is required',                               statusHint: 400 }
    case 'P0018': return { code: 'expiry_not_extended',  message: 'New expiry must be later than current expiry',              statusHint: 422 }
    case 'P0019': return { code: 'hold_reason_required', message: 'Hold reason is required when extending beyond 7 days',      statusHint: 400 }
    case 'P0020': return { code: 'duration_exceeded',    message: 'Diamond buyers may not extend beyond 7 days from original hold', statusHint: 422 }
    case 'P0021': return { code: 'not_your_hold',        message: 'You can only extend your own holds',                        statusHint: 403 }
    case 'P0022': return { code: 'duration_exceeded',    message: 'Sales advisers may not extend beyond 48 hours from original hold', statusHint: 422 }
    default:
      console.error('[service] Unmapped RPC error — SQLSTATE and message excluded from response:', { code, message: msg })
      return { code: 'unexpected_error', message: 'An unexpected error occurred', statusHint: 500 }
  }
}
