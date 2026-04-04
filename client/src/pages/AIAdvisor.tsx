import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Bot, Send, BrainCircuit, Sparkles, Trash2, Activity,
  MessageCircle
} from 'lucide-react'
import { api } from '../lib/api'
import { authService } from '../lib/auth'
import { WelcomeScreen } from './ai-advisor-components/WelcomeScreen'
import { MessageBubble } from './ai-advisor-components/MessageBubble'
import { TypingIndicator } from './ai-advisor-components/TypingIndicator'
import { SuggestedChips } from './ai-advisor-components/SuggestedChips'
import { ContextPills } from './ai-advisor-components/ContextPills'
import { getDeepLinks } from './ai-advisor-components/DeepLinkButtons'

interface Message {
  role: 'user' | 'assistant'
  content: string
  id: string
  timestamp: Date
  feedback?: 'up' | 'down'
}

const SUGGESTED_QUESTIONS = [
  "RELIANCE vs TCS — kaun better long term?",
  "Mujhe IPO mein invest karna chahiye?",
  "₹50,000 se portfolio kaise banao?",
  "P/E ratio kya hota hai? Samjhao",
  "Nifty all-time high pe hai — kya karun?",
  "Mera SIP ₹5000/month — sahi hai?"
]

const STOCK_FOLLOWUP_QUESTIONS = [
  "Iska technical analysis batao",
  "Is sector ke top competitors?",
  "Last quarter results kaisa tha?",
  "Is stock ka target price kya hai?"
]

