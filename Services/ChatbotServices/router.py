"""
FastAPI Router for Chatbot Services
Exposes all chatbot, e-commerce, and knowledge base endpoints as a microservice
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict, List, Optional
import json
import traceback
from .ai_agent import AgenticAI, AgentConfig
from .product_qna_rag import get_product_qna_rag

# Pydantic models for API
class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"
    user_id: str = ""  # Optional user ID for e-commerce operations

class ChatResponse(BaseModel):
    response: str
    session_id: str
    needs_approval: bool
    context: Dict

class ApprovalRequest(BaseModel):
    session_id: str
    approved: bool
    feedback: str = ""

class HistoryResponse(BaseModel):
    messages: List[Dict]
    session_id: str

# E-commerce request models
class ProductSearchRequest(BaseModel):
    query: str
    limit: int = 10

class CartRequest(BaseModel):
    user_id: str
    product_id: str
    quantity: int = 1

class CartItemRequest(BaseModel):
    cart_item_id: str
    quantity: Optional[int] = None

# Initialize AI agent
config = AgentConfig()
agent = AgenticAI(config)

# Create router for Chatbot endpoints
router = APIRouter(tags=["Chatbot Services"])

# =============== CHAT ENDPOINTS ===============

@router.post("/chat", response_model=ChatResponse)
async def chat_with_agent(request: ChatRequest):
    """Chat with the AI agent"""
    try:
        result = await agent.chat(request.message, request.session_id, request.user_id)
        return ChatResponse(
            response=result["response"],
            session_id=result["session_id"],
            needs_approval=result["needs_approval"],
            context=result["context"]
        )
    except Exception as e:
        print("Error in /chat endpoint:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/chat/stream")
async def stream_chat_with_agent(message: str, session_id: str = "default", user_id: str = ""):
    """Stream chat responses from the AI agent using GET parameters for EventSource compatibility"""
    async def generate_stream():
        try:
            async for chunk in agent.stream_chat(message, session_id, user_id):
                yield f"data: {json.dumps(chunk)}\n\n"
        except Exception as e:
            print("Error in /chat/stream endpoint:")
            traceback.print_exc()
            error_chunk = {
                "type": "error",
                "content": str(e),
                "session_id": session_id,
                "needs_approval": False,
                "context": {}
            }
            yield f"data: {json.dumps(error_chunk)}\n\n"
        finally:
            # Send end signal
            end_chunk = {"type": "end"}
            yield f"data: {json.dumps(end_chunk)}\n\n"
    
    return StreamingResponse(
        generate_stream(), 
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )

@router.get("/history/{session_id}", response_model=HistoryResponse)
async def get_conversation_history(session_id: str):
    """Get conversation history for a session"""
    try:
        messages = await agent.get_conversation_history(session_id)
        return HistoryResponse(messages=messages, session_id=session_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/history/{session_id}")
async def clear_conversation(session_id: str):
    """Clear conversation history for a session"""
    try:
        await agent.clear_conversation(session_id)
        return {"message": f"Conversation {session_id} cleared successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =============== APPROVAL ENDPOINTS ===============

@router.get("/approvals")
async def get_pending_approvals():
    """Get pending human approvals"""
    try:
        approvals = agent.get_pending_approvals()
        return {"pending_approvals": approvals}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/approvals")
async def provide_approval(request: ApprovalRequest):
    """Provide human approval or rejection"""
    try:
        result = agent.provide_approval(
            request.session_id, 
            request.approved, 
            request.feedback
        )
        return {"message": "Approval provided", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =============== SESSION ENDPOINTS ===============

@router.get("/sessions")
async def get_all_sessions():
    """Get all conversation sessions"""
    try:
        sessions = await agent.memory_store.get_all_sessions()
        return {"sessions": sessions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    """Health check endpoint for chatbot service"""
    return {
        "status": "healthy",
        "agent": "ready",
        "memory": "connected"
    }

@router.get("/debug/cart/{user_id}")
async def debug_cart(user_id: str):
    """Debug endpoint to test cart functionality"""
    try:
        print(f"[debug] Direct cart test for user: {user_id}")
        cart_items = await agent.get_cart_items(user_id)
        cart_summary = await agent.get_cart_summary(user_id)
        return {
            "user_id": user_id,
            "cart_items": cart_items,
            "cart_summary": cart_summary,
            "debug": "success"
        }
    except Exception as e:
        print(f"[debug] Direct cart test failed: {e}")
        traceback.print_exc()
        return {
            "user_id": user_id,
            "error": str(e),
            "debug": "failed"
        }

# =============== E-COMMERCE ENDPOINTS ===============

@router.get("/products")
async def get_products(limit: int = 20):
    """Get all products"""
    try:
        products = await agent.get_products(limit)
        return {"products": products}
    except Exception as e:
        print("Error in /products endpoint:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/products/search")
async def search_products(request: ProductSearchRequest):
    """Search products"""
    try:
        products = await agent.search_products(request.query, request.limit)
        return {"products": products, "query": request.query}
    except Exception as e:
        print("Error in /products/search endpoint:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/products/qna")
async def get_product_qna(product_name: str, category: str, limit: int = 6):
    """
    Get pre-generated questions and answers for a product using RAG
    Returns instant Q&A pairs without needing AI generation
    """
    try:
        qna_rag = get_product_qna_rag()
        questions_with_answers = qna_rag.get_questions_for_product(
            product_name=product_name,
            category=category,
            limit=limit
        )
        
        return {
            "success": True,
            "questions": questions_with_answers,
            "count": len(questions_with_answers)
        }
    except Exception as e:
        print("Error in /products/qna endpoint:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/products/{product_id}")
async def get_product_details(product_id: str):
    """Get product details"""
    try:
        product = await agent.get_product_details(product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        return {"product": product}
    except HTTPException:
        raise
    except Exception as e:
        print("Error in /products/{product_id} endpoint:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/products/popular/featured")
async def get_popular_products(limit: int = 5):
    """Get popular products"""
    try:
        products = await agent.get_popular_products(limit)
        return {"products": products}
    except Exception as e:
        print("Error in /products/popular/featured endpoint:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cart/add")
async def add_to_cart(request: CartRequest):
    """Add item to cart"""
    try:
        result = await agent.add_to_cart(request.user_id, request.product_id, request.quantity)
        if result["success"]:
            return {"message": result["message"], "action": result.get("action"), "success": True}
        else:
            raise HTTPException(status_code=400, detail=result["message"])
    except HTTPException:
        raise
    except Exception as e:
        print("Error in /cart/add endpoint:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/cart/{user_id}")
async def get_cart_items(user_id: str):
    """Get user's cart items"""
    try:
        cart_items = await agent.get_cart_items(user_id)
        return {"cart_items": cart_items, "user_id": user_id}
    except Exception as e:
        print("Error in /cart/{user_id} endpoint:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/cart/{user_id}/summary")
