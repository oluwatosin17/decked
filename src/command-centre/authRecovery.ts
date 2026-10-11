export function isPasswordRecoveryUrl(hash: string) {
  return new URLSearchParams(hash.replace(/^#/, '')).get('type') === 'recovery'
}

export function passwordUpdateErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : ''
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
  const message = error instanceof Error ? error.message.toLowerCase() : ''
  if (message.includes('rate limit') || message.includes('too many')) {
    return 'Too many sign-in attempts. Wait a few minutes, then try again.'
  }
  if (message.includes('failed to fetch') || message.includes('network') || message.includes('timeout')) {
    return 'We could not reach the sign-in service. Check your connection and try again.'
  }
  if (message.includes('email not confirmed')) {
    return 'Confirm this staff email before signing in.'
  }
  if (message.includes('invalid login credentials')) {
    return 'That email or password was not accepted. You can reset the password below.'
  }
  return 'Sign-in could not be completed. Please try again.'
}
