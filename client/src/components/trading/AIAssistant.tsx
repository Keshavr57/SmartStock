import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Bot, User, X, HelpCircle, TrendingUp, BarChart3, Volume2, Shield } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '@/lib/config';

interface Message {
    id: string;
    type: 'user' | 'ai';
    content: string | AIResponse;
    timestamp: Date;
}

interface AIResponse {
    type: 'educational' | 'general';
    title: string;
    explanation?: string;
    message?: string;
    topics?: string[];
    currentValue?: string;
    interpretation?: string | object;
    riskFactors?: string[];
    keyPrinciples?: string[];
    fundamentalConcepts?: string[];
    beforeYouStart?: string[];
    commonMistakes?: string[];
    positionSizing?: string;
    stopLoss?: string;
    currentAnalysis?: string;
    askMe?: string;
    disclaimer: string;
}

interface AIAssistantProps {
    symbol?: string;
    marketData?: {
        rsi?: number;
        volume?: number;
        avgVolume?: number;
    };
}

const AIAssistant: React.FC<AIAssistantProps> = ({ symbol, marketData }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (isOpen && !socketRef.current) {
            connectWebSocket();
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [isOpen]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const connectWebSocket = () => {
        socketRef.current = io(API_CONFIG.WEBSOCKET_URL);

        socketRef.current.on('connect', () => {
            console.log('🤖 Connected to AI Assistant');
            
            // Send welcome message
            const welcomeMessage: Message = {
                id: Date.now().toString(),
                type: 'ai',
                content: {
                    type: 'general',
                    title: 'Trading Education Assistant',
                    message: "Hello! I'm your trading education assistant. I can help you understand technical indicators and trading concepts.",
                    topics: [
                        "RSI (Relative Strength Index)",
                        "MACD (Moving Average Convergence Divergence)",
                        "Volume Analysis",
                        "Support & Resistance",
                        "Risk Management",
                        "Trading Basics"
                    ],
                    askMe: "Try asking: 'What is RSI?', 'Explain MACD', 'How does volume work?', or 'What is risk management?'",
                    disclaimer: "I provide educational content only, not financial advice."
                },
                timestamp: new Date()
            };
            
            setMessages([welcomeMessage]);
        });

        socketRef.current.on('connect_error', (error) => {
            console.log('🤖 AI Assistant connection failed, working in offline mode');
            
            // Add offline message
            const offlineMessage: Message = {
                id: Date.now().toString(),
                type: 'ai',
                content: "I'm currently offline, but I can still help with basic trading education. Try asking about RSI, MACD, volume analysis, or risk management!",
                timestamp: new Date()
            };
            
            setMessages([offlineMessage]);
        });

        socketRef.current.on('ai-response', (response: AIResponse) => {
            const aiMessage: Message = {
                id: Date.now().toString(),
                type: 'ai',
                content: response,
                timestamp: new Date()
            };
            
            setMessages(prev => [...prev, aiMessage]);
            setIsLoading(false);
        });

        socketRef.current.on('ai-error', (error) => {
            const errorMessage: Message = {
                id: Date.now().toString(),
                type: 'ai',
                content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
                timestamp: new Date()
            };
            
            setMessages(prev => [...prev, errorMessage]);
            setIsLoading(false);
        });
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const sendMessage = () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            type: 'user',
            content: inputValue,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        // Try WebSocket first, fallback to offline responses
        if (socketRef.current?.connected) {
            socketRef.current.emit('ai-query', {
                query: inputValue,
                context: {
                    symbol,
                    ...marketData
                }
            });
        } else {
            // Offline AI responses
            setTimeout(() => {
                const response = getOfflineResponse(inputValue);
                const aiMessage: Message = {
                    id: Date.now().toString(),
                    type: 'ai',
                    content: response,
                    timestamp: new Date()
                };
                
                setMessages(prev => [...prev, aiMessage]);
                setIsLoading(false);
            }, 1000);
        }

        setInputValue('');
    };

    const getOfflineResponse = (query: string): AIResponse => {
        const queryLower = query.toLowerCase();
        
        if (queryLower.includes('rsi') || queryLower.includes('relative strength')) {
            return {
                type: 'educational',
                title: 'Relative Strength Index (RSI)',
                explanation: 'RSI measures the speed and change of price movements on a scale of 0-100. It helps identify overbought (>70) and oversold (<30) conditions.',
                interpretation: 'RSI above 70 suggests the asset might be overbought, while RSI below 30 suggests it might be oversold.',
                riskFactors: [
                    'RSI can stay overbought/oversold for extended periods in strong trends',
                    'False signals can occur in volatile markets',
                    'Should be used with other indicators for confirmation'
                ],
                disclaimer: 'This is educational content only. Not financial advice. Always do your own research.'
            };
        } else if (queryLower.includes('macd')) {
            return {
                type: 'educational',
                title: 'Moving Average Convergence Divergence (MACD)',
                explanation: 'MACD shows the relationship between two moving averages. It consists of MACD line, signal line, and histogram.',
                riskFactors: [
                    'Lagging indicator - signals may come late',
                    'Can produce false signals in sideways markets',
                    'Best used in trending markets'
                ],
                disclaimer: 'This is educational content only. Not financial advice. Always do your own research.'
            };
        } else if (queryLower.includes('volume')) {
            return {
                type: 'educational',
                title: 'Volume Analysis',
                explanation: 'Volume represents the number of shares traded. High volume confirms price movements, while low volume suggests weak conviction.',
                riskFactors: [
                    'Volume spikes can be temporary',
                    'Low volume can lead to higher volatility',
                    'Volume patterns vary by market conditions'
                ],
                disclaimer: 'This is educational content only. Not financial advice. Always do your own research.'
            };
        } else if (queryLower.includes('risk')) {
            return {
                type: 'educational',
                title: 'Risk Management in Trading',
                explanation: 'Risk management is the process of identifying, analyzing, and mitigating potential losses in trading.',
                keyPrinciples: [
                    'Never risk more than you can afford to lose',
                    'Use position sizing (typically 1-2% of portfolio per trade)',
                    'Set stop-loss orders to limit downside',
                    'Diversify across different assets and sectors',
                    'Have a clear trading plan and stick to it'
                ],
                disclaimer: 'This is educational content only. Not financial advice. Always do your own research.'
            };
        } else {
            return {
                type: 'general',
                title: 'Trading Education Assistant (Offline Mode)',
                message: "I'm currently working offline, but I can still help you learn about trading concepts!",
                topics: [
                    "RSI (Relative Strength Index)",
                    "MACD (Moving Average Convergence Divergence)",
                    "Volume Analysis",
                    "Risk Management"
                ],
                askMe: "Try asking: 'What is RSI?', 'Explain MACD', 'How does volume work?', or 'What is risk management?'",
                disclaimer: "I provide educational content only, not financial advice."
            };
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const quickQuestions = [
        { icon: TrendingUp, text: "What is RSI?", query: "What is RSI and how do I use it?" },
        { icon: BarChart3, text: "Explain MACD", query: "Explain MACD indicator" },
        { icon: Volume2, text: "Volume Analysis", query: "How does volume analysis work?" },
        { icon: Shield, text: "Risk Management", query: "What is risk management in trading?" }
    ];

    const renderAIResponse = (response: AIResponse) => {
        return (
            <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">{response.title}</h4>
                
                {response.explanation && (
                    <p className="text-gray-700">{response.explanation}</p>
                )}
                
                {response.message && (
                    <p className="text-gray-700">{response.message}</p>
                )}

                {response.currentValue && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-blue-800 font-medium">{response.currentValue}</p>
                    </div>
                )}

                {response.interpretation && typeof response.interpretation === 'string' && (
                    <div className="bg-yellow-50 p-3 rounded-lg">
                        <p className="text-yellow-800">{response.interpretation}</p>
                    </div>
                )}

                {response.currentAnalysis && (
                    <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-green-800">{response.currentAnalysis}</p>
                    </div>
                )}

                {response.topics && (
                    <div>
                        <p className="font-medium text-gray-900 mb-2">I can help with:</p>
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                            {response.topics.map((topic, index) => (
                                <li key={index}>{topic}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {response.keyPrinciples && (
                    <div>
                        <p className="font-medium text-gray-900 mb-2">Key Principles:</p>
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                            {response.keyPrinciples.map((principle, index) => (
                                <li key={index}>{principle}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {response.fundamentalConcepts && (
                    <div>
                        <p className="font-medium text-gray-900 mb-2">Fundamental Concepts:</p>
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                            {response.fundamentalConcepts.map((concept, index) => (
                                <li key={index}>{concept}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {response.riskFactors && (
                    <div>
                        <p className="font-medium text-red-700 mb-2">⚠️ Risk Factors:</p>
                        <ul className="list-disc list-inside space-y-1 text-red-600">
                            {response.riskFactors.map((risk, index) => (
                                <li key={index}>{risk}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {response.askMe && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-gray-700">{response.askMe}</p>
                    </div>
                )}

                <div className="bg-gray-100 p-3 rounded-lg border-l-4 border-gray-400">
                    <p className="text-xs text-gray-600">{response.disclaimer}</p>
                </div>
            </div>
        );
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
            >
                <MessageCircle className="h-6 w-6" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col z-50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-600 text-white rounded-t-lg">
                <div className="flex items-center space-x-2">
                    <Bot className="h-5 w-5" />
                    <h3 className="font-semibold">AI Trading Assistant</h3>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-blue-700 rounded transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[85%] ${
                            message.type === 'user'
                                ? 'bg-blue-600 text-white rounded-lg rounded-br-none'
                                : 'bg-gray-100 text-gray-900 rounded-lg rounded-bl-none'
                        } p-3`}>
                            <div className="flex items-start space-x-2">
                                {message.type === 'ai' && <Bot className="h-4 w-4 mt-1 flex-shrink-0" />}
                                {message.type === 'user' && <User className="h-4 w-4 mt-1 flex-shrink-0" />}
                                <div className="flex-1">
                                    {typeof message.content === 'string' ? (
                                        <p className="text-sm">{message.content}</p>
                                    ) : (
                                        <div className="text-sm">
                                            {renderAIResponse(message.content)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-lg rounded-bl-none p-3">
                            <div className="flex items-center space-x-2">
                                <Bot className="h-4 w-4" />
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions */}
            {messages.length <= 1 && (
                <div className="p-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Quick questions:</p>
                    <div className="grid grid-cols-2 gap-2">
                        {quickQuestions.map((question, index) => {
                            const Icon = question.icon;
                            return (
                                <button
                                    key={index}
                                    onClick={() => {
                                        setInputValue(question.query);
                                        setTimeout(sendMessage, 100);
                                    }}
                                    className="flex items-center space-x-2 p-2 text-xs bg-gray-50 hover:bg-gray-100 rounded transition-colors"
                                >
                                    <Icon className="h-3 w-3 text-gray-500" />
                                    <span className="text-gray-700">{question.text}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask about trading concepts..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        disabled={isLoading}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!inputValue.trim() || isLoading}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIAssistant;