"""
Churn Prediction Data Preprocessing
Handles data transformation and prediction for the churn prediction model
"""

import pandas as pd
import joblib
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import Literal

logger = logging.getLogger(__name__)

# Global model variable
model = None

# Pydantic models for request/response
class ChurnPredictionInput(BaseModel):
    """Input schema for churn prediction"""
    Gender: str
    SatisfactionScore: int = Field(ge=1, le=5)
    CityTier: int = Field(ge=1, le=3) 
    MaritalStatus: str
    PreferedOrderCat: str = Field(alias="PreferedOrderCategory")  # Handle both field names
    Tenure: int = Field(ge=0)
    Complain_Raw: int = Field(ge=0, le=1)
    CashbackAmount: float = Field(ge=0)
    OrderAmountHikeFromlastYear: float
    CouponUsed: int = Field(ge=0)
    OrderCount: int = Field(ge=0)
    DaySinceLastOrder: int = Field(ge=0)
    WarehouseToHome: float = Field(ge=0)
    HourSpendOnApp: int = Field(ge=0)
    NumberOfAddress: int = Field(ge=1)
    PreferredLoginDevice: str
    PreferredPaymentMode: str
    Complain_Str: str

    class Config:
        populate_by_name = True  # Updated for Pydantic v2

class ChurnPredictionOutput(BaseModel):
    """Output schema for churn prediction"""
    churn_probability: float
    risk_tier: Literal["Low", "Medium", "High"]

def load_model():
    """Load the ML model"""
    global model
    try:
        # Get the directory where this file is located
        current_dir = Path(__file__).parent
        model_path = current_dir / 'churn_prediction_model.joblib'
        
        logger.info(f"Attempting to load model from: {model_path}")
        logger.info(f"Model file exists: {model_path.exists()}")
        
        if model_path.exists():
            logger.info("Loading model with joblib...")
            model = joblib.load(model_path)
            logger.info(f"Churn model loaded successfully from {model_path}")
            logger.info(f"Model type: {type(model)}")
        else:
            logger.error(f"Model file not found: {model_path}")
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        logger.error(f"Error type: {type(e).__name__}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")

def is_model_loaded():
    """Check if model is loaded"""
    return model is not None

