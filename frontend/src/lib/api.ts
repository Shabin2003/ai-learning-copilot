// API client - all backend communication

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(error.detail || `HTTP ${res.status}`)
  }

  return res.json()
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

import type {
  CreateSessionRequest, SessionResponse,
  QuestionResponse, AnswerResponse, SessionAnalytics,
  SessionSummary, ExplainConceptResponse
} from '@/types'

export const api = {
  sessions: {
    create: (data: CreateSessionRequest) =>
      request<SessionResponse>('/api/sessions/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    get: (sessionId: string) =>
      request<SessionResponse>(`/api/sessions/${sessionId}`),

    regeneratePath: (sessionId: string) =>
      request(`/api/sessions/${sessionId}/learning-path`, {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId }),
      }),
  },

  questions: {
    generate: (sessionId: string, topic?: string) =>
      request<QuestionResponse>('/api/questions/generate', {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId, topic }),
      }),

    submit: (data: {
      session_id: string
      question_id: string
      student_answer: string
      time_taken_seconds: number
    }) =>
      request<AnswerResponse>('/api/questions/submit', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    explain: (sessionId: string, concept: string, depth = 'detailed') =>
      request<ExplainConceptResponse>('/api/questions/explain', {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId, concept, depth }),
      }),
  },

  analytics: {
    get: (sessionId: string) =>
      request<SessionAnalytics>(`/api/analytics/${sessionId}`),

    summary: (sessionId: string) =>
      request<SessionSummary>(`/api/analytics/${sessionId}/summary`),
  },

  agents: {
    runDiagnostic: (sessionId: string) =>
      request('/api/agents/run', {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId, agent_type: 'diagnostic' }),
      }),

    health: (sessionId: string) =>
      request(`/api/agents/${sessionId}/health`),
  },
}
