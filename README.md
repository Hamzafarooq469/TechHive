# TechHive 🛒

A comprehensive full-stack e-commerce platform for tech products with integrated AI services including intelligent chatbot, sentiment analysis, and customer churn prediction.

## 🌟 Features

### Core E-Commerce
- **Product Management**: Browse, search, and filter tech products
- **Shopping Cart**: Add, update, and manage cart items
- **Order Management**: Place orders, track shipments, and view order history
- **Custom PC Builder**: Build and customize your own PC configuration
- **Coupon System**: Apply discount codes and promotional offers
- **Customer Profiles**: Manage user accounts and preferences

### AI-Powered Services
- **Intelligent Chatbot**: RAG-based conversational AI for customer support and product queries
- **Sentiment Analysis**: Real-time analysis of customer reviews and feedback
- **Churn Prediction**: ML model to predict customer churn and retention
- **Email Automation**: Automated email responses powered by AI

### Admin Features
- **Product CRUD Operations**: Full product management
- **Order Processing**: Manage orders and shipping
- **Customer Analytics**: View customer metrics and behavior
- **Complaint Management**: Handle customer complaints efficiently
- **Email Templates**: Customizable email templates

## 🛠️ Tech Stack

### Frontend
- **React** - UI library
- **Vite** - Build tool and development server
- **Redux** - State management
- **CSS3** - Styling

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Redis** - Caching and queue management
- **Bull** - Queue management for background jobs
- **Firebase** - Authentication and file storage
- **AWS S3** - File storage

### AI Services (Python)
- **FastAPI** - API framework for services
- **OpenAI** - AI agent and chatbot
- **FAISS** - Vector database for RAG
- **Transformers** - Sentiment analysis model
- **Scikit-learn** - Churn prediction model
- **MongoDB** - Storage for chat history

## 📁 Project Structure

```
TechHive/
├── backend/              # Node.js/Express backend
│   ├── config/          # Database configuration
│   ├── controller/      # API controllers
│   ├── middleware/      # Authentication & validation
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── services/        # External services (AWS, Firebase, Redis)
│   ├── queue/           # Background job processing
│   └── templates/       # Email templates
│
├── frontend/            # React/Vite frontend
│   ├── src/
│   │   ├── Admin/      # Admin dashboard
│   │   ├── Pages/      # Application pages
│   │   ├── Redux/      # State management
│   │   ├── Services/   # API services
│   │   └── Utils/      # Utility functions
│   └── public/         # Static assets
│
└── Services/            # Python microservices
    ├── ChatbotServices/ # AI chatbot with RAG
    ├── MailServices/    # Email bot service
    └── MLServices/      # ML models (churn & sentiment)
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v16 or higher)
- **Python** (v3.9 or higher)
- **MongoDB** (local or cloud instance)
- **Redis** (optional, for queue management)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Hamzafarooq469/TechHive.git
   cd TechHive
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

4. **Python Services Setup**
   ```bash
   cd Services
   pip install -r ChatbotServices/requirements.txt
   pip install -r MailServices/requirements.txt
   pip install -r MLServices/requirements.txt
   ```

### Configuration

#### Backend Environment Variables
Create a `.env` file in the `backend/` directory:
```env
MONGODB_URL=your_mongodb_connection_string
PORT=5000
JWT_SECRET=your_jwt_secret
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
AWS_S3_BUCKET=your_s3_bucket
REDIS_URL=your_redis_url
FIREBASE_PROJECT_ID=your_firebase_project_id
```

#### Frontend Environment Variables
Create a `.env` file in the `frontend/` directory:
```env
VITE_API_URL=http://localhost:5000
VITE_AI_SERVICE_URL=http://localhost:8000
```

#### Python Services Configuration
Create a `.env` file in the `Services/` directory:
```env
OPENAI_API_KEY=your_openai_api_key
MONGODB_URL=your_mongodb_connection_string
```

#### Firebase Setup
Update `backend/services/Firebase/firebaseCredentials.json` with your Firebase credentials.

### Running the Application

1. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```

2. **Start Redis** (optional, if using queue)
   ```bash
   redis-server
   ```

3. **Start Backend**
   ```bash
   cd backend
   npm start
   ```
   Backend runs on: `http://localhost:5000`

4. **Start Frontend**
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend runs on: `http://localhost:5173`

5. **Start Python Services**
   ```bash
   cd Services
   python app.py
   ```
   Services run on: `http://localhost:8000`

## 📡 API Endpoints

### Core Routes
- `/api/users` - User authentication and management
- `/api/products` - Product CRUD operations
- `/api/cart` - Shopping cart operations
- `/api/orders` - Order management
- `/api/custom-pc` - Custom PC configurations
- `/api/coupons` - Coupon management
- `/api/shipping` - Shipping details
- `/api/comments` - Product reviews and comments
- `/api/complains` - Customer complaints
- `/api/messages` - Messaging system

### AI Service Routes
- `/api/ml-service` - ML predictions (churn & sentiment)
- `/api/chatbot` - AI chatbot interactions
- `/api/mail-service` - Email automation

## 🤖 AI Services

### Chatbot Service
- RAG-based conversational AI
- Product knowledge base
- Context-aware responses
- MongoDB storage for chat history

### Sentiment Analysis
- Real-time sentiment classification
- Multi-class prediction (positive, negative, neutral)
- Transformer-based model

### Churn Prediction
- Customer churn probability prediction
- Feature engineering pipeline
- Model retraining capability

## 📦 Key Dependencies

### Backend
- express
- mongoose
- jsonwebtoken
- bcryptjs
- multer
- aws-sdk
- firebase-admin
- bull
- redis

### Frontend
- react
- react-router-dom
- @reduxjs/toolkit
- axios
- i18next

### Python Services
- fastapi
- uvicorn
- openai
- pymongo
- transformers
- scikit-learn
- faiss-cpu

## 🔐 Security Notes

⚠️ **Important**: 
- Never commit `.env` files to the repository
- Keep your API keys and credentials secure
- The `model.safetensors` file (255 MB) is excluded from Git. Download it separately or retrain the sentiment analysis model
- Update Firebase credentials in `firebaseCredentials.json` before deploying

## 📝 License

This project is licensed for educational purposes.

## 👥 Contributing

Contributions, issues, and feature requests are welcome!

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ for TechHive**
