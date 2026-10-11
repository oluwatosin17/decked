import { describe, expect, it } from 'vitest'
import { isPasswordRecoveryUrl, passwordUpdateErrorMessage } from './authRecovery'

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
