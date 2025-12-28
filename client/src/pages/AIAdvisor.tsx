import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Bot, Send, User, BookOpen, AlertTriangle, Lightbulb, Target, ChevronDown, ChevronRight, MessageSquare } from 'lucide-react'
import { processAiQuery } from '@/lib/api'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

export default function AIAdvisor() {
    const [messages, setMessages] = useState<Message[]>([
        { 
            role: 'assistant', 
            content: `👋 **Welcome to your Educational Financial Assistant!**

I'm here to help you **learn** about markets, not to give investment advice. I can:

📊 **Explain market concepts** (P/E ratios, technical analysis, etc.)
📈 **Analyze stock data** and teach you how to interpret it
💡 **Share educational insights** about market trends
🎓 **Guide you through** investment evaluation methods

**Important:** I provide educational content only. Always do your own research and consult qualified financial advisors before making investment decisions.

What would you like to learn about today?` 
        }
    ])
    const [input, setInput] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

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
                    content: `**Service Unavailable**

I'm currently unable to process your request. Here are some educational alternatives:

📚 **Learning Section**: Explore our comprehensive courses on trading and investing
📊 **Compare Tool**: Analyze stocks side-by-side with detailed metrics
📰 **Market News**: Stay updated with the latest market developments

**Educational Tip**: The best investment strategy is education. Consider learning about fundamental analysis to evaluate stocks independently!` 
                }])
            }
        } catch (error) {
            console.error("AI Advisor Error:", error)
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: `**Connection Error**

Unable to connect to the educational assistant. While I'm offline, here are some learning resources:

🎓 **Visit our Learning Section** for structured courses
📈 **Use the Compare Tool** to analyze stock fundamentals
📊 **Check Market Data** for real-time information

**Remember**: The goal is to learn how to analyze investments yourself, not to rely on predictions!` 
            }])
        } finally {
            setIsTyping(false)
        }
    }

    const formatMessage = (content: string) => {
        return content.split('\n').map((line, index) => {
            if (line.startsWith('##')) {
                return <h3 key={index} className="text-lg font-bold mt-4 mb-2 text-primary">{line.replace('##', '').trim()}</h3>
            }
            if (line.startsWith('**') && line.endsWith('**')) {
                return <p key={index} className="font-semibold mb-2">{line.replace(/\*\*/g, '')}</p>
            }
            if (line.startsWith('- ') || line.startsWith('• ')) {
                return <li key={index} className="ml-4 mb-1">{line.substring(2)}</li>
            }
            if (line.trim() === '---') {
                return <hr key={index} className="my-4 border-muted" />
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
        "Explain technical analysis basics",
        "How to build a diversified portfolio?"
    ]

    const educationalTopics = [
        {
            id: "stock-analysis",
            category: "📊 Stock Analysis",
            questions: [
                "How do I analyze a stock's P/E ratio?",
                "What is ROE and why is it important?",
                "How to read a company's balance sheet?",
                "What are the key financial ratios to look at?",
                "How do I evaluate a company's debt levels?",
                "What is book value and price-to-book ratio?"
            ]
        },
        {
            id: "technical-analysis",
            category: "📈 Technical Analysis", 
            questions: [
                "Explain technical analysis basics",
                "What are moving averages and how do they work?",
                "How do I use RSI and MACD indicators?",
                "What are support and resistance levels?",
                "How to identify chart patterns?",
                "What is volume analysis in trading?"
            ]
        },
        {
            id: "portfolio",
            category: "💼 Portfolio Management",
            questions: [
                "How to build a diversified portfolio?",
                "What is asset allocation and why is it important?",
                "How much should I invest in each stock?",
                "What is the difference between growth and value investing?",
                "How do I manage portfolio risk?",
                "When should I rebalance my portfolio?"
            ]
        },
        {
            id: "ipo-market",
            category: "🏢 IPO & Market Basics",
            questions: [
                "What should I look for in an IPO?",
                "How do IPOs work in India?",
                "What is Grey Market Premium (GMP)?",
                "How are stocks priced in the market?",
                "What are market orders vs limit orders?",
                "How do stock exchanges work?"
            ]
        },
        {
            id: "investment-strategies",
            category: "💰 Investment Strategies",
            questions: [
                "What is SIP and how does it work?",
                "Explain dollar-cost averaging strategy",
                "What is value investing approach?",
                "How does dividend investing work?",
                "What are the benefits of long-term investing?",
                "How to invest in different market conditions?"
            ]
        },
        {
            id: "risk-management",
            category: "⚠️ Risk Management",
            questions: [
                "How do I assess investment risk?",
                "What is stop-loss and how to use it?",
                "How much should I invest in risky assets?",
                "What are the different types of investment risks?",
                "How to protect portfolio during market crashes?",
                "What is position sizing in trading?"
            ]
        }
    ]

    return (
        <div className="p-6 container mx-auto max-w-7xl">
            {/* Header */}
            <div className="flex flex-col gap-4 items-center text-center mb-8">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                    <BookOpen className="h-6 w-6" />
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight">Educational Financial Assistant</h1>
                <p className="text-muted-foreground text-lg max-w-2xl">Learn about markets, understand analysis methods, and develop your investment knowledge through AI-powered education.</p>
                
                {/* Educational Notice */}
                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl p-4 max-w-2xl">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                        <div className="text-sm text-amber-800 dark:text-amber-200">
                            <p className="font-semibold mb-1">Educational Purpose Only</p>
                            <p>This assistant provides educational content and market analysis, not investment advice. Always consult qualified financial advisors and do your own research before making investment decisions.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Layout */}
            <div className="grid lg:grid-cols-4 gap-6">
                {/* Questions Sidebar */}
                <div className="lg:col-span-1">
                    <Card className="border-muted/50 bg-card/50 backdrop-blur-sm sticky top-6">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <MessageSquare className="h-5 w-5" />
                                Quick Questions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Popular Questions */}
                            <div>
                                <h4 className="font-semibold text-sm mb-3 text-primary">🔥 Popular</h4>
                                <div className="space-y-2">
                                    {quickQuestions.map((question, index) => (
                                        <Button
                                            key={index}
                                            variant="ghost"
                                            size="sm"
                                            className="w-full text-left justify-start h-auto py-2 px-3 text-xs hover:bg-primary/10 whitespace-normal"
                                            onClick={() => setInput(question)}
                                        >
                                            {question}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Categories */}
                            <div className="space-y-2">
                                {educationalTopics.map((topic) => (
                                    <div key={topic.id} className="border rounded-lg overflow-hidden">
                                        <button
                                            className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors"
                                            onClick={() => setExpandedCategory(expandedCategory === topic.id ? null : topic.id)}
                                        >
                                            <span className="font-medium text-sm">{topic.category}</span>
                                            {expandedCategory === topic.id ? 
                                                <ChevronDown className="h-4 w-4" /> : 
                                                <ChevronRight className="h-4 w-4" />
                                            }
                                        </button>
                                        {expandedCategory === topic.id && (
                                            <div className="px-3 pb-3 space-y-1">
                                                {topic.questions.map((question, qIndex) => (
                                                    <button
                                                        key={qIndex}
                                                        className="w-full text-left text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 p-2 rounded transition-colors"
                                                        onClick={() => setInput(question)}
                                                    >
                                                        • {question}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Chat Interface */}
                <div className="lg:col-span-3">
                    <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-xl h-[700px] flex flex-col">
                        <CardHeader className="border-b bg-muted/30 py-4 px-6 flex-shrink-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Bot className="h-6 w-6 text-primary" />
                                    <div>
                                        <CardTitle className="text-lg">Educational Assistant</CardTitle>
                                        <Badge variant="secondary" className="text-[10px] h-4">Learning Mode</Badge>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Lightbulb className="h-4 w-4" />
                                    <span>Educational Focus</span>
                                </div>
                            </div>
                        </CardHeader>
                        
                        {/* Messages */}
                        <div className="flex-1 overflow-hidden">
                            <ScrollArea className="h-full p-6">
                                <div className="space-y-6">
                                    {messages.map((m, i) => (
                                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${m.role === 'user' ? 'bg-primary text-white' : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'}`}>
                                                    {m.role === 'user' ? <User className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
                                                </div>
                                                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-secondary text-foreground rounded-tl-none border'}`}>
                                                    <div className="prose prose-sm max-w-none dark:prose-invert">
                                                        {formatMessage(m.content)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {isTyping && (
                                        <div className="flex justify-start">
                                            <div className="flex gap-3 max-w-[85%]">
                                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm text-white">
                                                    <BookOpen className="h-4 w-4" />
                                                </div>
                                                <div className="bg-secondary text-foreground rounded-2xl rounded-tl-none border px-4 py-3 text-sm animate-pulse">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex space-x-1">
                                                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                                                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                                        </div>
                                                        <span>Analyzing and preparing educational content...</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t bg-muted/20 flex-shrink-0">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Ask about market concepts, analysis methods, or investment education..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    className="h-12 bg-background border-muted-foreground/20 focus-visible:ring-primary"
                                    disabled={isTyping}
                                />
                                <Button 
                                    onClick={handleSend} 
                                    className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-md" 
                                    size="icon" 
                                    disabled={isTyping || !input.trim()}
                                >
                                    <Send className="h-5 w-5" />
                                </Button>
                            </div>
                            <p className="text-[10px] text-center text-muted-foreground mt-2 uppercase tracking-widest font-bold">Educational AI • Not Financial Advice</p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
