import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Target,
  BarChart3,
  DollarSign,
  TrendingDown,
  Shield,
  Zap,
  BookOpen,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { cn } from '../lib/utils'
import { useState } from 'react'

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
  marketCap: number | null;
  debtToEquity: number | null;
  profitMargin: number | null;
}

interface AnalysisFactor {
  name: string;
  score: number;
  weight: number;
  explanation: string;
  impact: 'positive' | 'negative' | 'neutral';
  educationalNote: string;
  icon: React.ReactNode;
}

interface Analysis {
  overallScore: number;
  recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'WEAK_HOLD' | 'AVOID';
  confidence: number;
  factors: AnalysisFactor[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  investmentHorizon: string[];
  suitableFor: string[];
  keyStrengths: string[];
  keyWeaknesses: string[];
  actionableInsights: string[];
  priceTarget: { low: number; high: number; rationale: string } | null;
}

interface StockRecommendationEngineProps {
  data: StockData[];
}

export default function StockRecommendationEngine({ data }: StockRecommendationEngineProps) {
  const [expandedStocks, setExpandedStocks] = useState<Set<string>>(new Set());

  const toggleExpanded = (symbol: string) => {
    const newExpanded = new Set(expandedStocks);
    if (newExpanded.has(symbol)) {
      newExpanded.delete(symbol);
    } else {
      newExpanded.add(symbol);
    }
    setExpandedStocks(newExpanded);
  };

  const analyzeStock = (stock: StockData): Analysis => {
    const factors: AnalysisFactor[] = [];
    let totalWeightedScore = 0;
    let totalWeight = 0;

    // 1. Valuation Analysis (P/E Ratio) - Weight: 20%
    if (stock.peRatio && stock.peRatio > 0) {
      let score = 50;
      let explanation = '';
      let impact: 'positive' | 'negative' | 'neutral' = 'neutral';
      
      if (stock.peRatio < 10) {
        score = 85;
        explanation = `Very attractive P/E of ${stock.peRatio.toFixed(1)}x suggests the stock is significantly undervalued`;
        impact = 'positive';
      } else if (stock.peRatio < 15) {
        score = 75;
        explanation = `Good P/E of ${stock.peRatio.toFixed(1)}x indicates reasonable valuation`;
        impact = 'positive';
      } else if (stock.peRatio < 25) {
        score = 60;
        explanation = `Fair P/E of ${stock.peRatio.toFixed(1)}x shows market-average valuation`;
        impact = 'neutral';
      } else if (stock.peRatio < 35) {
        score = 35;
        explanation = `High P/E of ${stock.peRatio.toFixed(1)}x suggests expensive valuation or high growth expectations`;
        impact = 'negative';
      } else {
        score = 15;
        explanation = `Very high P/E of ${stock.peRatio.toFixed(1)}x indicates potentially overvalued stock`;
        impact = 'negative';
      }

      factors.push({
        name: 'Valuation (P/E Ratio)',
        score,
        weight: 20,
        explanation,
        impact,
        educationalNote: 'P/E ratio compares stock price to earnings per share. Lower P/E often means better value, but consider growth prospects.',
        icon: <DollarSign className="h-4 w-4" />
      });
      totalWeightedScore += score * 20;
      totalWeight += 20;
    }

    // 2. Profitability Analysis (ROE) - Weight: 18%
    if (stock.roe && stock.roe > 0) {
      let score = 50;
      let explanation = '';
      let impact: 'positive' | 'negative' | 'neutral' = 'neutral';
      
      if (stock.roe > 20) {
        score = 90;
        explanation = `Excellent ROE of ${stock.roe.toFixed(1)}% shows highly efficient use of shareholder equity`;
        impact = 'positive';
      } else if (stock.roe > 15) {
        score = 80;
        explanation = `Strong ROE of ${stock.roe.toFixed(1)}% indicates good management efficiency`;
        impact = 'positive';
      } else if (stock.roe > 10) {
        score = 65;
        explanation = `Decent ROE of ${stock.roe.toFixed(1)}% shows reasonable profitability`;
        impact = 'neutral';
      } else if (stock.roe > 5) {
        score = 40;
        explanation = `Low ROE of ${stock.roe.toFixed(1)}% suggests inefficient use of equity`;
        impact = 'negative';
      } else {
        score = 20;
        explanation = `Very low ROE of ${stock.roe.toFixed(1)}% indicates poor management efficiency`;
        impact = 'negative';
      }

      factors.push({
        name: 'Profitability (ROE)',
        score,
        weight: 18,
        explanation,
        impact,
        educationalNote: 'Return on Equity measures how effectively a company uses shareholder money to generate profits. Above 15% is generally good.',
        icon: <TrendingUp className="h-4 w-4" />
      });
      totalWeightedScore += score * 18;
      totalWeight += 18;
    }

    // 3. Earnings Quality (EPS) - Weight: 15%
    if (stock.eps && stock.eps > 0) {
      let score = 50;
      let explanation = '';
      let impact: 'positive' | 'negative' | 'neutral' = 'neutral';
      
      if (stock.eps > 100) {
        score = 85;
        explanation = `High EPS of ₹${stock.eps.toFixed(2)} shows strong per-share profitability`;
        impact = 'positive';
      } else if (stock.eps > 50) {
        score = 75;
        explanation = `Good EPS of ₹${stock.eps.toFixed(2)} indicates solid earnings generation`;
        impact = 'positive';
      } else if (stock.eps > 20) {
        score = 60;
        explanation = `Moderate EPS of ₹${stock.eps.toFixed(2)} shows decent profitability`;
        impact = 'neutral';
      } else if (stock.eps > 5) {
        score = 40;
        explanation = `Low EPS of ₹${stock.eps.toFixed(2)} suggests limited per-share earnings`;
        impact = 'negative';
      } else {
        score = 25;
        explanation = `Very low EPS of ₹${stock.eps.toFixed(2)} indicates weak earnings performance`;
        impact = 'negative';
      }

      factors.push({
        name: 'Earnings Quality (EPS)',
        score,
        weight: 15,
        explanation,
        impact,
        educationalNote: 'Earnings Per Share shows company profit divided by number of shares. Higher EPS generally indicates better performance.',
        icon: <BarChart3 className="h-4 w-4" />
      });
      totalWeightedScore += score * 15;
      totalWeight += 15;
    }

    // 4. Price Position Analysis - Weight: 12%
    if (stock.lastTradedPrice && stock.fiftyTwoWeekHigh && stock.fiftyTwoWeekLow) {
      const range = stock.fiftyTwoWeekHigh - stock.fiftyTwoWeekLow;
      const currentPosition = (stock.lastTradedPrice - stock.fiftyTwoWeekLow) / range;
      
      let score = 50;
      let explanation = '';
      let impact: 'positive' | 'negative' | 'neutral' = 'neutral';
      
      if (currentPosition < 0.2) {
        score = 80;
        explanation = `Trading at ${(currentPosition * 100).toFixed(0)}% of 52-week range - potential value opportunity`;
        impact = 'positive';
      } else if (currentPosition < 0.4) {
        score = 70;
        explanation = `Trading at ${(currentPosition * 100).toFixed(0)}% of 52-week range - good entry point`;
        impact = 'positive';
      } else if (currentPosition < 0.7) {
        score = 55;
        explanation = `Trading at ${(currentPosition * 100).toFixed(0)}% of 52-week range - neutral position`;
        impact = 'neutral';
      } else if (currentPosition < 0.9) {
        score = 35;
        explanation = `Trading at ${(currentPosition * 100).toFixed(0)}% of 52-week range - near highs, limited upside`;
        impact = 'negative';
      } else {
        score = 25;
        explanation = `Trading at ${(currentPosition * 100).toFixed(0)}% of 52-week range - at or near highs`;
        impact = 'negative';
      }

      factors.push({
        name: 'Price Position',
        score,
        weight: 12,
        explanation,
        impact,
        educationalNote: 'Stocks trading near 52-week lows may offer value, while those near highs might have limited short-term upside.',
        icon: <Target className="h-4 w-4" />
      });
      totalWeightedScore += score * 12;
      totalWeight += 12;
    }

    // 5. Volatility & Risk Analysis - Weight: 10%
    if (stock.oneDayChangePercent !== null) {
      let score = 50;
      let explanation = '';
      let impact: 'positive' | 'negative' | 'neutral' = 'neutral';
      
      const absChange = Math.abs(stock.oneDayChangePercent);
      if (absChange < 1) {
        score = 75;
        explanation = `Low volatility (${stock.oneDayChangePercent.toFixed(2)}% today) indicates stable price movement`;
        impact = 'positive';
      } else if (absChange < 3) {
        score = 65;
        explanation = `Moderate volatility (${stock.oneDayChangePercent.toFixed(2)}% today) shows normal price movement`;
        impact = 'neutral';
      } else if (absChange < 5) {
        score = 45;
        explanation = `High volatility (${stock.oneDayChangePercent.toFixed(2)}% today) indicates increased risk`;
        impact = 'negative';
      } else {
        score = 25;
        explanation = `Very high volatility (${stock.oneDayChangePercent.toFixed(2)}% today) suggests significant risk`;
        impact = 'negative';
      }

      factors.push({
        name: 'Volatility & Risk',
        score,
        weight: 10,
        explanation,
        impact,
        educationalNote: 'High daily price movements indicate higher risk. Stable stocks are generally safer for conservative investors.',
        icon: <AlertTriangle className="h-4 w-4" />
      });
      totalWeightedScore += score * 10;
      totalWeight += 10;
    }

    // 6. Liquidity Analysis (Volume) - Weight: 8%
    if (stock.volume && stock.volume > 0) {
      let score = 50;
      let explanation = '';
      let impact: 'positive' | 'negative' | 'neutral' = 'neutral';
      
      if (stock.volume > 5000000) {
        score = 85;
        explanation = `High volume (${(stock.volume / 1000000).toFixed(1)}M) ensures excellent liquidity`;
        impact = 'positive';
      } else if (stock.volume > 1000000) {
        score = 75;
        explanation = `Good volume (${(stock.volume / 1000000).toFixed(1)}M) provides adequate liquidity`;
        impact = 'positive';
      } else if (stock.volume > 500000) {
        score = 60;
        explanation = `Moderate volume (${(stock.volume / 1000).toFixed(0)}K) offers reasonable liquidity`;
        impact = 'neutral';
      } else if (stock.volume > 100000) {
        score = 40;
        explanation = `Low volume (${(stock.volume / 1000).toFixed(0)}K) may cause liquidity issues`;
        impact = 'negative';
      } else {
        score = 25;
        explanation = `Very low volume (${(stock.volume / 1000).toFixed(0)}K) creates significant liquidity risk`;
        impact = 'negative';
      }

      factors.push({
        name: 'Liquidity (Volume)',
        score,
        weight: 8,
        explanation,
        impact,
        educationalNote: 'Higher trading volume means easier buying/selling without affecting price. Low volume stocks can be risky.',
        icon: <Zap className="h-4 w-4" />
      });
      totalWeightedScore += score * 8;
      totalWeight += 8;
    }

    // 7. Financial Health (Debt-to-Equity) - Weight: 10%
    if (stock.debtToEquity !== null && stock.debtToEquity !== undefined) {
      let score = 50;
      let explanation = '';
      let impact: 'positive' | 'negative' | 'neutral' = 'neutral';
      
      if (stock.debtToEquity < 0.3) {
        score = 85;
        explanation = `Low debt-to-equity (${stock.debtToEquity.toFixed(2)}) shows strong financial health`;
        impact = 'positive';
      } else if (stock.debtToEquity < 0.6) {
        score = 70;
        explanation = `Moderate debt-to-equity (${stock.debtToEquity.toFixed(2)}) indicates balanced leverage`;
        impact = 'neutral';
      } else if (stock.debtToEquity < 1.0) {
        score = 45;
        explanation = `High debt-to-equity (${stock.debtToEquity.toFixed(2)}) suggests elevated financial risk`;
        impact = 'negative';
      } else {
        score = 25;
        explanation = `Very high debt-to-equity (${stock.debtToEquity.toFixed(2)}) indicates significant leverage risk`;
        impact = 'negative';
      }

      factors.push({
        name: 'Financial Health (D/E)',
        score,
        weight: 10,
        explanation,
        impact,
        educationalNote: 'Debt-to-Equity ratio shows how much debt a company has relative to equity. Lower ratios are generally safer.',
        icon: <Shield className="h-4 w-4" />
      });
      totalWeightedScore += score * 10;
      totalWeight += 10;
    }

    // 8. Profit Margin Analysis - Weight: 7%
    if (stock.profitMargin && stock.profitMargin > 0) {
      let score = 50;
      let explanation = '';
      let impact: 'positive' | 'negative' | 'neutral' = 'neutral';
      
      if (stock.profitMargin > 20) {
        score = 90;
        explanation = `Excellent profit margin (${stock.profitMargin.toFixed(1)}%) shows strong pricing power`;
        impact = 'positive';
      } else if (stock.profitMargin > 10) {
        score = 75;
        explanation = `Good profit margin (${stock.profitMargin.toFixed(1)}%) indicates healthy profitability`;
        impact = 'positive';
      } else if (stock.profitMargin > 5) {
        score = 55;
        explanation = `Moderate profit margin (${stock.profitMargin.toFixed(1)}%) shows decent efficiency`;
        impact = 'neutral';
      } else {
        score = 30;
        explanation = `Low profit margin (${stock.profitMargin.toFixed(1)}%) suggests competitive pressure`;
        impact = 'negative';
      }

      factors.push({
        name: 'Profit Margin',
        score,
        weight: 7,
        explanation,
        impact,
        educationalNote: 'Profit margin shows what percentage of revenue becomes profit. Higher margins indicate better operational efficiency.',
        icon: <TrendingUp className="h-4 w-4" />
      });
      totalWeightedScore += score * 7;
      totalWeight += 7;
    }

    // Calculate overall score
    const overallScore = totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 50;

    // Determine recommendation based on score
    let recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'WEAK_HOLD' | 'AVOID';
    let confidence = 0;
    
    if (overallScore >= 80) {
      recommendation = 'STRONG_BUY';
      confidence = 85;
    } else if (overallScore >= 65) {
      recommendation = 'BUY';
      confidence = 75;
    } else if (overallScore >= 50) {
      recommendation = 'HOLD';
      confidence = 60;
    } else if (overallScore >= 35) {
      recommendation = 'WEAK_HOLD';
      confidence = 45;
    } else {
      recommendation = 'AVOID';
      confidence = 70;
    }

    // Determine risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
    if (overallScore >= 70) riskLevel = 'LOW';
    else if (overallScore >= 55) riskLevel = 'MEDIUM';
    else if (overallScore >= 40) riskLevel = 'HIGH';
    else riskLevel = 'VERY_HIGH';

    // Generate insights
    const positiveFactors = factors.filter(f => f.impact === 'positive').sort((a, b) => b.score - a.score);
    const negativeFactors = factors.filter(f => f.impact === 'negative').sort((a, b) => a.score - b.score);

    const keyStrengths = positiveFactors.slice(0, 3).map(f => f.explanation);
    const keyWeaknesses = negativeFactors.slice(0, 3).map(f => f.explanation);

    // Generate actionable insights
    const actionableInsights: string[] = [];
    
    if (recommendation === 'STRONG_BUY' || recommendation === 'BUY') {
      actionableInsights.push('Consider adding this stock to your watchlist for potential investment');
      actionableInsights.push('Monitor quarterly earnings reports for continued performance');
      if (riskLevel === 'LOW') {
        actionableInsights.push('Suitable for conservative portfolios due to low risk profile');
      }
    } else if (recommendation === 'HOLD') {
      actionableInsights.push('If you own this stock, consider holding for long-term growth');
      actionableInsights.push('Wait for better entry points or improved fundamentals before buying');
    } else {
      actionableInsights.push('Consider avoiding this investment until fundamentals improve');
      actionableInsights.push('Focus on stocks with better risk-reward profiles');
    }

    // Investment horizon suggestions
    const investmentHorizon: string[] = [];
    if (overallScore >= 70) {
      investmentHorizon.push('Long-term (3+ years)', 'Medium-term (1-3 years)');
    } else if (overallScore >= 50) {
      investmentHorizon.push('Long-term (3+ years)');
    } else {
      investmentHorizon.push('Not recommended for any horizon');
    }

    // Suitable investor types
    const suitableFor: string[] = [];
    if (riskLevel === 'LOW') {
      suitableFor.push('Conservative investors', 'Retirement portfolios', 'Dividend seekers');
    } else if (riskLevel === 'MEDIUM') {
      suitableFor.push('Moderate risk investors', 'Balanced portfolios', 'Growth seekers');
    } else if (riskLevel === 'HIGH') {
      suitableFor.push('Aggressive investors', 'Experienced traders', 'High-risk portfolios');
    } else {
      suitableFor.push('Speculative traders only', 'Very experienced investors');
    }

    // Price target calculation (simplified)
    let priceTarget: { low: number; high: number; rationale: string } | null = null;
    if (stock.lastTradedPrice && stock.peRatio && stock.eps) {
      const currentPrice = stock.lastTradedPrice;
      const fairPE = 18; // Assumed fair P/E for calculation
      const fairValue = stock.eps * fairPE;
      
      priceTarget = {
        low: Math.round(fairValue * 0.9),
        high: Math.round(fairValue * 1.1),
        rationale: `Based on fair P/E of ${fairPE}x and current EPS of ₹${stock.eps.toFixed(2)}`
      };
    }

    return {
      overallScore,
      recommendation,
      confidence,
      factors,
      riskLevel,
      investmentHorizon,
      suitableFor,
      keyStrengths,
      keyWeaknesses,
      actionableInsights,
      priceTarget
    };
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'STRONG_BUY': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400';
      case 'BUY': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300';
      case 'HOLD': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400';
      case 'WEAK_HOLD': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'AVOID': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'text-green-600 dark:text-green-400';
      case 'MEDIUM': return 'text-yellow-600 dark:text-yellow-400';
      case 'HIGH': return 'text-orange-600 dark:text-orange-400';
      case 'VERY_HIGH': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 65) return 'text-blue-600 dark:text-blue-400';
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 35) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (!data || data.length === 0) {
    return (
      <Card className="border-muted/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Advanced Educational Stock Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">Add stocks to compare for comprehensive educational analysis</p>
            <p className="text-sm text-muted-foreground">Get detailed factor-based recommendations with transparent scoring</p>
          </div>
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
            Advanced Educational Stock Analysis & Recommendations
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Comprehensive factor-based analysis with transparent scoring methodology. 
            Learn how professionals evaluate stocks through our educational recommendations.
          </p>
        </CardHeader>
      </Card>

      {data.map((stock) => {
        const analysis = analyzeStock(stock);
        const isExpanded = expandedStocks.has(stock.symbol);
        
        return (
          <Card key={stock.symbol} className="border-muted/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-xl">{stock.symbol}</CardTitle>
                    <Badge className={cn("px-3 py-1", getRecommendationColor(analysis.recommendation))}>
                      {analysis.recommendation.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{stock.name}</p>
                  {stock.lastTradedPrice && (
                    <p className="text-lg font-semibold mt-1">
                      ₹{stock.lastTradedPrice.toLocaleString()}
                      {stock.oneDayChangePercent && (
                        <span className={cn(
                          "ml-2 text-sm",
                          stock.oneDayChangePercent >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          ({stock.oneDayChangePercent >= 0 ? '+' : ''}{stock.oneDayChangePercent.toFixed(2)}%)
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-muted-foreground">Overall Score:</span>
                    <span className={cn("text-2xl font-bold", getScoreColor(analysis.overallScore))}>
                      {analysis.overallScore}
                    </span>
                    <span className="text-sm text-muted-foreground">/100</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Confidence:</span>
                    <span className="font-medium">{analysis.confidence}%</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <Progress value={analysis.overallScore} className="h-2" />
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Quick Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">Risk Level:</span>
                  <span className={cn("font-semibold", getRiskColor(analysis.riskLevel))}>
                    {analysis.riskLevel.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  <span className="text-sm">Horizon:</span>
                  <span className="font-medium text-sm">
                    {analysis.investmentHorizon[0] || 'Not recommended'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Best For:</span>
                  <span className="font-medium text-sm">
                    {analysis.suitableFor[0] || 'None'}
                  </span>
                </div>
              </div>

              {/* Key Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.keyStrengths.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      Key Strengths
                    </h4>
                    <ul className="space-y-1">
                      {analysis.keyStrengths.slice(0, 2).map((strength, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {analysis.keyWeaknesses.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-red-600">
                      <TrendingDown className="h-4 w-4" />
                      Key Concerns
                    </h4>
                    <ul className="space-y-1">
                      {analysis.keyWeaknesses.slice(0, 2).map((weakness, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                          {weakness}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Price Target */}
              {analysis.priceTarget && (
                <div className="bg-muted/30 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Educational Price Target
                  </h4>
                  <div className="flex items-center gap-4">
                    <span className="text-sm">Range: ₹{analysis.priceTarget.low.toLocaleString()} - ₹{analysis.priceTarget.high.toLocaleString()}</span>
                    <Badge variant="outline" className="text-xs">
                      {analysis.priceTarget.rationale}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Actionable Insights */}
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Actionable Insights
                </h4>
                <ul className="space-y-1">
                  {analysis.actionableInsights.map((insight, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Expand/Collapse Button */}
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleExpanded(stock.symbol)}
                  className="gap-2"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Hide Detailed Analysis
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Show Detailed Factor Analysis
                    </>
                  )}
                </Button>
              </div>

              {/* Detailed Factor Analysis */}
              {isExpanded && (
                <div className="space-y-4 border-t pt-4">
                  <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Detailed Factor Analysis
                  </h4>
                  
                  {analysis.factors.map((factor, index) => (
                    <Card key={index} className="border-muted/30">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {factor.icon}
                            <h5 className="font-semibold">{factor.name}</h5>
                            <Badge variant="outline" className="text-xs">
                              Weight: {factor.weight}%
                            </Badge>
                          </div>
                          <div className="text-right">
                            <span className={cn("text-lg font-bold", getScoreColor(factor.score))}>
                              {factor.score}
                            </span>
                            <span className="text-sm text-muted-foreground">/100</span>
                          </div>
                        </div>
                        
                        <Progress value={factor.score} className="h-2 mb-3" />
                        
                        <div className="space-y-2">
                          <p className="text-sm">{factor.explanation}</p>
                          <div className="bg-muted/50 p-3 rounded-lg">
                            <p className="text-xs text-muted-foreground">
                              <strong>Learn:</strong> {factor.educationalNote}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Investment Suitability */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div>
                      <h5 className="font-semibold mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Investment Horizon
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {analysis.investmentHorizon.map((horizon, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {horizon}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Suitable Investor Types
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {analysis.suitableFor.map((type, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Educational Disclaimer */}
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">Educational Purpose Only</h5>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      This analysis uses {analysis.factors.length} weighted factors to demonstrate professional stock evaluation methods. 
                      Scores are calculated using fundamental analysis principles. Always conduct your own research and consult 
                      financial advisors before making investment decisions.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}