




import os
import asyncio
import json
import hashlib
import re
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, ToolMessage
from langchain_core.tools import tool
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver  # unused but kept if you plan to use
from langgraph.prebuilt import ToolNode
from pymongo import MongoClient
from pydantic import BaseModel
from .ecommerce_service import EcommerceService
from .rag_knowledge_base import get_knowledge_base, search_knowledge, get_context

# Global registry so LangChain tools can access the EcommerceService instance
ECOMMERCE_SERVICE = None

# Load environment variables
# Get the Services directory (parent of ChatbotServices)
SERVICES_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOTENV_PATH = os.path.join(SERVICES_DIR, ".env")
print(f"[debug] loading dotenv from: {DOTENV_PATH}")
load_dotenv(dotenv_path=DOTENV_PATH)

# Debug: show what got loaded (key is masked)
openai_key_env = os.getenv("OPENAI_API_KEY")
mongo_uri_env = os.getenv("MONGO_URI", "mongodb://localhost:27017/TechHive")

if openai_key_env:
    masked_key = openai_key_env[:6] + "..." + openai_key_env[-4:] if len(openai_key_env) > 10 else openai_key_env
    print(f"[debug] OPENAI_API_KEY loaded: {bool(openai_key_env)} value: {masked_key}")
    print(f"[debug] API key length: {len(openai_key_env)}")
else:
    print("[debug] OPENAI_API_KEY not found in environment variables")
    
print(f"[debug] MONGO_URI: {mongo_uri_env}")

# Configuration
class AgentConfig:
    def __init__(self):
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/TechHive")
        self.db_name = "chatbot_db"
        self.collection_name = "conversations"
        self.ecommerce_db_name = "TechHive"  # Main e-commerce database
        
        # Debug: Check if API key is loaded
        if not self.openai_api_key:
            print("[ERROR] OPENAI_API_KEY is not set or empty!")
            raise ValueError("OPENAI_API_KEY environment variable is required")
        
        print(f"[debug] AgentConfig initialized with API key: {self.openai_api_key[:6]}...{self.openai_api_key[-4:]}")

# MongoDB-based Memory Store
class MongoDBMemoryStore:
    def __init__(self, config: AgentConfig):
        self.client = MongoClient(config.mongo_uri)
        self.db = self.client[config.db_name]
        self.conversations = self.db.conversations
        print("MongoDB conversation storage initialized successfully")

    async def save_conversation(self, session_id: str, messages: List[Dict], metadata: Dict = None):
        """Save conversation to MongoDB - keep only recent messages to avoid bloat"""
        # Limit messages to last 50 to prevent database bloat
        MAX_MESSAGES = 50
        if len(messages) > MAX_MESSAGES:
            messages = messages[-MAX_MESSAGES:]
            print(f"[debug] Trimmed messages to last {MAX_MESSAGES} for session: {session_id}")
        
        doc = {
            "session_id": session_id,
            "messages": messages,
            "metadata": metadata or {},
            "timestamp": datetime.utcnow(),
            "last_updated": datetime.utcnow()
        }
        
        # Upsert conversation (update if exists, insert if not)
        self.conversations.replace_one(
            {"session_id": session_id}, 
            doc, 
            upsert=True
        )
        print(f"[debug] Saved {len(messages)} messages for session: {session_id}")

    async def load_conversation(self, session_id: str, limit: int = 20) -> List[Dict]:
        """Load conversation from MongoDB - only load recent messages for performance"""
        doc = self.conversations.find_one({"session_id": session_id})
        if doc:
            messages = doc.get("messages", [])
            # Only keep the last N messages to avoid processing too much history
            limited_messages = messages[-limit:] if len(messages) > limit else messages
            print(f"[debug] Loaded {len(limited_messages)} messages (out of {len(messages)} total) for session: {session_id}")
            return limited_messages
        print(f"[debug] No conversation found for session: {session_id}")
        return []

    async def get_all_sessions(self) -> List[str]:
        """Get all session IDs"""
        sessions = list(self.conversations.find({}, {"session_id": 1, "_id": 0}))
        return [s["session_id"] for s in sessions]

    async def clear_session(self, session_id: str):
        """Clear a specific session"""
        result = self.conversations.delete_one({"session_id": session_id})
        if result.deleted_count > 0:
            print(f"[debug] Cleared conversation for session: {session_id}")
        else:
            print(f"[debug] No conversation found to clear for session: {session_id}")

    async def summarize_old_messages(self, messages: List[Dict], llm) -> str:
        """Summarize older messages to preserve context while reducing token usage"""
        if len(messages) < 8:  # Only summarize if we have enough messages
            return ""
        
        # Take messages that are older (not the most recent 3)
        old_messages = messages[:-3] if len(messages) > 3 else []
        
        if not old_messages:
            return ""
        
        # Create a summary prompt
        summary_text = "Previous conversation summary:\n"
        for msg in old_messages:
            role = "User" if msg.get("role") == "user" else "Assistant"
            content = msg.get("content", "")[:200]  # Truncate long messages
            summary_text += f"{role}: {content}\n"
        
        try:
            from langchain_core.messages import SystemMessage, HumanMessage
            summary_prompt = [
                SystemMessage(content="Summarize this conversation history in 2-3 sentences, focusing on key context about user preferences, cart contents, or important decisions made."),
                HumanMessage(content=summary_text)
            ]
            
            summary_response = await llm.ainvoke(summary_prompt)
            return f"[Previous conversation summary: {summary_response.content}]"
        except Exception as e:
            print(f"[debug] Error creating summary: {e}")
            return ""

class ResponseCache:
    """Simple in-memory cache for LLM responses to avoid repeated calls"""
    def __init__(self, max_size: int = 100, ttl_minutes: int = 30):
        self.cache: Dict[str, Dict] = {}
        self.max_size = max_size
        self.ttl_minutes = ttl_minutes
    
    def _generate_key(self, query: str, context_summary: str = "") -> str:
        """Generate cache key from query and context"""
        content = f"{query.lower().strip()}{context_summary}"
        return hashlib.md5(content.encode()).hexdigest()
    
    def get(self, query: str, context_summary: str = "") -> Optional[str]:
        """Get cached response if available and not expired"""
        key = self._generate_key(query, context_summary)
        
        if key not in self.cache:
            return None
        
        cached_data = self.cache[key]
        created_at = datetime.fromisoformat(cached_data["created_at"])
        
        # Check if expired
        if datetime.now() - created_at > timedelta(minutes=self.ttl_minutes):
            del self.cache[key]
            return None
        
        print(f"[debug] Cache hit for query: {query[:50]}...")
        return cached_data["response"]
    
    def set(self, query: str, response: str, context_summary: str = ""):
        """Cache response with expiration"""
        key = self._generate_key(query, context_summary)
        
        # Clean up old entries if cache is full
        if len(self.cache) >= self.max_size:
            # Remove oldest entry
            oldest_key = min(self.cache.keys(), 
                           key=lambda k: self.cache[k]["created_at"])
            del self.cache[oldest_key]
        
        self.cache[key] = {
            "response": response,
            "created_at": datetime.now().isoformat(),
            "query": query[:100]  # Store truncated query for debugging
        }
        print(f"[debug] Cached response for query: {query[:50]}...")

# Agent State
@dataclass
class AgentState:
    messages: List[Dict] = None
    session_id: str = ""
    user_input: str = ""
    ai_response: str = ""
    needs_human_approval: bool = False
    human_feedback: Optional[str] = None
    context: Dict[str, Any] = None
    user_id: str = ""  # For e-commerce operations
    ecommerce_data: Dict = None  # Store e-commerce related data
    lc_messages: List[Any] = None  # LangChain message history for ReAct loop
    
    # Checkout flow control
    checkout_step: str = "none"  # none, cart, shipping, coupon, review, order, completed
    in_checkout_flow: bool = False  # Flag to indicate if we're in the deterministic checkout flow
    checkout_data: Dict = None  # Store checkout-specific data (addresses, coupon, etc.)
    
    # PC Builder flow control
    pc_builder_step: str = "none"  # none, ram, ssd, cpu, gpu, psu, motherboard, aircooler, case, completed
    in_pc_builder_flow: bool = False  # Flag for PC builder flow
    pc_builder_data: Dict = None  # Store PC builder data (build_id, products, etc.)

    def __post_init__(self):
        if self.messages is None:
            self.messages = []
        if self.context is None:
            self.context = {}
        if self.ecommerce_data is None:
            self.ecommerce_data = {}
        if self.lc_messages is None:
            self.lc_messages = []
        if self.checkout_data is None:
            self.checkout_data = {}
        if self.pc_builder_data is None:
            self.pc_builder_data = {}

# Human-in-the-Loop Manager
class HITLManager:
    def __init__(self):
        self.pending_approvals = {}  # session_id -> pending_action

    def request_approval(self, session_id: str, action: str, context: Dict) -> bool:
        """Request human approval for an action"""
        self.pending_approvals[session_id] = {
            "action": action,
            "context": context,
            "timestamp": datetime.utcnow(),
            "status": "pending"
        }
        return True

    def provide_feedback(self, session_id: str, approval: bool, feedback: str = "") -> Dict:
        """Provide human feedback on pending action"""
        if session_id in self.pending_approvals:
            self.pending_approvals[session_id].update({
                "status": "approved" if approval else "rejected",
                "feedback": feedback,
                "resolved_at": datetime.utcnow()
            })
            return self.pending_approvals[session_id]
        return None

    def get_pending_approvals(self) -> Dict:
        """Get all pending approvals"""
        return {k: v for k, v in self.pending_approvals.items() if v["status"] == "pending"}

# =============== LANGCHAIN TOOLS (REACT AGENT) ===============

@tool
async def search_products_tool(query: str, limit: int = 10) -> Dict:
    """Search products by name or description."""
    if ECOMMERCE_SERVICE is None:
        return {"error": "Ecommerce service not initialized"}
    products = await ECOMMERCE_SERVICE.search_products(query, limit)
    return {"products": products}


@tool
async def get_products_tool(limit: int = 20, category: str = None, min_price: float = None, max_price: float = None, sort_by: str = None) -> Dict:
    """Get products with optional filtering and sorting. sort_by options: price_asc, price_desc, name_asc, rating_desc"""
    if ECOMMERCE_SERVICE is None:
        return {"error": "Ecommerce service not initialized"}
    products = await ECOMMERCE_SERVICE.get_products(limit, category, min_price, max_price, sort_by)
    return {"products": products}


@tool
async def get_product_details_tool(product_id: str) -> Dict:
    """Get detailed information about a specific product by its ID."""
    if ECOMMERCE_SERVICE is None:
        return {"error": "Ecommerce service not initialized"}
    product = await ECOMMERCE_SERVICE.get_product_by_id(product_id)
    if product:
        return {"product": product}
    return {"error": "Product not found"}


@tool
async def get_product_categories_tool() -> Dict:
    """Get all available product categories in the store."""
    if ECOMMERCE_SERVICE is None:
        return {"error": "Ecommerce service not initialized"}
    categories = await ECOMMERCE_SERVICE.get_product_categories()
    return {"categories": categories}


@tool
async def get_products_by_category_tool(category: str, limit: int = 20) -> Dict:
    """Get products in a specific category."""
    if ECOMMERCE_SERVICE is None:
        return {"error": "Ecommerce service not initialized"}
    products = await ECOMMERCE_SERVICE.get_products_by_category(category, limit)
    return {"products": products, "category": category}


@tool
async def get_featured_products_tool(limit: int = 10) -> Dict:
    """Get featured products (high rated or recently added)."""
    if ECOMMERCE_SERVICE is None:
        return {"error": "Ecommerce service not initialized"}
    products = await ECOMMERCE_SERVICE.get_featured_products(limit)
    return {"products": products}


@tool
async def get_price_range_tool() -> Dict:
    """Get the price range information for all products in the store."""
    if ECOMMERCE_SERVICE is None:
        return {"error": "Ecommerce service not initialized"}
    return await ECOMMERCE_SERVICE.get_price_range()


@tool
async def get_low_stock_products_tool(threshold: int = 10) -> Dict:
    """Get products with low stock (useful for inventory management)."""
    if ECOMMERCE_SERVICE is None:
        return {"error": "Ecommerce service not initialized"}
    products = await ECOMMERCE_SERVICE.get_low_stock_products(threshold)
    return {"products": products, "threshold": threshold}


@tool
async def add_to_cart_tool(user_id: str, product_id: str, quantity: int = 1) -> Dict:
    """Add a product to the user's cart. Requires user to be logged in."""
    if ECOMMERCE_SERVICE is None:
        return {"error": "Ecommerce service not initialized"}
    
    if not user_id or user_id.strip() == "":
        return {
            "error": "login_required",
            "message": "I'd be happy to help you add items to your cart! However, I need you to be logged in first. Please login to your account so I can access your personal cart.",
            "action_required": "Please login to add items to your cart"
        }
    
    return await ECOMMERCE_SERVICE.add_to_cart(user_id, product_id, quantity)


@tool
async def get_cart_summary_tool(user_id: str) -> Dict:
    """Get the user's cart summary including total items and price. Requires user to be logged in."""
    if ECOMMERCE_SERVICE is None:
        return {"error": "Ecommerce service not initialized"}
    
    if not user_id or user_id.strip() == "":
        return {
            "error": "login_required",
            "message": "I'd love to show you your cart! However, I need you to be logged in first to access your personal shopping cart.",
            "action_required": "Please login to view your cart"
        }
    
    return await ECOMMERCE_SERVICE.get_cart_summary(user_id)


@tool
async def remove_from_cart_tool(cart_item_id: str) -> Dict:
    """Remove a single item from the cart by its cart_item_id."""
    if ECOMMERCE_SERVICE is None:
        return {"error": "Ecommerce service not initialized"}
    return await ECOMMERCE_SERVICE.remove_from_cart(cart_item_id)


@tool
async def update_cart_item_quantity_by_product(user_id: str, product_name: str, quantity: int) -> Dict:
    """Update the quantity of a cart item by searching for it by product name. More user-friendly than using cart_item_id."""
    if ECOMMERCE_SERVICE is None:
        return {"error": "Ecommerce service not initialized"}
    
    if not user_id or user_id.strip() == "":
        return {
            "error": "login_required",
            "message": "I need you to be logged in to modify your cart.",
            "action_required": "Please login to update your cart"
        }
    
    if quantity < 1:
        return {"success": False, "message": "Quantity must be at least 1"}
    
    try:
        # Get current cart items
        cart_items = await ECOMMERCE_SERVICE.get_cart_items(user_id)
        print(f"[debug] Found {len(cart_items)} cart items for user {user_id}")
        
        # Find the item by product name (case-insensitive search)
        # Cart items structure: {_id, product: {name, price, ...}, quantity}
        target_item = None
        for item in cart_items:
            # Get product name from nested structure
            product = item.get("product", {})
            item_name = product.get("name", "").lower() if isinstance(product, dict) else ""
            if item_name and (product_name.lower() in item_name or item_name in product_name.lower()):
                target_item = item
                print(f"[debug] Found matching item: {item_name}")
                break
        
        if not target_item:
            return {
                "success": False, 
                "message": f"I couldn't find '{product_name}' in your cart. Please check the product name or add it to cart first."
            }
        
        # Update the quantity using the cart_item_id
        cart_item_id = str(target_item["_id"])
        product = target_item.get("product", {})
        actual_product_name = product.get("name", "item") if isinstance(product, dict) else "item"
        print(f"[debug] Updating cart_item_id {cart_item_id} to quantity {quantity}")
        
        result = await ECOMMERCE_SERVICE.update_cart_quantity(cart_item_id, quantity)
        
        if result.get("success"):
            result["product_name"] = actual_product_name
            result["message"] = f"Updated {actual_product_name} quantity to {quantity}"
        
        return result
        
    except Exception as e:
        print(f"Error updating cart item by product: {e}")
        return {"success": False, "message": f"Error updating cart item: {str(e)}"}


@tool
async def get_cart_items_tool(user_id: str) -> Dict:
    """Get detailed list of items in the user's cart with cart_item_ids. Useful for finding specific items to modify."""
    if ECOMMERCE_SERVICE is None:
        return {"error": "Ecommerce service not initialized"}
    
    if not user_id or user_id.strip() == "":
        return {
            "error": "login_required",
            "message": "I need you to be logged in to view your cart items.",
            "action_required": "Please login to view your cart"
        }
    
    try:
        items = await ECOMMERCE_SERVICE.get_cart_items(user_id)
        return {"success": True, "items": items}
    except Exception as e:
        return {"success": False, "message": f"Error getting cart items: {str(e)}"}


@tool
async def set_cart_quantity_tool(cart_item_id: str, quantity: int) -> Dict:
    """Set the quantity of a cart item to a specific number."""
    if ECOMMERCE_SERVICE is None:
        return {"error": "Ecommerce service not initialized"}
    
    if quantity < 1:
        return {"success": False, "message": "Quantity must be at least 1"}
    
    return await ECOMMERCE_SERVICE.update_cart_quantity(cart_item_id, quantity)


@tool
async def increase_quantity_tool(cart_item_id: str) -> Dict:
    """Increase the quantity of a cart item by 1."""
    if ECOMMERCE_SERVICE is None:
        return {"error": "Ecommerce service not initialized"}
    return await ECOMMERCE_SERVICE.increase_quantity(cart_item_id)


@tool
async def decrease_quantity_tool(cart_item_id: str) -> Dict:
    """Decrease the quantity of a cart item by 1. If quantity becomes 0, the item is removed."""
    if ECOMMERCE_SERVICE is None:
        return {"error": "Ecommerce service not initialized"}
    return await ECOMMERCE_SERVICE.decrease_quantity(cart_item_id)


@tool
async def empty_cart_tool(user_id: str) -> Dict:
    """Remove all items from the specified user's cart. Also handles 'flush', 'clear', 'empty' commands. Requires user to be logged in."""
    if ECOMMERCE_SERVICE is None:
        return {"error": "Ecommerce service not initialized"}
    
    if not user_id or user_id.strip() == "":
        return {
            "error": "login_required", 
            "message": "I can help you empty your cart! However, I need you to be logged in first to access your personal shopping cart.",
            "action_required": "Please login to manage your cart"
        }
    
    # Use the direct empty_user_cart method which is much faster (single database operation)
    result = await ECOMMERCE_SERVICE.empty_user_cart(user_id)
    if result.get("success"):
        return {
            "success": True,
            "removed": result.get("removed", 0),
            "message": f"Cart cleared successfully! Removed {result.get('removed', 0)} item(s)."
        }
    return result


@tool
async def get_orders_tool(user_id: str) -> Dict:
    """Get all orders for a specific user. Requires user to be logged in."""
    if ECOMMERCE_SERVICE is None:
        return {"error": "Ecommerce service not initialized"}
    
    if not user_id or user_id.strip() == "":
        return {
            "error": "login_required",
            "message": "I can help you check your orders! However, I need you to be logged in first to access your order history.",
            "action_required": "Please login to view your orders"
        }
    
    return await ECOMMERCE_SERVICE.get_user_orders(user_id)


