import { useGiGood } from '../lib/GiGoodContext'

export function useWallet() {
  const { state } = useGiGood()
  const isSeeker = state.auth.currentRole === 'seeker'
  const wallet = isSeeker ? state.data.seekerWallet : state.data.taskerWallet
  return {
    seekerWallet: state.data.seekerWallet,
    taskerWallet: state.data.taskerWallet,
    escrowHeldPool: state.data.escrowHeldPool,
    wallet,
    isSeeker,
  }
}
