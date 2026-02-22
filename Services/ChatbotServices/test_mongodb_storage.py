
#!/usr/bin/env python3
"""
Test script to verify MongoDB conversation storage works
"""

import os
import sys
import asyncio
from datetime import datetime

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ai_agent import AgentConfig, MongoDBMemoryStore

async def test_mongodb_storage():
    """Test MongoDB conversation storage functionality"""
    print("🧪 Testing MongoDB Conversation Storage...")
    print("=" * 50)
    
    try:
        # Initialize config and memory store
        config = AgentConfig()
        memory_store = MongoDBMemoryStore(config)
        
        # Test data
        test_session = "test_session_123"
        test_messages = [
            {
                "role": "user",
                "content": "Hello, can you help me find a laptop?",
                "timestamp": datetime.utcnow().isoformat()
            },
            {
                "role": "assistant", 
                "content": "I'd be happy to help you find a laptop! What's your budget and intended use?",
                "timestamp": datetime.utcnow().isoformat()
            }
        ]
        
        # Test save
        print("💾 Testing save_conversation...")
        await memory_store.save_conversation(test_session, test_messages, {"test": True})
        print("✅ Save successful!")
        
        # Test load
        print("📖 Testing load_conversation...")
        loaded_messages = await memory_store.load_conversation(test_session)
        print(f"✅ Load successful! Found {len(loaded_messages)} messages")
        
        # Verify data integrity
        if len(loaded_messages) == len(test_messages):
            print("✅ Message count matches!")
        else:
            print(f"❌ Message count mismatch: expected {len(test_messages)}, got {len(loaded_messages)}")
        
        # Test get_all_sessions
        print("📋 Testing get_all_sessions...")
        sessions = await memory_store.get_all_sessions()
        print(f"✅ Found {len(sessions)} sessions: {sessions}")
        
        # Clean up test data
        print("🧹 Cleaning up test data...")
        await memory_store.clear_session(test_session)
        print("✅ Cleanup successful!")
        
        print("\n🎉 All MongoDB storage tests passed!")
        print("🗑️ You can now safely delete conversations.json")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        print("Make sure MongoDB is running and accessible")

if __name__ == "__main__":
    asyncio.run(test_mongodb_storage())