export default function AIAdvisor() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeContexts, setActiveContexts] = useState<string[]>(['portfolio'])
  const [isMarketAnalysisMode, setIsMarketAnalysisMode] = useState(false)
  const [mentionedStocks, setMentionedStocks] = useState<string[]>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current && messagesContainerRef.current) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          const container = messagesContainerRef.current
          if (container) {
            container.scrollTop = container.scrollHeight
          }
        }, 50)
      })
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, scrollToBottom])

  const addBotMessage = (content: string) => {
    const botMsg: Message = {
      role: 'assistant',
      content,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, botMsg])
  }

  const handleChipClick = (question: string) => {
    setInput(question)
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
      handleSend()
    }, 50)
  }

  const handleContextToggle = (contextId: string) => {
    setActiveContexts(prev =>
      prev.includes(contextId)
        ? prev.filter(c => c !== contextId)
        : [...prev, contextId]
    )
  }

  const handleCopy = useCallback((content: string) => {
    navigator.clipboard.writeText(content)
  }, [])

  const handleFeedback = useCallback((messageId: string, rating: 'up' | 'down') => {
    console.log('Feedback:', messageId, rating)
    setMessages(prev => prev.map(msg =>
      msg.id === messageId ? { ...msg, feedback: rating } : msg
    ))
  }, [])

  const clearChat = () => {
    setMessages([])
    setMentionedStocks([])
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMsg: Message = {
      role: 'user',
      content: input,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    }

    const query = input

    // Detect mentioned stocks
    const stockPattern = /\b([A-Z]{2,4}|RELIANCE|TCS|INFOSYS|HDFC|ICICI|SBIN|NIFTY|SENSEX)\b/gi
    const foundStocks = query.match(stockPattern)
    if (foundStocks) {
      setMentionedStocks(prev => [...new Set([...prev, ...foundStocks.map(s => s.toUpperCase())])])
    }

    setInput('')
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)

    try {
      const user = authService.getUser()
      const userId = user?.id || 'anonymous_user'

      // Build context note
      let contextNote = ''
      if (activeContexts.includes('beginner')) {
        contextNote += '\n\n[Context: User is a beginner, explain simply with examples]'
      }
      if (activeContexts.includes('portfolio')) {
        contextNote += '\n\n[Context: User has ₹1,00,000 virtual portfolio for paper trading]'
      }
      if (isMarketAnalysisMode) {
        contextNote += '\n\n[Mode: Technical/Chart Analysis Focus — give RSI, support/resistance, moving averages where relevant]'
      }

      const finalMessage = query + contextNote

      // Build messages array for FastAPI service
      const messagesArray = [
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: 'user', content: finalMessage }
      ]

      const res = await api.post('/chat/ai-chat', {
        messages: messagesArray,
        userContext: {
          name: user?.name || user?.username || 'keshav123',
          portfolio: 100000
        }
      })

      if (res.data.reply) {
        addBotMessage(res.data.reply)
      } else {
        throw new Error(res.data.error || 'AI service error')
      }
    } catch (error: any) {
      console.error('AI Service Error:', error)

      if (error.response?.status === 429) {
        addBotMessage('Thoda rush hai abhi — ek second ruko aur dobara try karo! 🙏')
      } else if (!error.response || error.response?.status >= 500) {
        addBotMessage('Kuch technical issue aaya. Refresh karo aur dobara poocho.')
      } else {
        addBotMessage('Network issue lag raha hai. Internet check karo aur dobara try karo.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Dynamic suggested questions based on conversation
  const getDynamicQuestions = () => {
    if (messages.length === 0) return SUGGESTED_QUESTIONS
    if (mentionedStocks.length > 0) return STOCK_FOLLOWUP_QUESTIONS
    return SUGGESTED_QUESTIONS.slice(0, 3)
  }

  const lastBotMessage = messages.filter(m => m.role === 'assistant').pop()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
              <BrainCircuit className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Advisor</h1>
              <p className="text-sm text-gray-500">FinSage — Your Indian Market Expert</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearChat}
              className="ml-auto"
              title="Clear chat history"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Chat Card */}
        <Card className="mb-6 overflow-hidden">
          <CardHeader className="pb-0 border-b border-gray-100">
            <CardTitle className="text-sm font-normal text-gray-500">
              Session Memory Active • Full conversation context retained
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            {/* Context Pills */}
            <ContextPills
              activeContexts={activeContexts}
              onToggle={handleContextToggle}
            />

            {/* Messages Area */}
            {messages.length === 0 ? (
              <div className="h-[500px]">
                <WelcomeScreen onChipClick={handleChipClick} />
              </div>
            ) : (
              <div
                ref={messagesContainerRef}
                className="h-[500px] overflow-y-auto p-6 space-y-6"
              >
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    onCopy={handleCopy}
                    onFeedback={handleFeedback}
                    deepLinks={message.role === 'assistant' ? getDeepLinks(message.content) : undefined}
                  />
                ))}

                {isLoading && <TypingIndicator />}
                <div ref={messagesEndRef} className="h-1" />
              </div>
            )}

            {/* Suggested Chips */}
            {messages.length < 4 && (
              <SuggestedChips
                questions={getDynamicQuestions()}
                onChipClick={handleChipClick}
                hidden={isLoading}
              />
            )}
          </CardContent>
        </Card>

        {/* Input Section */}
        <Card>
          <CardContent className="p-4">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-3">
              <Input
                ref={inputRef}
                placeholder="Ask about stocks, IPOs, portfolio, or market analysis..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1"
                disabled={isLoading}
                autoComplete="off"
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-6 bg-purple-600 hover:bg-purple-700"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>

            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-gray-500">
                AI-powered insights for Indian markets • Educational purposes only
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMarketAnalysisMode(!isMarketAnalysisMode)}
                className={`text-xs ${isMarketAnalysisMode ? 'bg-purple-100 border-purple-300 text-purple-700' : ''}`}
              >
                <Activity className="h-3 w-3 mr-1" />
                Market Analysis {isMarketAnalysisMode ? 'ON' : 'OFF'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Welcome Badge */}
        {messages.length === 0 && (
          <div className="mt-6 flex justify-center gap-2">
            {['Stocks & IPO', 'Portfolio Building', 'Technical Analysis', 'Beginners Welcome'].map(cap => (
              <Badge key={cap} variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                <Sparkles className="h-3 w-3 mr-1" />
                {cap}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
