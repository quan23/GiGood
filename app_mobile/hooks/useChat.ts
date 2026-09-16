import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import { useGiGood } from '../lib/GiGoodContext'
import { useAuth } from './useAuth'
import * as chatApi from '../lib/features/chat/api'
import {
  connectChatHub,
  joinChatJobGroup,
  onReceiveMessage,
  onTyping,
  sendChatTyping,
} from '../lib/features/chat/hub'
import type {
  ConversationListItemDto,
  MessageDto,
  MessageListResponse,
} from '../lib/features/chat/types'
import type { Job, Role } from '../types'

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === '1'
const TYPING_CLEAR_MS = 3000
const TYPING_STOP_MS = 2000

export const chatQueryKeys = {
  conversations: ['chat', 'conversations'] as const,
  messages: (conversationId: string) => ['chat', 'messages', conversationId] as const,
}

/** View model shared by the conversation list and the detail screen (real + mock). */
export type ChatConversation = {
  id: string
  jobId: string
  jobTitle: string
  peerName: string
  peerAvatar: string | null
  lastMessage: { body: string; senderId: string; createdAt: string } | null
  lastMessageIsOwn: boolean
  unreadCount: number
}

/** View model for one bubble: real `MessageDto` (or demo chat) + own/aligned flag. */
export type ChatMessage = {
  id: string
  conversationId: string
  senderId: string
  body: string
  createdAt: string
  isOwn: boolean
}

// --- offline demo (EXPO_PUBLIC_USE_MOCK=1) ------------------------------------
// Mirrors the old tabs/chat behaviour: conversations are derived from the
// GiGoodContext demo jobs and sends go back through the reducer (`SEND_CHAT`).

const MOCK_SEEKER_ID = 'mock-seeker'
const MOCK_TASKER_ID = 'mock-tasker'
const MOCK_SEEKER_AVATAR =
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150'
const MOCK_TASKER_AVATAR =
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150'

function mockSenderId(sender: Role): string {
  return sender === 'seeker' ? MOCK_SEEKER_ID : MOCK_TASKER_ID
}

function mockConversationId(job: Job): string {
  return `seed-${job.id}`
}

/** Parses the demo `HH:mm` label onto today's date so the API-shaped ISO field works. */
function timeToIso(time?: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time ?? '')
  const date = new Date()
  if (match) date.setHours(Number(match[1]), Number(match[2]), 0, 0)
  return date.toISOString()
}

function mockConversationFromJob(job: Job, role: Role): ChatConversation {
  const isSeeker = role === 'seeker'
  const last = job.chats[job.chats.length - 1]
  return {
    id: mockConversationId(job),
    jobId: mockConversationId(job),
    jobTitle: job.title,
    peerName: isSeeker ? job.taskerName ?? 'Tasker' : job.seekerName,
    peerAvatar: isSeeker ? MOCK_TASKER_AVATAR : MOCK_SEEKER_AVATAR,
    lastMessage: last
      ? {
          body: last.text,
          senderId: mockSenderId(last.sender),
          createdAt: timeToIso(last.time),
        }
      : null,
    lastMessageIsOwn: last ? last.sender === role : false,
    unreadCount: 0,
  }
}

function mockMessagesFromJob(job: Job, role: Role): ChatMessage[] {
  return job.chats.map((chat, index) => ({
    id: `seed-msg-${job.id}-${index}`,
    conversationId: mockConversationId(job),
    senderId: mockSenderId(chat.sender),
    body: chat.text,
    createdAt: timeToIso(chat.time),
    isOwn: chat.sender === role,
  }))
}

function findMockJob(jobs: Job[], conversationId: string): Job | undefined {
  const numericId = conversationId.startsWith('seed-')
    ? conversationId.slice('seed-'.length)
    : conversationId
  return jobs.find((job) => String(job.id) === numericId)
}

// --- real-mode helpers --------------------------------------------------------

