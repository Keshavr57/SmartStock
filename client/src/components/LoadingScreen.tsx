import { useEffect, useState } from 'react'
import { Bot, TrendingUp } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  showProgress?: boolean;
  fast?: boolean;
}

export const LoadingScreen = ({ 
  message = "Loading SmartStock...", 
  showProgress = false,
  fast = false 
}: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0)
  const [loadingText, setLoadingText] = useState(message)

  useEffect(() => {
    if (!showProgress) return

    const messages = fast ? [
      "Initializing...",
      "Almost ready!"
    ] : [
      "Initializing SmartStock...",
      "Loading market data...",
      "Setting up dashboard...",
      "Almost ready!"
    ]

    let currentMessage = 0
    let currentProgress = 0

    const interval = setInterval(() => {
      currentProgress += fast ? Math.random() * 25 + 15 : Math.random() * 15 + 5
      
      if (currentProgress >= 100) {
        currentProgress = 100
        setProgress(100)
        clearInterval(interval)
        return
      }

      setProgress(Math.min(currentProgress, 95))
      
      const messageIndex = Math.floor((currentProgress / 100) * messages.length)
      if (messageIndex !== currentMessage && messageIndex < messages.length) {
        currentMessage = messageIndex
        setLoadingText(messages[messageIndex])
      }
    }, fast ? 100 : 200)

    return () => clearInterval(interval)
  }, [showProgress, fast])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="text-center space-y-6 p-8">
        {/* Logo and Brand */}
        <div className="flex items-center justify-center space-x-3 mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">SmartStock</h1>
        </div>

        {/* Loading Animation */}
        <div className="relative">
          <Bot className="h-12 w-12 text-blue-600 mx-auto animate-pulse" />
          
          {/* Pulse Effect */}
          <div className="absolute inset-0 rounded-full border-4 border-blue-200 animate-ping opacity-20"></div>
        </div>

        {/* Loading Text */}
        <div className="space-y-2">
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
            {loadingText}
          </p>
          
          {showProgress && (
            <div className="w-64 mx-auto">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {Math.round(progress)}% complete
              </p>
            </div>
          )}
        </div>

        {/* Animated Dots */}
        <div className="flex items-center justify-center space-x-1">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>

        {/* Quick Tip */}
        <div className="mt-8 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm max-w-md">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            💡 <strong>Tip:</strong> Use our AI advisor for instant stock analysis
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;