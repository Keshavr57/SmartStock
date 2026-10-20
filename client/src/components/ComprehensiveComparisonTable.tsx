import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '../lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface RowConfig {
  label: string;
  key: string;
  format: (value: number | null, symbol?: string) => string;
  showIcon?: boolean;
}

// One row per stock from /api/compare/comprehensive; any metric may be null when no source reports it.
interface StockData {
  symbol: string;
  [metric: string]: string | number | null | undefined | string[];
}

interface ComprehensiveComparisonTableProps {
  data: StockData[];
  loading: boolean;
}

export default function ComprehensiveComparisonTable({ data, loading }: ComprehensiveComparisonTableProps) {
  const formatCurrency = (value: number | null, _symbol?: string) => {
    if (value === null || value === undefined || typeof value !== 'number') return 'N/A';
    const prefix = '₹';
    return `${prefix}${value.toLocaleString()}`;
  };

  // Indian convention: lakh crore / crore.
  const formatLargeCurrency = (value: number | null, symbol?: string) => {
    if (value === null || value === undefined || typeof value !== 'number') return 'N/A';
    const sign = value < 0 ? '-' : '';
    const abs = Math.abs(value);
    if (abs >= 1e12) return `${sign}₹${(abs / 1e12).toFixed(2)} L Cr`;
    if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toLocaleString('en-IN', { maximumFractionDigits: 0 })} Cr`;
    if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(2)} L`;
    return formatCurrency(value, symbol);
  };

  const formatText = (value: unknown) => {
    if (value === null || value === undefined || value === '') return 'N/A';
    return String(value).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const formatPercentage = (value: number | null) => {
    if (value === null || value === undefined || typeof value !== 'number') return 'N/A';
    return `${value.toFixed(2)}%`;
  };

  const formatNumber = (value: number | null, _symbol?: string, decimals: number = 2) => {
    if (value === null || value === undefined || typeof value !== 'number') return 'N/A';
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

  const availableStocks = data;

  const sections: { title: string; rows: RowConfig[] }[] = [
    {
      title: 'Price & Returns',
      rows: [
        { label: 'Last Traded Price', key: 'lastTradedPrice', format: formatCurrency },
        { label: '1 Day Change %', key: 'oneDayChangePercent', format: formatPercentage, showIcon: true },
        { label: '1 Month Return', key: 'oneMonthReturn', format: formatPercentage, showIcon: true },
        { label: '3 Month Return', key: 'threeMonthReturn', format: formatPercentage, showIcon: true },
        { label: '6 Month Return', key: 'sixMonthReturn', format: formatPercentage, showIcon: true },
        { label: '1 Year Return', key: 'oneYearReturn', format: formatPercentage, showIcon: true },
        { label: '3 Year Return', key: 'threeYearReturn', format: formatPercentage, showIcon: true },
        { label: '5 Year Return', key: 'fiveYearReturn', format: formatPercentage, showIcon: true },
        { label: '52 Week High', key: 'fiftyTwoWeekHigh', format: formatCurrency },
        { label: '52 Week Low', key: 'fiftyTwoWeekLow', format: formatCurrency },
      ]
    },
    {
      title: 'Valuation',
      rows: [
        { label: 'Market Cap', key: 'marketCap', format: formatLargeCurrency },
        { label: 'P/E (TTM)', key: 'peRatio', format: formatNumber },
        { label: 'Forward P/E', key: 'forwardPE', format: formatNumber },
        { label: 'P/B', key: 'pbRatio', format: formatNumber },
        { label: 'PEG Ratio', key: 'pegRatio', format: formatNumber },
        { label: 'EV / EBITDA', key: 'evToEbitda', format: formatNumber },
        { label: 'Price / Sales', key: 'priceToSales', format: formatNumber },
        { label: 'EPS (TTM)', key: 'eps', format: formatCurrency },
        { label: 'Book Value / Share', key: 'bookValue', format: formatCurrency },
        { label: 'Dividend Yield', key: 'dividendYield', format: formatPercentage },
      ]
    },
    {
      title: 'Profitability & Growth',
      rows: [
        { label: 'ROE', key: 'roe', format: formatPercentage },
        { label: 'ROA', key: 'roa', format: formatPercentage },
        { label: 'ROCE', key: 'roce', format: formatPercentage },
        { label: 'Net Profit Margin', key: 'profitMargin', format: formatPercentage },
        { label: 'Operating Margin', key: 'operatingMargin', format: formatPercentage },
        { label: 'Gross Margin', key: 'grossMargin', format: formatPercentage },
        { label: 'Revenue Growth (YoY)', key: 'revenueGrowth', format: formatPercentage, showIcon: true },
        { label: 'Earnings Growth (YoY)', key: 'earningsGrowth', format: formatPercentage, showIcon: true },
      ]
    },
    {
      title: 'Financials',
      rows: [
        { label: 'Revenue (TTM)', key: 'revenue', format: formatLargeCurrency },
        { label: 'EBITDA', key: 'ebitda', format: formatLargeCurrency },
        { label: 'Net Income', key: 'netIncome', format: formatLargeCurrency },
        { label: 'Total Assets', key: 'totalAssets', format: formatLargeCurrency },
        { label: 'Total Liabilities', key: 'totalLiabilities', format: formatLargeCurrency },
        { label: 'Total Debt', key: 'totalDebt', format: formatLargeCurrency },
        { label: 'Cash', key: 'totalCash', format: formatLargeCurrency },
        { label: 'Free Cash Flow', key: 'freeCashFlow', format: formatLargeCurrency },
        { label: 'Debt / Equity', key: 'debtToEquity', format: formatNumber },
        { label: 'Current Ratio', key: 'currentRatio', format: formatNumber },
      ]
    },
    {
      title: 'Ownership',
      rows: [
        { label: 'Promoter / Insider Holding', key: 'promoterHolding', format: formatPercentage },
        { label: 'Institutional Holding', key: 'institutionalHolding', format: formatPercentage },
        { label: 'FII Holding', key: 'fiiHolding', format: formatPercentage },
      ]
    },
    {
      title: 'Technicals & Analyst View',
      rows: [
        { label: 'RSI (14)', key: 'rsi', format: formatNumber },
        { label: '50 Day Moving Avg', key: 'fiftyDMA', format: formatCurrency },
        { label: '200 Day Moving Avg', key: 'twoHundredDMA', format: formatCurrency },
        { label: 'Beta', key: 'beta', format: formatNumber },
        { label: 'Analyst Consensus', key: 'recommendation', format: (v) => formatText(v) },
        { label: 'Analyst Target Price', key: 'targetMeanPrice', format: formatCurrency },
        { label: 'No. of Analysts', key: 'analystCount', format: (v) => formatNumber(v, undefined, 0) },
        { label: 'Sector', key: 'sector', format: (v) => formatText(v) },
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground">
        Live price from Yahoo Finance (NSE); fundamentals from Yahoo Finance, with ROCE and promoter/FII holding from SmartStock's
        dataset where available. N/A means no source reports that metric for this company (e.g. EBITDA for banks).
      </p>

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
                    {availableStocks.map((stock, i) => (
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
                      {availableStocks.map((stock) => {
                        const value = stock[row.key] as number | null;
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