@tool
async def get_order_details_tool(order_id: str) -> Dict:
    """Get detailed information about a specific order by order ID (MongoDB ObjectId)."""
    if ECOMMERCE_SERVICE is None:
        return {"error": "Ecommerce service not initialized"}
    return await ECOMMERCE_SERVICE.get_order_details(order_id)


@tool
async def track_order_tool(order_number: str, user_id: str = "") -> Dict:
    """Track an order by order number or tracking number. User-friendly way to look up orders. Requires user to be logged in if searching their own orders."""
    if ECOMMERCE_SERVICE is None:
        return {"error": "Ecommerce service not initialized"}
    
    if not order_number or order_number.strip() == "":
        return {"success": False, "message": "Order number or tracking number is required"}
    
    # If user_id provided, use it for security (users can only see their own orders)
    # If not provided, search without user filter (may be admin or guest tracking)
    result = await ECOMMERCE_SERVICE.get_order_by_number(order_number.strip(), user_id if user_id else None)
    
    if result.get("success") and result.get("order"):
        order = result["order"]
        
        # Format detailed order information
        order_number = order.get('orderNumber', 'N/A')
        tracking_number = order.get('trackingNumber', 'Not assigned yet')
        status = order.get('status', 'Unknown')
        total_amount = order.get('totalAmount', 0)
        order_items = order.get('orderItems', [])
        
        # Build formatted message
        status_emoji = {
            'Processing': '⏳',
            'Confirmed': '✅',
            'Shipped': '🚚',
            'Delivered': '📬',
            'Cancel': '❌',
            'Delayed': '⚠️'
        }.get(status, '📦')
        
        message_parts = [
            f"📦 **Order Tracking Information**\n",
            f"**Order Number:** #{order_number}",
            f"**Status:** {status_emoji} {status}",
            f"**Tracking Number:** {tracking_number}",
            f"**Total Amount:** ${total_amount:.2f}"
        ]
        
        if order_items:
            message_parts.append(f"\n**Items:**")
            for item in order_items[:5]:  # Show first 5 items
                item_name = item.get('name', 'Unknown Item')
                item_quantity = item.get('quantity', 0)
                item_price = item.get('price', 0)
                message_parts.append(f"- {item_name} (Qty: {item_quantity}) - ${item_price:.2f}")
            if len(order_items) > 5:
                message_parts.append(f"... and {len(order_items) - 5} more item(s)")
        
        # Add created date if available
        if order.get('createdAt'):
            try:
                # Handle both datetime objects and ISO string format
                created_date = order['createdAt']
                if isinstance(created_date, str):
                    created_date = datetime.fromisoformat(created_date.replace('Z', '+00:00'))
                elif hasattr(created_date, 'strftime'):
                    # Already a datetime object
                    pass
                else:
                    created_date = None
                
                if created_date:
                    message_parts.append(f"\n**Order Date:** {created_date.strftime('%B %d, %Y at %I:%M %p')}")
            except:
                pass
        
        formatted_message = "\n".join(message_parts)
        
        formatted_order = {
            "success": True,
            "order": order,
            "message": formatted_message
        }
        return formatted_order
    
    return result


@tool
async def cancel_order_tool(order_id: str) -> Dict:
    """Cancel an order if it's eligible for cancellation (pending, confirmed, or processing status)."""
    if ECOMMERCE_SERVICE is None:
        return {"error": "Ecommerce service not initialized"}
    return await ECOMMERCE_SERVICE.cancel_order(order_id)


@tool
async def create_order_tool(user_id: str, shipping_address: Dict, payment_method: str = "cash_on_delivery", order_notes: str = "", coupon_code: str = "") -> Dict:
    """Create a new order from the user's cart items with optional coupon code. Requires user to be logged in."""
    if ECOMMERCE_SERVICE is None:
        return {"error": "Ecommerce service not initialized"}
    
    if not user_id or user_id.strip() == "":
        return {
            "error": "login_required",
            "message": "I'd be happy to help you place an order! However, I need you to be logged in first to process your order.",
            "action_required": "Please login to place an order"
        }
    
    return await ECOMMERCE_SERVICE.create_order(user_id, shipping_address, payment_method, order_notes, coupon_code)


@tool
async def get_shipping_addresses_tool(user_id: str) -> Dict:
    """Get all shipping addresses for a user. Requires user to be logged in."""
    if ECOMMERCE_SERVICE is None:
        return {"error": "Ecommerce service not initialized"}
    
    if not user_id or user_id.strip() == "":
        return {
            "error": "login_required",
            "message": "I can help you view your saved shipping addresses! However, I need you to be logged in first to access your personal information.",
            "action_required": "Please login to view your shipping addresses"
        }
    
    return await ECOMMERCE_SERVICE.get_user_shipping_addresses(user_id)


@tool
async def proceed_to_checkout_tool(user_id: str) -> Dict:
    """Begin the checkout process with human approval steps - shows shipping addresses and asks for confirmation."""
    if ECOMMERCE_SERVICE is None:
        return {"error": "Ecommerce service not initialized"}
    
    if not user_id or user_id.strip() == "":
        return {
            "error": "login_required",
            "message": "I need you to be logged in to proceed with checkout.",
            "action_required": "Please login to continue"
        }
    
    try:
        # First check if cart has items
        cart_result = await ECOMMERCE_SERVICE.get_cart_summary(user_id)
        if not cart_result or not cart_result.get("items") or len(cart_result.get("items", [])) == 0:
            return {
                "success": False,
                "message": "Your cart is empty. Please add some items before proceeding to checkout.",
                "needs_approval": False
            }
        
        # Get shipping addresses
        addresses_result = await ECOMMERCE_SERVICE.get_user_shipping_addresses(user_id)
        
        if not addresses_result.get("success") or not addresses_result.get("addresses"):
            return {
                "success": False,
                "message": "You don't have any shipping addresses saved. Please add a shipping address first.",
                "action_required": "add_shipping_address",
                "needs_approval": False
            }
        
        # Show cart summary and shipping addresses for approval
        cart_total = cart_result.get("total_price", 0)
        item_count = len(cart_result.get("items", []))
        addresses = addresses_result.get("addresses", [])
        
        checkout_summary = {
            "success": True,
            "message": f"🛒 **Checkout Review**\n\n**Cart Summary:** {item_count} items - Total: ${cart_total:.2f}\n\n**Available Shipping Addresses:**\n",
            "cart": cart_result,
            "addresses": addresses,
            "checkout_step": "shipping_confirmation",
            "needs_approval": True,
            "approval_type": "shipping_confirmation"
        }
        
        # Format shipping addresses
        for i, addr in enumerate(addresses, 1):
            checkout_summary["message"] += f"{i}. {addr.get('full_name', 'N/A')}\n   {addr.get('address', '')}, {addr.get('city', '')}, {addr.get('postal_code', '')}\n\n"
        
        checkout_summary["message"] += "Please confirm:\n1. Which shipping address would you like to use?\n2. Or would you like to add a new shipping address?\n\nType 'confirm address [number]' or 'add new address' to continue."
        
        return checkout_summary
        
    except Exception as e:
        return {
            "success": False,
            "message": f"Error during checkout: {str(e)}",
            "needs_approval": False
        }


@tool
async def confirm_shipping_and_ask_coupon_tool(user_id: str, address_index: int = 1) -> Dict:
    """Confirm shipping address and ask about coupon codes - second step of checkout."""
    if ECOMMERCE_SERVICE is None:
        return {"error": "Ecommerce service not initialized"}
    
    if not user_id or user_id.strip() == "":
        return {"error": "User ID required", "needs_approval": False}
    
    try:
        # Get addresses to confirm selection
        addresses_result = await ECOMMERCE_SERVICE.get_user_shipping_addresses(user_id)
        addresses = addresses_result.get("addresses", [])
        
        if address_index < 1 or address_index > len(addresses):
            return {
                "success": False,
                "message": "Invalid address selection. Please choose a valid address number.",
                "needs_approval": False
            }
        
        selected_address = addresses[address_index - 1]
        
        # Get available coupons
        coupons_result = await ECOMMERCE_SERVICE.get_available_coupons()
        available_coupons = coupons_result.get("coupons", []) if coupons_result.get("success") else []
        
        # Get cart summary for final review
        cart_result = await ECOMMERCE_SERVICE.get_cart_summary(user_id)
        
        coupon_message = {
            "success": True,
            "message": f"✅ **Shipping Address Confirmed:**\n{selected_address.get('full_name', 'N/A')}\n{selected_address.get('address', '')}, {selected_address.get('city', '')}\n\n",
            "selected_address": selected_address,
            "cart": cart_result,
            "checkout_step": "coupon_selection",
            "needs_approval": True,
            "approval_type": "coupon_selection"
        }
        
        if available_coupons:
            coupon_message["message"] += "🎫 **Available Coupon Codes:**\n"
            for coupon in available_coupons:
                discount_text = f"{coupon.get('discount_percentage', 0)}% off" if coupon.get('discount_type') == 'percentage' else f"${coupon.get('discount_amount', 0)} off"
                coupon_message["message"] += f"• **{coupon.get('code')}** - {discount_text} (Min: ${coupon.get('min_cart_value', 0)})\n"
            
            coupon_message["message"] += "\nWould you like to apply a coupon code?\nType 'apply coupon [CODE]' or 'no coupon' to continue."
            coupon_message["available_coupons"] = available_coupons
        else:
            coupon_message["message"] += "No coupon codes available at the moment.\n\nType 'continue to final review' to proceed."
        
        return coupon_message
        
    except Exception as e:
        return {
            "success": False,
            "message": f"Error confirming shipping: {str(e)}",
            "needs_approval": False
        }


@tool
async def continue_to_final_review_tool(user_id: str, coupon_code: str = "") -> Dict:
    """Continue from coupon selection to final order review. Auto-fetches the most recent confirmed shipping address."""
    if ECOMMERCE_SERVICE is None:
        return {"error": "Ecommerce service not initialized"}
    
    if not user_id or user_id.strip() == "":
        return {"error": "User ID required", "needs_approval": False}
    
    try:
        # Get user's shipping addresses
        addresses_result = await ECOMMERCE_SERVICE.get_user_shipping_addresses(user_id)
        addresses = addresses_result.get("addresses", [])
        
        if not addresses:
            return {
                "success": False,
                "message": "No shipping address found. Please add a shipping address first.",
                "needs_approval": False
            }
        
        # Use the first address (or most recently used)
        selected_address = addresses[0]
        
        # Apply coupon if provided
        if coupon_code:
            coupon_result = await ECOMMERCE_SERVICE.apply_coupon_to_cart(user_id, coupon_code)
            if not coupon_result.get("success"):
                return {
                    "success": False,
                    "message": f"Failed to apply coupon: {coupon_result.get('message', 'Unknown error')}",
                    "needs_approval": False
                }
        
        # Get final cart summary with any applied discounts
        cart_result = await ECOMMERCE_SERVICE.get_cart_summary(user_id)
        
        if not cart_result or not cart_result.get("items"):
            return {
                "success": False,
                "message": "Error retrieving cart summary",
                "needs_approval": False
            }
        
        # Create comprehensive order review
        review_message = {
            "success": True,
            "message": "📋 **Final Order Review**\n\n",
            "cart": cart_result,
            "shipping_address": selected_address,
            "coupon_code": coupon_code,
            "checkout_step": "final_confirmation",
            "needs_approval": True,
            "approval_type": "final_order_confirmation"
        }
        
        # Add cart details
        items = cart_result.get("items", [])
        subtotal = cart_result.get("total_price", 0)
        total = cart_result.get("total_price", 0)
        
        review_message["message"] += "**Items:**\n"
        for item in items:
            review_message["message"] += f"• {item.get('product_name', 'Unknown')} x{item.get('quantity', 1)} - ${item.get('total_price', 0):.2f}\n"
        
        review_message["message"] += f"\n**Subtotal:** ${subtotal:.2f}\n"
        
        # Show discount if applied
        if coupon_code:
            review_message["message"] += f"**Coupon ({coupon_code}):** Applied\n"
        
        review_message["message"] += f"**Total:** ${total:.2f}\n\n"
        
        # Add shipping details
        review_message["message"] += f"**Shipping Address:**\n{selected_address.get('full_name', 'N/A')}\n{selected_address.get('address', '')}\n{selected_address.get('city', '')}, {selected_address.get('postal_code', '')}\n\n"
        
        review_message["message"] += "**Payment Method:** Cash on Delivery\n\n"
        review_message["message"] += "✅ Type 'yes' or 'confirm' to place your order"
        
        return review_message
        
    except Exception as e:
        return {
            "success": False,
            "message": f"Error creating order review: {str(e)}",
            "needs_approval": False
        }


@tool
async def final_order_review_tool(user_id: str, selected_address: Dict, coupon_code: str = "") -> Dict:
    """Show final order review and ask for final confirmation before placing order."""
    if ECOMMERCE_SERVICE is None:
        return {"error": "Ecommerce service not initialized"}
    
    if not user_id or user_id.strip() == "":
        return {"error": "User ID required", "needs_approval": False}
    
    try:
        # Apply coupon if provided
        if coupon_code:
            coupon_result = await ECOMMERCE_SERVICE.apply_coupon_to_cart(user_id, coupon_code)
            if not coupon_result.get("success"):
                return {
                    "success": False,
                    "message": f"Failed to apply coupon: {coupon_result.get('message', 'Unknown error')}",
                    "needs_approval": False
                }
        
        # Get final cart summary with any applied discounts
        cart_result = await ECOMMERCE_SERVICE.get_cart_summary(user_id)
        
        if not cart_result.get("success"):
            return {
                "success": False,
                "message": "Error retrieving cart summary",
                "needs_approval": False
            }
        
        # Create comprehensive order review
        review_message = {
            "success": True,
            "message": "📋 **Final Order Review**\n\n",
            "cart": cart_result,
            "shipping_address": selected_address,
            "coupon_code": coupon_code,
            "checkout_step": "final_confirmation",
            "needs_approval": True,
            "approval_type": "final_order_confirmation"
        }
        
        # Add cart details
        items = cart_result.get("items", [])
        subtotal = cart_result.get("subtotal", 0)
        total = cart_result.get("total_price", 0)
        
        review_message["message"] += "**Items:**\n"
        for item in items:
            review_message["message"] += f"• {item.get('product_name', 'Unknown')} x{item.get('quantity', 1)} - ${item.get('total_price', 0):.2f}\n"
        
        review_message["message"] += f"\n**Subtotal:** ${subtotal:.2f}\n"
        
        # Show discount if applied
        if coupon_code and cart_result.get("discount_applied", 0) > 0:
            review_message["message"] += f"**Coupon ({coupon_code}):** -${cart_result.get('discount_applied', 0):.2f}\n"
        
        review_message["message"] += f"**Total:** ${total:.2f}\n\n"
        
        # Add shipping details
        review_message["message"] += f"**Shipping Address:**\n{selected_address.get('full_name', 'N/A')}\n{selected_address.get('address', '')}\n{selected_address.get('city', '')}, {selected_address.get('postal_code', '')}\n\n"
        
        review_message["message"] += "**Payment Method:** Cash on Delivery\n\n"
        review_message["message"] += "✅ Type 'yes' or 'confirm' to place your order"
        
        return review_message
        
    except Exception as e:
        return {
            "success": False,
            "message": f"Error creating order review: {str(e)}",
            "needs_approval": False
        }


@tool
async def confirm_and_place_order_tool(user_id: str) -> Dict:
    """Final step: Place the order after user confirms. Auto-fetches shipping address from previous steps."""
    if ECOMMERCE_SERVICE is None:
        return {"error": "Ecommerce service not initialized"}
    
    if not user_id or user_id.strip() == "":
        return {"error": "User ID required"}
    
    try:
        # Get shipping addresses
        addresses_result = await ECOMMERCE_SERVICE.get_user_shipping_addresses(user_id)
        addresses = addresses_result.get("addresses", [])
        
        if not addresses:
            return {
                "success": False,
                "message": "No shipping address found. Please add a shipping address first."
            }
        
        # Use the first address (should be the one confirmed earlier)
        shipping_address = addresses[0]
        
        # Get cart to verify it has items
        cart_result = await ECOMMERCE_SERVICE.get_cart_summary(user_id)
        if not cart_result or not cart_result.get("items"):
            return {
                "success": False,
                "message": "Your cart is empty. Cannot place order."
            }
        
        # Create the order
        result = await ECOMMERCE_SERVICE.create_order(
            user_id=user_id,
            shipping_address=shipping_address,
            payment_method="cash_on_delivery",
            order_notes="Order placed via AI assistant",
            coupon_code=""
        )
        
        if result.get("success"):
            result["message"] = f"🎉 **Order Placed Successfully!**\n\nOrder ID: #{result.get('order_id', 'N/A')}\n{result.get('message', '')}\n\nThank you for your purchase! You'll receive updates on your order status."
        
        return result
        
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to place order: {str(e)}"
        }


@tool
async def place_order_with_confirmation_tool(user_id: str, shipping_address: Dict, coupon_code: str = "", skip_coupon: bool = False) -> Dict:
    """Place the order after all confirmations - final step of HITL checkout process."""
    if ECOMMERCE_SERVICE is None:
        return {"error": "Ecommerce service not initialized"}
    
    if not user_id or user_id.strip() == "":
        return {"error": "User ID required"}
    
    try:
        # Create the order
        result = await ECOMMERCE_SERVICE.create_order(
            user_id=user_id,
            shipping_address=shipping_address,
            payment_method="cash_on_delivery",
            order_notes=f"Order placed via AI assistant{' with coupon: ' + coupon_code if coupon_code else ''}",
            coupon_code=coupon_code
        )
        
        if result.get("success"):
            result["message"] = f"🎉 **Order Placed Successfully!**\n\nOrder ID: #{result.get('order_id', 'N/A')}\n{result.get('message', '')}\n\nThank you for your purchase! You'll receive updates on your order status."
        
        return result
        
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to place order: {str(e)}"
        }


