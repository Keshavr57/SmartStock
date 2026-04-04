import { TrendingUp, BookOpen, Target, Shield } from 'lucide-react'

interface ContextPill {
  id: string
  label: string
  icon: React.ReactNode
  active: boolean
}

interface ContextPillsProps {
  activeContexts: string[]
  onToggle: (contextId: string) => void
}

export function ContextPills({ activeContexts, onToggle }: ContextPillsProps) {
  const pills: ContextPill[] = [
    {
      id: 'portfolio',
      label: 'Portfolio: ₹1L',
      icon: <Target className="h-3 w-3" />,
      active: activeContexts.includes('portfolio')
    },
    {
      id: 'beginner',
      label: 'Beginner Mode',
      icon: <BookOpen className="h-3 w-3" />,
      active: activeContexts.includes('beginner')
    },
    {
      id: 'nse',
      label: 'NSE Focus',
      icon: <TrendingUp className="h-3 w-3" />,
      active: activeContexts.includes('nse')
    },
    {
      id: 'conservative',
      label: 'Conservative',
      icon: <Shield className="h-3 w-3" />,
      active: activeContexts.includes('conservative')
    }
  ]

  return (
    <div className="flex flex-wrap gap-2 px-4 pb-2 border-b border-gray-100">
      {pills.map(pill => (
        <button
          key={pill.id}
          onClick={() => onToggle(pill.id)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all ${
            pill.active
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {pill.icon}
          {pill.label}
        </button>
      ))}
    </div>
  )
}
