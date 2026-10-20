// Client for the FinSage AI service (ai-service/). The browser talks to it directly with the user's
// SmartStock token; the service verifies it and reads the account through the backend on the user's behalf.
import { API_CONFIG } from './config'

const BASE = API_CONFIG.AI_SERVICE_URL.replace(/\/$/, '')

export interface ToolActivity { id: string; name: string; label: string; ok?: boolean }
export interface Source { id: number; title: string; section: string; path: string }
export interface OrderDraft {
    symbol: string
    name?: string
    side: 'BUY' | 'SELL'
    quantity: number
    estimated_price: number
    estimated_value: number
    estimated_charges: number
    estimated_total: number
    cash_available: number
    cash_after_order?: number
    shares_held: number
    reason?: string
    warnings: string[]
    executable: boolean
}
export interface AdvisorMessage {
    id: string
    role: 'user' | 'assistant'
    content: string
    tools?: { name: string; ok: boolean }[]
    sources?: Source[]
    proposals?: OrderDraft[]
    feedback?: 'up' | 'down'
    created_at?: string
}
export interface ConversationSummary { id: string; title: string; updated_at: string; preview: string }
export interface Memory { id: string; text: string; category: string; source: string; created_at: string }

export interface StreamHandlers {
    onConversation?: (id: string, isNew: boolean) => void
    onStatus?: (text: string) => void
    onToolStart?: (tool: ToolActivity) => void
    onToolEnd?: (id: string, ok: boolean) => void
    onToken?: (text: string) => void
    onSources?: (sources: Source[]) => void
    onProposal?: (draft: OrderDraft) => void
    onMemory?: (saved: string[]) => void
    onDone?: (messageId: string) => void
    onError?: (message: string) => void
}

function authHeaders(): Record<string, string> {
    const token = localStorage.getItem('token')
    return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
        ...init,
        headers: { 'Content-Type': 'application/json', ...authHeaders(), ...(init.headers || {}) }
    })
    if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail || `AI service error ${res.status}`)
    }
    return res.json()
}

export const advisor = {
    listConversations: () => request<{ conversations: ConversationSummary[] }>('/v1/conversations').then(r => r.conversations),
    getConversation: (id: string) => request<{ id: string; title: string; messages: AdvisorMessage[] }>(`/v1/conversations/${id}`),
    deleteConversation: (id: string) => request(`/v1/conversations/${id}`, { method: 'DELETE' }),
    listMemories: () => request<{ memories: Memory[] }>('/v1/memories').then(r => r.memories),
    deleteMemory: (id: string) => request(`/v1/memories/${id}`, { method: 'DELETE' }),
    clearMemories: () => request('/v1/memories', { method: 'DELETE' }),
    feedback: (messageId: string, rating: 'up' | 'down') =>
        request(`/v1/messages/${messageId}/feedback`, { method: 'POST', body: JSON.stringify({ rating }) }),
    starters: () => request<{ starters: string[] }>('/v1/starters').then(r => r.starters),
    health: () => fetch(`${BASE}/health`).then(r => r.ok).catch(() => false),

    /** POST /v1/chat and dispatch Server-Sent Events as they arrive. Abort with the signal to stop generating. */
    async chat(message: string, conversationId: string | null, handlers: StreamHandlers, signal?: AbortSignal) {
        const res = await fetch(`${BASE}/v1/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream', ...authHeaders() },
            body: JSON.stringify({ message, conversation_id: conversationId }),
            signal
        })
        if (!res.ok || !res.body) {
            const body = await res.json().catch(() => ({}))
            handlers.onError?.(body.detail || (res.status === 429 ? 'Too many messages, wait a few seconds.' : 'The AI advisor is unavailable right now.'))
            return
        }
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        for (;;) {
            const { value, done } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })
            // SSE frames are separated by a blank line.
            let split
            while ((split = buffer.search(/\r?\n\r?\n/)) !== -1) {
                const frame = buffer.slice(0, split)
                buffer = buffer.slice(split).replace(/^\r?\n\r?\n/, '')
                let event = 'message'
                const data: string[] = []
                for (const line of frame.split(/\r?\n/)) {
                    if (line.startsWith('event:')) event = line.slice(6).trim()
                    else if (line.startsWith('data:')) data.push(line.slice(5).trimStart())
                }
                if (!data.length) continue // keep-alive ping
                dispatch(event, JSON.parse(data.join('\n')), handlers)
            }
        }
    }
}

function dispatch(event: string, data: any, h: StreamHandlers) { // eslint-disable-line @typescript-eslint/no-explicit-any
    switch (event) {
        case 'conversation': return h.onConversation?.(data.conversation_id, data.is_new)
        case 'status': return h.onStatus?.(data.text)
        case 'tool_start': return h.onToolStart?.(data)
        case 'tool_end': return h.onToolEnd?.(data.id, data.ok)
        case 'token': return h.onToken?.(data.text)
        case 'sources': return h.onSources?.(data.sources)
        case 'proposal': return h.onProposal?.(data)
        case 'memory': return h.onMemory?.(data.saved)
        case 'done': return h.onDone?.(data.message_id)
        case 'error': return h.onError?.(data.message)
    }
}
