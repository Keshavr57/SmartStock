import { BrainCircuit } from 'lucide-react'

interface WelcomeScreenProps {
  onChipClick: (question: string) => void
}

const suggestedQuestions = [
  "RELIANCE vs TCS — kaun better long term?",
  "Mujhe IPO mein invest karna chahiye?",
  "₹50,000 se portfolio kaise banao?",
  "P/E ratio kya hota hai? Samjhao",
  "Nifty all-time high pe hai — kya karun?",
  "Mera SIP ₹5000/month — sahi hai?"
]

export function WelcomeScreen({ onChipClick }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-8 text-center">
      {/* Bot Icon */}
      <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center">
        <BrainCircuit className="w-8 h-8 text-purple-600" />
      </div>

      {/* Title */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Namaste! Main hun FinSage</h2>
        <p className="text-gray-500 mt-1">SmartStock ka AI Financial Advisor — Indian markets ka expert</p>
      </div>

      {/* Capability badges */}
      <div className="flex flex-wrap justify-center gap-2">
        {['Stocks & IPO', 'Portfolio Building', 'Technical Analysis', 'Beginners Welcome'].map(cap => (
          <span
            key={cap}
            className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm font-medium border border-purple-100"
          >
            {cap}
          </span>
        ))}
      </div>

      {/* Suggested Questions */}
      <div className="w-full max-w-lg">
        <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">Kuch popular sawaal</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {suggestedQuestions.map(q => (
            <button
              key={q}
              onClick={() => onChipClick(q)}
              className="text-left p-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 transition-all"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
