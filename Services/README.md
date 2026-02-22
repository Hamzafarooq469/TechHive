# TechHive AI Services Gateway

Unified microservices gateway for ML and Chatbot services.

## Quick Start

### Option 1: Run app.py directly
```bash
cd Services
python app.py
```

### Option 2: Use the start script (Windows)
```bash
cd Services
start_services.bat
```

### Option 3: Use Python start script (Cross-platform)
```bash
cd Services
python start_services.py
```

## Access Points

- **Server**: http://localhost:5000
- **API Docs**: http://localhost:5000/docs
- **Health Check**: http://localhost:5000/health

## Services

### Machine Learning (`/api/ml`)
- Churn prediction
- Model health monitoring

### Chatbot (`/api/chatbot`)
- AI conversational agent
- E-commerce operations
- Knowledge base search
- Order management

## Documentation

See [MICROSERVICES_SETUP.md](MICROSERVICES_SETUP.md) for detailed documentation.

## Migration from Old Setup

If you were previously running:
- `python ai_server.py` (port 8001) for chatbot
- `python app.py` (port 5000) for ML

**Now you only need:**
- `python app.py` (port 5000) for EVERYTHING

Update your API calls:
- `/chat` → `/api/chatbot/chat`
- `/predict` → `/api/ml/predict`
