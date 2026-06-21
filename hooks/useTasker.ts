import { useMemo } from 'react'
import { useGiGood } from '../lib/GiGoodContext'

export function useTasker() {
  const { state } = useGiGood()
  const jobs = state.data.jobs

  const availableJobs = useMemo(() => jobs.filter(j => j.status === 'finding'), [jobs])
  const assignedJobs = useMemo(() => jobs.filter(j => j.status === 'assigned' && !!j.taskerName), [jobs])
  const earningsList = useMemo(() => jobs.filter(j => j.status === 'completed' && j.taskerName), [jobs])
  const totalEarnings = useMemo(() => earningsList.reduce((sum, j) => sum + j.budget, 0), [earningsList])
  const chatJobs = useMemo(() => jobs.filter(j => j.status === 'assigned' || j.status === 'completed'), [jobs])

  return { availableJobs, assignedJobs, earningsList, totalEarnings, completedCount: earningsList.length, chatJobs }
}
