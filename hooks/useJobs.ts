import { useCallback } from 'react'
import { useGiGood } from '../lib/GiGoodContext'
import { Category } from '../types'

export function useJobs() {
  const { state, dispatch } = useGiGood()

  const jobs = state.data.jobs

  const postJob = useCallback((title: string, category: Category, description: string, budget: number, location: string) => {
    dispatch({ type: 'POST_JOB', payload: { title, category, description, budget, location } })
  }, [dispatch])

  const startMatching = useCallback((jobId: number) => {
    dispatch({ type: 'START_MATCHING', payload: jobId })
  }, [dispatch])

  const acceptJob = useCallback((jobId: number, taskerName: string) => {
    dispatch({ type: 'ACCEPT_JOB', payload: { jobId, taskerName } })
  }, [dispatch])

  const reportCompleted = useCallback((jobId: number) => {
    dispatch({ type: 'REPORT_COMPLETED', payload: jobId })
  }, [dispatch])

  const releaseEscrow = useCallback((jobId: number, rating: number, comment: string) => {
    dispatch({ type: 'RELEASE_ESCROW', payload: { jobId, rating, comment } })
  }, [dispatch])

  const rateTasker = useCallback((jobId: number, rating: number, comment: string) => {
    dispatch({ type: 'RATE_TASKER', payload: { jobId, rating, comment } })
  }, [dispatch])

  return { jobs, postJob, startMatching, acceptJob, reportCompleted, releaseEscrow, rateTasker }
}
