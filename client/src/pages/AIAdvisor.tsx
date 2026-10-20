import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
    Sparkles, Send, Square, Plus, Trash2, Brain, Copy, Check, ThumbsUp, ThumbsDown, BookOpen, Loader2,
    CheckCircle2, XCircle, MessageSquare, X, PanelLeft, Briefcase, LineChart, Newspaper, ShieldCheck
} from 'lucide-react'
import { advisor } from '@/lib/advisor'
import type { AdvisorMessage, ConversationSummary, Memory, OrderDraft, Source, ToolActivity } from '@/lib/advisor'
import Markdown from '@/components/advisor/Markdown'
import OrderDraftCard from '@/components/advisor/OrderDraftCard'
import { cn } from '@/lib/utils'

interface ChatMessage extends AdvisorMessage {
    streaming?: boolean
    status?: string
    activity?: ToolActivity[]
    error?: string
}

const TOOL_NAMES: Record<string, string> = {
    get_account_overview: 'Account', get_holdings: 'Holdings', get_order_history: 'Orders', get_watchlist: 'Watchlist',
    analyze_portfolio: 'Portfolio Doctor', propose_order: 'Order draft', get_quote: 'Quote', get_fundamentals: 'Fundamentals',
    get_price_history: 'Price history', compare_stocks: 'Compare', search_stocks: 'Stock search', get_market_overview: 'Market',
    get_news: 'News', get_ipos: 'IPOs', search_knowledge: 'Knowledge base', remember_user_fact: 'Memory'
}

const CAPABILITIES = [
    { icon: Briefcase, title: 'Knows your account', body: 'Holdings, P&L, orders and a Portfolio Doctor review.' },
    { icon: LineChart, title: 'Live market data', body: 'Quotes, fundamentals, price history and comparisons.' },
    { icon: Newspaper, title: 'News and IPOs', body: 'Tagged headlines with measured impact, and NSE IPOs.' },
    { icon: BookOpen, title: 'Grounded answers', body: 'Tax, SEBI rules and concepts from a curated knowledge base.' }
]

