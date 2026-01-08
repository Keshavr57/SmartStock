import { fetchYahooFundamentals } from "../services/yahoo.service.js";
import { fetchIndianStock } from "../services/indianStock.service.js";
import comprehensiveStockService from "../services/comprehensiveStockService.js";

export const compareStocks = async (req, res) => {
  try {
    const { symbols } = req.body;
    const results = [];

    for (let rawSym of symbols) {
      const sym = rawSym.trim().toUpperCase();
      let data = null;

      // Check if it's an Indian stock
      if (sym.endsWith('.NS') || sym.endsWith('.BO')) {
        console.log(`🇮🇳 Processing Indian stock: ${sym}`);
        
        // Try Indian API first
        data = await fetchIndianStock(sym);
        
        // If Indian API fails or returns incomplete data, try fallback
        if (!data || !data.pe) {
          console.log(`Using fallback for ${sym}`);
          data = await fetchAlternativeIndianStock(sym);
        }
        
        // Last resort: Yahoo Finance
        if (!data) {
          console.log(`Using Yahoo as last resort for ${sym}`);
          data = await fetchYahooFundamentals(sym);
        }
      } else {
        console.log(`Processing US/International stock: ${sym}`);
        
        // For US/international stocks, try Yahoo first
        data = await fetchYahooFundamentals(sym);
        
        // Fallback to mock data if Yahoo fails
        if (!data || !data.pe) {
          console.log(`🔄 Using US fallback for ${sym}`);
          data = await fetchAlternativeUSStock(sym);
        }
      }

      if (!data) {
        // If everything fails, add a placeholder
        console.log(`No data found for ${sym}`);
        results.push({
          symbol: sym,
          price: null,
          marketCap: null,
          pe: null,
          roe: null,
          profitMargin: null,
          revenue: null,
          debtToEquity: null,
          recommendation: "N/A"
        });
        continue;
      }

      console.log(`✅ Data found for ${sym}:`, data);
      results.push({
        symbol: sym,
        ...data
      });
    }

    res.json({
      success: true,
      comparison: results
    });
  } catch (err) {
    console.error("Compare Error:", err);
    res.status(500).json({ error: "Compare failed", details: err.message });
  }
};

export const getComprehensiveComparison = async (req, res) => {
  try {
    const { symbols } = req.body;
    
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: "Please provide an array of stock symbols" 
      });
    }

    // Use the comprehensive service for the best data
    const results = await Promise.allSettled(
      symbols.map(symbol => comprehensiveStockService.getComprehensiveStockData(symbol.trim().toUpperCase()))
    );

    const comparison = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        const data = result.value;
        // Map netMargin to profitMargin for consistency with the analysis engine
        return {
          ...data,
          profitMargin: data.netMargin || data.profitMargin
        };
      } else {
        // Return empty structure on error
        return comprehensiveStockService.getEmptyDataStructure(symbols[index].trim().toUpperCase());
      }
    });

    res.json({
      success: true,
      comparison,
      timestamp: new Date().toISOString(),
      dataSource: 'comprehensive_api'
    });

  } catch (err) {
    console.error("Robust Comprehensive Compare Error:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch robust comprehensive comparison", 
      details: err.message 
    });
  }
};
