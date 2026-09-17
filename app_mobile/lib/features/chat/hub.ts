import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
} from '@microsoft/signalr'
import { getAccessToken } from '../../core/storage/secure-store'
import { API_BASE_URL, USE_MOCK } from '../../core/config/env'
import type { MessageDto, TypingEventDto } from './types'

export type ReceiveMessageHandler = (message: MessageDto) => void
export type TypingHandler = (event: TypingEventDto) => void

let connection: HubConnection | null = null
let startPromise: Promise<void> | null = null
const joinedGroups = new Set<string>()

/**
 * Lazily builds (never starts) the singleton `/hubs/chat` connection. The bearer
 * token is fetched per request from secure storage; `withAutomaticReconnect`
 * honours the task 04 backoff `[0, 2000, 10000]` and then gives up.
 */
export function getChatHub(): HubConnection {
  if (connection) return connection

  const hub = new HubConnectionBuilder()
    .withUrl(`${API_BASE_URL}/hubs/chat`, {
      accessTokenFactory: async () => (await getAccessToken()) ?? '',
    })
    .withAutomaticReconnect([0, 2000, 10000])
    .build()

  // Group membership lives on the connection, so re-join tracked jobs after a
  // transport reconnect (otherwise the peer's messages silently stop arriving).
  hub.onreconnected(() => {
    joinedGroups.forEach((jobId) => {
      void hub.invoke('JoinJobGroup', jobId).catch(() => undefined)
    })
  })

  connection = hub
  return hub
}

/** Starts the singleton when disconnected. Best effort: never rejects (UI must not block). */
export async function connectChatHub(): Promise<void> {
  if (USE_MOCK) return

  const hub = getChatHub()
  if (hub.state !== HubConnectionState.Disconnected) return
  if (startPromise) return startPromise

  startPromise = hub
    .start()
    .catch((error) => {
      console.warn('[chat] hub connect failed:', error)
    })
    .finally(() => {
      startPromise = null
    })

  return startPromise
}

/** Stops and drops the singleton (sign-out / role reset). */
export async function disconnectChatHub(): Promise<void> {
  const hub = connection
  connection = null
  startPromise = null
  joinedGroups.clear()
  if (!hub) return
  await hub.stop().catch(() => undefined)
}

/** Joins the per-job group so `ReceiveMessage`/`Typing` events start arriving. */
export async function joinChatJobGroup(jobId: string): Promise<void> {
  if (USE_MOCK || !jobId) return
  joinedGroups.add(jobId)
  await connectChatHub()
  const hub = connection
  if (!hub || hub.state !== HubConnectionState.Connected) return
  await hub.invoke('JoinJobGroup', jobId).catch((error) => {
    console.warn('[chat] JoinJobGroup failed:', error)
  })
}

/** Typed `ReceiveMessage` subscription; the returned cleanup calls `off`. */
export function onReceiveMessage(handler: ReceiveMessageHandler): () => void {
  if (USE_MOCK) return () => undefined
  const hub = getChatHub()
  hub.on('ReceiveMessage', handler)
  return () => hub.off('ReceiveMessage', handler)
}

/** Typed `Typing` subscription; the returned cleanup calls `off`. */
export function onTyping(handler: TypingHandler): () => void {
  if (USE_MOCK) return () => undefined
  const hub = getChatHub()
  hub.on('Typing', handler)
  return () => hub.off('Typing', handler)
}

/** Best-effort typing signal for the peer (`Typing(jobId, isTyping)` hub method). */
export async function sendChatTyping(jobId: string, isTyping: boolean): Promise<void> {
  if (USE_MOCK || !jobId) return
  await connectChatHub()
  const hub = connection
  if (!hub || hub.state !== HubConnectionState.Connected) return
  await hub.invoke('Typing', jobId, isTyping).catch(() => undefined)
}