function toConversationView(
  item: ConversationListItemDto,
  ownId: string | null,
  role: Role,
): ChatConversation {
  return {
    id: item.id,
    jobId: item.jobId,
    jobTitle: item.job.title,
    peerName: item.peer?.name ?? (role === 'seeker' ? 'Chưa có Tasker' : 'Khách hàng'),
    peerAvatar: item.peer?.avatarUrl ?? null,
    lastMessage: item.lastMessage
      ? {
          body: item.lastMessage.body,
          senderId: item.lastMessage.senderId,
          createdAt: item.lastMessage.createdAt,
        }
      : null,
    lastMessageIsOwn: !!item.lastMessage && item.lastMessage.senderId === ownId,
    unreadCount: item.unreadCount,
  }
}

function sortMessagesAsc(messages: MessageDto[], ownId: string | null): ChatMessage[] {
  return [...messages]
    .sort((a, b) => {
      const diff = Date.parse(a.createdAt) - Date.parse(b.createdAt)
      return diff !== 0 ? diff : a.id.localeCompare(b.id)
    })
    .map((message) => ({ ...message, isOwn: message.senderId === ownId }))
}

/** Dedupes by id (REST send + hub echo) and bumps the list preview for the sender. */
function mergeMessageIntoCache(queryClient: QueryClient, message: MessageDto): void {
  queryClient.setQueryData<MessageListResponse>(
    chatQueryKeys.messages(message.conversationId),
    (prev) => {
      if (!prev) return prev
      if (prev.messages.some((item) => item.id === message.id)) return prev
      return { ...prev, messages: [message, ...prev.messages] }
    },
  )

  queryClient.setQueryData<ConversationListItemDto[]>(
    chatQueryKeys.conversations,
    (prev) => {
      if (!prev) return prev
      const index = prev.findIndex((item) => item.id === message.conversationId)
      if (index < 0) return prev
      const updated: ConversationListItemDto = {
        ...prev[index],
        lastMessage: {
          id: message.id,
          body: message.body,
          senderId: message.senderId,
          createdAt: message.createdAt,
        },
      }
      // Newest activity first, matching the API ordering.
      return [updated, ...prev.slice(0, index), ...prev.slice(index + 1)]
    },
  )
}

/**
 * Chat data source for the app, backed by React Query + the `/hubs/chat`
 * SignalR stream. With `EXPO_PUBLIC_USE_MOCK=1` it renders the existing
 * GiGoodContext demo chats in-memory instead.
 *
 * Pass a conversation id on the detail screen; call without arguments for the
 * conversation list.
 */
