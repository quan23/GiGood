import { useMemo } from "react";
import { useGiGood } from "@/lib/GiGoodContext";
import type { Job } from "@/types";

export function useTaskerBoard() {
  const { state, dispatch } = useGiGood();
  const availableJobs: Job[] = useMemo(() => state.data.jobs.filter(j => j.status === "finding"), [state.data.jobs]);
  const activeJobs: Job[] = useMemo(() => state.data.jobs.filter(j => j.status === "assigned" && j.taskerName === state.auth.profile?.name), [state.data.jobs, state.auth.profile?.name]);
  const completedJobs: Job[] = useMemo(() => state.data.jobs.filter(j => j.status === "completed" && j.taskerName === state.auth.profile?.name), [state.data.jobs, state.auth.profile?.name]);
  const earnings = state.data.taskerWallet;

  return { availableJobs, activeJobs, completedJobs, earnings, dispatch };
}
