
"""
Startup script for the Agentic AI system
Run this to start the AI agent server
"""

import os
import sys
import subprocess

def main():
    print("🚀 Starting Agentic AI System...")
    print("=" * 50)
    
    # Check if virtual environment is activated
    if not hasattr(sys, 'real_prefix') and not (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print("⚠️  Warning: Virtual environment not activated!")
        print("Please activate your virtual environment first:")
        print(".\venv\Scripts\activate  (Windows)")
        print("source venv/bin/activate  (Mac/Linux)")
        return
    
    # Set environment variables
    if not os.getenv('OPENAI_API_KEY'):
        print("⚠️  Warning: OPENAI_API_KEY not set!")
        print("Please set your OpenAI API key:")
        print("export OPENAI_API_KEY='your-api-key-here'")
        print("Or add it to the .env.ai file")
        
    print("🔧 Configuration:")
    print(f"   - OpenAI API Key: {'Set' if os.getenv('OPENAI_API_KEY') else 'Not Set'}")
    print(f"   - MongoDB URI: mongodb://localhost:27017")
    print(f"   - AI Server Port: 8001")
    print()
    
    print("📋 Features Included:")
    print("   ✅ LangGraph workflow engine")
    print("   ✅ OpenAI GPT integration")
    print("   ✅ MongoDB persistent memory")
    print("   ✅ Human-in-the-loop (HITL)")
    print("   ✅ FastAPI REST endpoints")
    print("   ✅ React chat interface")
    print()
    
    print("🌐 Starting FastAPI server on http://localhost:8001")
    print("📱 Access chat interface at http://localhost:5173/aiChat")
    print()
    print("Press Ctrl+C to stop the server")
    print("=" * 50)
    
    # Start the server
    try:
        subprocess.run([sys.executable, "ai_server.py"], check=True)
    except KeyboardInterrupt:
        print("\n👋 AI Agent server stopped.")
    except Exception as e:
        print(f"❌ Error starting server: {e}")

if __name__ == "__main__":
    main()