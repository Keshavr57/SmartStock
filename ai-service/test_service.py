#!/usr/bin/env python3
"""Test script for AI Advisor service"""

import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

def test_groq_connection():
    """Test if Groq API is working"""
    print("🧪 Testing Groq API connection...")
    
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("❌ GROQ_API_KEY not found in environment")
        return False
    
    print(f"✅ API Key found: {api_key[:10]}...")
    
    try:
        client = Groq(api_key=api_key)
        
        # Test simple query
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Say 'Hello, AI service is working!'"}
            ],
            model="llama-3.1-8b-instant",
            temperature=0.3,
            max_tokens=50
        )
        
        answer = response.choices[0].message.content
        print(f"✅ Groq Response: {answer}")
        return True
        
    except Exception as e:
        print(f"❌ Groq API Error: {str(e)}")
        return False

def test_financial_query():
    """Test financial question"""
    print("\n🧪 Testing financial query...")
    
    api_key = os.getenv("GROQ_API_KEY")
    client = Groq(api_key=api_key)
    
    system_prompt = """You are an expert Indian stock market financial advisor.
Only answer financial questions. Keep responses under 100 words."""
    
    try:
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": "What is P/E ratio?"}
            ],
            model="llama-3.1-8b-instant",
            temperature=0.3,
            max_tokens=200
        )
        
        answer = response.choices[0].message.content
        print(f"✅ Financial Query Response:\n{answer}\n")
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("SmartStock AI Advisor - Service Test")
    print("=" * 60)
    
    # Test 1: Groq connection
    test1 = test_groq_connection()
    
    # Test 2: Financial query
    test2 = test_financial_query()
    
    print("=" * 60)
    if test1 and test2:
        print("✅ All tests passed! AI service is ready.")
    else:
        print("❌ Some tests failed. Check configuration.")
    print("=" * 60)
