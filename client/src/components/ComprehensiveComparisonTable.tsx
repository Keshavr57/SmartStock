import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface RowConfig {
  label: string;
  key: string;
  format: (value: number | null, symbol?: string) => string;
  showIcon?: boolean;
}

interface StockData {
  symbol: string;
  lastTradedPrice: number | null;
  oneDayChange: number | null;
  oneDayChangePercent: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  marketCap: number | null;
  peRatio: number | null;
  bookValue: number | null;
  pbRatio: number | null;
  roe: number | null;
  roce: number | null;
  eps: number | null;
  dividendYield: number | null;
  oneMonthReturn: number | null;
  threeMonthReturn: number | null;
  oneYearReturn: number | null;
  threeYearReturn: number | null;
  fiveYearReturn: number | null;
  threeMonthHigh: number | null;
  threeMonthLow: number | null;
  oneYearHigh: number | null;
  oneYearLow: number | null;
  threeYearHigh: number | null;
  threeYearLow: number | null;
  fiveYearHigh: number | null;
  fiveYearLow: number | null;
  revenue: number | null;
  expenses: number | null;
  ebitda: number | null;
  profitBeforeTax: number | null;
  netProfit: number | null;
  totalAssets: number | null;
  totalLiabilities: number | null;
  operatingActivities: number | null;
  investingActivities: number | null;
  financingActivities: number | null;
  netCashFlow: number | null;
  promoters: number | null;
  dii: number | null;
  fii: number | null;
  public: number | null;
  government: number | null;
  fiftyDMA: number | null;
  twoHundredDMA: number | null;
  rsi: number | null;
  macd: number | null;
  mtf: number | null;
  pledgeMargin: number | null;
}

interface ComprehensiveComparisonTableProps {
  data: StockData[];
  loading: boolean;
}

export default function ComprehensiveComparisonTable({ data, loading }: ComprehensiveComparisonTableProps) {
  const formatCurrency = (value: number | null, symbol?: string) => {
    if (value === null || value === undefined) return 'N/A';
    const isIndian = symbol?.includes('.NS') || symbol?.includes('.BO');
    const prefix = isIndian ? '₹' : '$';
    return `${prefix}${value.toLocaleString()}`;
  };

  const formatLargeCurrency = (value: number | null, symbol?: string) => {
    if (value === null || value === undefined) return 'N/A';
    const isIndian = symbol?.includes('.NS') || symbol?.includes('.BO');
    const prefix = isIndian ? '₹' : '$';
    
    if (value >= 1e12) return `${prefix}${(value / 1e12).toFixed(1)}T`;
    if (value >= 1e9) return `${prefix}${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e7) return `${prefix}${(value / 1e7).toFixed(1)}Cr`;
    if (value >= 1e6) return `${prefix}${(value / 1e6).toFixed(1)}M`;
    return formatCurrency(value, symbol);
  };

  const formatPercentage = (value: number | null) => {
    if (value === null || value === undefined) return 'N/A';
    return `${value.toFixed(2)}%`;
  };

  const formatNumber = (value: number | null, _symbol?: string, decimals: number = 2) => {
    if (value === null || value === undefined) return 'N/A';
    return value.toFixed(decimals);
  };

  const getChangeIcon = (value: number | null) => {
    if (value === null || value === undefined) return <Minus className="h-3 w-3" />;
    if (value > 0) return <TrendingUp className="h-3 w-3 text-green-600" />;
    if (value < 0) return <TrendingDown className="h-3 w-3 text-red-600" />;
    return <Minus className="h-3 w-3" />;
  };

  const getChangeColor = (value: number | null) => {
    if (value === null || value === undefined) return '';
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return '';
  };

  if (loading) {
    return (
      <Card className="border-muted/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Comprehensive Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-muted-foreground">Loading comprehensive data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="border-muted/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Comprehensive Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Select stocks to view comprehensive comparison
          </div>
        </CardContent>
      </Card>
    );
  }

  const sections: { title: string; rows: RowConfig[] }[] = [
    {
      title: 'Price Information',
      rows: [
        { label: 'Last Traded Price', key: 'lastTradedPrice', format: formatCurrency },
        { label: '1 Day Change', key: 'oneDayChange', format: formatCurrency, showIcon: true },
        { label: '1 Day Change %', key: 'oneDayChangePercent', format: formatPercentage, showIcon: true },
        { label: '52 Week High', key: 'fiftyTwoWeekHigh', format: formatCurrency },
        { label: '52 Week Low', key: 'fiftyTwoWeekLow', format: formatCurrency },
      ]
    },
    {
      title: 'Key Metrics',
      rows: [
        { label: 'PE Ratio', key: 'peRatio', format: formatNumber },
        { label: 'EPS', key: 'eps', format: formatNumber },
        { label: 'Volume', key: 'volume', format: (v: number | null) => v ? v.toLocaleString() : 'N/A' },
      ]
    },
    {
      title: 'Financial Data (When Available)',
      rows: [
        { label: 'Revenue', key: 'revenue', format: formatLargeCurrency },
        { label: 'Net Income', key: 'netIncome', format: formatLargeCurrency },
        { label: 'Total Assets', key: 'totalAssets', format: formatLargeCurrency },
        { label: 'ROE', key: 'roe', format: formatPercentage },
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Data Availability Notice */}
      <Card className="border-muted/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span>Real-time price data available</span>
            <div className="w-2 h-2 rounded-full bg-yellow-500 ml-4"></div>
            <span>Financial data available when possible</span>
            <div className="w-2 h-2 rounded-full bg-gray-400 ml-4"></div>
            <span>Some advanced metrics may show N/A</span>
          </div>
        </CardContent>
      </Card>

      {sections.map((section) => (
        <Card key={section.title} className="border-muted/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              {section.title}
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                {section.rows.length} metrics
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent border-muted/50">
                    <TableHead className="w-1/4 font-semibold sticky left-0 bg-muted/30 z-10">Metric</TableHead>
                    {data.map((stock, i) => (
                      <TableHead key={stock.symbol} className={cn(
                        "text-right font-bold min-w-[120px]",
                        i === 0 ? "text-blue-600" : i === 1 ? "text-purple-600" : "text-emerald-600"
                      )}>
                        {stock.symbol}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {section.rows.map((row) => (
                    <TableRow key={row.key} className="border-muted/30 hover:bg-muted/20">
                      <TableCell className="font-medium text-muted-foreground sticky left-0 bg-background/95 z-10">
                        {row.label}
                      </TableCell>
                      {data.map((stock) => {
                        const value = stock[row.key as keyof StockData] as number | null;
                        const formattedValue = row.format(value, stock.symbol);
                        
                        return (
                          <TableCell key={stock.symbol} className="text-right min-w-[120px]">
                            <div className="flex items-center justify-end gap-1">
                              {row.showIcon && getChangeIcon(value)}
                              <span className={cn(
                                "font-medium",
                                row.showIcon ? getChangeColor(value) : ""
                              )}>
                                {formattedValue}
                              </span>
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}