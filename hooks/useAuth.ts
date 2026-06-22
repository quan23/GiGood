import { useCallback } from 'react'
import { useGiGood } from '../lib/GiGoodContext'
import { Role, Category, Availability, Vehicle } from '../types'

export function useAuth() {
  const { state, dispatch } = useGiGood()
  const { profile, currentRole, pendingSignupRole } = state.auth

  const signUpSeeker = useCallback((name: string, phone: string, location: string) => {
    dispatch({ type: 'FINISH_SIGNUP_SEEKER', payload: { name, phone, location } })
  }, [dispatch])

  const signUpTasker = useCallback((name: string, phone: string, location: string, taskerProfile: { skills: Category[]; bio: string; availability: Availability; vehicle: Vehicle; verified: boolean }) => {
    dispatch({ type: 'FINISH_SIGNUP_TASKER', payload: { name, phone, location, taskerProfile } })
  }, [dispatch])

  const quickLogin = useCallback((role: Role) => {
    dispatch({ type: 'QUICK_LOGIN', payload: role })
  }, [dispatch])

  const signOut = useCallback(() => {
    dispatch({ type: 'SIGN_OUT' })
  }, [dispatch])

  const switchRole = useCallback((role: Role) => {
    dispatch({ type: 'SWITCH_ROLE', payload: role })
  }, [dispatch])

  const setPendingRole = useCallback((role: Role) => {
    dispatch({ type: 'REGISTER_ROLE', payload: role })
  }, [dispatch])

  return { profile, currentRole, pendingSignupRole, isLoggedIn: !!profile, signUpSeeker, signUpTasker, quickLogin, signOut, switchRole, setPendingRole }
}
