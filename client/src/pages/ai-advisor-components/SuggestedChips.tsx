import { MessageCircle } from 'lucide-react'

interface SuggestedChipsProps {
  questions: string[]
  onChipClick: (question: string) => void
  hidden?: boolean
}

export function SuggestedChips({ questions, onChipClick, hidden = false }: SuggestedChipsProps) {
  if (hidden) return null

  return (
    <div className="flex flex-wrap gap-2 px-4 pb-3">
      {questions.map((question, idx) => (
        <button
          key={idx}
          onClick={() => onChipClick(question)}
          className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-full text-xs font-medium transition-colors border border-purple-100"
        >
          <MessageCircle className="h-3 w-3" />
          {question}
        </button>
      ))}
    </div>
  )
}
