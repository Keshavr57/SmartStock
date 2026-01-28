import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bot, Send, User, Sparkles, TrendingUp, BookOpen, MessageCircle } from 'lucide-react'
import { processAiQuery } from '../lib/api'
import { authService } from '../lib/auth'

interface Message {
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

export default function AIAdvisor() {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const messagesContainerRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = useCallback(() => {
        if (messagesEndRef.current && messagesContainerRef.current) {
            // Use requestAnimationFrame to ensure DOM is fully updated
            requestAnimationFrame(() => {
                setTimeout(() => {
                    const container = messagesContainerRef.current
                    if (container) {
                        // Scroll to the very bottom
                        container.scrollTop = container.scrollHeight
                    }
                }, 50)
            })
        }
    }, [])

    // Scroll to bottom when messages change or typing status changes
    useEffect(() => {
        scrollToBottom()
    }, [messages, isTyping, scrollToBottom])

    const handleSend = async () => {
        if (!input.trim() || isTyping) return

        const userMsg: Message = { 
            role: 'user', 
            content: input,
            timestamp: new Date()
        }
        
        const query = input
        setInput('')
        
        // Add user message and scroll immediately
        setMessages(prev => [...prev, userMsg])
        setIsTyping(true)
        
        // Ensure scroll happens after state update
        setTimeout(() => scrollToBottom(), 50)

        try {
            const user = authService.getUser();
            const userId = user?.id || 'anonymous_user';
            const res = await processAiQuery(query, userId);
            
            if (res.status === 'success') {
                const assistantMsg: Message = { 
                    role: 'assistant', 
                    content: res.answer,
                    timestamp: new Date()
                }
                setMessages(prev => [...prev, assistantMsg])
            } else {
                throw new Error('AI service error: ' + (res.message || 'Unknown error'))
            }
        } catch (error) {
            console.error('AI Service Error:', error)
            const errorMsg: Message = { 
                role: 'assistant', 
                content: `Sorry, I'm having trouble connecting to the AI service right now. Please try again in a moment.`,
                timestamp: new Date()
            }
            setMessages(prev => [...prev, errorMsg])
        } finally {
            setIsTyping(false)
        }
    }

    const quickQuestions = [
        "How do I analyze a stock before buying?",
        "What should a beginner know about investing?",
        "How can I manage risk in my portfolio?",
        "What are the key things to check in an IPO?"
    ]

    const handleQuickQuestion = (question: string) => {
        setInput(question)
        // Focus the input after setting the question
        setTimeout(() => {
            const inputElement = document.querySelector('input[placeholder*="Ask about stocks"]') as HTMLInputElement
            inputElement?.focus()
        }, 100)
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                            <Bot className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Advisor</h1>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Get instant answers about trading, investing, and market analysis. 
                        Ask questions and learn from AI-powered insights.
                    </p>
                </div>

                {/* Quick Questions */}
                {messages.length === 0 && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5" />
                                Quick Questions
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {quickQuestions.map((question, index) => (
                                    <Button
                                        key={index}
                                        variant="outline"
                                        className="justify-start h-auto p-4 text-left"
                                        onClick={() => handleQuickQuestion(question)}
                                    >
                                        <MessageCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                                        {question}
                                    </Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Chat Messages */}
                <Card className="mb-6">
                    <CardContent className="p-0">
                        <div 
                            ref={messagesContainerRef}
                            className="h-[500px] overflow-y-auto p-6 chat-container"
                        >
                            {messages.length === 0 ? (
                                <div className="text-center py-12">
                                    <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                        Welcome to AI Advisor
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        Ask me anything about trading, investing, or market analysis
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {messages.map((message, index) => (
                                        <div key={`${message.role}-${index}-${message.timestamp.getTime()}`} className={`flex gap-4 message-enter ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                message.role === 'user' 
                                                    ? 'bg-blue-600 text-white' 
                                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                            }`}>
                                                {message.role === 'user' ? 
                                                    <User className="h-4 w-4" /> : 
                                                    <Bot className="h-4 w-4" />
                                                }
                                            </div>
                                            <div className={`flex-1 max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                                                <div className={`inline-block p-4 rounded-lg ${
                                                    message.role === 'user'
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                                                }`}>
                                                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                                        {message.content}
                                                    </div>
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {message.timestamp.toLocaleTimeString()}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {isTyping && (
                                        <div className="flex gap-4 message-enter">
                                            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                                                <Bot className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="inline-block p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex gap-1">
                                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                                        </div>
                                                        <span className="text-sm text-gray-600 dark:text-gray-400">Thinking...</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {/* Scroll anchor - this ensures we always scroll to the bottom */}
                                    <div ref={messagesEndRef} className="h-1" />
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Input Section */}
                <Card>
                    <CardContent className="p-4">
                        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-3">
                            <Input
                                placeholder="Ask about stocks, trading, investing, or market analysis..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                className="flex-1"
                                disabled={isTyping}
                                autoComplete="off"
                            />
                            <Button 
                                type="submit"
                                disabled={isTyping || !input.trim()}
                                className="px-6"
                            >
                                {isTyping ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </Button>
                        </form>
                        <div className="flex items-center justify-between mt-3">
                            <p className="text-xs text-gray-500">
                                AI-powered market insights • Educational purposes only
                            </p>
                            <Badge variant="outline" className="text-xs">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                Market Analysis
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Educational Note */}
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-start gap-3">
                        <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">Educational Purpose</h3>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                This AI advisor provides educational insights about trading and investing. 
                                Always do your own research and consult financial advisors before making investment decisions.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
