export function isPasswordRecoveryUrl(hash: string) {
  return new URLSearchParams(hash.replace(/^#/, '')).get('type') === 'recovery'
}

export function passwordUpdateErrorMessage(error: unknown) {
  const message = authErrorText(error)
  if (message.includes('different from the old password')) {
    return 'Choose a password you have not used for this account.'
  }
  if (message.includes('password should be at least') || message.includes('weak password')) {
    return 'Choose a stronger password with at least 8 characters.'
  }
  if (message.includes('session') || message.includes('jwt') || message.includes('token')) {
    return 'This reset link has expired. Request a new reset link and try again.'
  }
  return 'We could not update your password. Please try a different password.'
}

export function staffSignInErrorMessage(error: unknown) {
  const message = authErrorText(error)
  if (message.includes('rate limit') || message.includes('too many')) {
    return 'Too many sign-in attempts. Wait a few minutes, then try again.'
  }
  if (message.includes('failed to fetch') || message.includes('network') || message.includes('timeout')) {
    return 'We could not reach the sign-in service. Check your connection and try again.'
  }
  if (message.includes('email not confirmed')) {
    return 'Confirm this staff email before signing in.'
  }
  if (message.includes('invalid login credentials') || message.includes('invalid_credentials')) {
    return 'That email or password was not accepted. You can reset the password below.'
  }
  if (message.includes('user not found') || message.includes('user_not_found')) {
    return 'That staff account could not be found. Check the email or ask an administrator to provision it.'
  }
  if (message.includes('disabled') || message.includes('banned')) {
    return 'This staff account is disabled. Ask an administrator to restore access.'
  }
  return 'Sign-in could not be completed. Please try again.'
}

function authErrorText(error: unknown) {
  if (error instanceof Error) return `${error.name} ${error.message}`.toLowerCase()
  if (!error || typeof error !== 'object') return String(error ?? '').toLowerCase()
  const value = error as Record<string, unknown>
  return [value.name, value.message, value.msg, value.code, value.error_code, value.status]
    .filter(part => typeof part === 'string' || typeof part === 'number')
    .join(' ')
    .toLowerCase()
}
