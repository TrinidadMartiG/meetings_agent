// Server-side (Next.js container): use internal Docker URL → http://backend:8000
// Client-side (browser): use public URL → http://localhost:8000
const API_URL =
  typeof window === "undefined"
    ? process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    : process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export async function apiFetch<T>(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const isFormData = options.body instanceof FormData
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(error.detail || "API error")
  }
  if (res.status === 204) return undefined as unknown as T
  return res.json()
}

export const api = {
  // Clients
  getClients: (token: string) => apiFetch<Client[]>("/clients", token),
  createClient: (token: string, name: string) =>
    apiFetch<Client>("/clients", token, {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  deleteClient: (token: string, id: string) =>
    apiFetch<void>(`/clients/${id}`, token, { method: "DELETE" }),

  // Meetings
  getMeetings: (token: string, clientId?: string) =>
    apiFetch<MeetingListItem[]>(
      `/meetings${clientId ? `?client_id=${clientId}` : ""}`,
      token
    ),
  getMeeting: (token: string, id: string) =>
    apiFetch<Meeting>(`/meetings/${id}`, token),
  createMeeting: (token: string, data: CreateMeetingData) =>
    apiFetch<Meeting>("/meetings", token, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  processMeeting: (token: string, id: string) =>
    apiFetch<{ message: string }>(`/meetings/${id}/process`, token, {
      method: "POST",
    }),
  updateMeeting: (token: string, id: string, data: { client_id: string }) =>
    apiFetch<Meeting>(`/meetings/${id}`, token, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteMeeting: (token: string, id: string) =>
    apiFetch<void>(`/meetings/${id}`, token, { method: "DELETE" }),

  // Insights
  getInsights: (
    token: string,
    params: { meetingId?: string; clientId?: string }
  ) => {
    const q = params.meetingId
      ? `?meeting_id=${params.meetingId}`
      : params.clientId
      ? `?client_id=${params.clientId}`
      : ""
    return apiFetch<Insight[]>(`/insights${q}`, token)
  },

  // Tasks
  getTasks: (token: string, params?: { status?: string; clientId?: string }) => {
    const q = new URLSearchParams()
    if (params?.status) q.set("status", params.status)
    if (params?.clientId) q.set("client_id", params.clientId)
    return apiFetch<Task[]>(
      `/tasks${q.toString() ? `?${q.toString()}` : ""}`,
      token
    )
  },
  createTask: (token: string, data: CreateTaskData) =>
    apiFetch<Task>("/tasks", token, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateTask: (token: string, id: string, data: Partial<Task>) =>
    apiFetch<Task>(`/tasks/${id}`, token, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteTask: (token: string, id: string) =>
    apiFetch<void>(`/tasks/${id}`, token, { method: "DELETE" }),
  getWeeklyDigest: (token: string) =>
    apiFetch<string[]>("/tasks/weekly-digest", token),
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Client {
  id: string
  name: string
  user_id: string
  created_at: string
}

export interface MeetingListItem {
  id: string
  title: string
  client_id: string | null
  meeting_date: string
  processed: boolean
  created_at: string
}

export interface Meeting extends MeetingListItem {
  transcription_text: string
  user_id: string
}

export type InsightType =
  | "key_point"
  | "action_item"
  | "recommendation"
  | "reminder"
  | "client_context"

export interface Insight {
  id: string
  meeting_id: string
  type: InsightType
  content: string
  priority: number
}

export interface Task {
  id: string
  user_id: string
  meeting_id: string | null
  client_id: string | null
  description: string
  status: "pending" | "done"
  due_date: string | null
  created_at: string
}

export interface CreateMeetingData {
  title: string
  client_id?: string
  meeting_date: string
  transcription_text: string
}

export interface CreateTaskData {
  description: string
  client_id?: string
  due_date?: string
}
