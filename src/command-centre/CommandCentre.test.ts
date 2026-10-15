import { describe, expect, it } from 'vitest'
import { isPasswordRecoveryUrl, passwordUpdateErrorMessage, staffSignInErrorMessage } from './authRecovery'

describe('Command Centre password recovery', () => {
  it('recognizes a Supabase recovery callback after the auth client has consumed it', () => {
    expect(isPasswordRecoveryUrl('#access_token=secret&type=recovery')).toBe(true)
  })

  it('does not treat ordinary and failed callbacks as active recovery sessions', () => {
    expect(isPasswordRecoveryUrl('')).toBe(false)
    expect(isPasswordRecoveryUrl('#error=access_denied&error_code=otp_expired')).toBe(false)
  })
})

describe('password update errors', () => {
  it('explains that a reused password must be changed', () => {
    expect(passwordUpdateErrorMessage(new Error('New password should be different from the old password.')))
      .toBe('Choose a password you have not used for this account.')
  })

  it('does not expose unexpected backend details', () => {
    expect(passwordUpdateErrorMessage(new Error('sensitive backend detail')))
      .toBe('We could not update your password. Please try a different password.')
  })
})

describe('staff sign-in errors', () => {
  it('distinguishes throttling from rejected credentials', () => {
    expect(staffSignInErrorMessage(new Error('Email rate limit exceeded')))
      .toBe('Too many sign-in attempts. Wait a few minutes, then try again.')
    expect(staffSignInErrorMessage(new Error('Invalid login credentials')))
      .toBe('That email or password was not accepted. You can reset the password below.')
  })

  it('understands structured Supabase auth responses', () => {
    expect(staffSignInErrorMessage({ code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials' }))
      .toBe('That email or password was not accepted. You can reset the password below.')
  })

  it('distinguishes temporary authentication-service failures', () => {
    expect(staffSignInErrorMessage({ status: 503, message: 'upstream unavailable' }))
      .toBe('We could not reach the sign-in service. Check your connection and try again.')
  })

  it('does not expose unexpected authentication details', () => {
    expect(staffSignInErrorMessage(new Error('sensitive backend detail')))
      .toBe('Sign-in could not be completed. Please try again.')
  })
})
