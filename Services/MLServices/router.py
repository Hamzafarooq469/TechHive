"""
FastAPI Router for ML Services
Simple routing layer - all logic is in preprocessing modules
"""

from fastapi import APIRouter, HTTPException
from .churn_preprocessing import (
    ChurnPredictionInput, 
    ChurnPredictionOutput, 
    predict_churn_from_pydantic, 
    predict_churn_from_dict, 
    is_model_loaded as is_churn_model_loaded
)
from .sentiment_preprocessing import (
    SentimentAnalysisInput,
    SentimentAnalysisOutput,
    predict_sentiment_from_pydantic,
    predict_sentiment_from_dict,
    is_model_loaded as is_sentiment_model_loaded,
    load_model as load_sentiment_model
)

# Create router for ML endpoints
router = APIRouter(tags=["Machine Learning"])

# Note: Sentiment model is loaded in sentiment_preprocessing.py on module import

@router.post("/predict")
async def predict_legacy(request_data: dict):
    """Legacy prediction endpoint for Node.js compatibility (churn prediction)"""
    if not is_churn_model_loaded():
        raise HTTPException(status_code=503, detail="Churn model not loaded. Check server logs.")
    
    try:
        return predict_churn_from_dict(request_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/sentiment", response_model=SentimentAnalysisOutput)
async def analyze_sentiment(input_data: SentimentAnalysisInput):
    """Analyze sentiment of text using DistilBERT model"""
    if not is_sentiment_model_loaded():
        raise HTTPException(status_code=503, detail="Sentiment model not loaded. Check server logs.")
    
    try:
        return predict_sentiment_from_pydantic(input_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/sentiment/predict")
async def predict_sentiment_legacy(request_data: dict):
    """Legacy sentiment prediction endpoint for Node.js compatibility"""
    if not is_sentiment_model_loaded():
        raise HTTPException(status_code=503, detail="Sentiment model not loaded. Check server logs.")
    
    try:
        return predict_sentiment_from_dict(request_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "churn_model_loaded": is_churn_model_loaded(),
        "sentiment_model_loaded": is_sentiment_model_loaded()
    }