async def get_cart_summary(user_id: str):
    """Get cart summary"""
    try:
        summary = await agent.get_cart_summary(user_id)
        return {"summary": summary, "user_id": user_id}
    except Exception as e:
        print("Error in /cart/{user_id}/summary endpoint:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/cart/item/{cart_item_id}")
async def remove_from_cart(cart_item_id: str):
    """Remove item from cart"""
    try:
        result = await agent.remove_from_cart(cart_item_id)
        if result["success"]:
            return {"message": result["message"], "success": True}
        else:
            raise HTTPException(status_code=400, detail=result["message"])
    except HTTPException:
        raise
    except Exception as e:
        print("Error in /cart/item/{cart_item_id} endpoint:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/cart/item/{cart_item_id}")
async def update_cart_quantity(cart_item_id: str, request: CartItemRequest):
    """Update cart item quantity"""
    try:
        if request.quantity is None or request.quantity < 1:
            raise HTTPException(status_code=400, detail="Quantity must be at least 1")
        
        result = await agent.update_cart_quantity(cart_item_id, request.quantity)
        if result["success"]:
            return {"message": result["message"], "success": True}
        else:
            raise HTTPException(status_code=400, detail=result["message"])
    except HTTPException:
        raise
    except Exception as e:
        print("Error in /cart/item/{cart_item_id} endpoint:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# =============== ORDER ENDPOINTS ===============

@router.get("/orders/{user_id}")
async def get_user_orders(user_id: str):
    """Get all orders for a user"""
    try:
        result = await agent.ecommerce.get_user_orders(user_id)
        if result["success"]:
            return {"orders": result["orders"], "user_id": user_id}
        else:
            raise HTTPException(status_code=400, detail=result["message"])
    except HTTPException:
        raise
    except Exception as e:
        print("Error in /orders/{user_id} endpoint:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/orders/details/{order_id}")
async def get_order_details(order_id: str):
    """Get order details"""
    try:
        result = await agent.ecommerce.get_order_details(order_id)
        if result["success"]:
            return {"order": result["order"]}
        else:
            raise HTTPException(status_code=404, detail=result["message"])
    except HTTPException:
        raise
    except Exception as e:
        print("Error in /orders/details/{order_id} endpoint:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/orders/{order_id}/cancel")
async def cancel_order(order_id: str):
    """Cancel an order"""
    try:
        result = await agent.ecommerce.cancel_order(order_id)
        if result["success"]:
            return {"message": result["message"], "success": True}
        else:
            raise HTTPException(status_code=400, detail=result["message"])
    except HTTPException:
        raise
    except Exception as e:
        print("Error in /orders/{order_id}/cancel endpoint:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/orders/create")
async def create_order_endpoint(request: Dict):
    """Create a new order from cart"""
    try:
        user_id = request.get("user_id", "")
        shipping_address_id = request.get("shipping_address_id", "")
        coupon_code = request.get("coupon_code", "")
        
        if not user_id:
            raise HTTPException(status_code=400, detail="User ID is required")
            
        result = await agent.ecommerce.create_order(user_id, shipping_address_id, coupon_code)
        if result["success"]:
            return {"order": result["order"], "message": result["message"]}
        else:
            raise HTTPException(status_code=400, detail=result["message"])
    except HTTPException:
        raise
    except Exception as e:
        print("Error in /orders/create endpoint:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# =============== SHIPPING ENDPOINTS ===============

@router.get("/shipping/{user_id}")
async def get_user_shipping_addresses(user_id: str):
    """Get all shipping addresses for a user"""
    try:
        result = await agent.ecommerce.get_user_shipping_addresses(user_id)
        if result["success"]:
            return {"addresses": result["addresses"]}
        else:
            raise HTTPException(status_code=400, detail=result["message"])
    except HTTPException:
        raise
    except Exception as e:
        print("Error in /shipping/{user_id} endpoint:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# =============== COUPON ENDPOINTS ===============

@router.post("/coupons/validate")
async def validate_coupon_endpoint(request: Dict):
    """Validate a coupon code"""
    try:
        coupon_code = request.get("code", "")
        order_amount = request.get("orderAmount", 0)
        product_ids = request.get("productIds", [])
        
        result = await agent.ecommerce.validate_coupon(coupon_code, order_amount, product_ids)
        return result
    except Exception as e:
        print("Error in /coupons/validate endpoint:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/coupons/available")
async def get_available_coupons():
    """Get all available coupon codes"""
    try:
        result = await agent.ecommerce.get_available_coupons()
        if result["success"]:
            return {"coupons": result["coupons"]}
        else:
            raise HTTPException(status_code=400, detail=result["message"])
    except Exception as e:
        print("Error in /coupons/available endpoint:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# =============== RAG KNOWLEDGE BASE ENDPOINTS ===============

@router.get("/knowledge/search")
async def search_knowledge_base(query: str, top_k: int = 3):
    """Search the knowledge base for relevant information"""
    try:
        from .rag_knowledge_base import search_knowledge
        results = search_knowledge(query, top_k)
        return {"results": results, "query": query}
    except Exception as e:
        print("Error in /knowledge/search endpoint:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/knowledge/context")
async def get_knowledge_context(query: str, max_length: int = 1000):
    """Get formatted context from knowledge base for a query"""
    try:
        from .rag_knowledge_base import get_context
        context = get_context(query, max_length)
        return {"context": context, "query": query}
    except Exception as e:
        print("Error in /knowledge/context endpoint:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/knowledge/add")
async def add_knowledge_document(request: Dict):
    """Add a new document to the knowledge base"""
    try:
        from .rag_knowledge_base import get_knowledge_base
        kb = get_knowledge_base()
        
        title = request.get("title", "")
        content = request.get("content", "")
        category = request.get("category", "general")
        keywords = request.get("keywords", [])
        
        if not title or not content:
            raise HTTPException(status_code=400, detail="Title and content are required")
        
        success = kb.add_document(title, content, category, keywords)
        if success:
            return {"message": "Document added successfully", "success": True}
        else:
            raise HTTPException(status_code=500, detail="Failed to add document")
    except HTTPException:
        raise
    except Exception as e:
        print("Error in /knowledge/add endpoint:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/products/generate-qna")
async def generate_product_qna(request: Dict):
    """
    Generate product-specific Q&A pairs with answers using AI
    Takes product details and returns questions with detailed answers
    """
    try:
        product_name = request.get("name", "")
        category = request.get("category", "")
        description = request.get("description", "")
        price = request.get("price", "")
        specifications = request.get("specifications", {})
        
        # Create detailed product context
        spec_text = ""
        if specifications:
            spec_text = "\n".join([f"- {key}: {value}" for key, value in specifications.items()])
        
        # Initialize agent
        agent = ai_agent
        
        prompt = f"""Generate 6 highly specific questions and detailed answers for this exact product. Use the actual product details provided.

Product Name: {product_name}
Category: {category}
Price: ${price}
Description: {description}
Specifications:
{spec_text}

Generate questions that customers would ask about THIS SPECIFIC product, and answer them using the EXACT details provided above.

For example:
- Instead of "Does it have a backlit keyboard?" answer "Yes, the {product_name} features a backlit keyboard..."
- Instead of "What is the RAM?" answer "The {product_name} comes with [specific RAM from specs]..."
- Use the actual product name, specifications, and features in every answer

Return ONLY a JSON array with this exact format:
[
  {{"id": 1, "question": "specific question", "answer": "detailed answer using product name and specs"}},
  {{"id": 2, "question": "specific question", "answer": "detailed answer using product name and specs"}},
  ...
]

Make the answers detailed (2-4 sentences) and always reference the specific product name and actual specifications.
Return ONLY the JSON array, nothing else."""

        # Get AI response
        result = agent.chat(prompt, session_id="qna-generation", user_id="system")
        response_text = result.get("response", "")
        
        # Parse JSON from response
        try:
            # Extract JSON array from response
            import re
            json_match = re.search(r'\[[\s\S]*\]', response_text)
            if json_match:
                qna_pairs = json.loads(json_match.group(0))
                return {
                    "success": True,
                    "questions": qna_pairs,
                    "count": len(qna_pairs)
                }
            else:
                raise ValueError("No JSON array found in response")
        except Exception as parse_error:
            print(f"Error parsing AI response: {parse_error}")
            print(f"Response was: {response_text}")
            raise HTTPException(status_code=500, detail="Failed to parse AI response")
            
    except Exception as e:
        print("Error in /products/generate-qna endpoint:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
