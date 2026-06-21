import { useMemo } from "react";
import { useGiGood } from "@/lib/GiGoodContext";
import type { Job } from "@/types";

export function useSeekerJobs() {
  const { state, dispatch } = useGiGood();
  const postedJobs = useMemo(() => state.data.jobs.filter(j => j.seekerName === state.auth.profile?.name), [state.data.jobs, state.auth.profile?.name]);
  const activeJob = useMemo(() => postedJobs.find(j => j.status === "assigned" || j.status === "finding"), [postedJobs]);

  const unreadChats = useMemo(
    () => postedJobs.filter(j => j.chats.length > 0 && j.chats[j.chats.length - 1]?.sender === "tasker"),
    [postedJobs],
  );

  const wallet = state.data.seekerWallet;
  const escrow = state.data.escrowHeldPool;

  return { postedJobs, activeJob, unreadChats, wallet, escrow, dispatch };
}
