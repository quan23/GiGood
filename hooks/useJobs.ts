import { useCallback } from "react";
import { useGiGood } from "@/lib/GiGoodContext";
import type { Category, Job } from "@/types";

export function useJobs() {
  const { state, dispatch } = useGiGood();
  const allJobs = state.data.jobs;

  const postJob = useCallback(
    (payload: Omit<Job, "id" | "status" | "seekerName" | "taskerName" | "chats" | "seekerRating" | "taskerRating" | "isCompletedReportedByTasker">) => {
      dispatch({ type: "POST_JOB", payload });
    },
    [dispatch],
  );

  const assignTasker = useCallback((jobId: number) => {
    dispatch({ type: "ASSIGN_TASKER", payload: { jobId } });
  }, [dispatch]);

  const sendChat = useCallback((jobId: number, text: string, sender: "seeker" | "tasker") => {
    dispatch({ type: "SEND_CHAT", payload: { jobId, text, sender } });
  }, [dispatch]);

  const reportCompleted = useCallback((jobId: number) => {
    dispatch({ type: "REPORT_COMPLETED", payload: { jobId } });
  }, [dispatch]);

  const confirmCompleted = useCallback((jobId: number, budget: number) => {
    dispatch({ type: "CONFIRM_COMPLETED", payload: { jobId, budget } });
  }, [dispatch]);

  const rateSeeker = useCallback((jobId: number, rating: number) => {
    dispatch({ type: "RATE_SEEKER", payload: { jobId, rating } });
  }, [dispatch]);

  const rateTasker = useCallback((jobId: number, rating: number) => {
    dispatch({ type: "RATE_TASKER", payload: { jobId, rating } });
  }, [dispatch]);

  const getJobById = useCallback((id: number) => allJobs.find(j => j.id === id), [allJobs]);

  return { allJobs, postJob, assignTasker, sendChat, reportCompleted, confirmCompleted, rateSeeker, rateTasker, getJobById };
}
