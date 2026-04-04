import { useState, useEffect, useRef } from 'react'
import { X, Search } from 'lucide-react'

interface Stock {
  symbol: string
  name: string
  sector: string
}

interface StockSearchAutocompleteProps {
  onSelectStock: (symbol: string) => void
  selectedSymbols: string[]
  maxSelection?: number
}

// List of seeded stocks from database
const SEEDED_STOCKS: Stock[] = [
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries', sector: 'Oil & Gas' },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services', sector: 'IT' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank', sector: 'Banking' },
  { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel', sector: 'Telecom' },
  { symbol: 'INFY.NS', name: 'Infosys', sector: 'IT' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank', sector: 'Banking' },
  { symbol: 'SBIN.NS', name: 'State Bank of India', sector: 'Banking' },
  { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever', sector: 'FMCG' },
  { symbol: 'ITC.NS', name: 'ITC Ltd', sector: 'FMCG' },
  { symbol: 'LT.NS', name: 'Larsen & Toubro', sector: 'Industrials' },
  { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank', sector: 'Banking' },
  { symbol: 'AXISBANK.NS', name: 'Axis Bank', sector: 'Banking' },
  { symbol: 'MARUTI.NS', name: 'Maruti Suzuki', sector: 'Auto' },
  { symbol: 'SUNPHARMA.NS', name: 'Sun Pharma', sector: 'Healthcare' },
  { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance', sector: 'Finance' },
  { symbol: 'TITAN.NS', name: 'Titan Company', sector: 'Retail' },
  { symbol: 'ASIANPAINT.NS', name: 'Asian Paints', sector: 'Materials' },
  { symbol: 'WIPRO.NS', name: 'Wipro', sector: 'IT' },
  { symbol: 'HCLTECH.NS', name: 'HCL Technologies', sector: 'IT' },
  { symbol: 'ULTRACEMCO.NS', name: 'UltraTech Cement', sector: 'Cement' },
  { symbol: 'NESTLEIND.NS', name: 'Nestle India', sector: 'FMCG' },
  { symbol: 'POWERGRID.NS', name: 'Power Grid', sector: 'Utilities' },
  { symbol: 'NTPC.NS', name: 'NTPC', sector: 'Power' },
  { symbol: 'ONGC.NS', name: 'ONGC', sector: 'Oil & Gas' },
  { symbol: 'JSWSTEEL.NS', name: 'JSW Steel', sector: 'Steel' },
  { symbol: 'TATAMOTORS.NS', name: 'Tata Motors', sector: 'Auto' },
  { symbol: 'TATASTEEL.NS', name: 'Tata Steel', sector: 'Steel' },
  { symbol: 'MM.NS', name: 'Mahindra & Mahindra', sector: 'Auto' },
  { symbol: 'ADANIENT.NS', name: 'Adani Enterprises', sector: 'Diversified' },
  { symbol: 'ADANIPORTS.NS', name: 'Adani Ports', sector: 'Ports' },
  { symbol: 'COALINDIA.NS', name: 'Coal India', sector: 'Mining' },
  { symbol: 'BAJAJFINSV.NS', name: 'Bajaj Finserv', sector: 'Finance' },
  { symbol: 'DRREDDY.NS', name: 'Dr Reddy\'s', sector: 'Pharma' },
  { symbol: 'CIPLA.NS', name: 'Cipla', sector: 'Pharma' },
  { symbol: 'EICHERMOT.NS', name: 'Eicher Motors', sector: 'Auto' },
  { symbol: 'APOLLOHOSP.NS', name: 'Apollo Hospitals', sector: 'Healthcare' },
  { symbol: 'GRASIM.NS', name: 'Grasim Industries', sector: 'Materials' },
  { symbol: 'HINDALCO.NS', name: 'Hindalco', sector: 'Metals' },
  { symbol: 'BPCL.NS', name: 'BPCL', sector: 'Oil & Gas' },
  { symbol: 'TECHM.NS', name: 'Tech Mahindra', sector: 'IT' },
  { symbol: 'INDUSINDBK.NS', name: 'IndusInd Bank', sector: 'Banking' },
  { symbol: 'SBILIFE.NS', name: 'SBI Life', sector: 'Insurance' },
  { symbol: 'HDFCLIFE.NS', name: 'HDFC Life', sector: 'Insurance' },
  { symbol: 'TATACONSUM.NS', name: 'Tata Consumer', sector: 'FMCG' },
  { symbol: 'DIVISLAB.NS', name: 'Divis Laboratories', sector: 'Pharma' },
  { symbol: 'HEROMOTOCO.NS', name: 'Hero MotoCorp', sector: 'Auto' },
  { symbol: 'BRITANNIA.NS', name: 'Britannia', sector: 'FMCG' },
  { symbol: 'BAJAJAUTO.NS', name: 'Bajaj Auto', sector: 'Auto' },
  { symbol: 'DMART.NS', name: 'DMart', sector: 'Retail' },
  { symbol: 'ADANIGREEN.NS', name: 'Adani Green Energy', sector: 'Renewables' },
  { symbol: 'ZOMATO.NS', name: 'Zomato', sector: 'Food Delivery' },
  { symbol: 'PFC.NS', name: 'Power Finance Corporation', sector: 'Finance' },
  { symbol: 'RECLTD.NS', name: 'REC Ltd', sector: 'Finance' },
  { symbol: 'GAIL.NS', name: 'GAIL', sector: 'Oil & Gas' },
  { symbol: 'SHREECEM.NS', name: 'Shree Cement', sector: 'Cement' },
  { symbol: 'VEDL.NS', name: 'Vedanta', sector: 'Mining' },
  { symbol: 'PIDILITIND.NS', name: 'Pidilite', sector: 'Chemicals' },
  { symbol: 'SIEMENS.NS', name: 'Siemens', sector: 'Electrical' },
  { symbol: 'AMBUJACEM.NS', name: 'Ambuja Cement', sector: 'Cement' },
  { symbol: 'NAUKRI.NS', name: 'Naukri.com', sector: 'Internet' },
  { symbol: 'MUTHOOTFIN.NS', name: 'Muthoot Finance', sector: 'Finance' },
  { symbol: 'HAVELLS.NS', name: 'Havells', sector: 'Electrical' },
  { symbol: 'DABUR.NS', name: 'Dabur', sector: 'FMCG' },
  { symbol: 'MARICO.NS', name: 'Marico', sector: 'FMCG' },
  { symbol: 'COLPAL.NS', name: 'Colgate Palmolive', sector: 'FMCG' },
  { symbol: 'GODREJCP.NS', name: 'Godrej Consumer', sector: 'FMCG' },
  { symbol: 'BERGEPAINT.NS', name: 'Berger Paints', sector: 'Paints' },
  { symbol: 'TATAPOWER.NS', name: 'Tata Power', sector: 'Power' },
  { symbol: 'TRENT.NS', name: 'Trent', sector: 'Retail' },
  { symbol: 'MAXHEALTH.NS', name: 'Max Healthcare', sector: 'Healthcare' },
  { symbol: 'POLYCAB.NS', name: 'Polycab', sector: 'Electrical' },
  { symbol: 'IRCTC.NS', name: 'IRCTC', sector: 'Travel' },
  { symbol: 'JINDALSTEL.NS', name: 'Jindal Steel', sector: 'Steel' },
  { symbol: 'LUPIN.NS', name: 'Lupin', sector: 'Pharma' },
  { symbol: 'TORNTPHARM.NS', name: 'Torrent Pharma', sector: 'Pharma' },
  { symbol: 'AUROPHARMA.NS', name: 'Aurobindo Pharma', sector: 'Pharma' },
  { symbol: 'PAGEIND.NS', name: 'Page Industries', sector: 'Textiles' },
  { symbol: 'CONCOR.NS', name: 'Concor', sector: 'Logistics' },
  { symbol: 'INDUSTOWER.NS', name: 'Indus Towers', sector: 'Telecom' },
  { symbol: 'BIOCON.NS', name: 'Biocon', sector: 'Biotech' },
  { symbol: 'MPHASIS.NS', name: 'Mphasis', sector: 'IT' },
  { symbol: 'VOLTAS.NS', name: 'Voltas', sector: 'Consumer Electronics' },
  { symbol: 'PAYTM.NS', name: 'Paytm', sector: 'Fintech' },
  { symbol: 'BANDHANBNK.NS', name: 'Bandhan Bank', sector: 'Banking' },
  { symbol: 'ALKEM.NS', name: 'Alkem Laboratories', sector: 'Pharma' },
]

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

  // Filter available stocks based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredStocks([])
      setIsOpen(false)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = SEEDED_STOCKS.filter(
      stock =>
        (stock.symbol.toLowerCase().includes(query) ||
          stock.name.toLowerCase().includes(query)) &&
        !selectedSymbols.includes(stock.symbol)
    )

    setFilteredStocks(filtered)
    setIsOpen(filtered.length > 0)
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
              : 'Search & select stocks (RELIANCE, WIPRO, TCS...)'
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
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-input rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
        >
          {filteredStocks.map((stock) => (
            <button
              key={stock.symbol}
              onClick={() => handleSelect(stock)}
              className="w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b last:border-b-0"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm">{stock.symbol}</div>
                  <div className="text-xs text-muted-foreground">{stock.name}</div>
                </div>
                <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                  {stock.sector}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && searchQuery && filteredStocks.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-input rounded-lg shadow-lg p-4 text-center text-sm text-muted-foreground">
          No seeded stocks found. Only stocks in our database are available.
        </div>
      )}
    </div>
  )
}
