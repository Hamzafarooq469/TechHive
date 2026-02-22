"""
Main FastAPI Application Entry Point
TechHive AI Services Gateway - Microservices Architecture
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging
import os

# Import microservice routers
from MLServices.router import router as ml_router
from ChatbotServices.router import router as chatbot_router
from MailServices.router import router as mail_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="TechHive AI Services Gateway",
    description="""
    **AI Services Gateway for TechHive E-commerce Platform**
    
    ## Microservices Architecture
    This gateway integrates multiple AI services:
    
    ### 1. Machine Learning Services (/api/ml)
    - Customer churn prediction
    - Risk assessment and classification
    - Model health monitoring
    
    ### 2. Chatbot Services (/api/chatbot)
    - AI-powered conversational agent
    - E-commerce integration (products, cart, orders)
    - Knowledge base search (RAG)
    - Session management and chat history
    - Human-in-the-loop approvals
    
    ## Features
    - FastAPI with automatic documentation
    - Pydantic data validation
    - CORS support for web integration
    - Microservices with clear separation
    - Legacy endpoint compatibility
    """,
    version="3.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include microservice routers with prefixes
app.include_router(ml_router, prefix="/api/ml", tags=["Machine Learning"])
app.include_router(chatbot_router, prefix="/api/chatbot", tags=["Chatbot & E-commerce"])
app.include_router(mail_router, prefix="/api/mail", tags=["Mail Services"])

# Root endpoint
@app.get("/")
async def root():
    """
    Root endpoint with service information
    """
    return {
        "message": "TechHive AI Services Gateway",
        "version": "3.0.0",
        "status": "operational",
        "documentation": "/docs",
        "microservices": {
            "machine_learning": {
                "prefix": "/api/ml",
                "endpoints": {
                    "churn_prediction": "/api/ml/predict",
                    "health_check": "/api/ml/health"
                }
            },
            "chatbot": {
                "prefix": "/api/chatbot",
                "endpoints": {
                    "chat": "/api/chatbot/chat",
                    "chat_stream": "/api/chatbot/chat/stream",
                    "products": "/api/chatbot/products",
                    "cart": "/api/chatbot/cart/{user_id}",
                    "orders": "/api/chatbot/orders/{user_id}",
                    "knowledge_search": "/api/chatbot/knowledge/search",
                    "health_check": "/api/chatbot/health"
                }
            }
        }
    }

# Global health endpoint
@app.get("/health")
async def global_health():
    """
    Global health check endpoint for all microservices
    """
    return {
        "status": "healthy",
        "message": "AI Services Gateway is operational",
        "services": {
            "ml_service": "available at /api/ml/health",
            "chatbot_service": "available at /api/chatbot/health"
        }
    }

# Main execution
if __name__ == "__main__":
    logger.info("Starting TechHive AI Services Gateway...")
    logger.info("ML Service available at: /api/ml")
    logger.info("Chatbot Service available at: /api/chatbot")
    
    # Check environment for reload setting (default to False for stability)
    enable_reload = os.getenv("ENABLE_RELOAD", "false").lower() == "true"
    
    if enable_reload:
        logger.info("Auto-reload ENABLED - service will restart on file changes")
        uvicorn.run(
            "app:app",
            host="0.0.0.0",
            port=5000,
            reload=True,
            reload_excludes=["*.log", "__pycache__/*", "*.pyc", "*.json", "*.md"],
            reload_delay=2.0,
            log_level="info"
        )
    else:
        logger.info("Auto-reload DISABLED - service will remain stable during conversations")
        uvicorn.run(
            "app:app",
            host="0.0.0.0",
            port=5000,
            reload=False,
            log_level="info"
        )