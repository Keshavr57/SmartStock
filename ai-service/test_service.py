#!/usr/bin/env python3
"""
SmartStock AI Service - Quick Test Script
Tests all endpoints and AI functionality
"""

import requests
import json
import sys
import time
import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

BASE_URL = "http://localhost:8000"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_success(msg):
    print(f"{Colors.GREEN}✅ {msg}{Colors.END}")

def print_error(msg):
    print(f"{Colors.RED}❌ {msg}{Colors.END}")

def print_info(msg):
    print(f"{Colors.BLUE}ℹ️ {msg}{Colors.END}")

def print_header(msg):
    print(f"\n{Colors.YELLOW}{'='*60}{Colors.END}")
    print(f"{Colors.YELLOW}{msg}{Colors.END}")
    print(f"{Colors.YELLOW}{'='*60}{Colors.END}\n")

def test_health():
    """Test: Health Check"""
    print_header("TEST 1: Service Health Check")
    
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        data = response.json()
        
        if response.status_code == 200:
            print_success(f"Service is healthy: {data}")
            return True
        else:
            print_error(f"Status code: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Failed to connect: {str(e)}")
        print_info(f"Make sure AI service is running: python ai-service/main.py")
        return False

def test_connection():
    """Test: Connection Check"""
    print_header("TEST 2: Connection Test")
    
    try:
        response = requests.get(f"{BASE_URL}/test-connection", timeout=5)
        data = response.json()
        
        if response.status_code == 200:
            print_success(f"Connection successful: {data}")
            return True
        else:
            print_error(f"Connection failed: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Connection error: {str(e)}")
        return False

def test_llm():
    """Test: LLM Functionality"""
    print_header("TEST 3: LLM Test")
    
    payload = {
        "message": "Say 'SmartStock AI is working perfectly!'"
    }
    
    try:
        print_info("Sending test message to LLM...")
        response = requests.post(f"{BASE_URL}/test-llm", json=payload, timeout=30)
        data = response.json()
        
        if response.status_code == 200 and data.get("status") == "success":
            print_success(f"LLM is working!")
            print_info(f"Response: {data.get('test_response', 'N/A')}")
            return True
        else:
            print_error(f"LLM test failed: {data}")
            return False
    except Exception as e:
        print_error(f"LLM test error: {str(e)}")
        return False

def test_financial_analysis():
    """Test: Financial Analysis Endpoint"""
    print_header("TEST 4: Financial Analysis")
    
    payload = {
        "message": "Should I buy Reliance stock at ₹2700?",
        "user_id": "test_user",
        "user_goal": "Long-term wealth creation",
        "risk_level": "medium",
        "trading_style": "swing"
    }
    
    try:
        print_info("Sending financial question to AI...")
        print_info(f"Question: {payload['message']}")
        
        response = requests.post(f"{BASE_URL}/process", json=payload, timeout=45)
        data = response.json()
        
        if response.status_code == 200 and data.get("status") == "success":
            print_success("AI Analysis completed!")
            print("\n--- AI Response ---")
            print(data.get("answer", "No answer"))
            print("--- End Response ---\n")
            
            if data.get("structured"):
                print_info("Structured Data:")
                print(json.dumps(data["structured"], indent=2))
            
            return True
        else:
            print_error(f"Analysis failed: {data}")
            return False
    except Exception as e:
        print_error(f"Analysis error: {str(e)}")
        return False

def test_various_questions():
    """Test: Multiple Financial Questions"""
    print_header("TEST 5: Various Financial Questions")
    
    questions = [
        {"message": "What is your view on TCS stock?", "style": "Stock Analysis"},
        {"message": "Is Bitcoin a good investment now?", "style": "Crypto Analysis"},
        {"message": "How to start investing with ₹5000?", "style": "Investment Guide"},
    ]
    
    success_count = 0
    
    for i, q in enumerate(questions, 1):
        print_info(f"\n{i}. {q['style']}: {q['message']}")
        
        try:
            response = requests.post(
                f"{BASE_URL}/process",
                json={"message": q["message"], "user_id": f"test_{i}"},
                timeout=45
            )
            
            if response.status_code == 200:
                print_success(f"Question {i} processed successfully")
                success_count += 1
            else:
                print_error(f"Question {i} failed (Status: {response.status_code})")
        except Exception as e:
            print_error(f"Question {i} error: {str(e)}")
    
    return success_count == len(questions)

def main():
    """Run all tests"""
    print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BLUE}  SmartStock AI Service - Test Suite{Colors.END}")
    print(f"{Colors.BLUE}  Version 3.0.0{Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}\n")
    
    print_info(f"Testing: {BASE_URL}\n")
    
    results = []
    
    # Run tests
    results.append(("Health Check", test_health()))
    
    if not results[-1][1]:
        print_error("\n⚠️ Service is not running. Start it with:")
        print_error("   cd ai-service && python main.py")
        sys.exit(1)
    
    results.append(("Connection Test", test_connection()))
    results.append(("LLM Test", test_llm()))
    results.append(("Financial Analysis", test_financial_analysis()))
    results.append(("Various Questions", test_various_questions()))
    
    # Summary
    print_header("TEST SUMMARY")
    
    for name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {name}")
    
    passed_count = sum(1 for _, p in results if p)
    total_count = len(results)
    
    print(f"\n{Colors.YELLOW}Result: {passed_count}/{total_count} tests passed{Colors.END}")
    
    if passed_count == total_count:
        print_success("\n🎉 All tests passed! AI service is working perfectly!")
        return 0
    else:
        print_error("\n⚠️ Some tests failed. Check the errors above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
