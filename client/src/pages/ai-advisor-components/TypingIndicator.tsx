export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 p-3 message-enter">
      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
      <span className="text-xs text-gray-400 ml-2">FinSage is thinking...</span>
    </div>
  )
}
