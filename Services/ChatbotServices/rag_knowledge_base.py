
"""
RAG Knowledge Base for E-commerce AI Assistant
Uses FAISS for vector similarity search with sklearn fallback and scikit-learn for TF-IDF embeddings
"""

import json
import numpy as np
try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False
    faiss = None

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pickle
import os
from typing import List, Dict, Optional, Tuple
import logging

class RAGKnowledgeBase:
    def __init__(self, knowledge_file: str = "knowledge_base.json", index_file: str = "faiss_index.bin", vectorizer_file: str = "vectorizer.pkl"):
        """
        Initialize RAG Knowledge Base with FAISS vector search and sklearn fallback
        
        Args:
            knowledge_file: JSON file containing knowledge base documents
            index_file: FAISS index file for vector search
            vectorizer_file: Pickled TF-IDF vectorizer
        """
        # Get the directory where this file is located (ChatbotServices)
        base_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Use absolute paths relative to ChatbotServices directory
        self.knowledge_file = os.path.join(base_dir, knowledge_file)
        self.index_file = os.path.join(base_dir, index_file)
        self.vectorizer_file = os.path.join(base_dir, vectorizer_file)
        
        # Initialize components
        self.documents = []
        self.document_metadata = []
        self.vectorizer = None
        self.faiss_index = None
        self.document_vectors = None
        self.use_faiss = FAISS_AVAILABLE
        
        # Load or create knowledge base
        self.load_or_create_knowledge_base()
        
        logging.info(f"RAG Knowledge Base initialized with {len(self.documents)} documents")
        if not self.use_faiss:
            logging.warning("Using sklearn fallback for vector search (FAISS not available or failed)")
        else:
            logging.info("Using FAISS for optimized vector search")
    
    def load_or_create_knowledge_base(self):
        """Load existing knowledge base or create a new one"""
        if os.path.exists(self.knowledge_file):
            self.load_knowledge_base()
        else:
            self.create_default_knowledge_base()
        
        # Load or create vector index
        if os.path.exists(self.index_file) and os.path.exists(self.vectorizer_file):
            self.load_vector_index()
        else:
            self.create_vector_index()
    
    def create_default_knowledge_base(self):
        """Create default knowledge base with e-commerce information"""
        default_knowledge = [
            {
                "id": "product_info_1",
                "title": "Product Categories",
                "content": "We offer a wide range of products including Electronics (smartphones, laptops, tablets), Clothing (men's wear, women's wear, accessories), Home & Garden (furniture, appliances, decor), Sports & Recreation, Books, and Health & Beauty products.",
                "category": "products",
                "keywords": ["products", "categories", "electronics", "clothing", "home", "sports", "books", "health"]
            },
            {
                "id": "shipping_policy_1",
                "title": "Shipping Information",
                "content": "We offer free shipping on orders over $50. Standard shipping takes 3-7 business days. Express shipping (1-2 business days) is available for $9.99. International shipping available to select countries with rates calculated at checkout.",
                "category": "shipping",
                "keywords": ["shipping", "delivery", "free shipping", "express", "international"]
            },
            {
                "id": "return_policy_1",
                "title": "Return & Exchange Policy",
                "content": "Items can be returned within 30 days of purchase for a full refund. Items must be in original condition with tags attached. Electronics have a 14-day return window. Custom or personalized items cannot be returned.",
                "category": "returns",
                "keywords": ["return", "refund", "exchange", "policy", "30 days"]
            },
            {
                "id": "payment_methods_1",
                "title": "Payment Methods",
                "content": "We accept all major credit cards (Visa, MasterCard, American Express, Discover), PayPal, Apple Pay, Google Pay, and Buy Now Pay Later options through Klarna and Afterpay.",
                "category": "payments",
                "keywords": ["payment", "credit card", "paypal", "apple pay", "google pay", "klarna", "afterpay"]
            },
            {
                "id": "coupon_info_1",
                "title": "Coupon and Discount Information",
                "content": "We offer various discount codes: SAVE10 (10% off orders over $100), SAVE20 (20% off orders over $200), FREESHIP (free shipping), NEWUSER (15% off first order), STUDENT10 (10% student discount). Coupons cannot be combined unless specified.",
                "category": "coupons",
                "keywords": ["coupon", "discount", "promo code", "save", "percent off", "free shipping"]
            },
            {
                "id": "customer_service_1",
                "title": "Customer Service",
                "content": "Our customer service team is available Monday-Friday 9AM-6PM EST. You can contact us via email at support@example.com, phone at 1-800-123-4567, or live chat on our website. We respond to emails within 24 hours.",
                "category": "support",
                "keywords": ["customer service", "support", "contact", "email", "phone", "live chat", "help"]
            },
            {
                "id": "account_management_1",
                "title": "Account Management",
                "content": "Create an account to track orders, save shipping addresses, view order history, manage wishlists, and receive exclusive offers. You can update your profile, change password, and manage communication preferences in your account settings.",
                "category": "account",
                "keywords": ["account", "profile", "login", "register", "password", "settings", "wishlist"]
            },
            {
                "id": "order_tracking_1",
                "title": "Order Tracking",
                "content": "Once your order ships, you'll receive a tracking number via email. You can track your package on our website by entering your order number and email address. Orders typically process within 1-2 business days before shipping.",
                "category": "orders",
                "keywords": ["order", "tracking", "shipment", "delivery status", "order number", "package"]
            }
        ]
        
        # Save to file
        with open(self.knowledge_file, 'w') as f:
            json.dump(default_knowledge, f, indent=2)
        
        self.documents = [doc['content'] for doc in default_knowledge]
        self.document_metadata = default_knowledge
        
        logging.info(f"Created default knowledge base with {len(default_knowledge)} documents")
    
    def load_knowledge_base(self):
        """Load knowledge base from JSON file"""
        try:
            with open(self.knowledge_file, 'r') as f:
                knowledge_data = json.load(f)
            
            self.documents = [doc['content'] for doc in knowledge_data]
            self.document_metadata = knowledge_data
            
            logging.info(f"Loaded knowledge base with {len(knowledge_data)} documents")
        except Exception as e:
            logging.error(f"Error loading knowledge base: {e}")
            self.create_default_knowledge_base()
    
    def create_vector_index(self):
        """Create TF-IDF vectors and FAISS index for similarity search with fallback"""
        if not self.documents:
            logging.error("No documents to index")
            return
        
        try:
            # Create TF-IDF vectors
            self.vectorizer = TfidfVectorizer(
                max_features=1000,
                stop_words='english',
                lowercase=True,
                ngram_range=(1, 2)  # Include bigrams
            )
            
            self.document_vectors = self.vectorizer.fit_transform(self.documents).toarray()
            
            # Try to create FAISS index if available
            if self.use_faiss and FAISS_AVAILABLE:
                try:
                    dimension = self.document_vectors.shape[1]
                    self.faiss_index = faiss.IndexFlatIP(dimension)  # Inner product for cosine similarity
                    
                    # Normalize vectors for cosine similarity
                    # Convert to float32 and ensure proper array format
                    vectors_float32 = self.document_vectors.astype(np.float32)
                    vectors_normalized = vectors_float32.copy()
                    faiss.normalize_L2(vectors_normalized)
                    
                    self.faiss_index.add(vectors_normalized)
                    
                    # Save index and vectorizer
                    faiss.write_index(self.faiss_index, self.index_file)
                    with open(self.vectorizer_file, 'wb') as f:
                        pickle.dump(self.vectorizer, f)
                    
                    logging.info(f"Created FAISS vector index with {len(self.documents)} documents, dimension: {dimension}")
                    
                except Exception as faiss_error:
                    logging.error(f"FAISS initialization failed: {faiss_error}")
                    logging.info("Falling back to sklearn-based similarity search")
                    self.use_faiss = False
                    self.faiss_index = None
                    
                    # Save vectorizer for sklearn fallback
                    with open(self.vectorizer_file, 'wb') as f:
                        pickle.dump(self.vectorizer, f)
            else:
                # Save vectorizer for sklearn fallback
                with open(self.vectorizer_file, 'wb') as f:
                    pickle.dump(self.vectorizer, f)
                logging.info(f"Created TF-IDF vectors with {len(self.documents)} documents (sklearn fallback)")
                
        except Exception as e:
            logging.error(f"Error creating vector index: {e}")
            self.vectorizer = None
            self.document_vectors = None
    
    def load_vector_index(self):
        """Load existing vector index and vectorizer with fallback handling"""
        try:
            # Try to load FAISS index first
            if self.use_faiss and FAISS_AVAILABLE and os.path.exists(self.index_file):
                try:
                    self.faiss_index = faiss.read_index(self.index_file)
                    with open(self.vectorizer_file, 'rb') as f:
                        self.vectorizer = pickle.load(f)
                    
                    # Recreate document vectors if needed
                    if self.documents and self.vectorizer:
                        self.document_vectors = self.vectorizer.transform(self.documents).toarray()
                    
                    logging.info("Loaded existing FAISS vector index and vectorizer")
                    return
                    
                except Exception as faiss_error:
                    logging.error(f"Error loading FAISS index: {faiss_error}")
                    logging.info("Falling back to sklearn-based search")
                    self.use_faiss = False
                    self.faiss_index = None
            
            # Load vectorizer for sklearn fallback
            if os.path.exists(self.vectorizer_file):
                with open(self.vectorizer_file, 'rb') as f:
                    self.vectorizer = pickle.load(f)
                
                # Recreate document vectors if needed
                if self.documents and self.vectorizer:
                    self.document_vectors = self.vectorizer.transform(self.documents).toarray()
                
                logging.info("Loaded existing vectorizer for sklearn-based search")
            else:
                logging.info("No existing index found, creating new vector index")
                self.create_vector_index()
                
        except Exception as e:
            logging.error(f"Error loading vector index: {e}")
            self.create_vector_index()
    
    def search(self, query: str, top_k: int = 3, min_score: float = 0.1) -> List[Dict]:
        """
        Search for relevant documents using vector similarity (FAISS or sklearn fallback)
        
        Args:
            query: Search query string
            top_k: Number of top results to return
            min_score: Minimum similarity score threshold
        
        Returns:
            List of relevant documents with metadata and scores
        """
        if not self.vectorizer:
            logging.error("Vector index not initialized")
            return []

        try:
            # Vectorize query
            query_vector = self.vectorizer.transform([query]).toarray()
            
            if self.use_faiss and self.faiss_index is not None:
                # Use FAISS for search
                query_normalized = query_vector.astype(np.float32)
                faiss.normalize_L2(query_normalized)
                
                scores, indices = self.faiss_index.search(query_normalized, top_k)
                
                results = []
                for score, idx in zip(scores[0], indices[0]):
                    if score >= min_score and idx < len(self.document_metadata):
                        result = self.document_metadata[idx].copy()
                        result['relevance_score'] = float(score)
                        results.append(result)
                        
                logging.info(f"FAISS search for '{query}' returned {len(results)} results")
                
            else:
                # Use sklearn cosine similarity fallback
                if self.document_vectors is None:
                    self.document_vectors = self.vectorizer.transform(self.documents).toarray()
                
                # Calculate cosine similarity
                similarities = cosine_similarity(query_vector, self.document_vectors)[0]
                
                # Get top_k indices
                top_indices = np.argsort(similarities)[::-1][:top_k]
                
                results = []
                for idx in top_indices:
                    score = similarities[idx]
                    if score >= min_score and idx < len(self.document_metadata):
                        result = self.document_metadata[idx].copy()
                        result['relevance_score'] = float(score)
                        results.append(result)
                
                logging.info(f"Sklearn search for '{query}' returned {len(results)} results")
            
            return results
            
        except Exception as e:
            logging.error(f"Error during search: {e}")
            return []
    
    def search_by_category(self, category: str, top_k: int = 5) -> List[Dict]:
        """Search for documents by category"""
        results = []
        for doc in self.document_metadata:
            if doc.get('category', '').lower() == category.lower():
                results.append(doc)
                if len(results) >= top_k:
                    break
        
        return results
    
    def search_by_keywords(self, keywords: List[str], top_k: int = 3) -> List[Dict]:
        """Search for documents containing specific keywords"""
        results = []
        keyword_set = {kw.lower() for kw in keywords}
        
        for doc in self.document_metadata:
            doc_keywords = {kw.lower() for kw in doc.get('keywords', [])}
            if keyword_set.intersection(doc_keywords):
                results.append(doc)
                if len(results) >= top_k:
                    break
        
        return results
    
    def add_document(self, title: str, content: str, category: str, keywords: List[str]) -> bool:
        """Add a new document to the knowledge base"""
        try:
            new_doc = {
                "id": f"{category}_{len(self.document_metadata)}",
                "title": title,
                "content": content,
                "category": category,
                "keywords": keywords
            }
            
            self.document_metadata.append(new_doc)
            self.documents.append(content)
            
            # Save updated knowledge base
            with open(self.knowledge_file, 'w') as f:
                json.dump(self.document_metadata, f, indent=2)
            
            # Recreate vector index
            self.create_vector_index()
            
            logging.info(f"Added new document: {title}")
            return True
            
        except Exception as e:
            logging.error(f"Error adding document: {e}")
            return False
    
    def get_context_for_query(self, query: str, max_context_length: int = 1000) -> str:
        """Get relevant context for a query, formatted for LLM prompt"""
        results = self.search(query, top_k=3)
        
        if not results:
            return "No relevant information found in knowledge base."
        
        context_parts = []
        total_length = 0
        
        for result in results:
            title = result.get('title', 'Untitled')
            content = result.get('content', '')
            score = result.get('relevance_score', 0)
            
            part = f"**{title}** (Relevance: {score:.2f})\n{content}\n"
            
            if total_length + len(part) > max_context_length:
                break
            
            context_parts.append(part)
            total_length += len(part)
        
        return "\n".join(context_parts)

# Global instance
knowledge_base = None

def get_knowledge_base() -> RAGKnowledgeBase:
    """Get or create global knowledge base instance"""
    global knowledge_base
    if knowledge_base is None:
        knowledge_base = RAGKnowledgeBase()
    return knowledge_base

def search_knowledge(query: str, top_k: int = 3) -> List[Dict]:
    """Convenient function to search knowledge base"""
    kb = get_knowledge_base()
    return kb.search(query, top_k)

def get_context(query: str, max_length: int = 1000) -> str:
    """Convenient function to get context for query"""
    kb = get_knowledge_base()
    return kb.get_context_for_query(query, max_length)