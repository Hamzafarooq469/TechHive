"""
Sentiment Analysis Data Preprocessing
Handles loading the DistilBERT model and performing sentiment analysis on text
"""

import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import Literal, Optional
import torch
from transformers import DistilBertForSequenceClassification, DistilBertTokenizer
import os

logger = logging.getLogger(__name__)

# Global model and tokenizer variables
model = None
tokenizer = None

# Label mapping (based on config.json - 3 labels: Negative, Neutral, Positive)
LABEL_MAPPING = {
    0: "Negative",
    1: "Neutral", 
    2: "Positive"
}

# Pydantic models for request/response
class SentimentAnalysisInput(BaseModel):
    """Input schema for sentiment analysis"""
    text: str = Field(..., min_length=1, description="Text to analyze for sentiment")

class SentimentAnalysisOutput(BaseModel):
    """Output schema for sentiment analysis"""
    sentiment: Literal["Negative", "Neutral", "Positive"]
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score for the prediction")
    probabilities: dict = Field(..., description="Probability scores for each sentiment class")

def load_model():
    """Load the DistilBERT sentiment analysis model and tokenizer"""
    global model, tokenizer
    try:
        # Get the directory where this file is located
        current_dir = Path(__file__).parent
        model_dir = current_dir
        
        logger.info(f"Attempting to load sentiment model from: {model_dir}")
        
        # Check if model files exist
        model_path = model_dir / 'model.safetensors'
        config_path = model_dir / 'config.json'
        tokenizer_path = model_dir / 'tokenizer.json'
        
        if not model_path.exists():
            logger.error(f"Model file not found: {model_path}")
            return False
        
        if not config_path.exists():
            logger.error(f"Config file not found: {config_path}")
            return False
        
        logger.info("Loading DistilBERT model and tokenizer...")
        
        # Load tokenizer
        tokenizer = DistilBertTokenizer.from_pretrained(str(model_dir))
        logger.info("Tokenizer loaded successfully")
        
        # Load model
        model = DistilBertForSequenceClassification.from_pretrained(str(model_dir))
        model.eval()  # Set to evaluation mode
        logger.info(f"Sentiment model loaded successfully from {model_dir}")
        
        # Check if CUDA is available, otherwise use CPU
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        model.to(device)
        logger.info(f"Model loaded on device: {device}")
        
        return True
        
    except Exception as e:
        logger.error(f"Failed to load sentiment model: {e}")
        logger.error(f"Error type: {type(e).__name__}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return False

def is_model_loaded():
    """Check if model and tokenizer are loaded"""
    return model is not None and tokenizer is not None

def predict_sentiment(text: str) -> dict:
    """
    Predict sentiment for a given text
    
    Args:
        text: The text to analyze
        
    Returns:
        Dictionary with sentiment, confidence, and probabilities
    """
    if not is_model_loaded():
        raise ValueError("Model not loaded. Please ensure the model is initialized.")
    
    try:
        # Tokenize the input text
        inputs = tokenizer(
            text,
            truncation=True,
            padding=True,
            max_length=512,
            return_tensors="pt"
        )
        
        # Move inputs to the same device as model
        device = next(model.parameters()).device
        inputs = {k: v.to(device) for k, v in inputs.items()}
        
        # Make prediction
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
            probabilities = torch.softmax(logits, dim=-1)[0]
        
        # Get predicted class and confidence
        predicted_class = torch.argmax(probabilities).item()
        confidence = probabilities[predicted_class].item()
        
        # Map class to sentiment label
        sentiment = LABEL_MAPPING.get(predicted_class, "Neutral")
        
        # Get probabilities for all classes
        prob_dict = {
            LABEL_MAPPING[i]: probabilities[i].item() 
            for i in range(len(LABEL_MAPPING))
        }
        
        return {
            "sentiment": sentiment,
            "confidence": round(confidence, 4),
            "probabilities": prob_dict
        }
        
    except Exception as e:
        logger.error(f"Error during sentiment prediction: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise

def predict_sentiment_from_dict(request_data: dict) -> dict:
    """
    Predict sentiment from a dictionary input (for API compatibility)
    
    Args:
        request_data: Dictionary containing 'text' key
        
    Returns:
        Dictionary with sentiment analysis results
    """
    text = request_data.get('text', '')
    if not text or not text.strip():
        raise ValueError("Text field is required and cannot be empty")
    
    return predict_sentiment(text.strip())

def predict_sentiment_from_pydantic(input_data: SentimentAnalysisInput) -> SentimentAnalysisOutput:
    """
    Predict sentiment from Pydantic input model
    
    Args:
        input_data: SentimentAnalysisInput Pydantic model
        
    Returns:
        SentimentAnalysisOutput Pydantic model
    """
    result = predict_sentiment(input_data.text)
    return SentimentAnalysisOutput(**result)

# Load model when module is imported (similar to churn_preprocessing.py)
load_model()

