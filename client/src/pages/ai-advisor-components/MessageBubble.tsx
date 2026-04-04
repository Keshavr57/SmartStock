import { Bot, User, Copy, ThumbsUp, ThumbsDown } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useState } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  id: string
  timestamp: Date
  feedback?: 'up' | 'down'
}

interface MessageBubbleProps {
  message: Message
  onCopy: (content: string) => void
  onFeedback: (messageId: string, rating: 'up' | 'down') => void
  deepLinks?: { label: string; href: string }[]
}

export function MessageBubble({ message, onCopy, onFeedback, deepLinks = [] }: MessageBubbleProps) {
  const [feedback, setFeedback] = useState<'up' | 'down' | undefined>(message.feedback)
  const isUser = message.role === 'user'

  const handleFeedback = (rating: 'up' | 'down') => {
    setFeedback(rating)
    onFeedback(message.id, rating)
  }

  return (
    <div className={`flex gap-4 message-enter ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser
          ? 'bg-purple-600 text-white'
          : 'bg-purple-100 text-purple-600'
      }`}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div className={`flex-1 max-w-[85%] ${isUser ? 'text-right' : ''}`}>
        <div className={`inline-block p-4 rounded-2xl text-left ${
          isUser
            ? 'bg-purple-600 text-white'
            : 'bg-white border border-gray-200'
        }`}>
          <div className="prose prose-sm max-w-none">
            {isUser ? (
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            ) : (
              <ReactMarkdown
                components={{
                  strong: ({children}) => <strong className="font-semibold text-gray-900">{children}</strong>,
                  ul: ({children}) => <ul className="list-disc ml-4 mt-2 space-y-1">{children}</ul>,
                  li: ({children}) => <li className="text-sm text-gray-700">{children}</li>,
                  p: ({children}) => <p className="mb-2 last:mb-0 text-sm text-gray-700">{children}</p>,
                  h1: ({children}) => <h1 className="text-lg font-bold text-gray-900 mt-3 mb-2">{children}</h1>,
                  h2: ({children}) => <h2 className="text-base font-semibold text-gray-900 mt-2 mb-1">{children}</h2>,
                  h3: ({children}) => <h3 className="text-sm font-semibold text-gray-900 mt-2 mb-1">{children}</h3>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>
        </div>

        {/* Message actions */}
        {!isUser && (
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => onCopy(message.content)}
              className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              title="Copy to clipboard"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => handleFeedback('up')}
              className={`p-1.5 rounded-lg transition-colors ${
                feedback === 'up'
                  ? 'text-green-600 bg-green-50'
                  : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
              }`}
              title="Helpful"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => handleFeedback('down')}
              className={`p-1.5 rounded-lg transition-colors ${
                feedback === 'down'
                  ? 'text-red-600 bg-red-50'
                  : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
              }`}
              title="Not helpful"
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Deep link buttons */}
        {!isUser && deepLinks.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {deepLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.href}
                className="px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-full text-xs font-medium transition-colors border border-purple-100"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div className={`text-xs text-gray-400 mt-1.5 ${isUser ? 'text-right' : 'text-left'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  )
}