export function useChat(activeConversationId?: string, jobIdHint?: string) {
  const queryClient = useQueryClient()
  const { state, dispatch } = useGiGood()
  const { profile, currentRole } = useAuth()

  const activeId =
    activeConversationId && activeConversationId.length > 0 ? activeConversationId : undefined
  const ownId = profile?.id ?? null
  const hint = jobIdHint && jobIdHint.length > 0 ? jobIdHint : undefined

  // --- conversations list -----------------------------------------------------

  const conversationsQuery = useQuery<ConversationListItemDto[]>({
    queryKey: chatQueryKeys.conversations,
    queryFn: chatApi.listConversations,
    enabled: !USE_MOCK,
  })

  const mockConversations = useMemo<ChatConversation[]>(() => {
    if (!USE_MOCK) return []
    const jobs = state.data.jobs.filter((job) =>
      currentRole === 'seeker' ? true : !!job.taskerName || job.chats.some((c) => c.sender === 'tasker'),
    )
    return jobs.map((job) => mockConversationFromJob(job, currentRole))
  }, [state.data.jobs, currentRole])

  const conversations = useMemo<ChatConversation[]>(() => {
    if (USE_MOCK) return mockConversations
    return (conversationsQuery.data ?? []).map((item) =>
      toConversationView(item, ownId, currentRole),
    )
  }, [mockConversations, conversationsQuery.data, ownId, currentRole])

  const conversation = useMemo<ChatConversation | null>(
    () => (activeId ? conversations.find((item) => item.id === activeId) ?? null : null),
    [conversations, activeId],
  )

  // Falls back to the route's `jobId` param when the list hasn't resolved the
  // conversation yet (freshly created / not visible yet) so realtime still joins.
  const jobId = conversation?.jobId ?? hint ?? null

  // --- message history --------------------------------------------------------

  const messagesQuery = useQuery<MessageListResponse>({
    queryKey: chatQueryKeys.messages(activeId ?? ''),
    queryFn: () => chatApi.listMessages(activeId as string),
    enabled: !USE_MOCK && !!activeId,
  })

  const messagesFor = useCallback(
    (conversationId: string): ChatMessage[] => {
      if (USE_MOCK) {
        const job = findMockJob(state.data.jobs, conversationId)
        return job ? mockMessagesFromJob(job, currentRole) : []
      }
      const cached = queryClient.getQueryData<MessageListResponse>(
        chatQueryKeys.messages(conversationId),
      )
      return sortMessagesAsc(cached?.messages ?? [], ownId)
    },
    [state.data.jobs, currentRole, queryClient, ownId],
  )

  const messages = useMemo<ChatMessage[]>(() => {
    if (!activeId) return []
    if (USE_MOCK) return messagesFor(activeId)
    return sortMessagesAsc(messagesQuery.data?.messages ?? [], ownId)
  }, [activeId, messagesFor, messagesQuery.data, ownId])

  // --- mutations --------------------------------------------------------------

  const sendMutation = useMutation({
    mutationFn: async ({ conversationId, body }: { conversationId: string; body: string }) => {
      if (USE_MOCK) {
        const job = findMockJob(state.data.jobs, conversationId)
        if (!job) throw new Error('Không tìm thấy cuộc trò chuyện.')
        const now = new Date()
        dispatch({
          type: 'SEND_CHAT',
          payload: {
            jobId: job.id,
            sender: currentRole,
            text: body,
            time: `${now.getHours().toString().padStart(2, '0')}:${now
              .getMinutes()
              .toString()
              .padStart(2, '0')}`,
          },
        })
        return null
      }
      return chatApi.sendMessage(conversationId, body)
    },
    onSuccess: (message) => {
      if (message) mergeMessageIntoCache(queryClient, message)
    },
  })

  const sendMessage = useCallback(
    async (body: string) => {
      if (!activeId) throw new Error('Chưa chọn cuộc trò chuyện.')
      const trimmed = body.trim()
      if (!trimmed) return
      await sendMutation.mutateAsync({ conversationId: activeId, body: trimmed })
    },
    [activeId, sendMutation],
  )

  const openMutation = useMutation({
    mutationFn: async (jobIdToOpen: string) => {
      if (USE_MOCK) return { id: jobIdToOpen }
      return chatApi.createConversation(jobIdToOpen)
    },
    onSuccess: () => {
      if (!USE_MOCK) void queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations })
    },
  })

  /** Create-or-get the conversation for a job and return its id (idempotent). */
  const openConversation = useCallback(
    async (jobIdToOpen: string): Promise<string> => {
      const result = await openMutation.mutateAsync(jobIdToOpen)
      return result.id
    },
    [openMutation],
  )

  // --- pagination -------------------------------------------------------------

  const [loadingMore, setLoadingMore] = useState(false)

  const loadMore = useCallback(async () => {
    if (USE_MOCK || !activeId || loadingMore) return
    const key = chatQueryKeys.messages(activeId)
    const current = queryClient.getQueryData<MessageListResponse>(key)
    if (!current?.nextCursor) return

    setLoadingMore(true)
    try {
      const page = await chatApi.listMessages(activeId, current.nextCursor)
      queryClient.setQueryData<MessageListResponse>(key, (prev) => {
        if (!prev) return page
        const seen = new Set(prev.messages.map((item) => item.id))
        const older = page.messages.filter((item) => !seen.has(item.id))
        return { messages: [...prev.messages, ...older], nextCursor: page.nextCursor }
      })
    } catch (error) {
      console.warn('[chat] load more messages failed:', error)
    } finally {
      setLoadingMore(false)
    }
  }, [activeId, loadingMore, queryClient])

  // --- realtime (ReceiveMessage / Typing) -------------------------------------

  const [typing, setTyping] = useState(false)
  const typingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const typingStopRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const typingSentRef = useRef(false)

  // Switching conversations resets the indicator and any in-flight typing signal.
  useEffect(() => {
    setTyping(false)
    if (typingClearRef.current) {
      clearTimeout(typingClearRef.current)
      typingClearRef.current = null
    }
    if (typingStopRef.current) {
      clearTimeout(typingStopRef.current)
      typingStopRef.current = null
    }
    typingSentRef.current = false
  }, [activeId])

  useEffect(() => {
    if (USE_MOCK || !activeId) return undefined

    const offReceive = onReceiveMessage((message) => {
      mergeMessageIntoCache(queryClient, message)
    })

    const offTyping = onTyping((event) => {
      if (!jobId || event.jobId !== jobId || event.userId === ownId) return
      if (event.isTyping) {
        setTyping(true)
        if (typingClearRef.current) clearTimeout(typingClearRef.current)
        typingClearRef.current = setTimeout(() => setTyping(false), TYPING_CLEAR_MS)
      } else {
        if (typingClearRef.current) clearTimeout(typingClearRef.current)
        typingClearRef.current = null
        setTyping(false)
      }
    })

    void connectChatHub()
    if (jobId) void joinChatJobGroup(jobId)

    return () => {
      offReceive()
      offTyping()
      if (typingClearRef.current) {
        clearTimeout(typingClearRef.current)
        typingClearRef.current = null
      }
      if (typingStopRef.current) {
        clearTimeout(typingStopRef.current)
        typingStopRef.current = null
      }
      typingSentRef.current = false
    }
  }, [activeId, jobId, ownId, queryClient])

  /** Debounced `Typing(jobId, bool)` outbound signal, wired to the input row. */
  const notifyTyping = useCallback(
    (isTyping: boolean) => {
      if (USE_MOCK || !jobId) return
      if (!isTyping) {
        if (!typingSentRef.current) return
        typingSentRef.current = false
        void sendChatTyping(jobId, false)
        return
      }
      if (!typingSentRef.current) {
        typingSentRef.current = true
        void sendChatTyping(jobId, true)
      }
      if (typingStopRef.current) clearTimeout(typingStopRef.current)
      typingStopRef.current = setTimeout(() => {
        typingSentRef.current = false
        void sendChatTyping(jobId, false)
      }, TYPING_STOP_MS)
    },
    [jobId],
  )

  const refetch = useCallback(async () => {
    if (USE_MOCK) return
    await conversationsQuery.refetch()
  }, [conversationsQuery])

  return {
    // Demo surface (task 04): conversations / messages / activeChatId / sendMessage / typing.
    conversations,
    messages,
    activeChatId: activeId ?? null,
    sendMessage,
    typing,
    // Conversation list.
    conversationsLoading: USE_MOCK ? false : conversationsQuery.isLoading,
    refreshing: USE_MOCK ? false : conversationsQuery.isRefetching,
    refetch,
    // Detail / realtime.
    conversation,
    jobId,
    messagesLoading: USE_MOCK ? false : messagesQuery.isLoading,
    loading: USE_MOCK ? false : activeId ? messagesQuery.isLoading : conversationsQuery.isLoading,
    error: USE_MOCK ? null : messagesQuery.error,
    hasMore: USE_MOCK ? false : !!messagesQuery.data?.nextCursor,
    loadingMore,
    loadMore,
    isSending: USE_MOCK ? false : sendMutation.isPending,
    isOpening: USE_MOCK ? false : openMutation.isPending,
    openConversation,
    messagesFor,
    notifyTyping,
  }
}
