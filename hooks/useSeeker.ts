import { useMemo } from 'react'
import { useGiGood } from '../lib/GiGoodContext'

export function useSeeker() {
  const { state } = useGiGood()
  const jobs = state.data.jobs

  const activeJobs = useMemo(() => jobs.filter(j => j.status === 'finding' || j.status === 'assigned'), [jobs])
  const history = useMemo(() => jobs.filter(j => j.status === 'completed'), [jobs])
  const chatJobs = useMemo(() => jobs.filter(j => j.status === 'assigned' || j.status === 'completed'), [jobs])

  return { activeJobs, history, chatJobs }
}
