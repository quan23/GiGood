import { createContext, useContext, useReducer, useMemo, type ReactNode, type Dispatch } from "react";
import type { GiGoodState, Job, Role, SeekerSubTab, TaskerSubTab, Toast, Category, Availability, Vehicle } from "@/types";
import { SEED_STATE, SAMPLE_TASKERS, SEEKER_AVATAR, TASKER_AVATAR } from "@/lib/seed";

export type GiGoodAction =
  | { type: "REGISTER_ROLE"; payload: Role }
  | {
      type: "FINISH_SIGNUP_SEEKER";
      payload: { name: string; phone: string; location: string };
    }
  | {
      type: "FINISH_SIGNUP_TASKER";
      payload: {
        name: string;
        phone: string;
        location: string;
        skills: Category[];
        bio: string;
        availability: Availability;
        vehicle: Vehicle;
      };
    }
  | { type: "POST_JOB"; payload: Omit<Job, "id" | "status" | "seekerName" | "taskerName" | "chats" | "seekerRating" | "taskerRating" | "isCompletedReportedByTasker"> }
  | { type: "ASSIGN_TASKER"; payload: { jobId: number } }
  | { type: "SEND_CHAT"; payload: { jobId: number; text: string; sender: "seeker" | "tasker" } }
  | { type: "REPORT_COMPLETED"; payload: { jobId: number } }
  | { type: "CONFIRM_COMPLETED"; payload: { jobId: number; budget: number } }
  | { type: "RATE_SEEKER"; payload: { jobId: number; rating: number } }
  | { type: "RATE_TASKER"; payload: { jobId: number; rating: number } }
  | { type: "SET_ACTIVE_SEEKER_TAB"; payload: SeekerSubTab }
  | { type: "SET_ACTIVE_TASKER_TAB"; payload: TaskerSubTab }
  | { type: "SET_ACTIVE_CHAT_ID"; payload: number | null }
  | { type: "SET_CHAT_DETAIL_OPEN"; payload: boolean }
  | { type: "SET_NOTIF_OPEN"; payload: boolean }
  | { type: "SET_NOTIF_BADGE"; payload: boolean }
  | { type: "SET_MATCHING_JOB_ID"; payload: number | null }
  | { type: "SHOW_TOAST"; payload: { message: string; variant: Toast["variant"] } }
  | { type: "HIDE_TOAST" }
  | { type: "GET_ESCROW" }