@tool
async def finalize_order_directly_tool(user_id: str) -> Dict:
    """Finalize order directly without coupon step - for when user says 'finalize order'."""
    if ECOMMERCE_SERVICE is None:
        return {"error": "Ecommerce service not initialized"}
    
    if not user_id or user_id.strip() == "":
        return {
            "error": "login_required",
            "message": "I need you to be logged in to finalize your order.",
            "action_required": "Please login to continue"
        }
    
    try:
        # Check cart
        cart_result = await ECOMMERCE_SERVICE.get_cart_summary(user_id)
        if not cart_result.get("success") or not cart_result.get("items"):
            return {
                "success": False,
                "message": "Your cart is empty. Please add items before finalizing your order."
            }
        
        # Get default/first shipping address
        addresses_result = await ECOMMERCE_SERVICE.get_user_shipping_addresses(user_id)
        
        if not addresses_result.get("success") or not addresses_result.get("addresses"):
            return {
                "success": False,
                "message": "You need to add a shipping address before finalizing your order.",
                "action_required": "add_shipping_address"
            }
        
        # Use first address as default
        default_address = addresses_result["addresses"][0]
        
        # Create order directly without coupon
        result = await ECOMMERCE_SERVICE.create_order(
            user_id=user_id,
            shipping_address=default_address,
            payment_method="cash_on_delivery",
            order_notes="Order finalized directly via AI assistant (no coupon applied)"
        )
        
        if result.get("success"):
            result["message"] = f"🎉 **Order Finalized Successfully!**\n\nOrder ID: #{result.get('order_id', 'N/A')}\n{result.get('message', '')}\n\nYour order has been placed with your default shipping address."
        
        return result
        
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to finalize order: {str(e)}"
        }


@tool
async def add_shipping_address_tool(user_id: str, full_name: str, address: str, city: str, postal_code: str, country: str = "Pakistan") -> Dict:
    """Add a new shipping address for the user. Matches backend schema: fullName, address, city, postalCode, country."""
    if ECOMMERCE_SERVICE is None:
        return {"error": "Ecommerce service not initialized"}
    
    if not user_id or user_id.strip() == "":
        return {
            "error": "login_required",
            "message": "I'd be happy to help you add a shipping address! However, I need you to be logged in first.",
            "action_required": "Please login to add shipping addresses"
        }
    
    address_data = {
        "fullName": full_name,
        "address": address,
        "city": city,
        "postalCode": postal_code,
        "country": country
    }
    
    return await ECOMMERCE_SERVICE.add_shipping_address(user_id, address_data)


@tool
async def check_shipping_and_suggest_next_step_tool(user_id: str) -> Dict:
    """Check if user has shipping addresses and suggest the next step in the ordering process."""
    if ECOMMERCE_SERVICE is None:
        return {"error": "Ecommerce service not initialized"}
    
    if not user_id or user_id.strip() == "":
        return {
            "error": "login_required",
            "message": "I need you to be logged in to check your shipping information.",
            "action_required": "Please login to continue"
        }
    
    try:
        # Check existing addresses
        addresses_result = await ECOMMERCE_SERVICE.get_user_shipping_addresses(user_id)
        
        if not addresses_result.get("success"):
            return addresses_result
        
        addresses = addresses_result.get("addresses", [])
        
        if len(addresses) > 0:
            # User has addresses, suggest moving to coupon selection
            return {
                "success": True,
                "has_addresses": True,
                "address_count": len(addresses),
                "message": f"Great! I see you have {len(addresses)} shipping address{'es' if len(addresses) != 1 else ''} saved. Let's move on to coupons - would you like to apply any coupon codes to get a discount on your order?",
                "next_step": "coupon_selection",
                "addresses": addresses
            }
        else:
            # No addresses, need to add one
            return {
                "success": True,
                "has_addresses": False,
                "address_count": 0,
                "message": "I notice you don't have any shipping addresses saved. To complete your order, I'll need your shipping information. Could you please provide your full name, complete address, city, postal code, and country?",
                "next_step": "add_shipping_address"
            }
            
    except Exception as e:
        return {"success": False, "message": f"Error checking shipping information: {str(e)}"}


@tool
async def get_shipping_addresses_tool(user_id: str) -> Dict:
    """Get all shipping addresses for a user. Requires user to be logged in."""
    if ECOMMERCE_SERVICE is None:
        return {"error": "Ecommerce service not initialized"}
    
    if not user_id or user_id.strip() == "":
        return {
            "error": "login_required",
            "message": "I can help you view your saved shipping addresses! However, I need you to be logged in first to access your personal information.",
            "action_required": "Please login to view your shipping addresses"
        }
    
    return await ECOMMERCE_SERVICE.get_user_shipping_addresses(user_id)


@tool
async def apply_coupon_to_cart_tool(user_id: str, coupon_code: str) -> Dict:
    """Apply a coupon code to the user's current cart - gets cart total and validates coupon automatically."""
    if ECOMMERCE_SERVICE is None:
        return {"error": "Ecommerce service not initialized"}
    
    if not user_id or user_id.strip() == "":
        return {
            "error": "login_required",
            "message": "I need you to be logged in to apply coupon codes to your cart.",
            "action_required": "Please login to use coupons"
        }
    
    try:
        # Get current cart summary to get total
        cart_summary = await ECOMMERCE_SERVICE.get_cart_summary(user_id)
        
        if not cart_summary.get("success"):
            return {"success": False, "message": "Could not get your cart total. Please check if you have items in your cart."}
        
        cart_total = cart_summary.get("total", 0)
        cart_items = cart_summary.get("items", [])
        
        if cart_total <= 0:
            return {"success": False, "message": "Your cart is empty. Add some items before applying a coupon."}
        
        # Validate the coupon with the cart total
        coupon_result = await ECOMMERCE_SERVICE.validate_coupon(coupon_code, cart_total, user_id)
        
        if coupon_result.get("success") and coupon_result.get("valid"):
            coupon_data = coupon_result.get("coupon", {})
            return {
                "success": True,
                "coupon_applied": True,
                "original_total": cart_total,
                "discount": coupon_data.get("discount", 0),
                "new_total": coupon_data.get("newTotal", cart_total),
                "coupon_code": coupon_code,
                "coupon_type": coupon_data.get("type"),
                "cashback_value": coupon_data.get("cashbackValue", 0),
                "message": f"Great! Coupon '{coupon_code}' applied successfully. You saved ${coupon_data.get('discount', 0):.2f}!",
                "cart_items_count": len(cart_items)
            }
        else:
            return {
                "success": False,
                "coupon_applied": False,
                "message": coupon_result.get("message", "Coupon could not be applied"),
                "cart_total": cart_total,
                "cart_items_count": len(cart_items)
            }
            
    except Exception as e:
        return {"success": False, "message": f"Error applying coupon: {str(e)}"}


@tool
async def validate_coupon_tool(user_id: str, coupon_code: str, cart_total: float) -> Dict:
    """Validate a coupon code and calculate discount for the given cart total. Matches backend validation."""
    if ECOMMERCE_SERVICE is None:
        return {"error": "Ecommerce service not initialized"}
    
    if not user_id or user_id.strip() == "":
        return {
            "error": "login_required",
            "message": "I need you to be logged in to apply coupon codes.",
            "action_required": "Please login to use coupons"
        }
    
    if not coupon_code or not coupon_code.strip():
        return {"success": False, "message": "Please provide a coupon code to validate"}
    
    if cart_total < 0:
        return {"success": False, "message": "Invalid cart total"}
    
    return await ECOMMERCE_SERVICE.validate_coupon(coupon_code, cart_total, user_id)


@tool
async def get_available_coupons_tool() -> Dict:
    """Get all active and valid coupon codes that users can apply."""
    if ECOMMERCE_SERVICE is None:
        return {"error": "Ecommerce service not initialized"}
    return await ECOMMERCE_SERVICE.get_available_coupons()


@tool
async def search_knowledge_base_tool(query: str) -> Dict:
    """Search the knowledge base for information about products, policies, shipping, returns, etc.
    
    Args:
        query: The search query string to find relevant information
        
    Returns:
        Dict containing search results with relevant information
    """
    try:
        from rag_knowledge_base import search_knowledge
        results = search_knowledge(query, top_k=3)
        
        if not results:
            return {
                "success": False,
                "message": "No relevant information found",
                "results": []
            }
        
        return {
            "success": True,
            "message": f"Found {len(results)} relevant documents",
            "results": results
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error searching knowledge base: {str(e)}",
            "results": []
        }


@tool
async def get_product_information_tool(product_query: str) -> Dict:
    """Get detailed information about products, features, specifications, or general product inquiries.
    
    Args:
        product_query: Query about products, features, categories, or general product information
        
    Returns:
        Dict containing relevant product information from knowledge base
    """
    try:
        from rag_knowledge_base import get_context
        context = get_context(f"product {product_query}", max_length=800)
        
        if "No relevant information found" in context:
            # Try a broader search
            context = get_context(product_query, max_length=800)
        
        return {
            "success": True,
            "information": context,
            "query": product_query
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error retrieving product information: {str(e)}",
            "information": ""
        }


