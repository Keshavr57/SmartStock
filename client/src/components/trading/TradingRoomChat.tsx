import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Users, X, Minimize2, Maximize2 } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '@/lib/config';

interface ChatMessage {
    id: number;
    message: string;
    userId: string;
    timestamp: Date;
}

interface TradingRoomChatProps {
    symbol: string;
    userId: string;
}

const TradingRoomChat: React.FC<TradingRoomChatProps> = ({ symbol, userId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [onlineUsers, setOnlineUsers] = useState<number>(0);
    const [socket, setSocket] = useState<Socket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && !socket) {
            connectToTradingRoom();
        }

        return () => {
            if (socket) {
                socket.emit('leave-trading-room', symbol);
                socket.disconnect();
            }
        };
    }, [isOpen, symbol]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const connectToTradingRoom = () => {
        const socketConnection = io(API_CONFIG.WEBSOCKET_URL);
        setSocket(socketConnection);

        socketConnection.on('connect', () => {
            console.log(`💬 Connected to trading room for ${symbol}`);
            socketConnection.emit('join-trading-room', symbol);
            
            // Add welcome message
            const welcomeMessage: ChatMessage = {
                id: Date.now(),
                message: `Welcome to ${symbol} trading room! Share your thoughts and analysis.`,
                userId: 'System',
                timestamp: new Date()
            };
            setMessages([welcomeMessage]);
        });

        socketConnection.on('connect_error', (error) => {
            console.log(`💬 Trading room connection failed for ${symbol}, working offline`);
            
            // Add offline message
            const offlineMessage: ChatMessage = {
                id: Date.now(),
                message: `Trading room is currently offline. You can still use the trading features!`,
                userId: 'System',
                timestamp: new Date()
            };
            setMessages([offlineMessage]);
        });

        socketConnection.on('trading-message', (message: ChatMessage) => {
            setMessages(prev => [...prev, message]);
        });

        socketConnection.on('room-users-count', (count: number) => {
            setOnlineUsers(count);
        });

        socketConnection.on('disconnect', () => {
            console.log(`💬 Disconnected from trading room for ${symbol}`);
        });
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const sendMessage = () => {
        if (!inputValue.trim()) return;

        const message = {
            symbol,
            message: inputValue,
            userId
        };

        // Try WebSocket first
        if (socket?.connected) {
            socket.emit('trading-message', message);
        } else {
            // Offline mode - just add to local messages
            console.log('💬 Trading room offline, message stored locally');
        }

        // Add message to local state immediately
        const localMessage: ChatMessage = {
            id: Date.now(),
            message: inputValue,
            userId,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, localMessage]);

        setInputValue('');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const formatTime = (timestamp: Date) => {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    const getUserDisplayName = (userId: string) => {
        if (userId === 'System') return 'System';
        return userId === 'demo-user' ? 'You' : `User ${userId.slice(-4)}`;
    };

    const getUserColor = (userId: string) => {
        if (userId === 'System') return 'text-blue-600';
        if (userId === 'demo-user') return 'text-green-600';
        
        // Generate consistent color based on userId
        const colors = ['text-purple-600', 'text-indigo-600', 'text-pink-600', 'text-orange-600'];
        const hash = userId.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        return colors[Math.abs(hash) % colors.length];
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 left-6 bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition-colors z-40"
                title={`Join ${symbol} trading room`}
            >
                <MessageCircle className="h-5 w-5" />
            </button>
        );
    }

    return (
        <div className={`fixed bottom-6 left-6 bg-white rounded-lg shadow-xl border border-gray-200 z-40 transition-all duration-300 ${
            isMinimized ? 'w-80 h-12' : 'w-80 h-96'
        }`}>
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-green-600 text-white rounded-t-lg">
                <div className="flex items-center space-x-2">
                    <MessageCircle className="h-4 w-4" />
                    <h3 className="font-semibold text-sm">{symbol} Trading Room</h3>
                    {onlineUsers > 0 && (
                        <div className="flex items-center space-x-1 text-xs bg-green-700 px-2 py-1 rounded">
                            <Users className="h-3 w-3" />
                            <span>{onlineUsers}</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center space-x-1">
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="p-1 hover:bg-green-700 rounded transition-colors"
                    >
                        {isMinimized ? (
                            <Maximize2 className="h-3 w-3" />
                        ) : (
                            <Minimize2 className="h-3 w-3" />
                        )}
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1 hover:bg-green-700 rounded transition-colors"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-3 h-64 bg-gray-50">
                        <div className="space-y-2">
                            {messages.map((message) => (
                                <div key={message.id} className="text-sm">
                                    <div className="flex items-start space-x-2">
                                        <span className="text-xs text-gray-500 mt-0.5 min-w-[40px]">
                                            {formatTime(message.timestamp)}
                                        </span>
                                        <div className="flex-1">
                                            <span className={`font-medium ${getUserColor(message.userId)}`}>
                                                {getUserDisplayName(message.userId)}:
                                            </span>
                                            <span className="ml-1 text-gray-700">{message.message}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-gray-200">
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Share your thoughts..."
                                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500 focus:border-transparent"
                                maxLength={200}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!inputValue.trim()}
                                className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send className="h-3 w-3" />
                            </button>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            Press Enter to send • {inputValue.length}/200
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default TradingRoomChat;