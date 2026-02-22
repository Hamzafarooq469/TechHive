"""
Email Writing Bot using LangGraph
Helps admins generate professional marketing emails
"""

import os
import json
from typing import Dict, List, Optional
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langgraph.graph import StateGraph, END
from typing_extensions import TypedDict

# Load environment variables
SERVICES_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOTENV_PATH = os.path.join(SERVICES_DIR, ".env")
load_dotenv(dotenv_path=DOTENV_PATH)

# Load TechHive company information
MAIL_SERVICES_DIR = os.path.dirname(os.path.abspath(__file__))
TECHHIVE_INFO_PATH = os.path.join(MAIL_SERVICES_DIR, "techhive_info.json")

def load_techhive_info() -> Dict:
    """Load TechHive company information from JSON"""
    try:
        with open(TECHHIVE_INFO_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"[EmailBot] Error loading TechHive info: {e}")
        return {}

# Email State
class EmailState(TypedDict):
    messages: List
    email_subject: Optional[str]
    email_body: Optional[str]
    email_type: Optional[str]  # promotional, announcement, newsletter, etc.
    target_audience: Optional[str]
    tone: Optional[str]  # professional, friendly, urgent, casual

class EmailBot:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")
        
        # Load TechHive company information
        self.techhive_info = load_techhive_info()
        
        self.llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.7,
            api_key=self.api_key
        )
        
        # Build LangGraph workflow
        self.workflow = self._build_workflow()
        self.app = self.workflow.compile()
        
        print("[EmailBot] Initialized successfully with TechHive knowledge base")
    
    def _build_workflow(self) -> StateGraph:
        """Build the LangGraph workflow for email generation"""
        workflow = StateGraph(EmailState)
        
        # Add nodes
        workflow.add_node("analyze_request", self._analyze_request)
        workflow.add_node("generate_email", self._generate_email)
        workflow.add_node("refine_email", self._refine_email)
        
        # Add edges
        workflow.set_entry_point("analyze_request")
        workflow.add_edge("analyze_request", "generate_email")
        workflow.add_edge("generate_email", END)
        workflow.add_edge("refine_email", END)
        
        return workflow
    
    def _analyze_request(self, state: EmailState) -> EmailState:
        """Analyze the user's request to extract email parameters"""
        messages = state["messages"]
        last_message = messages[-1].content if messages else ""
        
        system_prompt = """You are an expert email marketing analyst. Analyze the user's request and extract:
1. Email type (promotional, announcement, newsletter, welcome, etc.)
2. Target audience
3. Desired tone (professional, friendly, urgent, casual, etc.)
4. Key points to include

Respond in JSON format:
{
    "email_type": "type",
    "target_audience": "audience description",
    "tone": "tone",
    "key_points": ["point1", "point2"]
}"""
        
        try:
            response = self.llm.invoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=last_message)
            ])
            
            # Try to parse JSON from response
            import json
            analysis = json.loads(response.content)
            
            state["email_type"] = analysis.get("email_type", "general")
            state["target_audience"] = analysis.get("target_audience", "customers")
            state["tone"] = analysis.get("tone", "professional")
            
        except Exception as e:
            print(f"[EmailBot] Analysis error: {e}")
            # Fallback to defaults
            state["email_type"] = "general"
            state["target_audience"] = "customers"
            state["tone"] = "professional"
        
        return state
    
    def _generate_email(self, state: EmailState) -> EmailState:
        """Generate the email content"""
        messages = state["messages"]
        email_type = state.get("email_type", "general")
        target_audience = state.get("target_audience", "customers")
        tone = state.get("tone", "professional")
        
        last_message = messages[-1].content if messages else ""
        
        # Prepare company context from RAG
        company_context = self._format_company_context()
        
        system_prompt = f"""You are a professional email marketing copywriter for TechHive, an e-commerce platform.

Task: Write a compelling marketing email based on the user's request.

Email Type: {email_type}
Target Audience: {target_audience}
Tone: {tone}

IMPORTANT - Company Information (USE THIS IN ALL EMAILS):
{company_context}

Guidelines:
- Write in HTML format for email clients
- Include a clear subject line
- Use proper email structure (greeting, body, CTA, signature)
- Keep it concise but engaging
- Include relevant emojis where appropriate
- Make CTAs stand out with buttons styled like: <a href="URL" style="display: inline-block; padding: 15px 30px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0;">Button Text</a>
- DO NOT include "From:" in the email body - it's already in email headers
- ALWAYS include a professional footer with company information

Email Structure:
1. Greeting
2. Main content (with the user's requested information)
3. Clear Call-to-Action button
4. Closing message
5. Professional Footer (REQUIRED) - Use this exact format:

<div style="margin-top: 30px; padding: 20px 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; color: white; font-family: Arial, sans-serif;">
    <div style="text-align: center; margin-bottom: 12px;">
        <h2 style="margin: 0; font-size: 20px; font-weight: bold;">TechHive</h2>
        <p style="margin: 3px 0 0 0; font-size: 12px; opacity: 0.9;">Your Premium Tech Destination</p>
    </div>
    
    <div style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 6px; margin: 12px 0;">
        <div style="display: table; width: 100%;">
            <div style="display: table-row;">
                <div style="display: table-cell; padding: 4px; font-size: 13px;">
                    <strong>📧</strong> support@techhive.com
                </div>
            </div>
            <div style="display: table-row;">
                <div style="display: table-cell; padding: 4px; font-size: 13px;">
                    <strong>📞</strong> +92-300-1234567
                </div>
            </div>
            <div style="display: table-row;">
                <div style="display: table-cell; padding: 4px; font-size: 13px;">
                    <strong>💬</strong> <a href="https://wa.me/923001234567" style="color: white; text-decoration: underline;">WhatsApp</a>
                </div>
            </div>
            <div style="display: table-row;">
                <div style="display: table-cell; padding: 4px; font-size: 13px;">
                    <strong>🕐</strong> Mon-Sat: 9AM-8PM, Sun: 10AM-6PM
                </div>
            </div>
        </div>
    </div>
    
    <div style="text-align: center; margin: 12px 0;">
        <a href="https://www.facebook.com/techhive" style="display: inline-block; margin: 0 6px; color: white; font-size: 20px; text-decoration: none;">📘</a>
        <a href="https://www.instagram.com/techhive" style="display: inline-block; margin: 0 6px; color: white; font-size: 20px; text-decoration: none;">📸</a>
        <a href="https://www.twitter.com/techhive" style="display: inline-block; margin: 0 6px; color: white; font-size: 20px; text-decoration: none;">🐦</a>
        <a href="https://www.techhive.com" style="display: inline-block; margin: 0 6px; color: white; font-size: 20px; text-decoration: none;">🌐</a>
    </div>
    
    <div style="text-align: center; font-size: 11px; opacity: 0.8; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.3);">
        <p style="margin: 3px 0;">📍 123 Tech Plaza, F-7 Markaz, Islamabad, Pakistan</p>
        <p style="margin: 6px 0;"><a href="https://www.techhive.com/unsubscribe" style="color: white; text-decoration: underline;">Unsubscribe</a> | <a href="https://www.techhive.com/privacy-policy" style="color: white; text-decoration: underline;">Privacy Policy</a></p>
        <p style="margin: 6px 0; opacity: 0.7;">© 2025 TechHive. All rights reserved.</p>
    </div>
</div>

Respond in JSON format:
{{
    "subject": "Email subject line",
    "html": "Full HTML email content with proper footer",
    "preview": "Plain text preview (first 2-3 sentences)"
}}"""
        
        try:
            response = self.llm.invoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=last_message)
            ])
            
            # Parse JSON response
            import json
            email_data = json.loads(response.content)
            
            state["email_subject"] = email_data.get("subject", "")
            state["email_body"] = email_data.get("html", "")
            state["messages"].append(AIMessage(content=f"Generated email: {email_data.get('preview', '')}"))
            
        except Exception as e:
            print(f"[EmailBot] Generation error: {e}")
            # Fallback response
            response_content = response.content if 'response' in locals() else "Error generating email"
            state["email_subject"] = "Your TechHive Update"
            state["email_body"] = f"<p>{response_content}</p>"
            state["messages"].append(AIMessage(content="Generated email with fallback content"))
        
        return state
    
    def _format_company_context(self) -> str:
        """Format company information for the prompt"""
        info = self.techhive_info
        
        contact = info.get('contact_info', {})
        online = info.get('online_presence', {})
        address = info.get('physical_address', {})
        policies = info.get('policies', {})
        
        context = f"""
Company Name: {info.get('company_info', {}).get('name', 'TechHive')}
Tagline: {info.get('company_info', {}).get('tagline', '')}

Contact Information:
- Email: {contact.get('customer_support_email', '')}
- Phone: {contact.get('phone_number', '')}
- WhatsApp: {contact.get('whatsapp_link', '')}
- Business Hours: {contact.get('business_hours', '')}

Website & Social:
- Website: {online.get('website', '')}
- Facebook: {online.get('facebook', '')}
- Instagram: {online.get('instagram', '')}

Address: {address.get('street', '')}, {address.get('city', '')}, {address.get('country', '')}

Key Policies:
- Returns: {policies.get('return_policy', '')}
- Shipping: {policies.get('shipping', '')}

Unsubscribe Link: {info.get('email_footer', {}).get('unsubscribe_link', '')}
"""
        return context
    
    def _refine_email(self, state: EmailState) -> EmailState:
        """Refine existing email based on feedback"""
        messages = state["messages"]
        current_subject = state.get("email_subject", "")
        current_body = state.get("email_body", "")
        
        # Get the last user message (feedback)
        feedback = messages[-1].content if messages else ""
        
        system_prompt = f"""You are refining an email based on user feedback.

Current Subject: {current_subject}
Current Body: {current_body[:500]}...

User Feedback: {feedback}

Task: Modify the email according to the feedback while maintaining quality.

Respond in JSON format:
{{
    "subject": "Updated subject line",
    "html": "Updated HTML email content",
    "changes": "Brief description of changes made"
}}"""
        
        try:
            response = self.llm.invoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=feedback)
            ])
            
            import json
            email_data = json.loads(response.content)
            
            state["email_subject"] = email_data.get("subject", current_subject)
            state["email_body"] = email_data.get("html", current_body)
            state["messages"].append(AIMessage(content=f"Refined email: {email_data.get('changes', '')}"))
            
        except Exception as e:
            print(f"[EmailBot] Refinement error: {e}")
            state["messages"].append(AIMessage(content="Could not refine email. Please try again."))
        
        return state
    
    async def generate_email(self, prompt: str, conversation_history: List[Dict] = None) -> Dict:
        """Generate a new email based on prompt"""
        # Convert conversation history to LangChain messages
        messages = []
        if conversation_history:
            for msg in conversation_history:
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                elif msg["role"] == "assistant":
                    messages.append(AIMessage(content=msg["content"]))
        
        # Add current prompt
        messages.append(HumanMessage(content=prompt))
        
        # Create initial state
        initial_state = {
            "messages": messages,
            "email_subject": None,
            "email_body": None,
            "email_type": None,
            "target_audience": None,
            "tone": None
        }
        
        # Run the workflow
        result = await self.app.ainvoke(initial_state)
        
        return {
            "subject": result.get("email_subject", ""),
            "html": result.get("email_body", ""),
            "email_type": result.get("email_type", "general"),
            "tone": result.get("tone", "professional"),
            "success": True
        }
    
    async def refine_email(self, feedback: str, current_subject: str, current_body: str, conversation_history: List[Dict] = None) -> Dict:
        """Refine existing email based on feedback"""
        messages = []
        if conversation_history:
            for msg in conversation_history:
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                elif msg["role"] == "assistant":
                    messages.append(AIMessage(content=msg["content"]))
        
        messages.append(HumanMessage(content=feedback))
        
        initial_state = {
            "messages": messages,
            "email_subject": current_subject,
            "email_body": current_body,
            "email_type": None,
            "target_audience": None,
            "tone": None
        }
        
        # Run refinement
        result = self._refine_email(initial_state)
        
        return {
            "subject": result.get("email_subject", current_subject),
            "html": result.get("email_body", current_body),
            "success": True
        }

# Global instance
email_bot = None

def get_email_bot() -> EmailBot:
    """Get or create email bot instance"""
    global email_bot
    if email_bot is None:
        email_bot = EmailBot()
    return email_bot