# Main AI Agent
class AgenticAI:
    def __init__(self, config: AgentConfig):
        self.config = config

        # Initialize OpenAI client with better error handling
        try:
            self.llm = ChatOpenAI(
                api_key=config.openai_api_key,
                model="gpt-4o-mini",  # Correct model name
                temperature=0.2,  # Slightly higher for better instruction following
                max_tokens=400,   # Slightly increased for tool responses
            )
            print(f"[debug] ChatOpenAI client initialized with gpt-4o-mini")
        except Exception as e:
            print(f"[ERROR] Failed to initialize OpenAI client: {e}")
            raise

        self.memory_store = MongoDBMemoryStore(config)
        self.hitl_manager = HITLManager()
        self.response_cache = ResponseCache(max_size=50, ttl_minutes=15)  # Cache for 15 minutes
        
        # Try to initialize EcommerceService
        try:
            from .ecommerce_service import EcommerceService
            self.ecommerce = EcommerceService(config.mongo_uri, config.ecommerce_db_name)
            print("✅ E-commerce service initialized successfully")
        except Exception as e:
            print(f"⚠️ E-commerce service initialization failed: {e}")
            print("Note: Database operations will not be available")
            self.ecommerce = None

        # Initialize RAG knowledge base
        try:
            self.knowledge_base = get_knowledge_base()
            print("✅ RAG Knowledge Base initialized successfully")
        except Exception as e:
            print(f"❌ Error initializing RAG Knowledge Base: {e}")
            self.knowledge_base = None

        # Expose EcommerceService to tools (temporarily disabled)
        global ECOMMERCE_SERVICE
        ECOMMERCE_SERVICE = self.ecommerce

        # Bind tools for ReAct-style reasoning
        self.tools = [
            search_products_tool,
            get_products_tool,
            get_product_details_tool,
            get_product_categories_tool,
            get_products_by_category_tool,
            get_featured_products_tool,
            get_price_range_tool,
            get_low_stock_products_tool,
            add_to_cart_tool,
            get_cart_summary_tool,
            remove_from_cart_tool,
            increase_quantity_tool,
            decrease_quantity_tool,
            empty_cart_tool,
            get_orders_tool,
            get_order_details_tool,
            track_order_tool,
            cancel_order_tool,
            create_order_tool,
            get_shipping_addresses_tool,
            add_shipping_address_tool,
            check_shipping_and_suggest_next_step_tool,
            proceed_to_checkout_tool,
            confirm_shipping_and_ask_coupon_tool,
            continue_to_final_review_tool,
            final_order_review_tool,
            confirm_and_place_order_tool,
            place_order_with_confirmation_tool,
            finalize_order_directly_tool,
            validate_coupon_tool,
            get_available_coupons_tool,
            apply_coupon_to_cart_tool,
            update_cart_item_quantity_by_product,
            search_knowledge_base_tool,
            get_product_information_tool,
        ]
        self.llm_with_tools = self.llm.bind_tools(self.tools)
        # Underlying ToolNode runnable used by our wrapper node
        self.tool_node = ToolNode(self.tools)

        # Build the graph
        self.graph = self._build_graph()

    # =============== CHECKOUT FLOW NODES (Deterministic) ===============
    
    def _determine_flow_route(self, state: AgentState) -> str:
        """Determine which flow path to take (routing function for conditional edges)."""
        print(f"[debug] Flow Router - in_checkout_flow: {state.in_checkout_flow}, checkout_step: {state.checkout_step}")
        print(f"[debug] Flow Router - in_pc_builder_flow: {state.in_pc_builder_flow}, pc_builder_step: {state.pc_builder_step}")
        print(f"[debug] Flow Router - user_input: {state.user_input}")
        
        # Check if we're in PC builder flow
        if state.in_pc_builder_flow:
            step = state.pc_builder_step
            print(f"[debug] Flow Router - Routing to PC builder step: {step}")
            # Return prefixed step name to avoid conflicts
            if step == "completed":
                return "pc_builder_completed"
            else:
                return f"pc_builder_{step}"
        
        # Check if we're already in checkout flow
        if state.in_checkout_flow:
            # Route based on checkout step
            print(f"[debug] Flow Router - Routing to checkout step: {state.checkout_step}")
            return f"checkout_{state.checkout_step}"
        
        # Check user input for flow triggers
        user_input_lower = state.user_input.lower() if state.user_input else ""
        
        # PC Builder triggers
        pc_builder_triggers = [
            "build a pc", "build pc", "custom pc", "pc builder",
            "i want to build a pc", "help me build a pc"
        ]
        
        if any(trigger in user_input_lower for trigger in pc_builder_triggers):
            state.in_pc_builder_flow = True
            state.pc_builder_step = "ram"
            print("[debug] Flow Router - PC Builder trigger detected, starting PC builder flow")
            return "pc_builder_ram"
        
        # Checkout triggers
        checkout_triggers = [
            "proceed to checkout", "checkout", "start checkout",
            "buy now", "purchase now", "go to checkout"
        ]
        
        if any(trigger in user_input_lower for trigger in checkout_triggers):
            state.in_checkout_flow = True
            state.checkout_step = "shipping"
            print("[debug] Flow Router - Checkout trigger detected, starting checkout flow")
            return "checkout_shipping"
        
        # Default to general flow (LLM handles it)
        print("[debug] Flow Router - Routing to general LLM flow")
        return "general"
    
    async def _checkout_shipping_node(self, state: AgentState) -> AgentState:
        """Handle shipping address selection step."""
        print("[debug] Checkout: Shipping step")
        
        # FIRST: Check if user is responding with address confirmation
        user_input_lower = state.user_input.lower() if state.user_input else ""
        
        # If we already have addresses saved and user is confirming, process it immediately
        if state.checkout_data.get("addresses") and ("confirm address" in user_input_lower or "use address" in user_input_lower or user_input_lower.strip().isdigit()):
            import re
            match = re.search(r'(\d+)', user_input_lower)
            if match:
                try:
                    address_index = int(match.group(1)) - 1  # Convert to 0-indexed
                    addresses = state.checkout_data["addresses"]
                    
                    if 0 <= address_index < len(addresses):
                        selected_address = addresses[address_index]
                        state.checkout_data["selected_address"] = selected_address
                        state.checkout_data["selected_address_index"] = address_index
                        state.checkout_step = "coupon"
                        state.in_checkout_flow = True
                        
                        # Instead of just saying "moving to coupon", actually show the coupon selection
                        # Get available coupons
                        coupons_result = await self.ecommerce.get_available_coupons()
                        
                        message = f"✅ Shipping to: **{selected_address.get('fullName', 'N/A')}**, {selected_address.get('city', 'N/A')}.\n\n"
                        
                        if coupons_result.get("success") and coupons_result.get("coupons"):
                            coupons = coupons_result.get("coupons", [])
                            state.checkout_data["available_coupons"] = coupons
                            
                            message += "💰 **Available Coupons:**\n"
                            for idx, coupon in enumerate(coupons, 1):
                                coupon_type = coupon.get("type", "UNKNOWN")
                                value = coupon.get("value", 0)
                                
                                if coupon_type == "PERCENTAGE":
                                    discount_text = f"{value}% off"
                                elif coupon_type == "FIXED_AMOUNT":
                                    discount_text = f"${value} off"
                                else:
                                    discount_text = coupon_type
                                
                                remaining_uses = coupon.get("maxUses", 0) - coupon.get("timesUsed", 0)
                                message += f"{idx}. **{coupon.get('code')}** - {discount_text} ({remaining_uses} uses left)\n"
                            
                            message += "\nWould you like to apply a coupon?\nType the coupon number (e.g., \"1\") or \"skip\" to continue."
                        else:
                            message += "No coupon codes available at the moment.\n\nType 'continue to final review' to proceed."
                        
                        state.ai_response = message
                        
                        state.messages.append({
                            "role": "assistant",
                            "content": state.ai_response,
                            "timestamp": datetime.utcnow().isoformat(),
                        })
                        return state
                except (ValueError, IndexError):
                    pass
        
        # SECOND: If no valid confirmation, show the shipping UI
        if not state.user_id or state.user_id.strip() == "":
            state.ai_response = "I need you to be logged in to proceed with checkout."
            state.in_checkout_flow = False
            state.checkout_step = "none"
        else:
            try:
                # Check if cart has items
                cart_result = await self.ecommerce.get_cart_summary(state.user_id)
                if not cart_result or not cart_result.get("items") or len(cart_result.get("items", [])) == 0:
                    state.ai_response = "Your cart is empty. Please add some items before proceeding to checkout."
                    state.in_checkout_flow = False
                    state.checkout_step = "none"
                else:
                    # Get shipping addresses
                    addresses_result = await self.ecommerce.get_user_shipping_addresses(state.user_id)
                    
                    if not addresses_result.get("success") or not addresses_result.get("addresses"):
                        state.ai_response = "You don't have any shipping addresses saved. Please add a shipping address first."
                        state.in_checkout_flow = False
                        state.checkout_step = "none"
                    else:
                        # Show cart summary and shipping addresses
                        cart_total = cart_result.get("total_price", 0)
                        item_count = len(cart_result.get("items", []))
                        addresses = addresses_result.get("addresses", [])
                        
                        state.checkout_data["addresses"] = addresses
                        state.checkout_data["cart"] = cart_result
                        
                        message = f"🛒 **Checkout Review**\n\n**Cart Summary:** {item_count} items - Total: ${cart_total:.2f}\n\n**Available Shipping Addresses:**\n"
                        
                        for i, addr in enumerate(addresses, 1):
                            message += f"{i}. {addr.get('fullName', 'N/A')}\n   {addr.get('address', '')}, {addr.get('city', '')}, {addr.get('postalCode', '')}, {addr.get('country', '')}\n\n"
                        
                        message += "Please select your address by typing the number (e.g., \"1\")"
                        state.ai_response = message
                        state.in_checkout_flow = True
                        state.checkout_step = "shipping"  # Stay in shipping waiting for input
                            
            except Exception as e:
                state.ai_response = f"Error during checkout: {str(e)}"
                state.in_checkout_flow = False
                state.checkout_step = "none"
        
        state.messages.append({
            "role": "assistant",
            "content": state.ai_response,
            "timestamp": datetime.utcnow().isoformat(),
        })
        
        return state
    
    async def _checkout_coupon_node(self, state: AgentState) -> AgentState:
        """Handle coupon selection step."""
        print("[debug] Checkout: Coupon step")
        
        address_index = state.checkout_data.get("selected_address_index", 1)
        
        try:
            # Check user input FIRST to see if they're applying a coupon
            user_input_lower = state.user_input.lower() if state.user_input else ""
            user_input_stripped = state.user_input.strip() if state.user_input else ""
            
            # Check if user entered just a number (e.g., "1") or "apply coupon 1"
            if user_input_stripped.isdigit() or "apply coupon" in user_input_lower:
                # User is applying a coupon - process it directly
                import re
                
                # Get available coupons from checkout_data (already loaded)
                available_coupons = state.checkout_data.get("available_coupons", [])
                
                # Check if user just typed a number (e.g., "1")
                if user_input_stripped.isdigit():
                    coupon_idx = int(user_input_stripped) - 1
                    if 0 <= coupon_idx < len(available_coupons):
                        selected_coupon = available_coupons[coupon_idx]
                        state.checkout_data["coupon_code"] = selected_coupon.get('code', '')
                        state.checkout_step = "review"
                        state.in_checkout_flow = True
                        
                        # Instead of just saying "moving to review", show the actual review
                        coupon_code = selected_coupon.get('code', '')
                        cart_result = await self.ecommerce.get_cart_summary(state.user_id)
                        
                        if cart_result and cart_result.get("items"):
                            selected_address = state.checkout_data.get("selected_address", {})
                            state.checkout_data["final_cart"] = cart_result
                            
                            items = cart_result.get("items", [])
                            subtotal = cart_result.get("total_price", 0)
                            total = cart_result.get("total_price", 0)
                            
                            message = f"✅ Coupon **{coupon_code}** applied!\n\n"
                            message += "📋 **Final Order Review**\n\n**Items:**\n"
                            for item in items:
                                message += f"• {item.get('product_name', 'Unknown')} x{item.get('quantity', 1)} - ${item.get('total_price', 0):.2f}\n"
                            
                            message += f"\n**Subtotal:** ${subtotal:.2f}\n"
                            message += f"**Coupon ({coupon_code}):** Applied\n"
                            message += f"**Total:** ${total:.2f}\n\n"
                            message += f"**Shipping Address:**\n{selected_address.get('fullName', 'N/A')}\n{selected_address.get('address', '')}\n{selected_address.get('city', '')}, {selected_address.get('postalCode', '')}, {selected_address.get('country', '')}\n\n"
                            message += "**Payment Method:** Cash on Delivery\n\n"
                            message += "✅ Type 'yes' or 'confirm' to place your order"
                            
                            state.ai_response = message
                        else:
                            state.ai_response = f"✅ Coupon **{coupon_code}** applied! Moving to final review..."
                        
                        print(f"[debug] Coupon selected by number: {coupon_code}, showing review")
                    else:
                        state.checkout_step = "coupon"
                        state.in_checkout_flow = True
                        state.ai_response = f"Invalid coupon number. Please choose between 1 and {len(available_coupons)}."
                # Check for "apply coupon [number]" format
                elif "apply coupon" in user_input_lower:
                    match_num = re.search(r'apply coupon\s+(\d+)', user_input_lower)
                    if match_num:
                        coupon_idx = int(match_num.group(1)) - 1
                        if 0 <= coupon_idx < len(available_coupons):
                            selected_coupon = available_coupons[coupon_idx]
                            state.checkout_data["coupon_code"] = selected_coupon.get('code', '')
                            state.checkout_step = "review"
                            state.in_checkout_flow = True
                            
                            # Show the review directly
                            coupon_code = selected_coupon.get('code', '')
                            cart_result = await self.ecommerce.get_cart_summary(state.user_id)
                            
                            if cart_result and cart_result.get("items"):
                                selected_address = state.checkout_data.get("selected_address", {})
                                state.checkout_data["final_cart"] = cart_result
                                
                                items = cart_result.get("items", [])
                                subtotal = cart_result.get("total_price", 0)
                                total = cart_result.get("total_price", 0)
                                
                                message = f"✅ Coupon **{coupon_code}** applied!\n\n"
                                message += "📋 **Final Order Review**\n\n**Items:**\n"
                                for item in items:
                                    message += f"• {item.get('product_name', 'Unknown')} x{item.get('quantity', 1)} - ${item.get('total_price', 0):.2f}\n"
                                
                                message += f"\n**Subtotal:** ${subtotal:.2f}\n"
                                message += f"**Coupon ({coupon_code}):** Applied\n"
                                message += f"**Total:** ${total:.2f}\n\n"
                                message += f"**Shipping Address:**\n{selected_address.get('fullName', 'N/A')}\n{selected_address.get('address', '')}\n{selected_address.get('city', '')}, {selected_address.get('postalCode', '')}, {selected_address.get('country', '')}\n\n"
                                message += "**Payment Method:** Cash on Delivery\n\n"
                                message += "✅ Type 'yes' or 'confirm' to place your order"
                                
                                state.ai_response = message
                            else:
                                state.ai_response = f"✅ Coupon **{coupon_code}** applied! Moving to final review..."
                            
                            print(f"[debug] Coupon selected: {coupon_code}, showing review")
                        else:
                            state.checkout_step = "coupon"
                            state.in_checkout_flow = True
                            state.ai_response = f"Invalid coupon number. Please choose between 1 and {len(available_coupons)}."
                    else:
                        # Check for code (e.g., "apply coupon SAVE20")
                        match_code = re.search(r'apply coupon\s+([A-Z0-9]+)', user_input_lower.upper())
                        if match_code:
                            state.checkout_data["coupon_code"] = match_code.group(1)
                            state.checkout_step = "review"
                            state.in_checkout_flow = True
                            state.ai_response = f"✅ Coupon **{match_code.group(1)}** applied! Moving to final review..."
                            print(f"[debug] Coupon extracted: {match_code.group(1)}, moving to review")
                        else:
                            state.checkout_step = "coupon"
                            state.in_checkout_flow = True
                            state.ai_response = "Please specify the coupon number (e.g., '1')"
                else:
                    state.checkout_step = "coupon"
                    state.in_checkout_flow = True
                    state.ai_response = "Please specify the coupon number (e.g., '1')"
                        
                state.messages.append({
                    "role": "assistant",
                    "content": state.ai_response,
                    "timestamp": datetime.utcnow().isoformat(),
                })
                return state
            
            elif "no coupon" in user_input_lower or "skip" in user_input_lower or "continue" in user_input_lower:
                # User is skipping coupon - show review directly
                state.checkout_data["coupon_code"] = ""
                state.checkout_step = "review"
                state.in_checkout_flow = True
                
                # Show the review directly
                cart_result = await self.ecommerce.get_cart_summary(state.user_id)
                
                if cart_result and cart_result.get("items"):
                    selected_address = state.checkout_data.get("selected_address", {})
                    state.checkout_data["final_cart"] = cart_result
                    
                    items = cart_result.get("items", [])
                    subtotal = cart_result.get("total_price", 0)
                    total = cart_result.get("total_price", 0)
                    
                    message = "📋 **Final Order Review**\n\n**Items:**\n"
                    for item in items:
                        message += f"• {item.get('product_name', 'Unknown')} x{item.get('quantity', 1)} - ${item.get('total_price', 0):.2f}\n"
                    
                    message += f"\n**Subtotal:** ${subtotal:.2f}\n"
                    message += f"**Total:** ${total:.2f}\n\n"
                    message += f"**Shipping Address:**\n{selected_address.get('fullName', 'N/A')}\n{selected_address.get('address', '')}\n{selected_address.get('city', '')}, {selected_address.get('postalCode', '')}, {selected_address.get('country', '')}\n\n"
                    message += "**Payment Method:** Cash on Delivery\n\n"
                    message += "✅ Type 'yes' or 'confirm' to place your order"
                    
                    state.ai_response = message
                else:
                    state.ai_response = "Proceeding to final review without coupon..."
                
                print("[debug] No coupon selected, showing review")
                
                state.messages.append({
                    "role": "assistant",
                    "content": state.ai_response,
                    "timestamp": datetime.utcnow().isoformat(),
                })
                return state
            
            elif "no coupon" in user_input_lower or "skip" in user_input_lower or "continue" in user_input_lower:
                # User is skipping coupon - show review directly
                state.checkout_data["coupon_code"] = ""
                state.checkout_step = "review"
                state.in_checkout_flow = True
                
                # Show the review directly
                cart_result = await self.ecommerce.get_cart_summary(state.user_id)
                
                if cart_result and cart_result.get("items"):
                    selected_address = state.checkout_data.get("selected_address", {})
                    state.checkout_data["final_cart"] = cart_result
                    
                    items = cart_result.get("items", [])
                    subtotal = cart_result.get("total_price", 0)
                    total = cart_result.get("total_price", 0)
                    
                    message = "📋 **Final Order Review**\n\n**Items:**\n"
                    for item in items:
                        message += f"• {item.get('product_name', 'Unknown')} x{item.get('quantity', 1)} - ${item.get('total_price', 0):.2f}\n"
                    
                    message += f"\n**Subtotal:** ${subtotal:.2f}\n"
                    message += f"**Total:** ${total:.2f}\n\n"
                    message += f"**Shipping Address:**\n{selected_address.get('fullName', 'N/A')}\n{selected_address.get('address', '')}\n{selected_address.get('city', '')}, {selected_address.get('postalCode', '')}, {selected_address.get('country', '')}\n\n"
                    message += "**Payment Method:** Cash on Delivery\n\n"
                    message += "✅ Type 'yes' or 'confirm' to place your order"
                    
                    state.ai_response = message
                else:
                    state.ai_response = "Proceeding to final review without coupon..."
                
                print("[debug] No coupon selected, showing review")
                
                state.messages.append({
                    "role": "assistant",
                    "content": state.ai_response,
                    "timestamp": datetime.utcnow().isoformat(),
                })
                return state
            
            # If we reach here, show the coupon selection UI
            # Get addresses to confirm selection
            addresses_result = await self.ecommerce.get_user_shipping_addresses(state.user_id)
            addresses = addresses_result.get("addresses", [])
            # Get addresses to confirm selection
            addresses_result = await self.ecommerce.get_user_shipping_addresses(state.user_id)
            addresses = addresses_result.get("addresses", [])
            
            if address_index < 1 or address_index > len(addresses):
                state.ai_response = "Invalid address selection. Please choose a valid address number."
                state.checkout_step = "shipping"  # Go back to shipping
                state.in_checkout_flow = True
            else:
                selected_address = addresses[address_index - 1]
                
                # Get available coupons
                coupons_result = await self.ecommerce.get_available_coupons()
                available_coupons = coupons_result.get("coupons", []) if coupons_result.get("success") else []
                
                # Get cart summary
                cart_result = await self.ecommerce.get_cart_summary(state.user_id)
                
                state.checkout_data["selected_address"] = selected_address
                state.checkout_data["available_coupons"] = available_coupons
                state.checkout_data["cart"] = cart_result
                
                # IMPORTANT: Maintain checkout flow state
                state.in_checkout_flow = True
                
                message = f"✅ **Shipping Address Confirmed:**\n{selected_address.get('fullName', 'N/A')}\n{selected_address.get('address', '')}, {selected_address.get('city', '')}, {selected_address.get('postalCode', '')}, {selected_address.get('country', '')}\n\n"
                
                if available_coupons:
                    message += "🎫 **Available Coupon Codes:**\n"
                    for idx, coupon in enumerate(available_coupons, 1):
                        # Match backend schema
                        coupon_type = coupon.get('type', 'PERCENTAGE')
                        coupon_value = coupon.get('value', 0)
                        
                        if coupon_type == 'PERCENTAGE':
                            discount_text = f"{coupon_value}% off"
                        elif coupon_type == 'FIXED_AMOUNT':
                            discount_text = f"${coupon_value} off"
                        elif coupon_type == 'FREE_SHIPPING':
                            discount_text = "Free Shipping"
                        elif coupon_type == 'CASHBACK':
                            discount_text = f"${coupon_value} cashback"
                        else:
                            discount_text = f"{coupon_value}% off"
                        
                        max_uses = coupon.get('maxUses', 100)
                        times_used = coupon.get('timesUsed', 0)
                        remaining_uses = max_uses - times_used
                        
                        message += f"{idx}. **{coupon.get('code')}** - {discount_text} ({remaining_uses} uses left)\n"
                    
                    message += "\nWould you like to apply a coupon?\nType the coupon number (e.g., \"1\") or \"skip\" to continue."
                    state.ai_response = message
                    state.checkout_step = "coupon"  # Stay in coupon step waiting for input
                else:
                    message += "No coupon codes available at the moment.\n\nType 'continue to final review' to proceed."
                    state.ai_response = message
                    state.checkout_step = "coupon"  # Stay in coupon, wait for continue
                    
        except Exception as e:
            state.ai_response = f"Error confirming shipping: {str(e)}"
            state.in_checkout_flow = False
            state.checkout_step = "none"
        
        state.messages.append({
            "role": "assistant",
            "content": state.ai_response,
            "timestamp": datetime.utcnow().isoformat(),
        })
        
        return state
    
    async def _checkout_review_node(self, state: AgentState) -> AgentState:
        """Handle final review step."""
        print("[debug] Checkout: Review step")
        
        # FIRST: Check if user is confirming the order
        user_input_lower = state.user_input.lower() if state.user_input else ""
        
        # Simplified confirmation: accept "yes", "confirm", "ok", or the full phrase
        if any(word in user_input_lower for word in ["yes", "confirm", "ok"]) or "place order" in user_input_lower:
            print("[debug] User confirmed order, processing order placement...")
            state.checkout_step = "order"
            state.in_checkout_flow = True
            
            # Place the order immediately instead of waiting for another message
            try:
                cart_result = await self.ecommerce.get_cart_summary(state.user_id)
                selected_address = state.checkout_data.get("selected_address", {})
                coupon_code = state.checkout_data.get("coupon_code", "")
                
                order_result = await self.ecommerce.create_order(
                    user_id=state.user_id,
                    shipping_address=selected_address,
                    coupon_code=coupon_code
                )
                
                print(f"[debug] Order result keys: {order_result.keys() if isinstance(order_result, dict) else 'Not a dict'}")
                print(f"[debug] Order result success: {order_result.get('success')}")
                
                if order_result.get("success"):
                    # Data is directly in order_result, not nested in "order" key
                    print(f"[debug] Order result data: {order_result}")
                    
                    # Extract order details - data is at top level
                    order_id = order_result.get("order_id", "N/A")
                    order_number = order_result.get("orderNumber", "N/A")
                    tracking_number = order_result.get("trackingNumber", "Will be updated soon")
                    total_amount = order_result.get("totalAmount") or cart_result.get("total_price", 0)
                    
                    print(f"[debug] Extracted - Order ID: {order_id}, Order Number: {order_number}, Tracking: {tracking_number}, Total: {total_amount}")
                    
                    message = f"""🎉 **Order Placed Successfully!**

**Order Number:** #{order_number}
**Order ID:** {order_id}
**Tracking Number:** {tracking_number}
**Total Amount:** ${total_amount:.2f}
**Estimated Delivery:** 3-5 business days

{order_result.get('message', 'Your order has been confirmed and will be processed shortly.')}

Thank you for shopping with us! 🛍️"""
                    
                    state.ai_response = message
                    state.checkout_step = "completed"
                    state.in_checkout_flow = False
                    state.checkout_data = {}
                else:
                    state.ai_response = f"❌ Error placing order: {order_result.get('message', 'Unknown error')}"
                    state.in_checkout_flow = False
                    state.checkout_step = "none"
                    
            except Exception as e:
                state.ai_response = f"❌ Error placing order: {str(e)}"
                state.in_checkout_flow = False
                state.checkout_step = "none"
            
            state.messages.append({
                "role": "assistant",
                "content": state.ai_response,
                "timestamp": datetime.utcnow().isoformat(),
            })
            return state
        elif "cancel" in user_input_lower:
            state.ai_response = "🔙 Checkout cancelled. Your cart is still saved."
            state.in_checkout_flow = False
            state.checkout_step = "none"
            state.checkout_data = {}
            
            state.messages.append({
                "role": "assistant",
                "content": state.ai_response,
                "timestamp": datetime.utcnow().isoformat(),
            })
            return state
        
        # SECOND: If no confirmation, show the review UI
        coupon_code = state.checkout_data.get("coupon_code", "")
        
        try:
            # Note: Coupon validation happens at order creation time in the backend
            # We just show the coupon code here for reference
            
            # Get final cart summary
            cart_result = await self.ecommerce.get_cart_summary(state.user_id)
            
            if not cart_result or not cart_result.get("items"):
                state.ai_response = "Error retrieving cart summary"
                state.in_checkout_flow = False
                state.checkout_step = "none"
            else:
                # Get shipping address from checkout data
                selected_address = state.checkout_data.get("selected_address", {})
                
                # IMPORTANT: Maintain checkout flow state
                state.in_checkout_flow = True
                
                state.checkout_data["final_cart"] = cart_result
                
                # Create order review message
                items = cart_result.get("items", [])
                subtotal = cart_result.get("total_price", 0)
                total = cart_result.get("total_price", 0)
                
                message = "📋 **Final Order Review**\n\n**Items:**\n"
                for item in items:
                    message += f"• {item.get('product_name', 'Unknown')} x{item.get('quantity', 1)} - ${item.get('total_price', 0):.2f}\n"
                
                message += f"\n**Subtotal:** ${subtotal:.2f}\n"
                
                if coupon_code:
                    message += f"**Coupon ({coupon_code}):** Applied\n"
                
                message += f"**Total:** ${total:.2f}\n\n"
                message += f"**Shipping Address:**\n{selected_address.get('fullName', 'N/A')}\n{selected_address.get('address', '')}\n{selected_address.get('city', '')}, {selected_address.get('postalCode', '')}, {selected_address.get('country', '')}\n\n"
                message += "**Payment Method:** Cash on Delivery\n\n"
                message += "✅ Type 'yes' or 'confirm' to place your order"
                
                state.ai_response = message
                
                # Check if user confirmed order
                user_input_lower = state.user_input.lower() if state.user_input else ""
                
                if "confirm and place order" in user_input_lower or "place order" in user_input_lower or "confirm order" in user_input_lower:
                    state.checkout_step = "order"
                else:
                    state.checkout_step = "review"  # Stay in review
                    
        except Exception as e:
            state.ai_response = f"Error creating order review: {str(e)}"
            state.in_checkout_flow = False
            state.checkout_step = "none"
        
        state.messages.append({
            "role": "assistant",
            "content": state.ai_response,
            "timestamp": datetime.utcnow().isoformat(),
        })
        
        return state
    
    async def _checkout_order_node(self, state: AgentState) -> AgentState:
        """Handle order placement step."""
        print("[debug] Checkout: Order placement step")
        
        try:
            # Get shipping address from checkout data
            shipping_address = state.checkout_data.get("selected_address", {})
            
            if not shipping_address:
                state.ai_response = "No shipping address found. Please restart checkout."
                state.in_checkout_flow = False
                state.checkout_step = "none"
            else:
                # Get cart to verify it has items
                cart_result = await self.ecommerce.get_cart_summary(state.user_id)
                if not cart_result or not cart_result.get("items"):
                    state.ai_response = "Your cart is empty. Cannot place order."
                    state.in_checkout_flow = False
                    state.checkout_step = "none"
                else:
                    # Create the order
                    result = await self.ecommerce.create_order(
                        user_id=state.user_id,
                        shipping_address=shipping_address,
                        payment_method="cash_on_delivery",
                        order_notes="Order placed via AI assistant",
                        coupon_code=state.checkout_data.get("coupon_code", "")
                    )
                    
                    if result.get("success"):
                        state.ai_response = f"🎉 **Order Placed Successfully!**\n\nOrder ID: #{result.get('order_id', 'N/A')}\n{result.get('message', '')}\n\nThank you for your purchase! You'll receive updates on your order status."
                        state.checkout_step = "completed"
                    else:
                        state.ai_response = f"Failed to place order: {result.get('message', 'Unknown error')}"
                        state.in_checkout_flow = False
                        state.checkout_step = "none"
                        
        except Exception as e:
            state.ai_response = f"Failed to place order: {str(e)}"
            state.in_checkout_flow = False
            state.checkout_step = "none"
        
        state.messages.append({
            "role": "assistant",
            "content": state.ai_response,
            "timestamp": datetime.utcnow().isoformat(),
        })
        
        return state
    
    async def _checkout_completed_node(self, state: AgentState) -> AgentState:
        """Handle checkout completion."""
        print("[debug] Checkout: Completed")
        
        # Reset checkout flow
        state.in_checkout_flow = False
        state.checkout_step = "none"
        state.checkout_data = {}
        
        return state

    # =============== PC BUILDER FLOW NODES ===============
    
    def _is_question_or_conversation(self, user_input: str) -> bool:
        """Detect if user input is a question or conversational rather than a selection."""
        if not user_input:
            return False
        
        user_input_lower = user_input.lower().strip()
        
        # Check if it's a numeric selection or skip command
        if user_input_lower.isdigit() or user_input_lower in ["0", "skip"]:
            return False
        
        # Check for question indicators
        question_indicators = [
            "what", "which", "why", "how", "when", "where", "who",
            "tell me", "explain", "difference", "compare", "better",
            "recommend", "suggest", "help", "?", "confused", "don't understand",
            "go back", "previous", "change", "modify", "is", "but" "different"
        ]
        
        return any(indicator in user_input_lower for indicator in question_indicators)
    
    async def _handle_pc_builder_question(self, state: AgentState, component_type: str, products: list) -> AgentState:
        """Handle questions during PC builder flow using LLM with context."""
        print(f"[debug] Handling question during {component_type} selection")
        
        # Build context about current products
        products_context = f"\n\nCurrently showing {component_type.upper()} options:\n"
        for idx, product in enumerate(products, 1):
            products_context += f"{idx}. {product['name']} - ${product['price']}\n"
            if product.get('specifications'):
                products_context += f"   Specs: {str(product['specifications'])[:100]}\n"
        
        # Create a system message with context
        context_message = f"""You are helping a user build a custom PC. They are currently at the {component_type.upper()} selection step.
{products_context}
Answer their question naturally and helpfully. After answering, remind them they can:
- Enter a number (1-{len(products)}) to select that {component_type}
- Enter 0 or 'skip' to skip this component
- Ask more questions about the products

Keep your response concise and helpful."""
        
        # Use LLM to answer the question
        messages = [
            {"role": "system", "content": context_message},
            {"role": "user", "content": state.user_input}
        ]
        
        try:
            response = await self.llm.ainvoke(messages)
            state.ai_response = response.content
        except Exception as e:
            print(f"[debug] Error using LLM for question: {e}")
            state.ai_response = f"I understand you have a question. {products_context}\n\nPlease enter a number to select, or 0 to skip."
        
        return state
    
    async def _pc_builder_ram_node(self, state: AgentState) -> AgentState:
        """Handle RAM selection step."""
        print("[debug] PC Builder: RAM step")
        
        # Ensure we're marked as in PC builder flow
        state.in_pc_builder_flow = True
        state.pc_builder_step = "ram"
        
        user_input_lower = state.user_input.lower() if state.user_input else ""
        
        # If we have products shown and user asks a question, handle it
        if state.pc_builder_data.get("ram_products") and self._is_question_or_conversation(state.user_input):
            return await self._handle_pc_builder_question(state, "ram", state.pc_builder_data["ram_products"])
        
        # Check if user is responding with a selection
        if state.pc_builder_data.get("ram_products") and (user_input_lower.strip().isdigit() or "skip" in user_input_lower):
            if "0" in user_input_lower or "skip" in user_input_lower:
                # User skipped RAM - show SSD immediately
                state.pc_builder_step = "ssd"
                
                # Get SSD products
                ssd_products = await self.ecommerce.get_products(limit=5, category="SSD")
                state.pc_builder_data["ssd_products"] = ssd_products
                
                if not ssd_products:
                    state.ai_response = "⏭️ Skipped RAM selection.\n\nSorry, no SSD products available right now."
                    state.in_pc_builder_flow = False
                else:
                    response = "⏭️ Skipped RAM selection.\n\n"
                    response += "💾 **PC Builder - Step 2: Select SSD**\n\n"
                    response += "Choose an SSD option:\n\n"
                    
                    for idx, product in enumerate(ssd_products, 1):
                        response += f"**{idx}. {product['name']}** - ${product['price']}\n"
                        if product.get('description'):
                            response += f"   {product['description'][:80]}...\n"
                        response += "\n"
                    
                    response += "**0. Skip this step**\n\n"
                    response += "Enter the number of your choice (or 0 to skip):"
                    
                    state.ai_response = response
                
                state.messages.append({
                    "role": "assistant",
                    "content": state.ai_response,
                    "timestamp": datetime.utcnow().isoformat(),
                })
                return state
            
            # User selected a RAM product
            import re
            match = re.search(r'(\d+)', user_input_lower)
            if match:
                try:
                    selection = int(match.group(1))
                    ram_products = state.pc_builder_data.get("ram_products", [])
                    
                    if 1 <= selection <= len(ram_products):
                        selected_ram = ram_products[selection - 1]
                        
                        # Add component to build
                        build_id = state.pc_builder_data.get("build_id")
                        if build_id:
                            result = await self.ecommerce.add_component_to_build(
                                build_id, "ram", selected_ram["_id"]
                            )
                            
                            if result.get("success"):
                                state.pc_builder_step = "ssd"
                                
                                # Get SSD products immediately
                                ssd_products = await self.ecommerce.get_products(limit=5, category="SSD")
                                state.pc_builder_data["ssd_products"] = ssd_products
                                
                                if not ssd_products:
                                    state.ai_response = f"✅ **{selected_ram['name']}** selected!\n\nSorry, no SSD products available right now."
                                    state.in_pc_builder_flow = False
                                else:
                                    # Format response with SSD options
                                    response = f"✅ **{selected_ram['name']}** selected!\n\n"
                                    response += "💾 **PC Builder - Step 2: Select SSD**\n\n"
                                    response += "Choose an SSD option:\n\n"
                                    
                                    for idx, product in enumerate(ssd_products, 1):
                                        response += f"**{idx}. {product['name']}** - ${product['price']}\n"
                                        if product.get('description'):
                                            response += f"   {product['description'][:80]}...\n"
                                        response += "\n"
                                    
                                    response += "**0. Skip this step**\n\n"
                                    response += "Enter the number of your choice (or 0 to skip):"
                                    
                                    state.ai_response = response
                                
                                state.messages.append({
                                    "role": "assistant",
                                    "content": state.ai_response,
                                    "timestamp": datetime.utcnow().isoformat(),
                                })
                                return state
                except (ValueError, IndexError):
                    pass
            
            state.ai_response = "Invalid selection. Please enter a number from the list or 0 to skip."
            state.messages.append({
                "role": "assistant",
                "content": state.ai_response,
                "timestamp": datetime.utcnow().isoformat(),
            })
            return state
        
        # First time - start PC build and show RAM products
        if not state.pc_builder_data.get("build_id"):
            # Start PC build
            result = await self.ecommerce.start_pc_build(state.user_id, state.session_id)
            if result.get("success"):
                state.pc_builder_data["build_id"] = result.get("build_id")
            else:
                state.ai_response = f"Failed to start PC build: {result.get('message')}"
                state.in_pc_builder_flow = False
                return state
        
        # Get RAM products
        ram_products = await self.ecommerce.get_products(limit=5, category="RAM")
        state.pc_builder_data["ram_products"] = ram_products
        
        if not ram_products:
            state.ai_response = "Sorry, no RAM products available right now."
            state.in_pc_builder_flow = False
            return state
        
        # Format response with numbered options
        response = "🖥️ **PC Builder - Step 1: Select RAM**\n\n"
        response += "Choose a RAM option:\n\n"
        
        for idx, product in enumerate(ram_products, 1):
            response += f"**{idx}. {product['name']}** - ${product['price']}\n"
            if product.get('description'):
                response += f"   {product['description'][:80]}...\n"
            response += "\n"
        
        response += "**0. Skip this step**\n\n"
        response += "Enter the number of your choice (or 0 to skip):"
        
        state.ai_response = response
        state.messages.append({
            "role": "assistant",
            "content": state.ai_response,
            "timestamp": datetime.utcnow().isoformat(),
        })
        return state
    
    async def _pc_builder_ssd_node(self, state: AgentState) -> AgentState:
        """Handle SSD selection step."""
        print("[debug] PC Builder: SSD step")
        
        # Ensure we're marked as in PC builder flow
        state.in_pc_builder_flow = True
        state.pc_builder_step = "ssd"
        
        user_input_lower = state.user_input.lower() if state.user_input else ""
        
        # If we have products shown and user asks a question, handle it
        if state.pc_builder_data.get("ssd_products") and self._is_question_or_conversation(state.user_input):
            return await self._handle_pc_builder_question(state, "ssd", state.pc_builder_data["ssd_products"])
        
        # Check if user is responding with a selection
        if state.pc_builder_data.get("ssd_products") and (user_input_lower.strip().isdigit() or "skip" in user_input_lower):
            if "0" in user_input_lower or "skip" in user_input_lower:
                # User skipped SSD - show CPU immediately
                state.pc_builder_step = "cpu"
                
                # Get CPU products
                cpu_products = await self.ecommerce.get_products(limit=5, category="CPU")
                state.pc_builder_data["cpu_products"] = cpu_products
                
                if not cpu_products:
                    state.ai_response = "⏭️ Skipped SSD selection.\n\nSorry, no CPU products available right now."
                    state.in_pc_builder_flow = False
                else:
                    response = "⏭️ Skipped SSD selection.\n\n"
                    response += "⚙️ **PC Builder - Step 3: Select CPU**\n\n"
                    response += "Choose a CPU option:\n\n"
                    
                    for idx, product in enumerate(cpu_products, 1):
                        response += f"**{idx}. {product['name']}** - ${product['price']}\n"
                        if product.get('description'):
                            response += f"   {product['description'][:80]}...\n"
                        response += "\n"
                    
                    response += "**0. Skip this step**\n\n"
                    response += "Enter the number of your choice (or 0 to skip):"
                    
                    state.ai_response = response
                
                state.messages.append({
                    "role": "assistant",
                    "content": state.ai_response,
                    "timestamp": datetime.utcnow().isoformat(),
                })
                return state
            
            # User selected an SSD product
            import re
            match = re.search(r'(\d+)', user_input_lower)
            if match:
                try:
                    selection = int(match.group(1))
                    ssd_products = state.pc_builder_data.get("ssd_products", [])
                    
                    if 1 <= selection <= len(ssd_products):
                        selected_ssd = ssd_products[selection - 1]
                        
                        # Add component to build
                        build_id = state.pc_builder_data.get("build_id")
                        if build_id:
                            result = await self.ecommerce.add_component_to_build(
                                build_id, "ssd", selected_ssd["_id"]
                            )
                            
                            if result.get("success"):
                                state.pc_builder_step = "cpu"
                                
                                # Get CPU products immediately
                                cpu_products = await self.ecommerce.get_products(limit=5, category="CPU")
                                state.pc_builder_data["cpu_products"] = cpu_products
                                
                                if not cpu_products:
                                    state.ai_response = f"✅ **{selected_ssd['name']}** selected!\n\nSorry, no CPU products available right now."
                                    state.in_pc_builder_flow = False
                                else:
                                    # Format response with CPU options
                                    response = f"✅ **{selected_ssd['name']}** selected!\n\n"
                                    response += "⚙️ **PC Builder - Step 3: Select CPU**\n\n"
                                    response += "Choose a CPU option:\n\n"
                                    
                                    for idx, product in enumerate(cpu_products, 1):
                                        response += f"**{idx}. {product['name']}** - ${product['price']}\n"
                                        if product.get('description'):
                                            response += f"   {product['description'][:80]}...\n"
                                        response += "\n"
                                    
                                    response += "**0. Skip this step**\n\n"
                                    response += "Enter the number of your choice (or 0 to skip):"
                                    
                                    state.ai_response = response
                                
                                state.messages.append({
                                    "role": "assistant",
                                    "content": state.ai_response,
                                    "timestamp": datetime.utcnow().isoformat(),
                                })
                                return state
                except (ValueError, IndexError):
                    pass
            
            state.ai_response = "Invalid selection. Please enter a number from the list or 0 to skip."
            state.messages.append({
                "role": "assistant",
                "content": state.ai_response,
                "timestamp": datetime.utcnow().isoformat(),
            })
            return state
        
        # Get SSD products
        ssd_products = await self.ecommerce.get_products(limit=5, category="SSD")
        state.pc_builder_data["ssd_products"] = ssd_products
        
        if not ssd_products:
            state.ai_response = "Sorry, no SSD products available right now."
            state.pc_builder_step = "cpu"
            return state
        
        # Format response with numbered options
        response = "💾 **PC Builder - Step 2: Select SSD**\n\n"
        response += "Choose an SSD option:\n\n"
        
        for idx, product in enumerate(ssd_products, 1):
            response += f"**{idx}. {product['name']}** - ${product['price']}\n"
            if product.get('description'):
                response += f"   {product['description'][:80]}...\n"
            response += "\n"
        
        response += "**0. Skip this step**\n\n"
        response += "Enter the number of your choice (or 0 to skip):"
        
        state.ai_response = response
        return state
    
    async def _pc_builder_cpu_node(self, state: AgentState) -> AgentState:
        """Handle CPU selection step."""
        print("[debug] PC Builder: CPU step")
        
        # Ensure we're marked as in PC builder flow
        state.in_pc_builder_flow = True
        state.pc_builder_step = "cpu"
        
        user_input_lower = state.user_input.lower() if state.user_input else ""
        
        # If we have products shown and user asks a question, handle it
        if state.pc_builder_data.get("cpu_products") and self._is_question_or_conversation(state.user_input):
            return await self._handle_pc_builder_question(state, "cpu", state.pc_builder_data["cpu_products"])
        
        # Check if user is responding with a selection
        if state.pc_builder_data.get("cpu_products") and (user_input_lower.strip().isdigit() or "skip" in user_input_lower):
            if "0" in user_input_lower or "skip" in user_input_lower:
                # User skipped CPU - move to GPU
                state.pc_builder_step = "gpu"
                
                # Immediately show GPU products
                gpu_products = await self.ecommerce.get_products(limit=5, category="GPU")
                state.pc_builder_data["gpu_products"] = gpu_products
                
                if not gpu_products:
                    state.ai_response = "⏭️ Skipped CPU selection.\n\nSorry, no GPU products available right now."
                    state.pc_builder_step = "psu"
                    return state
                
                # Format GPU response
                response = "⏭️ Skipped CPU selection.\n\n"
                response += "🎮 **PC Builder - Step 4: Select GPU**\n\n"
                response += "Choose a GPU option:\n\n"
                
                for idx, product in enumerate(gpu_products, 1):
                    response += f"**{idx}. {product['name']}** - ${product['price']}\n"
                    if product.get('description'):
                        response += f"   {product['description'][:80]}...\n"
                    response += "\n"
                
                response += "**0. Skip this step**\n\n"
                response += "Enter the number of your choice (or 0 to skip):"
                
                state.ai_response = response
                return state
            
            # User selected a CPU product
            import re
            match = re.search(r'(\d+)', user_input_lower)
            if match:
                try:
                    selection = int(match.group(1))
                    cpu_products = state.pc_builder_data.get("cpu_products", [])
                    
                    if 1 <= selection <= len(cpu_products):
                        selected_cpu = cpu_products[selection - 1]
                        
                        # Add component to build
                        build_id = state.pc_builder_data.get("build_id")
                        if build_id:
                            result = await self.ecommerce.add_component_to_build(
                                build_id, "cpu", selected_cpu["_id"]
                            )
                            
                            if result.get("success"):
                                state.pc_builder_step = "gpu"
                                
                                # Immediately show GPU products
                                gpu_products = await self.ecommerce.get_products(limit=5, category="GPU")
                                state.pc_builder_data["gpu_products"] = gpu_products
                                
                                if not gpu_products:
                                    state.ai_response = f"✅ **{selected_cpu['name']}** selected!\n\nSorry, no GPU products available right now."
                                    state.pc_builder_step = "psu"
                                    return state
                                
                                # Format GPU response
                                response = f"✅ **{selected_cpu['name']}** selected!\n\n"
                                response += "🎮 **PC Builder - Step 4: Select GPU**\n\n"
                                response += "Choose a GPU option:\n\n"
                                
                                for idx, product in enumerate(gpu_products, 1):
                                    response += f"**{idx}. {product['name']}** - ${product['price']}\n"
                                    if product.get('description'):
                                        response += f"   {product['description'][:80]}...\n"
                                    response += "\n"
                                
                                response += "**0. Skip this step**\n\n"
                                response += "Enter the number of your choice (or 0 to skip):"
                                
                                state.ai_response = response
                                return state
                except (ValueError, IndexError):
                    pass
            
            state.ai_response = "Invalid selection. Please enter a number from the list or 0 to skip."
            return state
        
        # Get CPU products
        cpu_products = await self.ecommerce.get_products(limit=5, category="CPU")
        state.pc_builder_data["cpu_products"] = cpu_products
        
        if not cpu_products:
            state.ai_response = "Sorry, no CPU products available right now."
            state.pc_builder_step = "completed"
            return state
        
        # Format response with numbered options
        response = "⚙️ **PC Builder - Step 3: Select CPU**\n\n"
        response += "Choose a CPU option:\n\n"
        
        for idx, product in enumerate(cpu_products, 1):
            response += f"**{idx}. {product['name']}** - ${product['price']}\n"
            if product.get('description'):
                response += f"   {product['description'][:80]}...\n"
            response += "\n"
        
        response += "**0. Skip this step**\n\n"
        response += "Enter the number of your choice (or 0 to skip):"
        
        state.ai_response = response
        return state
    
    async def _pc_builder_gpu_node(self, state: AgentState) -> AgentState:
        """Handle GPU selection step."""
        print("[debug] PC Builder: GPU step")
        
        # Ensure we're marked as in PC builder flow
        state.in_pc_builder_flow = True
        state.pc_builder_step = "gpu"
        
        user_input_lower = state.user_input.lower() if state.user_input else ""
        
        # If we have products shown and user asks a question, handle it
        if state.pc_builder_data.get("gpu_products") and self._is_question_or_conversation(state.user_input):
            return await self._handle_pc_builder_question(state, "gpu", state.pc_builder_data["gpu_products"])
        
        # Always fetch GPU products fresh if not showing them for the first time
        if not state.pc_builder_data.get("gpu_products") and (user_input_lower.strip().isdigit() or "skip" in user_input_lower):
            gpu_products = await self.ecommerce.get_products(limit=5, category="GPU")
            state.pc_builder_data["gpu_products"] = gpu_products
            print(f"[debug] Fetched {len(gpu_products)} GPU products for selection")
        
        # Check if user is responding with a selection
        if state.pc_builder_data.get("gpu_products") and (user_input_lower.strip().isdigit() or "skip" in user_input_lower):
            if "0" in user_input_lower or "skip" in user_input_lower:
                # User skipped GPU - move to PSU
                state.pc_builder_step = "psu"
                
                # Immediately show PSU products
                psu_products = await self.ecommerce.get_products(limit=5, category="PSU")
                state.pc_builder_data["psu_products"] = psu_products
                
                if not psu_products:
                    state.ai_response = "⏭️ Skipped GPU selection.\n\nSorry, no PSU products available right now."
                    state.pc_builder_step = "completed"
                    return state
                
                # Format PSU response
                response = "⏭️ Skipped GPU selection.\n\n"
                response += "⚡ **PC Builder - Step 5: Select PSU**\n\n"
                response += "Choose a PSU option:\n\n"
                
                for idx, product in enumerate(psu_products, 1):
                    response += f"**{idx}. {product['name']}** - ${product['price']}\n"
                    if product.get('description'):
                        response += f"   {product['description'][:80]}...\n"
                    response += "\n"
                
                response += "**0. Skip this step**\n\n"
                response += "Enter the number of your choice (or 0 to skip):"
                
                state.ai_response = response
                return state
            
            # User selected a GPU product
            import re
            match = re.search(r'(\d+)', user_input_lower)
            if match:
                try:
                    selection = int(match.group(1))
                    gpu_products = state.pc_builder_data.get("gpu_products", [])
                    
                    print(f"[debug] GPU selection: {selection}, available products: {len(gpu_products)}")
                    
                    if 1 <= selection <= len(gpu_products):
                        selected_gpu = gpu_products[selection - 1]
                        
                        # Add component to build
                        build_id = state.pc_builder_data.get("build_id")
                        if build_id:
                            result = await self.ecommerce.add_component_to_build(
                                build_id, "gpu", selected_gpu["_id"]
                            )
                            
                            if result.get("success"):
                                state.pc_builder_step = "psu"
                                
                                # Immediately show PSU products
                                psu_products = await self.ecommerce.get_products(limit=5, category="PSU")
                                state.pc_builder_data["psu_products"] = psu_products
                                
                                if not psu_products:
                                    state.ai_response = f"✅ **{selected_gpu['name']}** selected!\n\nSorry, no PSU products available right now."
                                    state.pc_builder_step = "completed"
                                    return state
                                
                                # Format PSU response
                                response = f"✅ **{selected_gpu['name']}** selected!\n\n"
                                response += "⚡ **PC Builder - Step 5: Select PSU**\n\n"
                                response += "Choose a PSU option:\n\n"
                                
                                for idx, product in enumerate(psu_products, 1):
                                    response += f"**{idx}. {product['name']}** - ${product['price']}\n"
                                    if product.get('description'):
                                        response += f"   {product['description'][:80]}...\n"
                                    response += "\n"
                                
                                response += "**0. Skip this step**\n\n"
                                response += "Enter the number of your choice (or 0 to skip):"
                                
                                state.ai_response = response
                                return state
                            else:
                                print(f"[debug] Failed to add GPU: {result.get('message')}")
                                state.ai_response = f"Failed to add GPU: {result.get('message')}"
                                return state
                except (ValueError, IndexError) as e:
                    print(f"[debug] Exception in GPU selection: {e}")
                    import traceback
                    traceback.print_exc()
                    pass
            
            state.ai_response = "Invalid selection. Please enter a number from the list or 0 to skip."
            return state
        
        # Get GPU products
        gpu_products = await self.ecommerce.get_products(limit=5, category="GPU")
        state.pc_builder_data["gpu_products"] = gpu_products
        
        if not gpu_products:
            state.ai_response = "Sorry, no GPU products available right now."
            state.pc_builder_step = "psu"
            return state
        
        # Format response with numbered options
        response = "🎮 **PC Builder - Step 4: Select GPU**\n\n"
        response += "Choose a GPU option:\n\n"
        
        for idx, product in enumerate(gpu_products, 1):
            response += f"**{idx}. {product['name']}** - ${product['price']}\n"
            if product.get('description'):
                response += f"   {product['description'][:80]}...\n"
            response += "\n"
        
        response += "**0. Skip this step**\n\n"
        response += "Enter the number of your choice (or 0 to skip):"
        
        state.ai_response = response
        return state
    
    async def _pc_builder_psu_node(self, state: AgentState) -> AgentState:
        """Handle PSU selection step."""
        print("[debug] PC Builder: PSU step")
        
        # Ensure we're marked as in PC builder flow
        state.in_pc_builder_flow = True
        state.pc_builder_step = "psu"
        
        user_input_lower = state.user_input.lower() if state.user_input else ""
        
        # If we have products shown and user asks a question, handle it
        if state.pc_builder_data.get("psu_products") and self._is_question_or_conversation(state.user_input):
            return await self._handle_pc_builder_question(state, "psu", state.pc_builder_data["psu_products"])
        
        # Always fetch PSU products fresh if not showing them for the first time
        if not state.pc_builder_data.get("psu_products") and (user_input_lower.strip().isdigit() or "skip" in user_input_lower):
            psu_products = await self.ecommerce.get_products(limit=5, category="PSU")
            state.pc_builder_data["psu_products"] = psu_products
            print(f"[debug] Fetched {len(psu_products)} PSU products for selection")
        
        # Check if user is responding with a selection
        if state.pc_builder_data.get("psu_products") and (user_input_lower.strip().isdigit() or "skip" in user_input_lower):
            if "0" in user_input_lower or "skip" in user_input_lower:
                # User skipped PSU - move to next step
                state.pc_builder_step = "motherboard"
                state.ai_response = "⏭️ Skipped PSU selection.\n\nLet's continue to the next component."
                return state
            
            # User selected a PSU product
            import re
            match = re.search(r'(\d+)', user_input_lower)
            if match:
                try:
                    selection = int(match.group(1))
                    psu_products = state.pc_builder_data.get("psu_products", [])
                    
                    if 1 <= selection <= len(psu_products):
                        selected_psu = psu_products[selection - 1]
                        
                        # Add component to build
                        build_id = state.pc_builder_data.get("build_id")
                        if build_id:
                            result = await self.ecommerce.add_component_to_build(
                                build_id, "psu", selected_psu["_id"]
                            )
                            
                            if result.get("success"):
                                state.pc_builder_step = "motherboard"
                                
                                # Immediately show motherboard options
                                motherboard_products = await self.ecommerce.get_products(limit=5, category="Motherboard")
                                state.pc_builder_data["motherboard_products"] = motherboard_products
                                
                                if not motherboard_products:
                                    state.ai_response = f"✅ **{selected_psu['name']}** selected!\n\nSorry, no Motherboard products available. Moving to next step."
                                    state.pc_builder_step = "aircooler"
                                    return state
                                
                                # Format response with next step
                                response = f"✅ **{selected_psu['name']}** selected!\n\n"
                                response += "🔲 **PC Builder - Step 6: Select Motherboard**\n\n"
                                response += "Choose a Motherboard option:\n\n"
                                
                                for idx, product in enumerate(motherboard_products, 1):
                                    response += f"**{idx}. {product['name']}** - ${product['price']}\n"
                                    if product.get('description'):
                                        response += f"   {product['description'][:80]}...\n"
                                    response += "\n"
                                
                                response += "**0. Skip this step**\n\n"
                                response += "Enter the number of your choice (or 0 to skip):"
                                
                                state.ai_response = response
                                return state
                except (ValueError, IndexError):
                    pass
            
            state.ai_response = "Invalid selection. Please enter a number from the list or 0 to skip."
            return state
        
        # Get PSU products
        psu_products = await self.ecommerce.get_products(limit=5, category="PSU")
        state.pc_builder_data["psu_products"] = psu_products
        
        if not psu_products:
            state.ai_response = "Sorry, no PSU products available right now."
            state.pc_builder_step = "completed"
            return state
        
        # Format response with numbered options
        response = "⚡ **PC Builder - Step 5: Select PSU**\n\n"
        response += "Choose a PSU option:\n\n"
        
        for idx, product in enumerate(psu_products, 1):
            response += f"**{idx}. {product['name']}** - ${product['price']}\n"
            if product.get('description'):
                response += f"   {product['description'][:80]}...\n"
            response += "\n"
        
        response += "**0. Skip this step**\n\n"
        response += "Enter the number of your choice (or 0 to skip):"
        
        state.ai_response = response
        return state
    
    async def _pc_builder_motherboard_node(self, state: AgentState) -> AgentState:
        """Handle Motherboard selection step."""
        print("[debug] PC Builder: Motherboard step")
        
        # Ensure we're marked as in PC builder flow
        state.in_pc_builder_flow = True
        state.pc_builder_step = "motherboard"
        
        user_input_lower = state.user_input.lower() if state.user_input else ""
        
        # If we have products shown and user asks a question, handle it
        if state.pc_builder_data.get("motherboard_products") and self._is_question_or_conversation(state.user_input):
            return await self._handle_pc_builder_question(state, "motherboard", state.pc_builder_data["motherboard_products"])
        
        # Always fetch Motherboard products fresh if not showing them for the first time
        if not state.pc_builder_data.get("motherboard_products") and (user_input_lower.strip().isdigit() or "skip" in user_input_lower):
            motherboard_products = await self.ecommerce.get_products(limit=5, category="Motherboard")
            state.pc_builder_data["motherboard_products"] = motherboard_products
            print(f"[debug] Fetched {len(motherboard_products)} Motherboard products for selection")
        
        # Check if user is responding with a selection
        if state.pc_builder_data.get("motherboard_products") and (user_input_lower.strip().isdigit() or "skip" in user_input_lower):
            if "0" in user_input_lower or "skip" in user_input_lower:
                # User skipped Motherboard - move to next step
                state.pc_builder_step = "aircooler"
                state.ai_response = "⏭️ Skipped Motherboard selection.\n\nLet's continue to the next component."
                return state
            
            # User selected a Motherboard product
            import re
            match = re.search(r'(\d+)', user_input_lower)
            if match:
                try:
                    selection = int(match.group(1))
                    motherboard_products = state.pc_builder_data.get("motherboard_products", [])
                    
                    if 1 <= selection <= len(motherboard_products):
                        selected_motherboard = motherboard_products[selection - 1]
                        
                        # Add component to build
                        build_id = state.pc_builder_data.get("build_id")
                        if build_id:
                            result = await self.ecommerce.add_component_to_build(
                                build_id, "motherboard", selected_motherboard["_id"]
                            )
                            
                            if result.get("success"):
                                state.pc_builder_step = "aircooler"
                                
                                # Immediately show aircooler options
                                aircooler_products = await self.ecommerce.get_products(limit=5, category="AirCooler")
                                state.pc_builder_data["aircooler_products"] = aircooler_products
                                
                                if not aircooler_products:
                                    state.ai_response = f"✅ **{selected_motherboard['name']}** selected!\n\nSorry, no Air Cooler products available. Moving to next step."
                                    state.pc_builder_step = "case"
                                    return state
                                
                                # Format response with next step
                                response = f"✅ **{selected_motherboard['name']}** selected!\n\n"
                                response += "❄️ **PC Builder - Step 7: Select Air Cooler**\n\n"
                                response += "Choose an Air Cooler option:\n\n"
                                
                                for idx, product in enumerate(aircooler_products, 1):
                                    response += f"**{idx}. {product['name']}** - ${product['price']}\n"
                                    if product.get('description'):
                                        response += f"   {product['description'][:80]}...\n"
                                    response += "\n"
                                
                                response += "**0. Skip this step**\n\n"
                                response += "Enter the number of your choice (or 0 to skip):"
                                
                                state.ai_response = response
                                return state
                except (ValueError, IndexError):
                    pass
            
            state.ai_response = "Invalid selection. Please enter a number from the list or 0 to skip."
            return state
        
        # Get Motherboard products
        motherboard_products = await self.ecommerce.get_products(limit=5, category="Motherboard")
        state.pc_builder_data["motherboard_products"] = motherboard_products
        
        if not motherboard_products:
            state.ai_response = "Sorry, no Motherboard products available right now."
            state.pc_builder_step = "aircooler"
            return state
        
        # Format response with numbered options
        response = "🔲 **PC Builder - Step 6: Select Motherboard**\n\n"
        response += "Choose a Motherboard option:\n\n"
        
        for idx, product in enumerate(motherboard_products, 1):
            response += f"**{idx}. {product['name']}** - ${product['price']}\n"
            if product.get('description'):
                response += f"   {product['description'][:80]}...\n"
            response += "\n"
        
        response += "**0. Skip this step**\n\n"
        response += "Enter the number of your choice (or 0 to skip):"
        
        state.ai_response = response
        return state
    
    async def _pc_builder_aircooler_node(self, state: AgentState) -> AgentState:
        """Handle Air Cooler selection step."""
        print("[debug] PC Builder: Air Cooler step")
        
        # Ensure we're marked as in PC builder flow
        state.in_pc_builder_flow = True
        state.pc_builder_step = "aircooler"
        
        user_input_lower = state.user_input.lower() if state.user_input else ""
        
        # If we have products shown and user asks a question, handle it
        if state.pc_builder_data.get("aircooler_products") and self._is_question_or_conversation(state.user_input):
            return await self._handle_pc_builder_question(state, "aircooler", state.pc_builder_data["aircooler_products"])
        
        # Always fetch Air Cooler products fresh if not showing them for the first time
        if not state.pc_builder_data.get("aircooler_products") and (user_input_lower.strip().isdigit() or "skip" in user_input_lower):
            aircooler_products = await self.ecommerce.get_products(limit=5, category="AirCooler")
            state.pc_builder_data["aircooler_products"] = aircooler_products
            print(f"[debug] Fetched {len(aircooler_products)} Air Cooler products for selection")
        
        # Check if user is responding with a selection
        if state.pc_builder_data.get("aircooler_products") and (user_input_lower.strip().isdigit() or "skip" in user_input_lower):
            if "0" in user_input_lower or "skip" in user_input_lower:
                # User skipped Air Cooler - move to next step
                state.pc_builder_step = "case"
                state.ai_response = "⏭️ Skipped Air Cooler selection.\n\nLet's continue to the next component."
                return state
            
            # User selected an Air Cooler product
            import re
            match = re.search(r'(\d+)', user_input_lower)
            if match:
                try:
                    selection = int(match.group(1))
                    aircooler_products = state.pc_builder_data.get("aircooler_products", [])
                    
                    if 1 <= selection <= len(aircooler_products):
                        selected_aircooler = aircooler_products[selection - 1]
                        
                        # Add component to build
                        build_id = state.pc_builder_data.get("build_id")
                        if build_id:
                            result = await self.ecommerce.add_component_to_build(
                                build_id, "aircooler", selected_aircooler["_id"]
                            )
                            
                            if result.get("success"):
                                state.pc_builder_step = "case"
                                
                                # Immediately show case options
                                case_products = await self.ecommerce.get_products(limit=5, category="Case")
                                state.pc_builder_data["case_products"] = case_products
                                
                                if not case_products:
                                    state.ai_response = f"✅ **{selected_aircooler['name']}** selected!\n\nSorry, no Case products available. Completing build."
                                    state.pc_builder_step = "completed"
                                    return state
                                
                                # Format response with next step
                                response = f"✅ **{selected_aircooler['name']}** selected!\n\n"
                                response += "📦 **PC Builder - Step 8: Select Case**\n\n"
                                response += "Choose a Case option:\n\n"
                                
                                for idx, product in enumerate(case_products, 1):
                                    response += f"**{idx}. {product['name']}** - ${product['price']}\n"
                                    if product.get('description'):
                                        response += f"   {product['description'][:80]}...\n"
                                    response += "\n"
                                
                                response += "**0. Skip this step**\n\n"
                                response += "Enter the number of your choice (or 0 to skip):"
                                
                                state.ai_response = response
                                return state
                except (ValueError, IndexError):
                    pass
            
            state.ai_response = "Invalid selection. Please enter a number from the list or 0 to skip."
            return state
        
        # Get Air Cooler products
        aircooler_products = await self.ecommerce.get_products(limit=5, category="AirCooler")
        state.pc_builder_data["aircooler_products"] = aircooler_products
        
        if not aircooler_products:
            state.ai_response = "Sorry, no Air Cooler products available right now."
            state.pc_builder_step = "case"
            return state
        
        # Format response with numbered options
        response = "❄️ **PC Builder - Step 7: Select Air Cooler**\n\n"
        response += "Choose an Air Cooler option:\n\n"
        
        for idx, product in enumerate(aircooler_products, 1):
            response += f"**{idx}. {product['name']}** - ${product['price']}\n"
            if product.get('description'):
                response += f"   {product['description'][:80]}...\n"
            response += "\n"
        
        response += "**0. Skip this step**\n\n"
        response += "Enter the number of your choice (or 0 to skip):"
        
        state.ai_response = response
        return state
    
    async def _pc_builder_case_node(self, state: AgentState) -> AgentState:
        """Handle Case selection step."""
        print("[debug] PC Builder: Case step")
        
        # Ensure we're marked as in PC builder flow
        state.in_pc_builder_flow = True
        state.pc_builder_step = "case"
        
        user_input_lower = state.user_input.lower() if state.user_input else ""
        
        # If we have products shown and user asks a question, handle it
        if state.pc_builder_data.get("case_products") and self._is_question_or_conversation(state.user_input):
            return await self._handle_pc_builder_question(state, "case", state.pc_builder_data["case_products"])
        
        # Always fetch Case products fresh if not showing them for the first time
        if not state.pc_builder_data.get("case_products") and (user_input_lower.strip().isdigit() or "skip" in user_input_lower):
            case_products = await self.ecommerce.get_products(limit=5, category="Case")
            state.pc_builder_data["case_products"] = case_products
            print(f"[debug] Fetched {len(case_products)} Case products for selection")
        
        # Check if user is responding with a selection
        if state.pc_builder_data.get("case_products") and (user_input_lower.strip().isdigit() or "skip" in user_input_lower):
            if "0" in user_input_lower or "skip" in user_input_lower:
                # User skipped Case - complete build
                state.pc_builder_step = "completed"
                state.ai_response = "⏭️ Skipped Case selection.\n\nYour PC build is complete. Would you like to add components to your cart?"
                return state
            
            # User selected a Case product
            import re
            match = re.search(r'(\d+)', user_input_lower)
            if match:
                try:
                    selection = int(match.group(1))
                    case_products = state.pc_builder_data.get("case_products", [])
                    
                    if 1 <= selection <= len(case_products):
                        selected_case = case_products[selection - 1]
                        
                        # Add component to build
                        build_id = state.pc_builder_data.get("build_id")
                        if build_id:
                            result = await self.ecommerce.add_component_to_build(
                                build_id, "case", selected_case["_id"]
                            )
                            
                            if result.get("success"):
                                state.pc_builder_step = "completed"
                                
                                # Get build summary
                                build_result = await self.ecommerce.get_pc_build(build_id)
                                if build_result.get("success"):
                                    build = build_result["pcBuild"]
                                    components = build.get("components", {})
                                    total_price = build.get("totalPrice", 0)
                                    
                                    summary = f"✅ **{selected_case['name']}** selected!\n\n"
                                    summary += "🎉 **Your PC Build is Complete!**\n\n"
                                    summary += "**Components:**\n"
                                    if "ram" in components:
                                        summary += f"• RAM: {components['ram']['name']} (${components['ram']['price']})\n\n"
                                    if "ssd" in components:
                                        summary += f"• SSD: {components['ssd']['name']} (${components['ssd']['price']})\n\n"
                                    if "cpu" in components:
                                        summary += f"• CPU: {components['cpu']['name']} (${components['cpu']['price']})\n\n"
                                    if "gpu" in components:
                                        summary += f"• GPU: {components['gpu']['name']} (${components['gpu']['price']})\n\n"
                                    if "psu" in components:
                                        summary += f"• PSU: {components['psu']['name']} (${components['psu']['price']})\n\n"
                                    if "motherboard" in components:
                                        summary += f"• Motherboard: {components['motherboard']['name']} (${components['motherboard']['price']})\n\n"
                                    if "aircooler" in components:
                                        summary += f"• Air Cooler: {components['aircooler']['name']} (${components['aircooler']['price']})\n\n"
                                    if "case" in components:
                                        summary += f"• Case: {components['case']['name']} (${components['case']['price']})\n\n"
                                    summary += f"\n**Total: ${total_price}**\n\n"
                                    summary += "Would you like to add these components to your cart? (yes/no)"
                                    
                                    state.ai_response = summary
                                else:
                                    state.ai_response = f"✅ Build complete! {result.get('message')}"
                                return state
                except (ValueError, IndexError):
                    pass
            
            state.ai_response = "Invalid selection. Please enter a number from the list or 0 to skip."
            return state
        
        # Get Case products
        case_products = await self.ecommerce.get_products(limit=5, category="Case")
        state.pc_builder_data["case_products"] = case_products
        
        if not case_products:
            state.ai_response = "Sorry, no Case products available right now."
            state.pc_builder_step = "completed"
            return state
        
        # Format response with numbered options
        response = "📦 **PC Builder - Step 8: Select Case**\n\n"
        response += "Choose a Case option:\n\n"
        
        for idx, product in enumerate(case_products, 1):
            response += f"**{idx}. {product['name']}** - ${product['price']}\n"
            if product.get('description'):
                response += f"   {product['description'][:80]}...\n"
            response += "\n"
        
        response += "**0. Skip this step**\n\n"
        response += "Enter the number of your choice (or 0 to skip):"
        
        state.ai_response = response
        return state
    
    async def _pc_builder_completed_node(self, state: AgentState) -> AgentState:
        """Handle completion and cart addition."""
        print("[debug] PC Builder: Completed step")
        
        user_input_lower = state.user_input.lower() if state.user_input else ""
        
        # Check if user wants to add to cart
        if "yes" in user_input_lower or "add" in user_input_lower:
            build_id = state.pc_builder_data.get("build_id")
            if build_id:
                result = await self.ecommerce.save_build_to_cart(build_id)
                if result.get("success"):
                    state.ai_response = f"✅ {result.get('message')}\n\nAll components have been added to your cart!"
                else:
                    state.ai_response = f"Failed to add to cart: {result.get('message')}"
            else:
                state.ai_response = "Build not found."
        else:
            state.ai_response = "PC build saved. You can start a new build anytime!"
        
        # Exit PC builder flow
        state.in_pc_builder_flow = False
        state.pc_builder_step = "none"
        state.pc_builder_data = {}
        print("[debug] PC Builder completed, exiting flow")
        return state

    def _build_graph(self) -> StateGraph:
        """Build the LangGraph workflow with dual paths: deterministic checkout flow + general LLM flow."""
        workflow = StateGraph(AgentState)

        # Add common nodes
        workflow.add_node("load_memory", self._load_memory)
        workflow.add_node("process_input", self._process_input)
        workflow.add_node("agent_llm", self._agent_llm)
        workflow.add_node("tools", self._tools_node)  # Custom tools node wrapper
        workflow.add_node("check_hitl", self._check_hitl_needed)
        workflow.add_node("await_approval", self._await_approval)
        workflow.add_node("save_memory", self._save_memory)
        
        # Add PC Builder flow nodes
        workflow.add_node("pc_builder_ram", self._pc_builder_ram_node)
        workflow.add_node("pc_builder_ssd", self._pc_builder_ssd_node)
        workflow.add_node("pc_builder_cpu", self._pc_builder_cpu_node)
        workflow.add_node("pc_builder_gpu", self._pc_builder_gpu_node)
        workflow.add_node("pc_builder_psu", self._pc_builder_psu_node)
        workflow.add_node("pc_builder_motherboard", self._pc_builder_motherboard_node)
        workflow.add_node("pc_builder_aircooler", self._pc_builder_aircooler_node)
        workflow.add_node("pc_builder_case", self._pc_builder_case_node)
        workflow.add_node("pc_builder_completed", self._pc_builder_completed_node)
        
        # Add checkout-specific nodes for deterministic flow
        workflow.add_node("checkout_shipping", self._checkout_shipping_node)
        workflow.add_node("checkout_coupon", self._checkout_coupon_node)
        workflow.add_node("checkout_review", self._checkout_review_node)
        workflow.add_node("checkout_order", self._checkout_order_node)
        workflow.add_node("checkout_completed", self._checkout_completed_node)

        # Linear edges
        workflow.add_edge("load_memory", "process_input")
        
        # Conditional edges from process_input - determine flow path
        workflow.add_conditional_edges(
            "process_input",
            self._determine_flow_route,
            {
                "general": "agent_llm",
                "pc_builder_ram": "pc_builder_ram",
                "pc_builder_ssd": "pc_builder_ssd",
                "pc_builder_cpu": "pc_builder_cpu",
                "pc_builder_gpu": "pc_builder_gpu",
                "pc_builder_psu": "pc_builder_psu",
                "pc_builder_motherboard": "pc_builder_motherboard",
                "pc_builder_aircooler": "pc_builder_aircooler",
                "pc_builder_case": "pc_builder_case",
                "pc_builder_completed": "pc_builder_completed",
                "checkout_shipping": "checkout_shipping",
                "checkout_coupon": "checkout_coupon",
                "checkout_review": "checkout_review",
                "checkout_order": "checkout_order",
                "checkout_completed": "checkout_completed",
            },
        )

        # Conditional edges from LLM node (for general flow):
        # - If it produced tool_calls, go to tools
        # - Otherwise, continue to HITL check
        def route_from_llm(state: AgentState) -> str:
            if not state.lc_messages:
                return "no_tools"
            last = state.lc_messages[-1]
            if isinstance(last, AIMessage) and getattr(last, "tool_calls", None):
                return "tools"
            return "no_tools"

        workflow.add_conditional_edges(
            "agent_llm",
            route_from_llm,
            {
                "tools": "tools",
                "no_tools": "check_hitl",
            },
        )

        # After tools execute, go back to LLM to summarize
        workflow.add_edge("tools", "agent_llm")
        
        # Checkout nodes: Only save (steps progress on next user message)
        # This keeps the flow simple and predictable
        workflow.add_edge("checkout_shipping", "save_memory")
        workflow.add_edge("checkout_coupon", "save_memory")
        workflow.add_edge("checkout_review", "save_memory")
        workflow.add_edge("checkout_order", "save_memory")
        workflow.add_edge("checkout_completed", "save_memory")

        # HITL and saving
        workflow.add_conditional_edges(
            "check_hitl",
            self._should_await_approval,
            {
                "needs_approval": "await_approval",
                "proceed": "save_memory",
            },
        )

        workflow.add_edge("await_approval", "save_memory")
        workflow.add_edge("save_memory", END)
        
        # PC Builder flow edges
        workflow.add_edge("pc_builder_ram", "save_memory")
        workflow.add_edge("pc_builder_ssd", "save_memory")
        workflow.add_edge("pc_builder_cpu", "save_memory")
        workflow.add_edge("pc_builder_gpu", "save_memory")
        workflow.add_edge("pc_builder_psu", "save_memory")
        workflow.add_edge("pc_builder_motherboard", "save_memory")
        workflow.add_edge("pc_builder_aircooler", "save_memory")
        workflow.add_edge("pc_builder_case", "save_memory")
        workflow.add_edge("pc_builder_completed", "save_memory")

        # Set entry point
        workflow.set_entry_point("load_memory")

        # Compile with increased recursion limit to handle multi-step checkout
        compiled = workflow.compile()
        return compiled

    async def _load_memory(self, state: AgentState) -> AgentState:
        """Load conversation history from MongoDB - ultra-minimal for speed"""
        # Load recent messages to preserve multi-step checkout flow context
        messages = await self.memory_store.load_conversation(state.session_id, limit=6)
        state.messages = messages
        
        # Check for user_id in metadata first (faster), then fallback to scanning messages
        doc = self.memory_store.conversations.find_one({"session_id": state.session_id})
        print(f"[debug] MongoDB doc found: {doc is not None}")
        if doc and doc.get("metadata"):
            metadata = doc["metadata"]
            print(f"[debug] Metadata keys: {list(metadata.keys())}")
            print(f"[debug] Metadata in_checkout_flow: {metadata.get('in_checkout_flow')}")
            print(f"[debug] Metadata checkout_step: {metadata.get('checkout_step')}")
            
            if metadata.get("user_id"):
                state.user_id = metadata["user_id"]
                print(f"[debug] Loaded user_id from metadata: {state.user_id}")
            
            # Restore checkout flow state (always restore, even if False)
            if "in_checkout_flow" in metadata:
                state.in_checkout_flow = metadata.get("in_checkout_flow", False)
                state.checkout_step = metadata.get("checkout_step", "none")
                state.checkout_data = metadata.get("checkout_data", {})
                print(f"[debug] Restored checkout flow: step={state.checkout_step}, in_flow={state.in_checkout_flow}")
                print(f"[debug] Restored checkout_data keys: {list(state.checkout_data.keys())}")
            else:
                print(f"[debug] No checkout flow state found in metadata")
            
            # Restore PC builder flow state (always restore, even if False)
            if "in_pc_builder_flow" in metadata:
                state.in_pc_builder_flow = metadata.get("in_pc_builder_flow", False)
                state.pc_builder_step = metadata.get("pc_builder_step", "none")
                state.pc_builder_data = metadata.get("pc_builder_data", {})
                print(f"[debug] Restored PC builder flow: step={state.pc_builder_step}, in_flow={state.in_pc_builder_flow}")
                print(f"[debug] Restored pc_builder_data keys: {list(state.pc_builder_data.keys())}")
            else:
                print(f"[debug] No PC builder flow state found in metadata")
        else:
            print(f"[debug] No metadata found in doc")
            # Fallback: scan messages (only if not in metadata)
            for msg in reversed(messages):  # Check most recent first
                if msg.get("role") == "system" and msg.get("user_id"):
                    state.user_id = msg["user_id"]
                    print(f"[debug] Loaded user_id from message history: {state.user_id}")
                    break
        
        return state

    async def _process_input(self, state: AgentState) -> AgentState:
        """Process user input and add to text conversation history (for Mongo)."""
        if state.user_input:
            user_msg = {
                "role": "user",
                "content": state.user_input,
                "timestamp": datetime.utcnow().isoformat(),
            }
            state.messages.append(user_msg)
        return state

    async def _agent_llm(self, state: AgentState) -> AgentState:
        """Single ReAct LLM step: decide whether to call tools or answer directly."""
        
        # ULTRA-FAST: Handle simple queries without LLM
        user_input_lower = state.user_input.lower() if state.user_input else ""
        user_input_trimmed = state.user_input.strip() if state.user_input else ""
        
        # Simple greeting responses (no LLM needed)
        if user_input_lower in ["hi", "hello", "hey", "help", "thanks", "ok"]:
            responses = {
                "hi": "Hello! I can help you shop. What are you looking for?",
                "hello": "Hi there! How can I help you today?",
                "hey": "Hey! What can I help you find?",
                "help": "I can help you search products, manage your cart, and checkout. What do you need?",
                "thanks": "You're welcome! Anything else I can help with?",
                "ok": "Great! What would you like to do next?"
            }
            state.ai_response = responses.get(user_input_lower, "Hi! How can I help you?")
            state.messages.append({
                "role": "assistant",
                "content": state.ai_response,
                "timestamp": datetime.utcnow().isoformat(),
            })
            return state
        
        # ULTRA-FAST: Detect tracking/order numbers and directly call track_order_tool
        # Patterns: "TH-XXXXX" (tracking number), pure numbers (order numbers), or alphanumeric codes
        # Match: TH- followed by alphanumeric (e.g., TH-BDB44FF9), pure numbers (3+ digits), or alphanumeric codes
        user_input_upper = user_input_trimmed.upper()
        tracking_pattern = re.match(r'^TH-[A-Z0-9]{4,20}$', user_input_upper)  # TH-XXXXXXXX format
        order_number_pattern = re.match(r'^\d{3,20}$', user_input_trimmed)  # Pure numeric order numbers
        alphanumeric_code = re.match(r'^[A-Z0-9\-]{4,20}$', user_input_upper)  # Generic alphanumeric codes
        
        # If input looks like a tracking/order number (not a sentence/question), directly call tool
        is_likely_tracking_code = (tracking_pattern or order_number_pattern or 
                                   (alphanumeric_code and len(user_input_trimmed.split()) == 1 and 
                                    not any(word in user_input_lower for word in ['what', 'where', 'when', 'how', 'show', 'track'])))
        
        if is_likely_tracking_code:
            print(f"[debug] Detected tracking/order number pattern, directly calling track_order_tool: {user_input_trimmed}")
            try:
                # Directly call the tracking tool (LangChain tools are callable directly)
                result = await track_order_tool.ainvoke({
                    "order_number": user_input_trimmed,
                    "user_id": state.user_id if state.user_id else ""
                })
                
                if result.get("success") and result.get("message"):
                    state.ai_response = result["message"]
                elif result.get("success") and result.get("order"):
                    # Format order info if message not provided
                    order = result["order"]
                    state.ai_response = result.get("message", f"Order #{order.get('orderNumber', 'N/A')} - {order.get('status', 'Unknown')}")
                else:
                    state.ai_response = result.get("message", "Order not found. Please check the order number or tracking number and try again.")
                
                state.messages.append({
                    "role": "assistant",
                    "content": state.ai_response,
                    "timestamp": datetime.utcnow().isoformat(),
                })
                return state
            except Exception as e:
                print(f"[ERROR] Error in direct track_order_tool call: {e}")
                import traceback
                traceback.print_exc()
                # Fall through to LLM if direct call fails
        
        # First pass: build LangChain message history
        if not state.lc_messages:
            system_prompt = (
                "You are an agentic e-commerce assistant. Always pick the tool that matches the user's intent.\n\n"
                "CART INTENTS:\n"
                "- 'what's in my cart' / 'show cart' / 'cart summary' → use get_cart_summary_tool\n"
                "- 'empty/clear/flush cart' → use empty_cart_tool (do NOT summarize first)\n\n"
                "CHECKOUT FLOW (multi-step process):\n"
                "1. 'proceed to checkout' / 'checkout' → use proceed_to_checkout_tool (shows shipping addresses)\n"
                "2. 'confirm address [number]' / user confirms shipping → use confirm_shipping_and_ask_coupon_tool\n"
                "3. 'continue to final review' / 'no coupon' → use continue_to_final_review_tool\n"
                "4. 'apply coupon [code]' then 'continue to final review' → use continue_to_final_review_tool with coupon_code\n"
                "5. 'confirm and place order' / 'place order' → use confirm_and_place_order_tool (STOP after this)\n\n"
                "PRODUCT INTENTS:\n"
                "- 'search/find/browse products' → use search_products_tool (or other product tools)\n\n"
                "ORDER TRACKING INTENTS:\n"
                "- 'track order [number]' / 'where is order [number]' / 'order status [number]' / 'track [number]' → use track_order_tool (accepts order number or tracking number)\n"
                "- 'show my orders' / 'my orders' / 'order history' → use get_orders_tool\n"
                "- 'order details [id]' → use get_order_details_tool (requires MongoDB ObjectId)\n\n"
                "IMPORTANT: When a tool returns a response, ALWAYS relay the tool's message field EXACTLY as provided. "
                "Do NOT summarize, rephrase, or add your own interpretation. Just pass through the tool's message.\n\n"
                "NEVER guess cart contents or order status without a tool call. If unsure, ask a brief clarifying question, then call the correct tool.\n"
                f"User ID: {state.user_id}"
            )
            msgs: List[Any] = [SystemMessage(content=system_prompt)]

            # Disabled conversation summary for maximum speed - minimal context only
            # if len(state.messages) > 5:  # Only create summary for longer conversations
            #     try:
            #         summary = await self.memory_store.summarize_old_messages(state.messages, self.llm)
            #         if summary:
            #             msgs.append(SystemMessage(content=summary))
            #             print(f"[debug] Added conversation summary to reduce context size")
            #     except Exception as e:
            #         print(f"[debug] Error creating summary: {e}")

            # Send only the most recent message for maximum speed
            if state.messages:
                last_msg = state.messages[-1]
                role = last_msg.get("role")
                if role == "user":
                    msgs.append(HumanMessage(content=last_msg["content"]))
                elif role == "assistant":
                    msgs.append(AIMessage(content=last_msg["content"]))

            # Current user input
            if state.user_input:
                msgs.append(HumanMessage(content=state.user_input))

            state.lc_messages = msgs

        # Check cache for simple queries (no tool calls needed)
        if state.user_input and not any(keyword in state.user_input.lower() for keyword in [
            'cart', 'order', 'buy', 'purchase', 'add', 'remove', 'update', 'apply', 'coupon'
        ]):
            # Create context summary for cache key
            context_summary = ""
            if len(state.messages) > 0:
                recent_context = " ".join([msg.get("content", "")[:50] for msg in state.messages[-3:]])
                context_summary = recent_context[:200]
            
            cached_response = self.response_cache.get(state.user_input, context_summary)
            if cached_response:
                print(f"[debug] Using cached response, skipping LLM call")
                state.ai_response = cached_response
                state.messages.append({
                    "role": "assistant",
                    "content": cached_response,
                    "timestamp": datetime.utcnow().isoformat(),
                })
                return state

        # Call LLM with bound tools (with timeout)
        print(f"[debug] Calling LLM with {len(state.lc_messages)} messages...")
        try:
            # Add timeout to individual LLM call
            response = await asyncio.wait_for(
                self.llm_with_tools.ainvoke(state.lc_messages),
                timeout=60.0  # 60 second timeout for LLM call (increased for better thinking time)
            )
            print(f"[debug] LLM response received")
            state.lc_messages.append(response)

            # If the LLM decided to answer directly (no tool calls), finalize response
            tool_calls = getattr(response, "tool_calls", None)
            if not tool_calls:
                print(f"[debug] LLM responded directly (no tool calls)")
                state.ai_response = response.content
                print(f"[debug] LLM ai_response: {state.ai_response[:200] if state.ai_response else 'None'}")

                # Only override if user is asking about cart status AND LLM wrongly says empty
                # Do NOT override during checkout flow (when user says "checkout" or "proceed")
                user_asking_about_cart = state.user_input and any(phrase in state.user_input.lower() for phrase in [
                    "what's in my cart", "show cart", "cart summary", "view cart", "my cart", "cart contents", "show my cart"
                ])
                is_checkout_request = state.user_input and any(phrase in state.user_input.lower() for phrase in [
                    "checkout", "proceed", "place order", "confirm", "buy"
                ])
                has_recent_cart_tool = state.context.get("last_cart_tool")
                llm_claims_empty = state.ai_response and "cart is empty" in state.ai_response.lower()
                
                print(f"[debug] user_asking_about_cart: {user_asking_about_cart}, is_checkout_request: {is_checkout_request}")
                print(f"[debug] has_recent_cart_tool: {bool(has_recent_cart_tool)}, llm_claims_empty: {llm_claims_empty}")
                
                # Only override for cart status queries, NOT for checkout flow
                if user_asking_about_cart and not is_checkout_request and has_recent_cart_tool and llm_claims_empty:
                    print("[debug] Overriding empty-cart hallucination with last cart tool output")
                    print(f"[debug] Cart tool output: {state.context['last_cart_tool'][:200]}")
                    state.ai_response = state.context["last_cart_tool"]
                
                # Cache the response if it's a general query (no personalized data)
                if state.user_input and not state.user_id and not any(keyword in state.user_input.lower() for keyword in [
                    'cart', 'order', 'my', 'i have', 'purchase history'
                ]):
                    context_summary = ""
                    if len(state.messages) > 0:
                        recent_context = " ".join([msg.get("content", "")[:50] for msg in state.messages[-3:]])
                        context_summary = recent_context[:200]
                    self.response_cache.set(state.user_input, response.content, context_summary)
                
                state.messages.append(
                    {
                        "role": "assistant",
                        "content": state.ai_response,
                        "timestamp": datetime.utcnow().isoformat(),
                    }
                )
                return state
            else:
                print(f"[debug] LLM requested {len(tool_calls)} tool calls")

            # Otherwise, ToolNode will execute the tools next and append ToolMessages;
            # we'll come back here on the next iteration to let the LLM summarize.
            return state
        except asyncio.TimeoutError:
            print(f"[ERROR] LLM call timed out after 25 seconds")
            state.ai_response = "Sorry, I'm taking too long to respond. Please try a simpler question."
            state.messages.append({
                "role": "assistant",
                "content": state.ai_response,
                "timestamp": datetime.utcnow().isoformat(),
            })
            return state
        except Exception as e:
            print(f"[ERROR] Error in _agent_llm: {e}")
            import traceback
            traceback.print_exc()
            state.ai_response = f"I encountered an error: {str(e)}. Please try again."
            return state

    async def _tools_node(self, state: AgentState) -> AgentState:
        """Wrapper around ToolNode to execute tools based on the last AIMessage.tool_calls."""
        # ToolNode expects either a list of messages or {"messages": [...]}
        if not state.lc_messages:
            # Nothing to do
            return state

        try:
            print(f"[debug] Executing tools...")
            # Call underlying ToolNode; it will run all requested tools
            result = await self.tool_node.ainvoke({"messages": state.lc_messages})
            print(f"[debug] Tools execution completed")

            # ToolNode may return a list of ToolMessages or {"messages": [...]}
            if isinstance(result, list):
                for msg in result:
                    state.lc_messages.append(msg)
                    content = getattr(msg, "content", "") or ""
                    if "cart" in content.lower() and "item" in content.lower():
                        state.context["last_cart_tool"] = content
                        print(f"[debug] Captured cart tool output: {content[:200]}")
                print(f"[debug] Added {len(result)} tool messages")
            elif isinstance(result, dict) and "messages" in result:
                for msg in result["messages"]:
                    state.lc_messages.append(msg)
                    content = getattr(msg, "content", "") or ""
                    if "cart" in content.lower() and "item" in content.lower():
                        state.context["last_cart_tool"] = content
                        print(f"[debug] Captured cart tool output: {content[:200]}")
                print(f"[debug] Added {len(result['messages'])} tool messages from dict")
                
                # SMART TRIMMING: Preserve message pairs (AIMessage with tool_calls + ToolMessage)
                if len(state.lc_messages) > 8:  # Trim if too many messages
                    print(f"[debug] Smart trimming: {len(state.lc_messages)} → preserving tool pairs")
                    
                    # Keep system message
                    trimmed = [state.lc_messages[0]]
                    
                    # Keep last 6 messages, but ensure tool_call -> tool pairs are intact
                    recent_msgs = state.lc_messages[-6:]
                    
                    # If first message in recent is a ToolMessage, we need its preceding AIMessage
                    from langchain_core.messages import ToolMessage, AIMessage
                    if recent_msgs and isinstance(recent_msgs[0], ToolMessage):
                        # Find the AIMessage with tool_calls that precedes this ToolMessage
                        for i in range(len(state.lc_messages) - 6 - 1, -1, -1):
                            msg = state.lc_messages[i]
                            if isinstance(msg, AIMessage) and hasattr(msg, 'tool_calls') and msg.tool_calls:
                                # Found the AIMessage, include it
                                trimmed.append(msg)
                                break
                    
                    trimmed.extend(recent_msgs)
                    state.lc_messages = trimmed
                    print(f"[debug] Trimmed to {len(state.lc_messages)} messages with valid tool pairs")
            else:
                print(f"[debug] Unexpected tool result type: {type(result)}")
        except Exception as e:
            print(f"[ERROR] Error in tools_node: {e}")
            import traceback
            traceback.print_exc()
            # Continue with error message to prevent hanging
            from langchain_core.messages import ToolMessage
            error_msg = ToolMessage(
                content=f"Error executing tool: {str(e)}",
                tool_call_id="error"
            )
            state.lc_messages.append(error_msg)

        return state

    async def _check_hitl_needed(self, state: AgentState) -> AgentState:
        """Check if human-in-the-loop is needed - enhanced for checkout workflow"""
        
        # Check if any tool results indicate need for approval
        for msg in state.lc_messages:
            if hasattr(msg, 'tool_calls') and msg.tool_calls:
                continue  # Skip tool call messages
            
            # Check if this is a tool result that needs approval
            if hasattr(msg, 'content') and isinstance(msg.content, str):
                try:
                    # Try to parse as tool result
                    if '"needs_approval": true' in msg.content.lower() or '"needs_approval":true' in msg.content.lower():
                        state.needs_human_approval = True
                        
                        # Extract approval type if available
                        approval_type = "general"
                        if '"approval_type"' in msg.content:
                            import re
                            match = re.search(r'"approval_type":\s*"([^"]+)"', msg.content)
                            if match:
                                approval_type = match.group(1)
                        
                        self.hitl_manager.request_approval(
                            state.session_id,
                            approval_type,
                            {"response": msg.content, "approval_type": approval_type}
                        )
                        print(f"[debug] HITL approval requested for: {approval_type}")
                        break
                except:
                    pass
        
        # Fallback: check AI response for sensitive keywords
        if not state.needs_human_approval and state.ai_response:
            sensitive_keywords = ["delete", "remove all", "empty cart", "place order", "confirm order"]
            if any(keyword in state.ai_response.lower() for keyword in sensitive_keywords):
                state.needs_human_approval = True
                self.hitl_manager.request_approval(
                    state.session_id,
                    "ai_response",
                    {"response": state.ai_response}
                )

        return state

    def _should_await_approval(self, state: AgentState) -> str:
        """Determine if we should await approval"""
        return "needs_approval" if state.needs_human_approval else "proceed"

    async def _await_approval(self, state: AgentState) -> AgentState:
        """Handle human approval process"""
        # In a real implementation, this would wait for human input
        # For now, we'll mark it as pending
        state.context["awaiting_approval"] = True
        return state

    async def _save_memory(self, state: AgentState) -> AgentState:
        """Save conversation to MongoDB - store user_id and checkout state in metadata for faster retrieval"""
        metadata = {
            "last_ai_response": state.ai_response[:100] if state.ai_response else "",  # Store only preview
        }
        # Store user_id in metadata for faster retrieval
        if state.user_id:
            metadata["user_id"] = state.user_id
        
        # ALWAYS store checkout flow state in metadata for persistence (even if False/none)
        metadata["in_checkout_flow"] = state.in_checkout_flow
        metadata["checkout_step"] = state.checkout_step
        metadata["checkout_data"] = state.checkout_data if state.checkout_data else {}
        
        # Store PC builder flow state in metadata for persistence
        metadata["in_pc_builder_flow"] = state.in_pc_builder_flow
        metadata["pc_builder_step"] = state.pc_builder_step
        metadata["pc_builder_data"] = state.pc_builder_data if state.pc_builder_data else {}
        
        print(f"[debug] Saving checkout state: in_flow={state.in_checkout_flow}, step={state.checkout_step}")
        print(f"[debug] Saving PC builder state: in_flow={state.in_pc_builder_flow}, step={state.pc_builder_step}")
        
        await self.memory_store.save_conversation(
            state.session_id,
            state.messages,
            metadata
        )
        return state

    async def chat(self, message: str, session_id: str = "default", user_id: str = "") -> Dict:
        """Main chat interface"""
        initial_state = AgentState(
            user_input=message,
            session_id=session_id,
            user_id=user_id
        )

        # Run the graph
        final_state = await self.graph.ainvoke(initial_state)

        return {
            "response": final_state["ai_response"],
            "session_id": session_id,
            "needs_approval": final_state["needs_human_approval"],
            "context": final_state.get("context", {})
        }

    async def stream_chat(self, message: str, session_id: str = "default", user_id: str = ""):
        """Stream chat responses for better user experience"""
        try:
            # Send initial status
            yield {
                "type": "status",
                "content": "Processing your message...",
                "session_id": session_id,
                "needs_approval": False,
                "context": {}
            }
            
            initial_state = AgentState(
                user_input=message,
                session_id=session_id,
                user_id=user_id
            )

            # Load conversation history first
            yield {
                "type": "status", 
                "content": "Loading conversation history...",
                "session_id": session_id,
                "needs_approval": False,
                "context": {}
            }
            
            # Use the full graph to process the request
            # This ensures proper context and configuration
            yield {
                "type": "status",
                "content": "Processing...",
                "session_id": session_id,
                "needs_approval": False,
                "context": {}
            }
            
            print(f"[debug] About to invoke graph for streaming with message: {message}")
            
            # Add timeout protection to prevent hanging
            import asyncio
            try:
                # Increased timeout and recursion limit for multi-step checkout
                result = await asyncio.wait_for(
                    self.graph.ainvoke(initial_state, config={"recursion_limit": 50}),
                    timeout=120.0
                )
            except asyncio.TimeoutError:
                print("[ERROR] Graph execution timed out after 120 seconds")
                yield {
                    "type": "error",
                    "content": "Request is taking longer than expected. Please try again.",
                    "session_id": session_id,
                    "needs_approval": False,
                    "context": {}
                }
                return
            print(f"[debug] Graph result type: {type(result)}")
            print(f"[debug] Graph result keys: {result.keys() if isinstance(result, dict) else 'Not a dict'}")
            
            # Extract the AI response, handling different possible keys
            ai_response = ""
            if isinstance(result, dict):
                print(f"[debug] Looking for ai_response in result...")
                ai_response = result.get("ai_response", "")
                print(f"[debug] ai_response found: {ai_response[:100]}..." if ai_response else "[debug] ai_response is empty")
                
                if not ai_response:
                    # Try other possible keys
                    print(f"[debug] ai_response empty, trying other keys...")
                    ai_response = result.get("response", "")
                    if not ai_response:
                        # Check if there are messages
                        messages = result.get("messages", [])
                        if messages and len(messages) > 0:
                            last_msg = messages[-1]
                            if isinstance(last_msg, dict) and last_msg.get("role") == "assistant":
                                ai_response = last_msg.get("content", "")
                            else:
                                ai_response = str(last_msg)
                        else:
                            ai_response = "I found your request but couldn't generate a proper response. Let me try to help you with MacBook information."
            else:
                print(f"[debug] Result is not a dict: {result}")
                ai_response = "I apologize, but I couldn't process your request properly."
            
            print(f"[debug] Final ai_response: {ai_response[:100]}..." if ai_response else "[debug] Final ai_response is empty")
            
            if not ai_response or ai_response.strip() == "":
                ai_response = "I found some MacBook products but encountered an issue generating the response. We have MacBook Pro models available. Would you like me to search again or provide specific details?"
            
            # Stream the response word by word
            words = ai_response.split()
            if not words:  # Safety check
                words = ["I", "apologize", "for", "the", "technical", "issue.", "Please", "try", "again."]
                ai_response = " ".join(words)
            
            streamed_content = ""
            
            yield {
                "type": "status",
                "content": "Generating response...",
                "session_id": session_id,
                "needs_approval": False,
                "context": {}
            }
            
            print(f"[debug] Starting to stream {len(words)} words")
            
            for i, word in enumerate(words):
                streamed_content += word + " "
                
                yield {
                    "type": "content",
                    "content": streamed_content.strip(),
                    "session_id": session_id,
                    "needs_approval": result.get("needs_human_approval", False) if isinstance(result, dict) else False,
                    "context": result.get("context", {}) if isinstance(result, dict) else {},
                    "is_partial": i < len(words) - 1
                }
                
                # Add small delay for streaming effect
                await asyncio.sleep(0.03)
            
            # Send final complete response
            yield {
                "type": "complete",
                "content": ai_response,
                "session_id": session_id,
                "needs_approval": result.get("needs_human_approval", False) if isinstance(result, dict) else False,
                "context": result.get("context", {}) if isinstance(result, dict) else {}
            }
            
        except Exception as e:
            print(f"Error in stream_chat: {e}")
            import traceback
            traceback.print_exc()
            yield {
                "type": "error",
                "content": f"I encountered an error: {str(e)}. Please try again.",
                "session_id": session_id,
                "needs_approval": False,
                "context": {}
            }

    async def get_conversation_history(self, session_id: str) -> List[Dict]:
        """Get conversation history for a session"""
        return await self.memory_store.load_conversation(session_id)

    async def clear_conversation(self, session_id: str):
        """Clear conversation history for a session"""
        await self.memory_store.clear_session(session_id)

    def get_pending_approvals(self) -> Dict:
        """Get pending human approvals"""
        return self.hitl_manager.get_pending_approvals()

    def provide_approval(self, session_id: str, approved: bool, feedback: str = "") -> Dict:
        """Provide human approval/rejection"""
        return self.hitl_manager.provide_feedback(session_id, approved, feedback)

    # =============== E-COMMERCE FUNCTIONS ===============
    
    async def search_products(self, query: str, limit: int = 10) -> List[Dict]:
        """Search for products"""
        if self.ecommerce is None:
            print("E-commerce service not available (MongoDB not installed)")
            return []
        try:
            return await self.ecommerce.search_products(query, limit)
        except Exception as e:
            print(f"Error searching products: {e}")
            return []
    
    async def get_products(self, limit: int = 20) -> List[Dict]:
        """Get all products"""
        if self.ecommerce is None:
            print("E-commerce service not available (MongoDB not installed)")
            return []
        try:
            return await self.ecommerce.get_products(limit)
        except Exception as e:
            print(f"Error getting products: {e}")
            return []
    
    async def get_product_details(self, product_id: str) -> Optional[Dict]:
        """Get details of a specific product"""
        try:
            return await self.ecommerce.get_product_by_id(product_id)
        except Exception as e:
            print(f"Error getting product details: {e}")
            return None
    
    async def add_to_cart(self, user_id: str, product_id: str, quantity: int = 1) -> Dict:
        """Add item to user's cart"""
        try:
            return await self.ecommerce.add_to_cart(user_id, product_id, quantity)
        except Exception as e:
            print(f"Error adding to cart: {e}")
            return {"success": False, "message": "Failed to add item to cart"}
    
    async def get_cart_items(self, user_id: str) -> List[Dict]:
        """Get user's cart items"""
        try:
            return await self.ecommerce.get_cart_items(user_id)
        except Exception as e:
            print(f"Error getting cart items: {e}")
            return []
    
    async def get_cart_summary(self, user_id: str) -> Dict:
        """Get cart summary with totals"""
        try:
            return await self.ecommerce.get_cart_summary(user_id)
        except Exception as e:
            print(f"Error getting cart summary: {e}")
            return {"total_items": 0, "total_price": 0, "items": []}
    
    async def remove_from_cart(self, cart_item_id: str) -> Dict:
        """Remove item from cart"""
        try:
            return await self.ecommerce.remove_from_cart(cart_item_id)
        except Exception as e:
            print(f"Error removing from cart: {e}")
            return {"success": False, "message": "Failed to remove item from cart"}
    
    async def update_cart_quantity(self, cart_item_id: str, quantity: int) -> Dict:
        """Update quantity of cart item"""
        try:
            return await self.ecommerce.update_cart_quantity(cart_item_id, quantity)
        except Exception as e:
            print(f"Error updating cart quantity: {e}")
            return {"success": False, "message": "Failed to update quantity"}
    
    async def get_popular_products(self, limit: int = 5) -> List[Dict]:
        """Get popular products"""
        try:
            return await self.ecommerce.get_popular_products(limit)
        except Exception as e:
            print(f"Error getting popular products: {e}")
            return []

# Initialize the agent
config = AgentConfig()
agent = AgenticAI(config)