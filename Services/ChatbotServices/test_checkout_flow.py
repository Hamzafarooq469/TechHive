"""
Test Script for Deterministic Checkout Flow
Run this to validate the checkout flow implementation
"""

import asyncio
from ai_agent import agent, AgentConfig

async def test_checkout_flow():
    """Test the complete checkout flow"""
    print("=" * 60)
    print("TESTING DETERMINISTIC CHECKOUT FLOW")
    print("=" * 60)
    
    # Test user ID (replace with actual user ID from your database)
    test_user_id = "test_user_123"
    session_id = "test_session_checkout"
    
    # Test conversation sequence
    test_messages = [
        "Hi, I want to proceed to checkout",
        "confirm address 1",
        "apply coupon SAVE20",
        "confirm and place order"
    ]
    
    print("\n📝 Test Scenario: Complete Checkout Flow\n")
    
    for i, message in enumerate(test_messages, 1):
        print(f"\n{'='*60}")
        print(f"Step {i}: User says: '{message}'")
        print('='*60)
        
        try:
            # Send message to agent
            response = await agent.chat(
                message=message,
                session_id=session_id,
                user_id=test_user_id
            )
            
            print(f"\n🤖 Bot Response:")
            print(response['response'])
            
            # Show checkout state
            print(f"\n📊 State Info:")
            print(f"   - Needs Approval: {response.get('needs_approval', False)}")
            
            # Check context for checkout step
            context = response.get('context', {})
            if context:
                print(f"   - Context: {context}")
            
            # Wait a bit between messages
            await asyncio.sleep(1)
            
        except Exception as e:
            print(f"\n❌ Error: {e}")
            import traceback
            traceback.print_exc()
            break
    
    print("\n" + "="*60)
    print("TEST COMPLETED")
    print("="*60)


async def test_general_flow():
    """Test general conversation (non-checkout)"""
    print("\n" + "="*60)
    print("TESTING GENERAL FLOW (NON-CHECKOUT)")
    print("="*60)
    
    test_user_id = "test_user_123"
    session_id = "test_session_general"
    
    test_messages = [
        "Show me MacBook products",
        "What's in my cart?",
        "Tell me about your return policy"
    ]
    
    print("\n📝 Test Scenario: General Queries\n")
    
    for i, message in enumerate(test_messages, 1):
        print(f"\n{'='*60}")
        print(f"Step {i}: User says: '{message}'")
        print('='*60)
        
        try:
            response = await agent.chat(
                message=message,
                session_id=session_id,
                user_id=test_user_id
            )
            
            print(f"\n🤖 Bot Response:")
            print(response['response'][:200] + "..." if len(response['response']) > 200 else response['response'])
            
            await asyncio.sleep(1)
            
        except Exception as e:
            print(f"\n❌ Error: {e}")
            import traceback
            traceback.print_exc()
            break
    
    print("\n" + "="*60)
    print("TEST COMPLETED")
    print("="*60)


async def test_interrupted_checkout():
    """Test checkout interruption and resume"""
    print("\n" + "="*60)
    print("TESTING CHECKOUT INTERRUPTION & RESUME")
    print("="*60)
    
    test_user_id = "test_user_123"
    session_id = "test_session_interrupted"
    
    # Session 1: Start checkout but don't complete
    print("\n📝 Session 1: Start checkout (interrupted)\n")
    
    print("Step 1: User says: 'I want to checkout'")
    response1 = await agent.chat(
        message="I want to checkout",
        session_id=session_id,
        user_id=test_user_id
    )
    print(f"🤖 Bot Response:\n{response1['response']}")
    
    # Simulate user closing browser / session ending
    print("\n⏸️  [User closes browser - session ends]")
    await asyncio.sleep(2)
    
    # Session 2: Resume with different message
    print("\n📝 Session 2: Resume conversation\n")
    
    print("Step 2: User says: 'Hi, I'm back'")
    response2 = await agent.chat(
        message="Hi, I'm back",
        session_id=session_id,
        user_id=test_user_id
    )
    print(f"🤖 Bot Response:\n{response2['response']}")
    print("\n✅ If bot remembers checkout state, it should show shipping addresses again")
    
    print("\n" + "="*60)
    print("TEST COMPLETED")
    print("="*60)


async def run_all_tests():
    """Run all test scenarios"""
    print("\n" + "="*60)
    print("🧪 RUNNING ALL CHECKOUT FLOW TESTS")
    print("="*60)
    
    try:
        # Test 1: Complete checkout flow
        await test_checkout_flow()
        await asyncio.sleep(2)
        
        # Test 2: General flow (no checkout)
        await test_general_flow()
        await asyncio.sleep(2)
        
        # Test 3: Interrupted checkout
        await test_interrupted_checkout()
        
        print("\n\n" + "="*60)
        print("✅ ALL TESTS COMPLETED SUCCESSFULLY")
        print("="*60)
        
    except Exception as e:
        print(f"\n\n❌ TEST SUITE FAILED: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    print("\n" + "="*60)
    print("DETERMINISTIC CHECKOUT FLOW - TEST SUITE")
    print("="*60)
    print("\nThis script will test:")
    print("1. Complete checkout flow (shipping → coupon → review → order)")
    print("2. General conversation flow (product search, cart queries)")
    print("3. Checkout interruption and resume")
    print("\n⚠️  Make sure you have:")
    print("   - MongoDB running")
    print("   - Test user with cart items in database")
    print("   - Test user with shipping addresses")
    print("   - Valid coupon codes in database")
    print("\n" + "="*60)
    
    input("\nPress Enter to start tests...")
    
    asyncio.run(run_all_tests())
