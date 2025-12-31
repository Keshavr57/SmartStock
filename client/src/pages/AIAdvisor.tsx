import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bot, Send, User, BookOpen } from 'lucide-react'
import { processAiQuery } from '../lib/api'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

export default function AIAdvisor() {
    const [messages, setMessages] = useState<Message[]>([
        { 
            role: 'assistant', 
            content: `**Professional Market Analysis Assistant**

I'm here to provide market insights like an experienced fund manager - direct, practical, and focused on what actually moves prices.

**My approach:**
• Core insights that professionals care about
• Market intuition, not textbook definitions  
• Real risks and uncertainties
• Human psychology behind market moves
• Professional takeaways, not disclaimers

**I can analyze:**
• Stock fundamentals and valuation metrics
• IPO risk assessments with institutional perspective
• Portfolio construction and risk management
• Market trends and sector rotation

**Professional note:** This is educational market analysis to help you think like institutional investors. Always do your own research.

What market question can I help you analyze?` 
        }
    ])
    const [input, setInput] = useState('')
    const [isTyping, setIsTyping] = useState(false)

    const handleSend = async () => {
        if (!input.trim() || isTyping) return

        const userMsg: Message = { role: 'user', content: input }
        setMessages(prev => [...prev, userMsg])
        const query = input
        setInput('')
        setIsTyping(true)

        try {
            const res = await processAiQuery(query)
            if (res.status === 'success') {
                setMessages(prev => [...prev, { role: 'assistant', content: res.answer }])
            } else {
                setMessages(prev => [...prev, { 
                    role: 'assistant', 
                    content: `Service Unavailable

I'm currently unable to process your request. Here are some educational alternatives:

• Learning Section: Explore our comprehensive courses on trading and investing
• Compare Tool: Analyze stocks side-by-side with detailed metrics
• Market News: Stay updated with the latest market developments

Educational Tip: The best investment strategy is education. Consider learning about fundamental analysis to evaluate stocks independently!` 
                }])
            }
        } catch (error) {
            console.error("AI Advisor Error:", error)
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: `Connection Error

Unable to connect to the educational assistant. While I'm offline, here are some learning resources:

• Visit our Learning Section for structured courses
• Use the Compare Tool to analyze stock fundamentals
• Check Market Data for real-time information

Remember: The goal is to learn how to analyze investments yourself, not to rely on predictions!` 
            }])
        } finally {
            setIsTyping(false)
        }
    }

    const formatMessage = (content: string) => {
        return content.split('\n').map((line, index) => {
            if (line.startsWith('• ')) {
                return <li key={index} className="ml-4 mb-1">{line.substring(2)}</li>
            }
            if (line.trim()) {
                return <p key={index} className="mb-2">{line}</p>
            }
            return <br key={index} />
        })
    }

    const quickQuestions = [
        "How do I analyze a stock's P/E ratio?",
        "What should I look for in an IPO?",
        "Explain market psychology and investor behavior",
        "How do fund managers build portfolios?"
    ]

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Advisor</h1>
                    <p className="text-gray-600">Learn about markets and investment concepts</p>
                </div>

                {/* Quick Questions */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Questions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {quickQuestions.map((question, index) => (
                            <button
                                key={index}
                                onClick={() => setInput(question)}
                                className="p-3 text-left bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-sm"
                            >
                                {question}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chat Interface */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    {/* Chat Header */}
                    <div className="border-b border-gray-200 p-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <Bot className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Market Professional</h3>
                                <p className="text-sm text-gray-500">Institutional-grade analysis</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Messages */}
                    <div className="h-96 overflow-y-auto p-4">
                        <div className="space-y-4">
                            {messages.map((m, i) => (
                                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`flex space-x-3 max-w-[80%] ${m.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                            m.role === 'user' 
                                                ? 'bg-blue-600 text-white' 
                                                : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {m.role === 'user' ? <User className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
                                        </div>
                                        <div className={`rounded-lg px-4 py-3 ${
                                            m.role === 'user' 
                                                ? 'bg-blue-600 text-white' 
                                                : 'bg-gray-100 text-gray-900'
                                        }`}>
                                            <div className="text-sm">
                                                {formatMessage(m.content)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="flex space-x-3 max-w-[80%]">
                                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <BookOpen className="h-4 w-4 text-gray-600" />
                                        </div>
                                        <div className="bg-gray-100 rounded-lg px-4 py-3">
                                            <div className="flex items-center space-x-2">
                                                <div className="flex space-x-1">
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                                </div>
                                                <span className="text-sm text-gray-600">Thinking...</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Input */}
                    <div className="border-t border-gray-200 p-4">
                        <div className="flex space-x-3">
                            <Input
                                placeholder="Ask about market analysis, stock evaluation, or professional insights..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                className="flex-1"
                                disabled={isTyping}
                            />
                            <Button 
                                onClick={handleSend} 
                                disabled={isTyping || !input.trim()}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                            Professional market analysis • Educational purposes
                        </p>
                    </div>
                </div>

                {/* Disclaimer */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                        <strong>Professional Analysis:</strong> This assistant provides institutional-grade market analysis and professional insights for educational purposes. Responses follow fund manager methodology with focus on practical market dynamics.
                    </p>
                </div>
            </div>
        </div>
    )
}
