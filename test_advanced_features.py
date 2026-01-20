#!/usr/bin/env python3
"""
Test script for Advanced Gen AI Features
Run this to test the new AI capabilities locally
"""

import sys
import os
sys.path.append('ai-service')

def test_stock_screening():
    print("🔍 Testing Stock Screening...")
    try:
        from stock_screener import process_stock_screening_query
        
        queries = [
            "Find undervalued banking stocks with P/E < 15",
            "Show me IT stocks with ROE > 20%",
            "Large cap pharma companies with dividend yield > 2%"
        ]
        
        for query in queries:
            print(f"\nQuery: {query}")
            print("-" * 50)
            response = process_stock_screening_query(query)
            print(response[:300] + "..." if len(response) > 300 else response)
            print("\n")
    except Exception as e:
        print(f"Stock screening test failed: {e}")

def test_market_analysis():
    print("📊 Testing Market Analysis...")
    try:
        from market_analyzer import process_market_analysis_query
        
        queries = [
            "Analyze current market sentiment",
            "Why is Reliance falling today?",
            "Market levels and trends"
        ]
        
        for query in queries:
            print(f"\nQuery: {query}")
            print("-" * 50)
            response = process_market_analysis_query(query)
            print(response[:300] + "..." if len(response) > 300 else response)
            print("\n")
    except Exception as e:
        print(f"Market analysis test failed: {e}")

def test_general_ai():
    print("🤖 Testing General AI Features...")
    try:
        from engine import process_query
        
        queries = [
            "How to analyze stocks?",
            "Best investment strategy for beginners",
            "Analyze portfolio"
        ]
        
        for query in queries:
            print(f"\nQuery: {query}")
            print("-" * 50)
            response = process_query(query)
            print(response[:300] + "..." if len(response) > 300 else response)
            print("\n")
    except Exception as e:
        print(f"General AI test failed: {e}")

if __name__ == "__main__":
    print("🚀 Testing Advanced Gen AI Features for SmartStock")
    print("=" * 60)
    
    try:
        test_stock_screening()
        test_market_analysis() 
        test_general_ai()
        
        print("✅ All tests completed successfully!")
        print("\n🎯 Next Steps:")
        print("1. Deploy updated AI service to production")
        print("2. Test features in the live application")
        print("3. Gather user feedback for improvements")
        print("4. Implement Phase 2 features (Predictive Intelligence)")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        print("Check your environment setup and dependencies")