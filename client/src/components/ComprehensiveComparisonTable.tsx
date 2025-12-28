import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

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
  const formatCurrency = (value: number | null, symbol: string) => {
    if (value === null || value === undefined) return 'N/A';
    const isIndian = symbol.includes('.NS') || symbol.includes('.BO');
    const prefix = isIndian ? '₹' : '$';
    return `${prefix}${value.toLocaleString()}`;
  };

  const formatLargeCurrency = (value: number | null, symbol: string) => {
    if (value === null || value === undefined) return 'N/A';
    const isIndian = symbol.includes('.NS') || symbol.includes('.BO');
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

  const formatNumber = (value: number | null, decimals: number = 2) => {
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

  const sections = [
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
        { label: 'Market Cap', key: 'marketCap', format: formatLargeCurrency },
        { label: 'PE Ratio', key: 'peRatio', format: formatNumber },
        { label: 'Book Value', key: 'bookValue', format: formatCurrency },
        { label: 'PB Ratio', key: 'pbRatio', format: formatNumber },
        { label: 'ROE', key: 'roe', format: (v: number | null) => formatPercentage(v ? v * 100 : null) },
        { label: 'ROCE', key: 'roce', format: (v: number | null) => formatPercentage(v ? v * 100 : null) },
        { label: 'EPS', key: 'eps', format: formatNumber },
        { label: 'Dividend Yield', key: 'dividendYield', format: (v: number | null) => formatPercentage(v ? v * 100 : null) },
      ]
    },
    {
      title: 'Returns',
      rows: [
        { label: '1 Month', key: 'oneMonthReturn', format: formatPercentage, showIcon: true },
        { label: '3 Month', key: 'threeMonthReturn', format: formatPercentage, showIcon: true },
        { label: '1 Year', key: 'oneYearReturn', format: formatPercentage, showIcon: true },
        { label: '3 Year', key: 'threeYearReturn', format: formatPercentage, showIcon: true },
        { label: '5 Year', key: 'fiveYearReturn', format: formatPercentage, showIcon: true },
      ]
    },
    {
      title: 'Historical Performance',
      rows: [
        { label: '3 Month High', key: 'threeMonthHigh', format: formatCurrency },
        { label: '3 Month Low', key: 'threeMonthLow', format: formatCurrency },
        { label: '1 Year High', key: 'oneYearHigh', format: formatCurrency },
        { label: '1 Year Low', key: 'oneYearLow', format: formatCurrency },
        { label: '3 Year High', key: 'threeYearHigh', format: formatCurrency },
        { label: '3 Year Low', key: 'threeYearLow', format: formatCurrency },
        { label: '5 Year High', key: 'fiveYearHigh', format: formatCurrency },
        { label: '5 Year Low', key: 'fiveYearLow', format: formatCurrency },
      ]
    },
    {
      title: 'Income Statement',
      rows: [
        { label: 'Revenue', key: 'revenue', format: formatLargeCurrency },
        { label: 'Expenses', key: 'expenses', format: formatLargeCurrency },
        { label: 'EBITDA', key: 'ebitda', format: formatLargeCurrency },
        { label: 'Profit Before Tax', key: 'profitBeforeTax', format: formatLargeCurrency },
        { label: 'Net Profit', key: 'netProfit', format: formatLargeCurrency },
      ]
    },
    {
      title: 'Balance Sheet',
      rows: [
        { label: 'Total Assets', key: 'totalAssets', format: formatLargeCurrency },
        { label: 'Total Liabilities', key: 'totalLiabilities', format: formatLargeCurrency },
      ]
    },
    {
      title: 'Cash Flow',
      rows: [
        { label: 'Operating Activities', key: 'operatingActivities', format: formatLargeCurrency },
        { label: 'Investing Activities', key: 'investingActivities', format: formatLargeCurrency },
        { label: 'Financing Activities', key: 'financingActivities', format: formatLargeCurrency },
        { label: 'Net Cash Flow', key: 'netCashFlow', format: formatLargeCurrency },
      ]
    },
    {
      title: 'Share Holding Pattern',
      rows: [
        { label: 'Promoters', key: 'promoters', format: formatPercentage },
        { label: 'DII', key: 'dii', format: formatPercentage },
        { label: 'FII', key: 'fii', format: formatPercentage },
        { label: 'Public', key: 'public', format: formatPercentage },
        { label: 'Government', key: 'government', format: formatPercentage },
      ]
    },
    {
      title: 'Technicals',
      rows: [
        { label: '50 DMA', key: 'fiftyDMA', format: formatCurrency },
        { label: '200 DMA', key: 'twoHundredDMA', format: formatCurrency },
        { label: 'RSI (14)', key: 'rsi', format: formatNumber },
        { label: 'MACD (12,26)', key: 'macd', format: formatNumber },
      ]
    },
    {
      title: 'Margin Availability',
      rows: [
        { label: 'MTF', key: 'mtf', format: formatPercentage },
        { label: 'Pledge Margin', key: 'pledgeMargin', format: formatPercentage },
      ]
    }
  ];

  return (
    <div className="space-y-6">
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