def preprocess_input(user_data: dict) -> pd.DataFrame:
    """
    Preprocess input data for model prediction
    """
    # Extract values (handle both single values and arrays from Node.js)
    input_values = {}
    for key, value in user_data.items():
        if isinstance(value, list) and len(value) > 0:
            input_values[key] = value[0]
        else:
            input_values[key] = value

    # Handle field name variations
    if 'PreferedOrderCategory' in input_values and 'PreferedOrderCat' not in input_values:
        input_values['PreferedOrderCat'] = input_values['PreferedOrderCategory']

    # Create DataFrame
    input_dict = {
        'Gender': [input_values.get('Gender')],
        'SatisfactionScore': [input_values.get('SatisfactionScore')],
        'CityTier': [input_values.get('CityTier')],
        'MaritalStatus': [input_values.get('MaritalStatus')],
        'PreferedOrderCat': [input_values.get('PreferedOrderCat')],
        'Tenure': [input_values.get('Tenure')],
        'Complain_Raw': [input_values.get('Complain_Raw')],
        'CashbackAmount': [input_values.get('CashbackAmount')],
        'OrderAmountHikeFromlastYear': [input_values.get('OrderAmountHikeFromlastYear')], 
        'CouponUsed': [input_values.get('CouponUsed')], 
        'OrderCount': [input_values.get('OrderCount')], 
        'DaySinceLastOrder': [input_values.get('DaySinceLastOrder')], 
        'WarehouseToHome': [input_values.get('WarehouseToHome')], 	
        'HourSpendOnApp': [input_values.get('HourSpendOnApp')], 	
        'NumberOfAddress': [input_values.get('NumberOfAddress')], 
        'PreferredLoginDevice': [input_values.get('PreferredLoginDevice')], 
        'PreferredPaymentMode': [input_values.get('PreferredPaymentMode')], 	
        'Complain_Str': [input_values.get('Complain_Str')], 
    }
    
    input_df = pd.DataFrame(input_dict)
    
    # Fix feature name: 'Complain' -> 'Complain_1'
    input_df['Complain_1'] = input_df['Complain_Raw']
    input_df = input_df.drop(columns=['Complain_Raw'])

    # One-hot encoding for categorical features
    categorical_cols_for_ohe = [
        'PreferredLoginDevice', 'CityTier', 'PreferredPaymentMode', 
        'Gender', 'PreferedOrderCat', 'MaritalStatus', 'Complain_Str' 
    ]
    
    input_df['CityTier'] = input_df['CityTier'].astype(object) 
    input_df = pd.get_dummies(input_df, columns=categorical_cols_for_ohe, drop_first=False)

    # Expected features (must match training data)
    expected_features = [
        'Tenure', 'WarehouseToHome', 'HourSpendOnApp', 'SatisfactionScore', 
        'NumberOfAddress', 'OrderAmountHikeFromlastYear', 'CouponUsed', 
        'OrderCount', 'DaySinceLastOrder', 'CashbackAmount', 
        'PreferredLoginDevice_Mobile Phone', 'PreferredLoginDevice_Phone', 
        'CityTier_2', 'CityTier_3', 
        'PreferredPaymentMode_Credit Card', 'PreferredPaymentMode_Debit Card', 
        'PreferredPaymentMode_E wallet', 'PreferredPaymentMode_UPI', 
        'Gender_Male', 
        'PreferedOrderCat_Grocery', 'PreferedOrderCat_Laptop & Accessory', 
        'PreferedOrderCat_Mobile Phone', 'PreferedOrderCat_Others', 
        'MaritalStatus_Married', 'MaritalStatus_Single', 
        'Complain_1', 
        'Complain_Str_No Complain' 
    ]

    final_input_df = pd.DataFrame(0, index=[0], columns=expected_features)
    
    for col in final_input_df.columns:
        if col in input_df.columns:
            final_input_df[col] = input_df[col].iloc[0]

    return final_input_df[expected_features]

def predict_churn_from_pydantic(data: ChurnPredictionInput):
    """
    Predict customer churn probability using Pydantic input
    """
    if model is None:
        raise Exception("Model not loaded. Check server logs.")
    
    try:
        # Convert Pydantic model to dict
        input_data = data.dict(by_alias=True)
        
        # Preprocess the data
        input_df = preprocess_input(input_data)
        
        # Make prediction
        prediction_proba = model.predict_proba(input_df)[:, 1][0]
        risk_percentage = float(round(prediction_proba * 100, 2))
        
        # Determine risk tier
        if risk_percentage >= 65:
            risk_tier = 'High'
        elif risk_percentage >= 30:
            risk_tier = 'Medium'
        else:
            risk_tier = 'Low'
        
        return ChurnPredictionOutput(
            churn_probability=risk_percentage,
            risk_tier=risk_tier
        )
        
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise Exception(f"Prediction failed: {str(e)}")

def predict_churn_from_dict(request_data: dict):
    """
    Predict customer churn probability using raw dict input (for Node.js compatibility)
    """
    if model is None:
        raise Exception("Model not loaded. Check server logs.")
    
    try:
        # Handle field name conversion for Node.js compatibility
        if 'PreferedOrderCategory' in request_data:
            request_data['PreferedOrderCat'] = request_data['PreferedOrderCategory']
        
        # Preprocess the data
        input_df = preprocess_input(request_data)
        
        # Make prediction
        prediction_proba = model.predict_proba(input_df)[:, 1][0]
        risk_percentage = float(round(prediction_proba * 100, 2))
        
        # Determine risk tier
        if risk_percentage >= 65:
            risk_tier = 'High'
        elif risk_percentage >= 30:
            risk_tier = 'Medium'
        else:
            risk_tier = 'Low'
        
        return {
            'churn_probability': risk_percentage,
            'risk_tier': risk_tier
        }
        
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise Exception("Prediction failed due to internal processing error")

# Load model when module is imported
load_model()