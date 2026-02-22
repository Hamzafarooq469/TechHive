
"""
E-commerce Service for AI Agent Integration
Provides Python interface to interact with Node.js/MongoDB e-commerce functionality
"""

import asyncio
import json
import uuid
from typing import Dict, List, Optional, Any
from datetime import datetime
from pymongo import MongoClient
from bson import ObjectId
from bson.errors import InvalidId


class EcommerceService:
    """Service to handle e-commerce operations for AI agent"""
    
    def __init__(self, mongo_uri: str, db_name: str = "TechHive"):
        """Initialize connection to main e-commerce database"""
        self.client = MongoClient(mongo_uri)
        self.db = self.client[db_name]
        
        # Collections
        self.users = self.db.users
        self.products = self.db.products
        self.carts = self.db.carts
        self.orders = self.db.orders
        self.shippings = self.db.shippings
        self.coupons = self.db.coupons
        self.counters = self.db.counters
        
        # Test connection
        try:
            self.client.admin.command('ping')
            print(f"✅ Connected to e-commerce database: {db_name}")
        except Exception as e:
            print(f"❌ Failed to connect to e-commerce database: {e}")
            raise

    def _serialize_doc(self, doc: Dict) -> Dict:
        """Convert MongoDB document to JSON-serializable format"""
        if doc is None:
            return None
        
        # Convert ObjectId to string
        if '_id' in doc:
            doc['_id'] = str(doc['_id'])
        
        # Handle nested ObjectIds
        for key, value in doc.items():
            if isinstance(value, ObjectId):
                doc[key] = str(value)
        
        return doc

    # =============== PRODUCT OPERATIONS ===============
    
    async def get_products(self, limit: int = 20, category: str = None, min_price: float = None, max_price: float = None, sort_by: str = None) -> List[Dict]:
        """Get products with optional filtering and sorting"""
        try:
            print(f"[debug] Getting products with filters - limit: {limit}, category: {category}, price range: {min_price}-{max_price}, sort: {sort_by}")
            
            # Build query filter
            query = {}
            
            if category:
                query["category"] = category
                
            if min_price is not None or max_price is not None:
                price_filter = {}
                if min_price is not None:
                    price_filter["$gte"] = min_price
                if max_price is not None:
                    price_filter["$lte"] = max_price
                query["price"] = price_filter
            
            # Build sort option
            sort_option = []
            if sort_by == "price_asc":
                sort_option = [("price", 1)]
            elif sort_by == "price_desc":
                sort_option = [("price", -1)]
            elif sort_by == "name_asc":
                sort_option = [("name", 1)]
            elif sort_by == "rating_desc":
                sort_option = [("averageRating", -1)]
            else:
                sort_option = [("createdAt", -1)]  # Default: newest first
            
            print(f"[debug] Query: {query}")
            print(f"[debug] Sort: {sort_option}")
            
            # Execute query
            cursor = self.products.find(query)
            if sort_option:
                cursor = cursor.sort(sort_option)
            cursor = cursor.limit(limit)
            
            products = list(cursor)
            print(f"[debug] Found {len(products)} products")
            
            return [self._serialize_doc(product) for product in products]
        except Exception as e:
            print(f"Error fetching products: {e}")
            return []

    async def search_products(self, query: str, limit: int = 10) -> List[Dict]:
        """Search products by name or description"""
        try:
            print(f"[debug] Searching products with query: '{query}', limit: {limit}")
            
            # Test database connection first
            try:
                self.client.admin.command('ping')
                print(f"[debug] Database connection is alive for search")
            except Exception as conn_e:
                print(f"[debug] Database connection failed during search: {conn_e}")
                return []
            
            # Create text search query
            search_filter = {
                "$or": [
                    {"name": {"$regex": query, "$options": "i"}},
                    {"description": {"$regex": query, "$options": "i"}}
                ]
            }
            
            print(f"[debug] Search filter: {search_filter}")
            products = list(self.products.find(search_filter).limit(limit))
            print(f"[debug] Found {len(products)} products")
            
            if products:
                print(f"[debug] First product: {products[0].get('name', 'No name')}")
            
            return [self._serialize_doc(product) for product in products]
        except Exception as e:
            print(f"[debug] Error searching products: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
            return []

    async def get_product_by_id(self, product_id: str) -> Optional[Dict]:
        """Get detailed information about a specific product"""
        try:
            print(f"[debug] Getting product details for ID: {product_id}")
            product = self.products.find_one({"_id": ObjectId(product_id)})
            
            if product:
                product_data = self._serialize_doc(product)
                print(f"[debug] Found product: {product_data.get('name', 'Unknown')}")
                return product_data
            else:
                print(f"[debug] Product not found for ID: {product_id}")
                return None
                
        except InvalidId:
            print(f"[debug] Invalid product ID format: {product_id}")
            return None
        except Exception as e:
            print(f"Error fetching product: {e}")
            return None

    async def get_product_categories(self) -> List[str]:
        """Get all unique product categories"""
        try:
            categories = self.products.distinct("category")
            print(f"[debug] Found categories: {categories}")
            return categories
        except Exception as e:
            print(f"Error getting categories: {e}")
            return []

    async def get_products_by_category(self, category: str, limit: int = 20) -> List[Dict]:
        """Get products in a specific category"""
        try:
            print(f"[debug] Getting products in category: {category}")
            products = list(self.products.find({"category": category}).limit(limit))
            print(f"[debug] Found {len(products)} products in {category}")
            return [self._serialize_doc(product) for product in products]
        except Exception as e:
            print(f"Error getting products by category: {e}")
            return []

    async def get_featured_products(self, limit: int = 10) -> List[Dict]:
        """Get featured products (high rated or recently added)"""
        try:
            # Get products with high ratings or recently added
            featured = list(self.products.find({
                "$or": [
                    {"averageRating": {"$gte": 4.0}},
                    {"createdAt": {"$gte": datetime.utcnow().replace(day=1)}}  # This month
                ]
            }).sort([("averageRating", -1), ("createdAt", -1)]).limit(limit))
            
            print(f"[debug] Found {len(featured)} featured products")
            return [self._serialize_doc(product) for product in featured]
        except Exception as e:
            print(f"Error getting featured products: {e}")
            return []

    async def get_price_range(self) -> Dict:
        """Get the price range of all products"""
        try:
            pipeline = [
                {"$group": {
                    "_id": None,
                    "min_price": {"$min": "$price"},
                    "max_price": {"$max": "$price"},
                    "avg_price": {"$avg": "$price"}
                }}
            ]
            
            result = list(self.products.aggregate(pipeline))
            if result:
                price_info = result[0]
                return {
                    "min_price": price_info["min_price"],
                    "max_price": price_info["max_price"],
                    "avg_price": round(price_info["avg_price"], 2)
                }
            return {"min_price": 0, "max_price": 0, "avg_price": 0}
        except Exception as e:
            print(f"Error getting price range: {e}")
            return {"min_price": 0, "max_price": 0, "avg_price": 0}

    async def get_low_stock_products(self, threshold: int = 10) -> List[Dict]:
        """Get products with low stock"""
        try:
            products = list(self.products.find({"stock": {"$lte": threshold}}).sort([("stock", 1)]))
            print(f"[debug] Found {len(products)} products with low stock (<= {threshold})")
            return [self._serialize_doc(product) for product in products]
        except Exception as e:
            print(f"Error getting low stock products: {e}")
            return []

    # =============== USER OPERATIONS ===============
    
    async def get_user_by_id(self, user_id: str) -> Optional[Dict]:
        """Get user by ID"""
        try:
            user = self.users.find_one({"_id": ObjectId(user_id)})
            if user:
                # Don't return password
                user.pop('password', None)
                return self._serialize_doc(user)
            return None
        except InvalidId:
            print(f"Invalid user ID: {user_id}")
            return None
        except Exception as e:
            print(f"Error fetching user: {e}")
            return None

    async def get_user_by_email(self, email: str) -> Optional[Dict]:
        """Get user by email"""
        try:
            user = self.users.find_one({"email": email})
            if user:
                # Don't return password
                user.pop('password', None)
                return self._serialize_doc(user)
            return None
        except Exception as e:
            print(f"Error fetching user: {e}")
            return None

    # =============== CART OPERATIONS ===============
    
    async def get_cart_items(self, user_id: str) -> List[Dict]:
        """Get all items in user's cart"""
        try:
            print(f"[debug] Getting cart items for user: {user_id}")
            
            # Find the user's cart
            cart = self.carts.find_one({"user": user_id})
            print(f"[debug] Cart found: {bool(cart)}")
            
            if not cart or 'items' not in cart:
                print(f"[debug] No cart or items found for user: {user_id}")
                return []
            
            # Get items with product details
            cart_items = []
            for item in cart['items']:
                product_id = item.get('product')
                if product_id:
                    # Get product details
                    product = self.products.find_one({"_id": ObjectId(product_id)})
                    if product:
                        cart_item = {
                            "_id": str(item.get('_id', '')),
                            "product": self._serialize_doc(product),
                            "quantity": item.get('quantity', 1),
                            "cartItemId": str(item.get('_id', ''))
                        }
                        cart_items.append(cart_item)
            
            print(f"[debug] Found {len(cart_items)} cart items")
            return cart_items
            
        except Exception as e:
            print(f"[debug] Error fetching cart items: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
            return []

    async def add_to_cart(self, user_id: str, product_id: str, quantity: int = 1) -> Dict:
        """Add item to cart"""
        try:
            # Get product details
            product = await self.get_product_by_id(product_id)
            if not product:
                return {"success": False, "message": "Product not found"}

            product_oid = ObjectId(product_id)

            # Find user's cart
            cart = self.carts.find_one({"user": user_id})
            
            if cart:
                # Cart exists, check if product is already in cart
                existing_item_index = None
                for i, item in enumerate(cart["items"]):
                    if item["product"] == product_oid:
                        existing_item_index = i
                        break
                
                if existing_item_index is not None:
                    # Update quantity of existing item
                    new_quantity = cart["items"][existing_item_index]["quantity"] + quantity
                    self.carts.update_one(
                        {"_id": cart["_id"]},
                        {"$set": {f"items.{existing_item_index}.quantity": new_quantity}}
                    )
                    return {
                        "success": True,
                        "message": f"Updated {product['name']} quantity to {new_quantity}",
                        "action": "updated"
                    }
                else:
                    # Add new item to existing cart
                    from bson import ObjectId as BsonObjectId
                    new_item = {
                        "_id": BsonObjectId(),  # Explicitly generate subdocument ID
                        "product": product_oid,
                        "quantity": quantity
                    }
                    self.carts.update_one(
                        {"_id": cart["_id"]},
                        {"$push": {"items": new_item}}
                    )
                    return {
                        "success": True,
                        "message": f"Added {product['name']} to cart",
                        "action": "added"
                    }
            else:
                # Create new cart with first item
                from bson import ObjectId as BsonObjectId
                cart_doc = {
                    "user": user_id,
                    "items": [{
                        "_id": BsonObjectId(),  # Explicitly generate subdocument ID
                        "product": product_oid,
                        "quantity": quantity
                    }],
                    "createdAt": datetime.utcnow(),
                    "updatedAt": datetime.utcnow()
                }
                
                result = self.carts.insert_one(cart_doc)
                return {
                    "success": True,
                    "message": f"Created cart and added {product['name']}",
                    "action": "created",
                    "cartId": str(result.inserted_id)
                }


        except Exception as e:
            print(f"Error adding to cart: {e}")
            return {"success": False, "message": "Failed to add item to cart"}

    async def remove_from_cart(self, cart_item_id: str) -> Dict:
        """Remove item from cart"""
        try:
            # Find the cart that contains this item
            cart = self.carts.find_one({"items._id": ObjectId(cart_item_id)})
            if not cart:
                return {"success": False, "message": "Cart item not found"}
            
            # Remove the item from the items array
            result = self.carts.update_one(
                {"_id": cart["_id"]},
                {"$pull": {"items": {"_id": ObjectId(cart_item_id)}}}
            )
            
            if result.modified_count > 0:
                return {"success": True, "message": "Item removed from cart"}
            else:
                return {"success": False, "message": "Failed to remove item"}
        except InvalidId:
            return {"success": False, "message": "Invalid cart item ID"}
        except Exception as e:
            print(f"Error removing from cart: {e}")
            return {"success": False, "message": "Failed to remove item from cart"}

    async def update_cart_quantity(self, cart_item_id: str, quantity: int) -> Dict:
        """Update quantity of cart item"""
        try:
            if quantity < 1:
                return {"success": False, "message": "Quantity must be at least 1"}

            # Find the cart that contains this item
            cart = self.carts.find_one({"items._id": ObjectId(cart_item_id)})
            if not cart:
                return {"success": False, "message": "Cart item not found"}
            
            # Update the specific item's quantity in the array
            result = self.carts.update_one(
                {"_id": cart["_id"], "items._id": ObjectId(cart_item_id)},
                {"$set": {"items.$.quantity": quantity}}
            )
            
            if result.modified_count > 0:
                return {"success": True, "message": f"Updated quantity to {quantity}"}
            else:
                return {"success": False, "message": "Failed to update quantity"}
        except InvalidId:
            return {"success": False, "message": "Invalid cart item ID"}
        except Exception as e:
            print(f"Error updating cart quantity: {e}")
            return {"success": False, "message": "Failed to update quantity"}

    async def increase_quantity(self, cart_item_id: str) -> Dict:
        """Increase quantity of cart item by 1"""
        try:
            print(f"[debug] Increasing quantity for cart_item_id: {cart_item_id}")
            
            # Find the cart that contains this item
            cart = self.carts.find_one({"items._id": ObjectId(cart_item_id)})
            if not cart:
                print(f"[debug] No cart found with items._id: {cart_item_id}")
                return {"success": False, "message": "Cart item not found"}
            
            print(f"[debug] Found cart: {cart['_id']}")
            
            # Find the specific item
            target_item = None
            for item in cart["items"]:
                print(f"[debug] Checking item _id: {item.get('_id')} vs {cart_item_id}")
                if str(item["_id"]) == cart_item_id:
                    target_item = item
                    break
            
            if not target_item:
                print(f"[debug] Target item not found in cart items")
                return {"success": False, "message": "Item not found in cart"}
            
            print(f"[debug] Target item found: quantity={target_item['quantity']}")
            
            # Get product to check stock
            product = self.products.find_one({"_id": ObjectId(target_item["product"])})
            if not product:
                print(f"[debug] Product not found: {target_item['product']}")
                return {"success": False, "message": "Product not found"}
            
            print(f"[debug] Product found: stock={product.get('stock', 'N/A')}")
            
            current_quantity = target_item["quantity"]
            if current_quantity >= product["stock"]:
                return {"success": False, "message": f"Only {product['stock']} items in stock"}
            
            # Increase quantity by 1
            result = self.carts.update_one(
                {"_id": cart["_id"], "items._id": ObjectId(cart_item_id)},
                {"$inc": {"items.$.quantity": 1}}
            )
            
            print(f"[debug] Update result: modified_count={result.modified_count}")
            
            if result.modified_count > 0:
                return {"success": True, "message": "Quantity increased"}
            else:
                return {"success": False, "message": "Failed to increase quantity"}
                
        except InvalidId:
            return {"success": False, "message": "Invalid cart item ID"}
        except Exception as e:
            print(f"Error increasing quantity: {e}")
            return {"success": False, "message": "Failed to increase quantity"}

    async def decrease_quantity(self, cart_item_id: str) -> Dict:
        """Decrease quantity of cart item by 1"""
        try:
            # Find the cart that contains this item
            cart = self.carts.find_one({"items._id": ObjectId(cart_item_id)})
            if not cart:
                return {"success": False, "message": "Cart item not found"}
            
            # Find the specific item
            target_item = None
            for item in cart["items"]:
                if str(item["_id"]) == cart_item_id:
                    target_item = item
                    break
            
            if not target_item:
                return {"success": False, "message": "Item not found in cart"}
            
            current_quantity = target_item["quantity"]
            if current_quantity <= 1:
                # Remove item if quantity would become 0
                return await self.remove_from_cart(cart_item_id)
            
            # Decrease quantity by 1
            result = self.carts.update_one(
                {"_id": cart["_id"], "items._id": ObjectId(cart_item_id)},
                {"$inc": {"items.$.quantity": -1}}
            )
            
            if result.modified_count > 0:
                return {"success": True, "message": "Quantity decreased"}
            else:
                return {"success": False, "message": "Failed to decrease quantity"}
                
        except InvalidId:
            return {"success": False, "message": "Invalid cart item ID"}
        except Exception as e:
            print(f"Error decreasing quantity: {e}")
            return {"success": False, "message": "Failed to decrease quantity"}

    async def get_cart_summary(self, user_id: str) -> Dict:
        """Get cart summary with total items and price"""
        try:
            print(f"[debug] Getting cart summary for user: {user_id}")
            cart_items = await self.get_cart_items(user_id)
            print(f"[debug] Cart items retrieved: {len(cart_items)} items")
            
            if not cart_items:
                return {
                    "total_items": 0,
                    "total_price": 0,
                    "items": []
                }

            total_items = sum(item["quantity"] for item in cart_items)
            total_price = sum(item["product"]["price"] * item["quantity"] for item in cart_items)
            
            summary = {
                "total_items": total_items,
                "total_price": round(total_price, 2),
                "items": cart_items
            }
            print(f"[debug] Cart summary: {total_items} items, ${total_price:.2f} total")
            return summary
        except Exception as e:
            print(f"[debug] Error getting cart summary: {e}")
            return {"total_items": 0, "total_price": 0, "items": []}

    # =============== UTILITY FUNCTIONS ===============
    
    async def get_popular_products(self, limit: int = 5) -> List[Dict]:
        """Get popular products (you can implement logic based on your needs)"""
        try:
            # For now, just return recent products
            products = list(self.products.find().sort("createdAt", -1).limit(limit))
            return [self._serialize_doc(product) for product in products]
        except Exception as e:
            print(f"Error fetching popular products: {e}")
            return []

    def close_connection(self):
        """Close MongoDB connection"""
        self.client.close()

    # =============== ORDER OPERATIONS ===============
    
    async def _get_next_order_number(self) -> int:
        """Get next order number from counter collection (matches backend logic)"""
        try:
            # Try to find and increment counter
            counter = self.counters.find_one({"id": "order"})
            if counter:
                # Update and get new value
                self.counters.update_one(
                    {"id": "order"},
                    {"$inc": {"seq": 1}}
                )
                updated_counter = self.counters.find_one({"id": "order"})
                return updated_counter["seq"]
            else:
                # Initialize if doesn't exist
                self.counters.insert_one({"id": "order", "seq": 1})
                return 1
        except Exception as e:
            print(f"Error getting next order number: {e}")
            import traceback
            traceback.print_exc()
            # Fallback: use timestamp-based number
            return int(datetime.utcnow().timestamp())
    
    async def get_user_orders(self, user_id: str) -> Dict:
        """Get all orders for a specific user"""
        try:
            print(f"[debug] Getting orders for user: {user_id}")
            orders = list(self.orders.find({"user": user_id}).sort("createdAt", -1))
            serialized_orders = [self._serialize_doc(order) for order in orders]
            print(f"[debug] Found {len(serialized_orders)} orders")
            return {"success": True, "orders": serialized_orders}
        except Exception as e:
            print(f"Error getting user orders: {e}")
            return {"success": False, "message": "Failed to get orders"}

    async def get_order_details(self, order_id: str) -> Dict:
        """Get detailed information about a specific order"""
        try:
            print(f"[debug] Getting order details for: {order_id}")
            order = self.orders.find_one({"_id": ObjectId(order_id)})
            if not order:
                return {"success": False, "message": "Order not found"}
            return {"success": True, "order": self._serialize_doc(order)}
        except InvalidId:
            return {"success": False, "message": "Invalid order ID"}
        except Exception as e:
            print(f"Error getting order details: {e}")
            return {"success": False, "message": "Failed to get order details"}
    
    async def get_order_by_number(self, order_number: str, user_id: str = None) -> Dict:
        """Get order details by order number or tracking number. Optionally filter by user_id."""
        try:
            print(f"[debug] Searching for order by number: {order_number}, user_id: {user_id}")
            
            # Build query - search by orderNumber or trackingNumber
            query = {
                "$or": [
                    {"orderNumber": order_number},
                    {"trackingNumber": order_number}
                ]
            }
            
            # If user_id provided, add it to query for security (users can only see their own orders)
            if user_id:
                query["user"] = user_id
            
            order = self.orders.find_one(query)
            if not order:
                return {"success": False, "message": f"Order with number/tracking '{order_number}' not found"}
            
            return {"success": True, "order": self._serialize_doc(order)}
        except Exception as e:
            print(f"Error getting order by number: {e}")
            import traceback
            traceback.print_exc()
            return {"success": False, "message": "Failed to get order details"}

    async def cancel_order(self, order_id: str) -> Dict:
        """Cancel an order if it's eligible"""
        try:
            print(f"[debug] Attempting to cancel order: {order_id}")
            
            # Check if order exists and is eligible for cancellation
            order = self.orders.find_one({"_id": ObjectId(order_id)})
            if not order:
                return {"success": False, "message": "Order not found"}
            
            if order["orderStatus"] in ["shipped", "delivered"]:
                return {"success": False, "message": "Cannot cancel shipped or delivered orders"}
            
            # Update order status to cancelled
            result = self.orders.update_one(
                {"_id": ObjectId(order_id)},
                {"$set": {"orderStatus": "cancelled", "updatedAt": datetime.utcnow()}}
            )
            
            if result.modified_count > 0:
                return {"success": True, "message": "Order cancelled successfully"}
            else:
                return {"success": False, "message": "Failed to cancel order"}
                
        except InvalidId:
            return {"success": False, "message": "Invalid order ID"}
        except Exception as e:
            print(f"Error cancelling order: {e}")
            return {"success": False, "message": "Failed to cancel order"}

    async def create_order(self, user_id: str, shipping_address: Dict, payment_method: str = "cash_on_delivery", order_notes: str = "", coupon_code: str = "") -> Dict:
        """Create a new order from cart items - matches backend order schema"""
        try:
            print(f"[debug] Creating order for user: {user_id}")
            print(f"[debug] Shipping address provided: {shipping_address}")
            
            # Get cart and cart items
            cart = self.carts.find_one({"user": user_id})
            if not cart:
                return {"success": False, "message": "Cart not found"}
            
            cart_items = await self.get_cart_items(user_id)
            if not cart_items:
                return {"success": False, "message": "Cart is empty"}
            
            # Handle shipping address - find existing or create new
            shipping_id = None
            if isinstance(shipping_address, dict) and shipping_address.get("_id"):
                # Address dict with ID provided
                shipping_id = ObjectId(shipping_address["_id"])
                print(f"[debug] Using existing shipping address ID: {shipping_id}")
            elif isinstance(shipping_address, dict):
                # Address dict without ID - try to find existing matching address
                existing_addresses = await self.get_user_shipping_addresses(user_id)
                if existing_addresses.get("success") and existing_addresses.get("addresses"):
                    addresses = existing_addresses["addresses"]
                    # Try to find a matching address
                    for addr in addresses:
                        if (addr.get("fullName") == shipping_address.get("fullName") and
                            addr.get("address") == shipping_address.get("address") and
                            addr.get("city") == shipping_address.get("city") and
                            addr.get("postalCode") == shipping_address.get("postalCode")):
                            shipping_id = ObjectId(addr["_id"])
                            print(f"[debug] Found existing shipping address: {shipping_id}")
                            break
                
                # If no match found, create a new shipping address
                if not shipping_id:
                    print(f"[debug] Creating new shipping address")
                    add_result = await self.add_shipping_address(user_id, shipping_address)
                    if add_result.get("success") and add_result.get("address"):
                        shipping_id = ObjectId(add_result["address"]["_id"])
                    else:
                        return {"success": False, "message": f"Failed to create shipping address: {add_result.get('message', 'Unknown error')}"}
            
            if not shipping_id:
                return {"success": False, "message": "Invalid shipping address provided"}
            
            # Calculate total - cart_items structure: {product: {...}, quantity: ...}
            total_amount = sum(item["product"]["price"] * item["quantity"] for item in cart_items)
            
            # Generate order number and tracking number (matches backend logic)
            order_number = await self._get_next_order_number()
            tracking_number = 'TH-' + str(uuid.uuid4())[:8].upper()
            
            # Initialize order data - match backend order schema structure exactly
            order_data = {
                "user": user_id,  # Backend uses string, not ObjectId
                "cart": ObjectId(cart["_id"]),  # Reference to cart
                "shipping": shipping_id,  # Backend expects ObjectId reference
                "orderNumber": str(order_number),  # Backend expects string
                "trackingNumber": tracking_number,
                "orderItems": [{
                    "productId": ObjectId(item["product"]["_id"]),
                    "name": item["product"]["name"],
                    "image": item["product"].get("imageUrl", item["product"].get("image", "")),
                    "price": item["product"]["price"],
                    "quantity": item["quantity"]
                } for item in cart_items],
                "totalAmount": total_amount,
                "status": "Processing",  # Match backend enum
                "isGuest": False,
                "couponCode": None,
                "cashbackAmount": 0,
                "couponUsed": 0,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
            
            # Apply coupon if provided
            if coupon_code:
                coupon_validation = await self.validate_coupon(coupon_code, total_amount, user_id)
                if coupon_validation["success"] and coupon_validation["valid"]:
                    coupon = coupon_validation["coupon"]
                    discount = coupon["discount"]  # validate_coupon returns "discount", not "discountAmount"
                    new_total = coupon["newTotal"]
                    
                    order_data["couponCode"] = coupon["code"]
                    order_data["cashbackAmount"] = coupon.get("cashbackValue", 0)
                    order_data["couponUsed"] = 1
                    order_data["totalAmount"] = new_total  # Use discounted total from validation
                    
                    # Increment coupon usage count (backend uses timesUsed)
                    if coupon.get("_id"):
                        self.coupons.update_one(
                            {"_id": ObjectId(coupon["_id"])},
                            {"$inc": {"timesUsed": 1}}
                        )
                else:
                    order_data["couponCode"] = None
                    order_data["cashbackAmount"] = 0
                    order_data["couponUsed"] = 0
            
            # Create the order
            result = self.orders.insert_one(order_data)
            
            if result.inserted_id:
                # Clear the cart (empty items, don't delete cart)
                await self.empty_user_cart(user_id)
                return {
                    "success": True, 
                    "message": "Order created successfully", 
                    "order_id": str(result.inserted_id),
                    "orderNumber": order_data["orderNumber"],
                    "trackingNumber": order_data["trackingNumber"]
                }
            else:
                return {"success": False, "message": "Failed to create order"}
                
        except Exception as e:
            print(f"Error creating order: {e}")
            import traceback
            traceback.print_exc()
            return {"success": False, "message": f"Failed to create order: {str(e)}"}

    async def empty_user_cart(self, user_id: str) -> Dict:
        """Remove all items from user's cart"""
        try:
            # Cart uses "user" field as string, not ObjectId
            cart = self.carts.find_one({"user": user_id})
            if cart:
                # Remove all items from the cart
                result = self.carts.update_one(
                    {"_id": cart["_id"]},
                    {"$set": {"items": [], "updatedAt": datetime.utcnow()}}
                )
                return {"success": True, "removed": len(cart.get("items", []))}
            return {"success": True, "removed": 0}
        except Exception as e:
            print(f"Error emptying cart: {e}")
            import traceback
            traceback.print_exc()
            return {"success": False, "message": "Failed to empty cart"}

    # =============== SHIPPING OPERATIONS ===============
    
    async def get_user_shipping_addresses(self, user_id: str) -> Dict:
        """Get all shipping addresses for a user"""
        try:
            print(f"[debug] Getting shipping addresses for user: {user_id}")
            # Backend uses 'user' field as string, not ObjectId
            addresses = list(self.shippings.find({"user": user_id}).sort("createdAt", -1))
            print(f"[debug] Found {len(addresses)} shipping addresses")
            
            serialized_addresses = [self._serialize_doc(address) for address in addresses]
            
            # Debug: print first address fields if available
            if serialized_addresses:
                first_addr = serialized_addresses[0]
                print(f"[debug] First address fields: {list(first_addr.keys())}")
                print(f"[debug] First address fullName: {first_addr.get('fullName', 'NOT FOUND')}")
                print(f"[debug] First address sample: {first_addr}")
            
            return {"success": True, "addresses": serialized_addresses}
        except Exception as e:
            print(f"Error getting shipping addresses: {e}")
            import traceback
            traceback.print_exc()
            return {"success": False, "message": "Failed to get shipping addresses"}

    async def add_shipping_address(self, user_id: str, address_data: Dict) -> Dict:
        """Add a new shipping address for a user - matches backend schema"""
        try:
            print(f"[debug] Adding shipping address for user: {user_id}")
            
            # Required fields validation based on backend schema
            required_fields = ["fullName", "address", "city", "postalCode", "country"]
            for field in required_fields:
                if not address_data.get(field):
                    return {"success": False, "message": f"Missing required field: {field}"}
            
            # Backend schema - simpler structure
            shipping_doc = {
                "user": user_id,  # Backend uses string, not ObjectId
                "fullName": address_data["fullName"],
                "address": address_data["address"],
                "city": address_data["city"],
                "postalCode": address_data["postalCode"],
                "country": address_data["country"],
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
            
            result = self.shippings.insert_one(shipping_doc)
            created_address = self.shippings.find_one({"_id": result.inserted_id})
            
            return {
                "success": True,
                "message": "Shipping address added successfully",
                "address": self._serialize_doc(created_address)
            }
            
        except Exception as e:
            print(f"Error adding shipping address: {e}")
            return {"success": False, "message": "Failed to add shipping address"}

    async def update_shipping_address(self, address_id: str, user_id: str, address_data: Dict) -> Dict:
        """Update an existing shipping address - matches backend schema"""
        try:
            print(f"[debug] Updating shipping address: {address_id} for user: {user_id}")
            
            # Check if address belongs to user (backend uses string user field)
            address = self.shippings.find_one({
                "_id": ObjectId(address_id),
                "user": user_id
            })
            
            if not address:
                return {"success": False, "message": "Shipping address not found"}
            
            # Update fields based on backend schema
            update_data = {"updatedAt": datetime.utcnow()}
            updateable_fields = ["fullName", "address", "city", "postalCode", "country"]
            
            for field in updateable_fields:
                if field in address_data:
                    update_data[field] = address_data[field]
            
            result = self.shippings.update_one(
                {"_id": ObjectId(address_id)},
                {"$set": update_data}
            )
            
            if result.modified_count > 0:
                updated_address = self.shippings.find_one({"_id": ObjectId(address_id)})
                return {
                    "success": True,
                    "message": "Shipping address updated successfully",
                    "address": self._serialize_doc(updated_address)
                }
            else:
                return {"success": False, "message": "No changes made"}
                
        except InvalidId:
            return {"success": False, "message": "Invalid address ID"}
        except Exception as e:
            print(f"Error updating shipping address: {e}")
            return {"success": False, "message": "Failed to update shipping address"}

    # =============== COUPON OPERATIONS ===============
    
    async def validate_coupon(self, coupon_code: str, cart_total: float, user_id: str) -> Dict:
        """Validate a coupon code and calculate discount (matches backend schema)"""
        try:
            print(f"[debug] Validating coupon: {coupon_code} for cart total: ${cart_total}, user: {user_id}")
            
            coupon = self.coupons.find_one({"code": coupon_code.upper()})
            if not coupon:
                return {"success": True, "valid": False, "message": "Invalid coupon code."}
            
            # Check if coupon is expired
            if datetime.utcnow() > coupon.get("validUntil", datetime.utcnow()):
                return {"success": True, "valid": False, "message": "Coupon has expired."}
            
            # Check usage limit (backend uses maxUses and timesUsed)
            max_uses = coupon.get("maxUses", 100)
            times_used = coupon.get("timesUsed", 0)
            if times_used >= max_uses:
                return {"success": True, "valid": False, "message": "Coupon has reached its maximum usage limit."}
            
            # Check if user has already used this coupon (backend uses userHistory)
            user_history = coupon.get("userHistory", [])
            has_used = any(history.get("userId") == user_id for history in user_history)
            if has_used:
                return {"success": True, "valid": False, "message": "You have already used this coupon."}
            
            # Calculate discount (backend uses 'type' and 'value' fields)
            coupon_type = coupon.get("type")
            coupon_value = coupon.get("value", 0)
            discount_applied = 0
            
            if coupon_type == "PERCENTAGE":
                discount_applied = cart_total * (coupon_value / 100)
            elif coupon_type == "FIXED_AMOUNT":
                discount_applied = coupon_value
            elif coupon_type in ["FREE_SHIPPING", "CASHBACK"]:
                discount_applied = 0  # No price discount at checkout for these types
            else:
                return {"success": True, "valid": False, "message": "Invalid coupon type."}
            
            new_total = max(0, cart_total - discount_applied)
            
            coupon_data = self._serialize_doc(coupon)
            coupon_data["discount"] = round(discount_applied, 2)
            coupon_data["newTotal"] = round(new_total, 2)
            coupon_data["cashbackValue"] = coupon_value if coupon_type == "CASHBACK" else 0
            
            return {
                "success": True, 
                "valid": True, 
                "coupon": coupon_data,
                "message": "Coupon applied successfully."
            }
            
        except Exception as e:
            print(f"Error validating coupon: {e}")
            return {"success": False, "message": "Failed to validate coupon"}

    async def get_available_coupons(self) -> Dict:
        """Get all active and valid coupon codes (matches backend schema)"""
        try:
            print("[debug] Getting available coupons")
            current_time = datetime.utcnow()
            print(f"[debug] Current time: {current_time}")
            
            # Backend schema: check validUntil and maxUses/timesUsed
            all_coupons = list(self.coupons.find({}))
            print(f"[debug] Total coupons in database: {len(all_coupons)}")
            
            # Check which coupons are valid
            coupons = list(self.coupons.find({
                "validUntil": {"$gte": current_time}
            }))
            print(f"[debug] Non-expired coupons: {len(coupons)}")
            
            # Filter out coupons that have reached usage limit
            available_coupons = []
            for coupon in coupons:
                max_uses = coupon.get("maxUses", 100)
                times_used = coupon.get("timesUsed", 0)
                if times_used < max_uses:
                    available_coupons.append(self._serialize_doc(coupon))
                else:
                    print(f"[debug] Coupon {coupon.get('code')} has reached max uses")
            
            print(f"[debug] Available coupons after filtering: {len(available_coupons)}")
            for coupon in available_coupons:
                print(f"[debug] - {coupon.get('code')}: {coupon.get('type')} {coupon.get('value')}")
            
            # If no valid coupons, show what coupons exist and why they're not available
            if len(available_coupons) == 0 and len(all_coupons) > 0:
                print("[debug] No available coupons. Checking reasons:")
                for coupon in all_coupons:
                    code = coupon.get('code', 'UNKNOWN')
                    valid_until = coupon.get('validUntil')
                    if valid_until < current_time:
                        print(f"[debug] - {code}: EXPIRED (expired on {valid_until})")
                    elif coupon.get('timesUsed', 0) >= coupon.get('maxUses', 100):
                        print(f"[debug] - {code}: MAX USES REACHED")
            
            return {"success": True, "coupons": available_coupons}
            
        except Exception as e:
            print(f"Error getting available coupons: {e}")
            import traceback
            traceback.print_exc()
            return {"success": False, "message": "Failed to get available coupons"}

    # =============== CUSTOM PC BUILDER OPERATIONS ===============
    
    async def start_pc_build(self, user_id: str, session_id: str = "default") -> Dict:
        """Start a new PC build session"""
        try:
            print(f"[debug] Starting PC build for user: {user_id}, session: {session_id}")
            
            # Access customPCs collection
            custom_pcs = self.db.custompcs
            
            pc_build_doc = {
                "user": user_id,
                "sessionId": session_id,
                "currentStep": "ram",
                "status": "in_progress",
                "components": {},
                "totalPrice": 0,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
            
            result = custom_pcs.insert_one(pc_build_doc)
            created_build = custom_pcs.find_one({"_id": result.inserted_id})
            
            return {
                "success": True,
                "message": "PC build started! Let's start with selecting RAM.",
                "pcBuild": self._serialize_doc(created_build),
                "currentStep": "ram",
                "build_id": str(result.inserted_id)
            }
        except Exception as e:
            print(f"Error starting PC build: {e}")
            import traceback
            traceback.print_exc()
            return {"success": False, "message": "Failed to start PC build"}
    
    async def get_pc_build(self, build_id: str) -> Dict:
        """Get PC build by ID"""
        try:
            print(f"[debug] Getting PC build: {build_id}")
            custom_pcs = self.db.custompcs
            
            build = custom_pcs.find_one({"_id": ObjectId(build_id)})
            if not build:
                return {"success": False, "message": "PC build not found"}
            
            # Populate component products if they exist
            if "components" in build:
                for comp_type in ["ram", "ssd", "cpu"]:
                    if comp_type in build["components"] and "product" in build["components"][comp_type]:
                        product_id = build["components"][comp_type]["product"]
                        product = await self.get_product_by_id(str(product_id))
                        if product:
                            build["components"][comp_type]["productDetails"] = product
            
            return {"success": True, "pcBuild": self._serialize_doc(build)}
        except InvalidId:
            return {"success": False, "message": "Invalid build ID"}
        except Exception as e:
            print(f"Error getting PC build: {e}")
            import traceback
            traceback.print_exc()
            return {"success": False, "message": "Failed to get PC build"}
    
    async def get_user_pc_builds(self, user_id: str) -> Dict:
        """Get all PC builds for a user"""
        try:
            print(f"[debug] Getting PC builds for user: {user_id}")
            custom_pcs = self.db.custompcs
            
            builds = list(custom_pcs.find({"user": user_id}).sort("createdAt", -1))
            serialized_builds = [self._serialize_doc(build) for build in builds]
            
            return {"success": True, "builds": serialized_builds}
        except Exception as e:
            print(f"Error getting user PC builds: {e}")
            return {"success": False, "message": "Failed to get PC builds"}
    
    async def add_component_to_build(self, build_id: str, component_type: str, product_id: str) -> Dict:
        """Add a component to PC build"""
        try:
            print(f"[debug] Adding {component_type} to build {build_id}: product {product_id}")
            
            valid_types = ["ram", "ssd", "cpu", "gpu", "psu", "motherboard", "aircooler", "case"]
            if component_type not in valid_types:
                return {"success": False, "message": f"Invalid component type. Must be one of: {', '.join(valid_types)}"}
            
            custom_pcs = self.db.custompcs
            build = custom_pcs.find_one({"_id": ObjectId(build_id)})
            
            if not build:
                return {"success": False, "message": "PC build not found"}
            
            # Note: No strict order check - allow adding any component at any time
            # This supports skipping components in the PC builder flow
            
            # Get product details
            product = await self.get_product_by_id(product_id)
            if not product:
                return {"success": False, "message": "Product not found"}
            
            # Add component
            component_data = {
                "product": ObjectId(product_id),
                "name": product["name"],
                "price": product["price"],
                "specifications": product.get("specifications", {})
            }
            
            update_data = {
                f"components.{component_type}": component_data,
                "updatedAt": datetime.utcnow()
            }
            
            # Calculate total price
            components = build.get("components", {})
            components[component_type] = component_data
            total = sum(comp["price"] for comp in components.values() if "price" in comp)
            update_data["totalPrice"] = total
            
            # Move to next step
            next_message = ""
            if component_type == "ram":
                update_data["currentStep"] = "ssd"
                next_message = "Great! RAM selected. Now let's choose an SSD."
            elif component_type == "ssd":
                update_data["currentStep"] = "cpu"
                next_message = "Excellent! SSD selected. Now let's pick a CPU."
            elif component_type == "cpu":
                update_data["currentStep"] = "gpu"
                next_message = "Perfect! CPU selected. Now let's pick a GPU."
            elif component_type == "gpu":
                update_data["currentStep"] = "psu"
                next_message = "Great! GPU selected. Now let's choose a PSU."
            elif component_type == "psu":
                update_data["currentStep"] = "motherboard"
                next_message = "Excellent! PSU selected. Now let's pick a Motherboard."
            elif component_type == "motherboard":
                update_data["currentStep"] = "aircooler"
                next_message = "Perfect! Motherboard selected. Now let's choose an Air Cooler."
            elif component_type == "aircooler":
                update_data["currentStep"] = "case"
                next_message = "Great! Air Cooler selected. Now let's pick a Case."
            elif component_type == "case":
                update_data["currentStep"] = "complete"
                update_data["status"] = "completed"
                next_message = "Perfect! Your PC build is complete!"
            
            custom_pcs.update_one(
                {"_id": ObjectId(build_id)},
                {"$set": update_data}
            )
            
            updated_build = custom_pcs.find_one({"_id": ObjectId(build_id)})
            
            return {
                "success": True,
                "message": next_message,
                "pcBuild": self._serialize_doc(updated_build),
                "currentStep": update_data.get("currentStep", "complete"),
                "componentAdded": component_data
            }
        except InvalidId:
            return {"success": False, "message": "Invalid ID"}
        except Exception as e:
            print(f"Error adding component to build: {e}")
            import traceback
            traceback.print_exc()
            return {"success": False, "message": "Failed to add component"}
    
    async def cancel_pc_build(self, build_id: str) -> Dict:
        """Cancel a PC build"""
        try:
            print(f"[debug] Cancelling PC build: {build_id}")
            custom_pcs = self.db.custompcs
            
            result = custom_pcs.update_one(
                {"_id": ObjectId(build_id)},
                {"$set": {"status": "cancelled", "updatedAt": datetime.utcnow()}}
            )
            
            if result.modified_count > 0:
                return {"success": True, "message": "PC build cancelled successfully"}
            else:
                return {"success": False, "message": "PC build not found"}
        except InvalidId:
            return {"success": False, "message": "Invalid build ID"}
        except Exception as e:
            print(f"Error cancelling PC build: {e}")
            return {"success": False, "message": "Failed to cancel PC build"}
    
    async def save_build_to_cart(self, build_id: str) -> Dict:
        """Save completed PC build to cart"""
        try:
            print(f"[debug] Saving PC build to cart: {build_id}")
            custom_pcs = self.db.custompcs
            
            build = custom_pcs.find_one({"_id": ObjectId(build_id)})
            if not build:
                return {"success": False, "message": "PC build not found"}
            
            if build["status"] != "completed":
                return {"success": False, "message": "PC build is not complete yet"}
            
            user_id = build["user"]
            components = build.get("components", {})
            
            # Add each component to cart
            results = []
            for comp_type in ["ram", "ssd", "cpu", "gpu", "psu", "motherboard", "aircooler", "case"]:
                if comp_type in components and "product" in components[comp_type]:
                    product_id = str(components[comp_type]["product"])
                    result = await self.add_to_cart(user_id, product_id, 1)
                    results.append({
                        "component": comp_type,
                        "result": result
                    })
            
            return {
                "success": True,
                "message": "PC build saved to cart successfully!",
                "results": results,
                "itemsAdded": len(results)
            }
        except InvalidId:
            return {"success": False, "message": "Invalid build ID"}
        except Exception as e:
            print(f"Error saving build to cart: {e}")
            import traceback
            traceback.print_exc()
            return {"success": False, "message": "Failed to save build to cart"}
