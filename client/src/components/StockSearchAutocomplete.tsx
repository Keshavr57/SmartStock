import { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import { api } from '../lib/api'

interface Stock {
  symbol: string
  name: string
  sector: string | null
}

interface StockSearchAutocompleteProps {
  onSelectStock: (symbol: string) => void
  selectedSymbols: string[]
  maxSelection?: number
}

const SEARCH_DEBOUNCE_MS = 250

export default function StockSearchAutocomplete({
  onSelectStock,
  selectedSymbols,
  maxSelection = 3
}: StockSearchAutocompleteProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [searching, setSearching] = useState(false)

  // Search all NSE-listed equities on the server (debounced).
  useEffect(() => {
    const query = searchQuery.trim()
    if (!query) {
      setFilteredStocks([])
      setIsOpen(false)
      return
    }
    let cancelled = false
    setSearching(true)
    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/market/stocks/search', { params: { q: query, limit: 10 } })
        if (cancelled) return
        const results: Stock[] = (res.data?.data || []).filter((s: Stock) => !selectedSymbols.includes(s.symbol))
        setFilteredStocks(results)
        setIsOpen(true)
      } catch {
        if (!cancelled) setFilteredStocks([])
      } finally {
        if (!cancelled) setSearching(false)
      }
    }, SEARCH_DEBOUNCE_MS)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [searchQuery, selectedSymbols])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (stock: Stock) => {
    if (selectedSymbols.length < maxSelection) {
      onSelectStock(stock.symbol)
      setSearchQuery('')
      setIsOpen(false)
      inputRef.current?.focus()
    }
  }

  const isMaxReached = selectedSymbols.length >= maxSelection

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          placeholder={
            isMaxReached
              ? `Max ${maxSelection} stocks selected`
              : 'Search any NSE stock (e.g. Reliance, Zomato, IRFC)'
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={isMaxReached}
          className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Dropdown Results */}
      {isOpen && filteredStocks.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-input rounded-lg z-50 max-h-64 overflow-y-auto"
        >
          {filteredStocks.map((stock) => (
            <button
              key={stock.symbol}
              onClick={() => handleSelect(stock)}
              className="w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b last:border-b-0"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm">{stock.symbol.replace(/\.NS$/, '')}</div>
                  <div className="text-xs text-muted-foreground">{stock.name}</div>
                </div>
                {stock.sector && (
                  <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {stock.sector}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && searchQuery && !searching && filteredStocks.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-input rounded-lg p-4 text-center text-sm text-muted-foreground">
          No NSE-listed stock matches "{searchQuery}".
        </div>
      )}
    </div>
  )
}