function giGoodReducer(state: GiGoodState, action: GiGoodAction): GiGoodState {
  switch (action.type) {
    case "REGISTER_ROLE":
      return { ...state, auth: { ...state.auth, pendingSignupRole: action.payload } };

    case "FINISH_SIGNUP_SEEKER": {
      const { name, phone, location } = action.payload;
      return {
        ...state,
        auth: {
          ...state.auth,
          profile: {
            name,
            avatar: SEEKER_AVATAR,
            role: "seeker",
            phone,
            location,
            taskerProfile: null,
          },
          currentRole: "seeker",
        },
      };
    }

    case "FINISH_SIGNUP_TASKER": {
      const { name, phone, location, skills, bio, availability, vehicle } = action.payload;
      return {
        ...state,
        auth: {
          ...state.auth,
          profile: {
            name,
            avatar: TASKER_AVATAR,
            role: "tasker",
            phone,
            location,
            taskerProfile: {
              skills,
              bio,
              availability,
              vehicle,
              verified: false,
            },
          },
          currentRole: "tasker",
        },
      };
    }

    case "POST_JOB": {
      const nextId = Math.max(...state.data.jobs.map(j => j.id), 999) + 1;
      const newJob: Job = {
        ...action.payload,
        id: nextId,
        status: "finding",
        seekerName: state.auth.profile?.name ?? "Bạn",
        taskerName: null,
        chats: [],
        seekerRating: null,
        taskerRating: null,
        isCompletedReportedByTasker: false,
      };
      return {
        ...state,
        data: { ...state.data, jobs: [newJob, ...state.data.jobs] },
        ui: { ...state.ui, activeSeekerSubTab: "jobs", matchingJobIdRef: nextId },
      };
    }

    case "ASSIGN_TASKER": {
      const assignIndex = state.data.jobs.findIndex(j => j.id === action.payload.jobId);
      if (assignIndex === -1) return state;
      const jobs = [...state.data.jobs];
      const taskerPool = SAMPLE_TASKERS;
      const pick = taskerPool[Math.floor(Math.random() * taskerPool.length)];
      jobs[assignIndex] = {
        ...jobs[assignIndex],
        status: "assigned",
        taskerName: pick.name,
        chats: [
          {
            sender: "tasker",
            text: `Xin chào, mình là ${pick.name}, đã nhận việc. Mình sẽ đến địa điểm trong ít phút nữa ạ!`,
            time: "Vừa xong",
          },
        ],
      };
      const escrow = state.data.escrowHeldPool + jobs[assignIndex].budget;
      return {
        ...state,
        data: { ...state.data, jobs, escrowHeldPool: escrow },
        ui: { ...state.ui, activeChatId: action.payload.jobId, chatDetailOpen: true },
      };
    }

    case "SEND_CHAT": {
      const chatIndex = state.data.jobs.findIndex(j => j.id === action.payload.jobId);
      if (chatIndex === -1) return state;
      const jobs = [...state.data.jobs];
      jobs[chatIndex] = {
        ...jobs[chatIndex],
        chats: [
          ...jobs[chatIndex].chats,
          { sender: action.payload.sender, text: action.payload.text, time: "Vừa xong" },
        ],
      };
      return { ...state, data: { ...state.data, jobs } };
    }

    case "REPORT_COMPLETED": {
      const idx = state.data.jobs.findIndex(j => j.id === action.payload.jobId);
      if (idx === -1) return state;
      const jobs = [...state.data.jobs];
      jobs[idx] = { ...jobs[idx], isCompletedReportedByTasker: true };
      return { ...state, data: { ...state.data, jobs } };
    }

    case "CONFIRM_COMPLETED": {
      const idx = state.data.jobs.findIndex(j => j.id === action.payload.jobId);
      if (idx === -1) return state;
      const job = state.data.jobs[idx];
      const newEscrow = state.data.escrowHeldPool - Math.min(state.data.escrowHeldPool, action.payload.budget);
      const newTaskerWallet = state.data.taskerWallet + Math.min(action.payload.budget, state.data.escrowHeldPool);
      const jobs = [...state.data.jobs];
      jobs[idx] = { ...job, status: "completed", isCompletedReportedByTasker: false };
      return {
        ...state,
        data: { ...state.data, jobs, taskerWallet: newTaskerWallet, escrowHeldPool: newEscrow },
      };
    }

    case "RATE_SEEKER": {
      const idx = state.data.jobs.findIndex(j => j.id === action.payload.jobId);
      if (idx === -1) return state;
      const jobs = [...state.data.jobs];
      jobs[idx] = { ...jobs[idx], seekerRating: action.payload.rating };
      return { ...state, data: { ...state.data, jobs } };
    }

    case "RATE_TASKER": {
      const idx = state.data.jobs.findIndex(j => j.id === action.payload.jobId);
      if (idx === -1) return state;
      const jobs = [...state.data.jobs];
      jobs[idx] = { ...jobs[idx], taskerRating: action.payload.rating };
      return { ...state, data: { ...state.data, jobs } };
    }

    case "SET_ACTIVE_SEEKER_TAB":
      return { ...state, ui: { ...state.ui, activeSeekerSubTab: action.payload } };

    case "SET_ACTIVE_TASKER_TAB":
      return { ...state, ui: { ...state.ui, activeTaskerSubTab: action.payload } };

    case "SET_ACTIVE_CHAT_ID":
      return { ...state, ui: { ...state.ui, activeChatId: action.payload } };

    case "SET_CHAT_DETAIL_OPEN":
      return { ...state, ui: { ...state.ui, chatDetailOpen: action.payload } };

    case "SET_NOTIF_OPEN":
      return { ...state, ui: { ...state.ui, notifOpen: action.payload } };

    case "SET_NOTIF_BADGE":
      return { ...state, ui: { ...state.ui, notifBadge: action.payload } };

    case "SET_MATCHING_JOB_ID":
      return { ...state, ui: { ...state.ui, matchingJobIdRef: action.payload } };

    case "SHOW_TOAST":
      return { ...state, ui: { ...state.ui, toast: { message: action.payload.message, variant: action.payload.variant, visible: true } } };

    case "HIDE_TOAST": {
      if (!state.ui.toast) return state;
      return { ...state, ui: { ...state.ui, toast: { ...state.ui.toast, visible: false } } };
    }

    case "GET_ESCROW":
      return state;

    default:
      return state;
  }
}

const GiGoodCtx = createContext<{ state: GiGoodState; dispatch: Dispatch<GiGoodAction> } | null>(null);

export function GiGoodProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(giGoodReducer, SEED_STATE);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <GiGoodCtx.Provider value={value}>{children}</GiGoodCtx.Provider>;
}

export function useGiGood() {
  const ctx = useContext(GiGoodCtx);
  if (!ctx) throw new Error("useGiGood must be used within GiGoodProvider");
  return ctx;
}
