import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StockData {
  symbol: string;
  name: string;
  lastTradedPrice: number | null;
  oneDayChangePercent: number | null;
  peRatio: number | null;
  eps: number | null;
  volume: number | null;
  revenue: number | null;
  roe: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
}

interface StockRecommendationEngineProps {
  data: StockData[];
}

interface Analysis {
  score: number;
  recommendation: 'BUY' | 'HOLD' | 'AVOID' | 'LEARN';
  reasons: string[];
  educationalPoints: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  suitableFor: string[];
}

export default function StockRecommendationEngine({ data }: StockRecommendationEngineProps) {
  const analyzeStock = (stock: StockData): Analysis => {
    let score = 50; // Start with neutral score
    const reasons: string[] = [];
    const educationalPoints: string[] = [];
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
    const suitableFor: string[] = [];

    // P/E Ratio Analysis
    if (stock.peRatio) {
      if (stock.peRatio < 15) {
        score += 15;
        reasons.push(`Low P/E ratio (${stock.peRatio.toFixed(1)}) suggests undervalued stock`);
        educationalPoints.push("P/E ratio below 15 often indicates good value, but check why it's low");
      } else if (stock.peRatio < 25) {
        score += 10;
        reasons.push(`Reasonable P/E ratio (${stock.peRatio.toFixed(1)}) shows fair valuation`);
        educationalPoints.push("P/E ratio 15-25 is generally considered reasonable for most stocks");
      } else if (stock.peRatio < 40) {
        score -= 5;
        reasons.push(`High P/E ratio (${stock.peRatio.toFixed(1)}) suggests expensive valuation`);
        educationalPoints.push("High P/E ratios can indicate growth expectations or overvaluation");
      } else {
        score -= 15;
        reasons.push(`Very high P/E ratio (${stock.peRatio.toFixed(1)}) indicates overvalued stock`);
        educationalPoints.push("P/E above 40 is risky - stock might be in a bubble");
        riskLevel = 'HIGH';
      }
    }

    // EPS Analysis
    if (stock.eps) {
      if (stock.eps > 50) {
        score += 10;
        reasons.push(`Strong earnings per share (₹${stock.eps.toFixed(2)})`);
        educationalPoints.push("High EPS shows the company is profitable per share");
      } else if (stock.eps > 20) {
        score += 5;
        reasons.push(`Good earnings per share (₹${stock.eps.toFixed(2)})`);
      } else if (stock.eps < 5) {
        score -= 10;
        reasons.push(`Low earnings per share (₹${stock.eps.toFixed(2)})`);
        educationalPoints.push("Low EPS might indicate struggling profitability");
        riskLevel = 'HIGH';
      }
    }

    // Price Movement Analysis
    if (stock.oneDayChangePercent) {
      if (Math.abs(stock.oneDayChangePercent) > 5) {
        score -= 5;
        reasons.push(`High volatility (${stock.oneDayChangePercent.toFixed(2)}% today)`);
        educationalPoints.push("High daily volatility indicates higher risk");
        riskLevel = 'HIGH';
      }
    }

    // 52-week range analysis
    if (stock.lastTradedPrice && stock.fiftyTwoWeekHigh && stock.fiftyTwoWeekLow) {
      const range = stock.fiftyTwoWeekHigh - stock.fiftyTwoWeekLow;
      const currentPosition = (stock.lastTradedPrice - stock.fiftyTwoWeekLow) / range;
      
      if (currentPosition < 0.3) {
        score += 10;
        reasons.push("Trading near 52-week low - potential value opportunity");
        educationalPoints.push("Stocks near 52-week lows can be good value buys if fundamentals are strong");
      } else if (currentPosition > 0.8) {
        score -= 5;
        reasons.push("Trading near 52-week high - limited upside");
        educationalPoints.push("Stocks near 52-week highs might have limited short-term upside");
      }
    }

    // ROE Analysis (when available)
    if (stock.roe) {
      if (stock.roe > 15) {
        score += 15;
        reasons.push(`Excellent ROE (${stock.roe.toFixed(1)}%) shows efficient management`);
        educationalPoints.push("ROE above 15% indicates the company efficiently uses shareholder money");
      } else if (stock.roe > 10) {
        score += 10;
        reasons.push(`Good ROE (${stock.roe.toFixed(1)}%) shows decent profitability`);
      } else if (stock.roe < 5) {
        score -= 10;
        reasons.push(`Low ROE (${stock.roe.toFixed(1)}%) indicates poor efficiency`);
        educationalPoints.push("Low ROE suggests the company isn't efficiently using shareholder equity");
      }
    }

    // Volume Analysis
    if (stock.volume) {
      if (stock.volume > 1000000) {
        score += 5;
        reasons.push("High trading volume indicates good liquidity");
        educationalPoints.push("High volume stocks are easier to buy/sell without affecting price");
      } else if (stock.volume < 100000) {
        score -= 5;
        reasons.push("Low trading volume - liquidity concerns");
        educationalPoints.push("Low volume stocks can be harder to sell quickly");
        riskLevel = 'HIGH';
      }
    }

    // Determine recommendation
    let recommendation: 'BUY' | 'HOLD' | 'AVOID' | 'LEARN';
    if (score >= 70) {
      recommendation = 'BUY';
      suitableFor.push("Long-term investors", "Value seekers");
    } else if (score >= 50) {
      recommendation = 'HOLD';
      suitableFor.push("Moderate risk investors", "Learning investors");
    } else if (score >= 30) {
      recommendation = 'LEARN';
      suitableFor.push("Educational purposes", "Paper trading");
    } else {
      recommendation = 'AVOID';
      suitableFor.push("Experienced traders only");
    }

    // Adjust risk level based on final score
    if (score < 40) riskLevel = 'HIGH';
    else if (score > 65) riskLevel = 'LOW';

    return {
      score,
      recommendation,
      reasons,
      educationalPoints,
      riskLevel,
      suitableFor
    };
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'BUY': return 'bg-green-100 text-green-800 border-green-200';
      case 'HOLD': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'LEARN': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'AVOID': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'text-green-600';
      case 'MEDIUM': return 'text-yellow-600';
      case 'HIGH': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (!data || data.length === 0) {
    return (
      <Card className="border-muted/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Educational Stock Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Add stocks to compare for educational analysis and recommendations.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-muted/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Educational Stock Analysis & Recommendations
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Learn about stock analysis through our educational recommendations. This is for learning purposes only, not financial advice.
          </p>
        </CardHeader>
      </Card>

      {data.map((stock) => {
        const analysis = analyzeStock(stock);
        
        return (
          <Card key={stock.symbol} className="border-muted/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{stock.symbol}</CardTitle>
                  <p className="text-sm text-muted-foreground">{stock.name}</p>
                </div>
                <div className="text-right">
                  <Badge className={cn("mb-2", getRecommendationColor(analysis.recommendation))}>
                    {analysis.recommendation}
                  </Badge>
                  <div className="text-sm">
                    Score: <span className="font-bold">{analysis.score}/100</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Risk Level */}
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">Risk Level: </span>
                <span className={cn("font-semibold", getRiskColor(analysis.riskLevel))}>
                  {analysis.riskLevel}
                </span>
              </div>

              {/* Suitable For */}
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Suitable For:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.suitableFor.map((type, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Analysis Reasons */}
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Analysis Points:
                </h4>
                <ul className="space-y-1">
                  {analysis.reasons.map((reason, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Educational Points */}
              {analysis.educationalPoints.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Learn About Stock Analysis:
                  </h4>
                  <ul className="space-y-1">
                    {analysis.educationalPoints.map((point, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 flex-shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Disclaimer */}
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <strong>Educational Purpose Only:</strong> This analysis is for learning about stock evaluation. 
                  Always do your own research and consult financial advisors before making investment decisions.
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}