const timeAgo = (iso: string) => {
    const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
    if (mins < 60) return `${Math.max(mins, 1)}m`
    if (mins < 1440) return `${Math.round(mins / 60)}h`
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function ActivityList({ activity, status, streaming }: { activity: ToolActivity[]; status?: string; streaming?: boolean }) {
    if (!activity.length && !(streaming && status)) return null
    return (
        <ul className="mb-2 space-y-1">
            {activity.map(a => (
                <li key={a.id} className="flex items-center gap-2 text-xs text-zinc-500">
                    {a.ok === undefined ? <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-500" />
                        : a.ok ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-rose-500" />}
                    {a.label}
                </li>
            ))}
            {streaming && !activity.length && status && (
                <li className="flex items-center gap-2 text-xs text-zinc-500"><Loader2 className="w-3.5 h-3.5 animate-spin text-brand-500" />{status}…</li>
            )}
        </ul>
    )
}

function SourcesRow({ sources }: { sources: Source[] }) {
    return (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-zinc-400 flex items-center gap-1"><BookOpen className="w-3 h-3" /> Sources</span>
            {sources.map(s => (
                <span key={`${s.path}-${s.section}`} title={s.path} className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                    {s.title} › {s.section}
                </span>
            ))}
        </div>
    )
}

function AssistantMessage({ message, onFeedback }: { message: ChatMessage; onFeedback: (id: string, rating: 'up' | 'down') => void }) {
    const [copied, setCopied] = useState(false)
    const usedTools = message.tools?.map(t => TOOL_NAMES[t.name] || t.name) ?? []
    return (
        <div className="flex gap-3">
            <div className="w-7 h-7 shrink-0 rounded-lg bg-brand-600 text-white flex items-center justify-center mt-0.5"><Sparkles className="w-3.5 h-3.5" /></div>
            <div className="min-w-0 flex-1 text-[15px] text-zinc-800 dark:text-zinc-200">
                {message.streaming
                    ? <ActivityList activity={message.activity ?? []} status={message.status} streaming />
                    : usedTools.length > 0 && <p className="mb-2 text-[11px] text-zinc-400">Checked: {[...new Set(usedTools)].join(' · ')}</p>}
                {message.content && <Markdown>{message.content}</Markdown>}
                {message.streaming && message.content && <span className="inline-block w-1.5 h-4 align-middle bg-brand-500 animate-pulse ml-0.5" />}
                {message.error && <p className="text-sm text-rose-600 dark:text-rose-400">{message.error}</p>}
                {message.proposals?.map((d: OrderDraft, i) => <OrderDraftCard key={`${message.id}-${i}`} draft={d} />)}
                {message.sources && message.sources.length > 0 && <SourcesRow sources={message.sources} />}
                {!message.streaming && message.content && message.id && (
                    <div className="mt-2 flex items-center gap-1 text-zinc-400">
                        <button title="Copy" onClick={() => { navigator.clipboard.writeText(message.content); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
                            className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700">
                            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button title="Helpful" onClick={() => onFeedback(message.id, 'up')} className={cn('p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800', message.feedback === 'up' && 'text-emerald-600')}><ThumbsUp className="w-3.5 h-3.5" /></button>
                        <button title="Not helpful" onClick={() => onFeedback(message.id, 'down')} className={cn('p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800', message.feedback === 'down' && 'text-rose-600')}><ThumbsDown className="w-3.5 h-3.5" /></button>
                    </div>
                )}
            </div>
        </div>
    )
}

function MemoryPanel({ onClose, refreshKey }: { onClose: () => void; refreshKey: number }) {
    const [memories, setMemories] = useState<Memory[] | null>(null)
    const load = useCallback(() => { advisor.listMemories().then(setMemories).catch(() => setMemories([])) }, [])
    useEffect(() => { load() }, [load, refreshKey])
    const remove = async (id: string) => { setMemories(m => m?.filter(x => x.id !== id) ?? null); await advisor.deleteMemory(id).catch(load) }
    const clearAll = async () => {
        if (!window.confirm('Forget everything FinSage remembers about you?')) return
        setMemories([]); await advisor.clearMemories().catch(load)
    }
    return (
        <aside className="w-80 shrink-0 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col">
            <div className="h-12 flex items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800">
                <span className="flex items-center gap-2 text-sm font-semibold"><Brain className="w-4 h-4 text-brand-600 dark:text-brand-300" /> What FinSage remembers</span>
                <button onClick={onClose} className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"><X className="w-4 h-4" /></button>
            </div>
            <p className="px-4 py-3 text-xs text-zinc-500 leading-relaxed">
                Facts you share about yourself (goals, horizon, risk appetite, preferences) are saved so advice stays personal across chats.
                Your portfolio is always read live and never stored here.
            </p>
            <ul className="flex-1 overflow-y-auto px-2 pb-2">
                {memories === null && <li className="px-2 text-xs text-zinc-400">Loading…</li>}
                {memories?.length === 0 && <li className="px-2 text-sm text-zinc-500">Nothing yet. Tell FinSage about your goals and it will remember.</li>}
                {memories?.map(m => (
                    <li key={m.id} className="group flex items-start gap-2 px-2 py-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                        <span className="flex-1 min-w-0">
                            <span className="block text-sm text-zinc-800 dark:text-zinc-200">{m.text}</span>
                            <span className="block text-[11px] text-zinc-400 mt-0.5">{m.category.replace('_', ' ')} · {timeAgo(m.created_at)}</span>
                        </span>
                        <button onClick={() => remove(m.id)} title="Forget this" className="p-1 rounded text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                    </li>
                ))}
            </ul>
            {memories && memories.length > 0 && (
                <button onClick={clearAll} className="m-3 h-8 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10">Forget everything</button>
            )}
        </aside>
    )
}

export default function AIAdvisor() {
    const [params, setParams] = useSearchParams()
    const conversationId = params.get('c')
    const [conversations, setConversations] = useState<ConversationSummary[]>([])
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [starters, setStarters] = useState<string[]>([])
    const [input, setInput] = useState('')
    const [busy, setBusy] = useState(false)
    const [showHistory, setShowHistory] = useState(false)
    const [showMemory, setShowMemory] = useState(false)
    const [memoryVersion, setMemoryVersion] = useState(0)
    const [offline, setOffline] = useState(false)
    const abortRef = useRef<AbortController | null>(null)
    const scrollRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)
    const skipLoadRef = useRef<string | null>(null)

    const refreshConversations = useCallback(() => { advisor.listConversations().then(setConversations).catch(() => {}) }, [])

    useEffect(() => {
        advisor.health().then(ok => setOffline(!ok))
        refreshConversations()
        advisor.starters().then(setStarters).catch(() => setStarters([]))
    }, [refreshConversations])

    // Load a conversation when the URL points at one (but not the one we just created while streaming).
    useEffect(() => {
        if (!conversationId) { setMessages([]); return }
        if (skipLoadRef.current === conversationId) return
        advisor.getConversation(conversationId)
            .then(c => setMessages(c.messages))
            .catch(() => setParams({}, { replace: true }))
    }, [conversationId, setParams])

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }, [messages])

    const patchLast = (patch: (m: ChatMessage) => ChatMessage) =>
        setMessages(prev => prev.map((m, i) => (i === prev.length - 1 ? patch(m) : m)))

    const send = async (text: string) => {
        const message = text.trim()
        if (!message || busy) return
        setInput('')
        setBusy(true)
        setMessages(prev => [...prev,
            { id: `u-${Date.now()}`, role: 'user', content: message },
            { id: '', role: 'assistant', content: '', streaming: true, status: 'Thinking', activity: [], proposals: [], sources: [] }
        ])
        const controller = new AbortController()
        abortRef.current = controller
        try {
            await advisor.chat(message, conversationId, {
                onConversation: (id, isNew) => {
                    if (isNew) { skipLoadRef.current = id; setParams({ c: id }, { replace: true }) }
                },
                onStatus: status => patchLast(m => ({ ...m, status })),
                onToolStart: tool => patchLast(m => ({ ...m, activity: [...(m.activity ?? []), tool] })),
                onToolEnd: (id, ok) => patchLast(m => ({ ...m, activity: m.activity?.map(a => (a.id === id ? { ...a, ok } : a)) })),
                onToken: t => patchLast(m => ({ ...m, content: m.content + t })),
                onSources: sources => patchLast(m => ({ ...m, sources })),
                onProposal: draft => patchLast(m => ({ ...m, proposals: [...(m.proposals ?? []), draft] })),
                onMemory: () => setMemoryVersion(v => v + 1),
                onDone: id => patchLast(m => ({ ...m, id, streaming: false, tools: m.activity?.map(a => ({ name: a.name, ok: a.ok ?? true })) })),
                onError: error => patchLast(m => ({ ...m, streaming: false, error }))
            }, controller.signal)
        } catch (error) {
            if ((error as Error).name === 'AbortError') patchLast(m => ({ ...m, streaming: false, content: m.content || '_Stopped._' }))
            else patchLast(m => ({ ...m, streaming: false, error: 'Could not reach the AI advisor. Is the AI service running?' }))
        } finally {
            setBusy(false)
            abortRef.current = null
            refreshConversations()
            // Memory extraction runs in the background after each answer.
            setTimeout(() => setMemoryVersion(v => v + 1), 4000)
            inputRef.current?.focus()
        }
    }

    const newChat = () => { abortRef.current?.abort(); setParams({}); setMessages([]); setShowHistory(false); inputRef.current?.focus() }
    const openChat = (id: string) => { skipLoadRef.current = null; setParams({ c: id }); setShowHistory(false) }
    const removeChat = async (id: string) => {
        setConversations(c => c.filter(x => x.id !== id))
        await advisor.deleteConversation(id).catch(refreshConversations)
        if (id === conversationId) newChat()
    }
    const feedback = (id: string, rating: 'up' | 'down') => {
        setMessages(prev => prev.map(m => (m.id === id ? { ...m, feedback: rating } : m)))
        advisor.feedback(id, rating).catch(() => {})
    }

    const history = (
        <div className="flex flex-col h-full">
            <div className="p-3">
                <button onClick={newChat} className="w-full h-9 flex items-center justify-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800">
                    <Plus className="w-4 h-4" /> New chat
                </button>
            </div>
            <p className="px-4 pb-1 text-[11px] font-medium text-zinc-400">Recent</p>
            <ul className="flex-1 overflow-y-auto px-2 pb-3">
                {conversations.length === 0 && <li className="px-2 py-2 text-xs text-zinc-400">No conversations yet.</li>}
                {conversations.map(c => (
                    <li key={c.id} className="group relative">
                        <button onClick={() => openChat(c.id)} className={cn('w-full text-left px-2 py-2 rounded-lg', c.id === conversationId ? 'bg-zinc-100 dark:bg-zinc-800' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50')}>
                            <span className="block text-sm truncate pr-6 text-zinc-800 dark:text-zinc-200">{c.title}</span>
                            <span className="block text-[11px] text-zinc-400">{timeAgo(c.updated_at)}</span>
                        </button>
                        <button onClick={() => removeChat(c.id)} title="Delete" className="absolute right-1.5 top-2 p-1 rounded text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                    </li>
                ))}
            </ul>
        </div>
    )

    return (
        <div className="flex h-[calc(100vh-3.5rem)] max-md:h-[calc(100vh-7.5rem)] bg-zinc-50 dark:bg-zinc-950">
            <aside className="hidden lg:block w-64 shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">{history}</aside>
            {showHistory && (
                <div className="lg:hidden fixed inset-0 z-40" onClick={() => setShowHistory(false)}>
                    <div className="absolute inset-0 bg-zinc-950/40" />
                    <aside className="absolute inset-y-0 left-0 w-72 bg-white dark:bg-zinc-900" onClick={e => e.stopPropagation()}>{history}</aside>
                </div>
            )}

            <section className="flex-1 min-w-0 flex flex-col">
                <div className="h-12 shrink-0 flex items-center gap-2 px-3 md:px-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                    <button onClick={() => setShowHistory(true)} className="lg:hidden p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"><PanelLeft className="w-4 h-4" /></button>
                    <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-300" />
                    <h1 className="text-sm font-semibold">FinSage</h1>
                    <span className="hidden sm:inline text-xs text-zinc-400">AI advisor with access to your virtual account</span>
                    <button onClick={() => setShowMemory(s => !s)} className={cn('ml-auto h-8 px-2.5 flex items-center gap-1.5 rounded-lg text-xs font-medium', showMemory ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800')}>
                        <Brain className="w-3.5 h-3.5" /> Memory
                    </button>
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto">
                    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
                        {offline && (
                            <p className="text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg px-3 py-2">
                                The AI service isn't reachable. Start it with <code>uvicorn app.main:app</code> in <code>ai-service/</code>.
                            </p>
                        )}
                        {messages.length === 0 ? (
                            <div className="pt-6 md:pt-12">
                                <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center"><Sparkles className="w-5 h-5" /></div>
                                <h2 className="mt-4 text-2xl font-semibold tracking-tight">Ask about your portfolio or the market</h2>
                                <p className="mt-1.5 text-sm text-zinc-500">FinSage reads your virtual account and live NSE data, remembers your goals, and answers in English or Hinglish.</p>
                                <div className="mt-6 grid sm:grid-cols-2 gap-3">
                                    {CAPABILITIES.map(c => (
                                        <div key={c.title} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5">
                                            <c.icon className="w-4 h-4 text-brand-600 dark:text-brand-300" />
                                            <p className="mt-2 text-sm font-medium">{c.title}</p>
                                            <p className="text-xs text-zinc-500 mt-0.5">{c.body}</p>
                                        </div>
                                    ))}
                                </div>
                                {starters.length > 0 && (
                                    <div className="mt-6 space-y-2">
                                        {starters.map(s => (
                                            <button key={s} onClick={() => send(s)} className="w-full flex items-center gap-2 text-left text-sm px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-brand-300 dark:hover:border-brand-500/40">
                                                <MessageSquare className="w-4 h-4 text-zinc-400 shrink-0" /> {s}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                <p className="mt-6 flex items-center gap-1.5 text-xs text-zinc-400"><ShieldCheck className="w-3.5 h-3.5" /> FinSage can prepare orders, but nothing is placed until you confirm.</p>
                            </div>
                        ) : messages.map((m, i) => m.role === 'user' ? (
                            <div key={m.id || i} className="flex justify-end">
                                <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-zinc-200/70 dark:bg-zinc-800 px-4 py-2.5 text-[15px] text-zinc-900 dark:text-zinc-100">{m.content}</p>
                            </div>
                        ) : (
                            <AssistantMessage key={m.id || `a-${i}`} message={m} onFeedback={feedback} />
                        ))}
                    </div>
                </div>

                <div className="shrink-0 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                    <form onSubmit={e => { e.preventDefault(); send(input) }} className="mx-auto max-w-3xl px-4 py-3">
                        <div className="flex items-end gap-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 p-2 focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/20">
                            <textarea
                                ref={inputRef}
                                value={input}
                                rows={1}
                                onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px` }}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
                                placeholder="Ask about your holdings, a stock, an IPO, taxes…"
                                className="flex-1 resize-none bg-transparent px-2 py-1.5 text-[15px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none max-h-40"
                            />
                            {busy ? (
                                <button type="button" onClick={() => abortRef.current?.abort()} title="Stop" className="h-9 w-9 shrink-0 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center"><Square className="w-3.5 h-3.5" /></button>
                            ) : (
                                <button type="submit" disabled={!input.trim()} title="Send" className="h-9 w-9 shrink-0 rounded-lg bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center disabled:opacity-40"><Send className="w-4 h-4" /></button>
                            )}
                        </div>
                        <p className="mt-1.5 text-[11px] text-zinc-400 text-center">Educational analysis on a virtual account, not investment advice. Enter to send, Shift+Enter for a new line.</p>
                    </form>
                </div>
            </section>

            {showMemory && (
                <div className="max-xl:fixed max-xl:inset-y-0 max-xl:right-0 max-xl:z-40 flex">
                    <MemoryPanel onClose={() => setShowMemory(false)} refreshKey={memoryVersion} />
                </div>
            )}
        </div>
    )
}
