"""
FastAPI Router for Mail Services
Provides AI-powered email generation endpoints
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import traceback
from .email_bot import get_email_bot

# Pydantic models
class GenerateEmailRequest(BaseModel):
    prompt: str
    conversation_history: Optional[List[Dict]] = None

class RefineEmailRequest(BaseModel):
    feedback: str
    current_subject: str
    current_body: str
    conversation_history: Optional[List[Dict]] = None

class EmailResponse(BaseModel):
    subject: str
    html: str
    email_type: Optional[str] = None
    tone: Optional[str] = None
    success: bool

# Create router
router = APIRouter(tags=["Mail Services"])

@router.post("/generate-email", response_model=EmailResponse)
async def generate_email(request: GenerateEmailRequest):
    """Generate a marketing email using AI"""
    try:
        bot = get_email_bot()
        result = await bot.generate_email(
            prompt=request.prompt,
            conversation_history=request.conversation_history
        )
        return EmailResponse(**result)
    except Exception as e:
        print("[MailServices] Error in /generate-email:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/refine-email", response_model=EmailResponse)
async def refine_email(request: RefineEmailRequest):
    """Refine an existing email based on feedback"""
    try:
        bot = get_email_bot()
        result = await bot.refine_email(
            feedback=request.feedback,
            current_subject=request.current_subject,
            current_body=request.current_body,
            conversation_history=request.conversation_history
        )
        return EmailResponse(**result)
    except Exception as e:
        print("[MailServices] Error in /refine-email:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "Mail Services"}
