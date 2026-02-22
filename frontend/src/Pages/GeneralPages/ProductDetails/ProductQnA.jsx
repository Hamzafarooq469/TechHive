import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaRobot, FaQuestionCircle, FaChevronDown, FaChevronUp } from 'react-icons/fa';

const ProductQnA = ({ product, userId, sessionId }) => {
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);

  // Load pre-generated questions and answers from RAG on component mount
  useEffect(() => {
    loadQuestionsFromRAG();
  }, [product]);

  const loadQuestionsFromRAG = async () => {
    setLoadingQuestions(true);
    
    try {
      // Get pre-stored Q&A from RAG knowledge base
      const response = await axios.get('http://localhost:5000/api/chatbot/products/qna', {
        params: {
          product_name: product.name,
          category: product.category,
          limit: 6
        }
      });

      if (response.data.success && response.data.questions.length > 0) {
        setQuestions(response.data.questions);
      } else {
        // Fallback to category-specific questions if RAG has no data
        const fallbackQuestions = generateFallbackQuestions();
        setQuestions(fallbackQuestions);
      }
    } catch (error) {
      console.log('Error loading Q&A from RAG, using fallback:', error);
      const fallbackQuestions = generateFallbackQuestions();
      setQuestions(fallbackQuestions);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const generateFallbackQuestions = () => {
    // Category-specific fallback questions with answers
    const category = product.category?.toLowerCase() || '';
    
    if (category.includes('laptop') || category.includes('notebook')) {
      return [
        { 
          id: 1, 
          question: "What are the key specifications?", 
          answer: "This laptop features modern specifications typical for its category. Check the product description above for detailed specs including processor, RAM, storage, display, and graphics capabilities."
        },
        { 
          id: 2, 
          question: "Does it have a backlit keyboard?", 
          answer: "Most modern laptops in this category include backlit keyboards with adjustable brightness levels, making it easy to work in low-light conditions."
        },
        { 
          id: 3, 
          question: "Can the RAM or storage be upgraded?", 
          answer: "RAM upgradability depends on the model. Many laptops have soldered RAM that cannot be upgraded, while others have accessible RAM slots. Storage can often be upgraded if it uses M.2 NVMe SSDs. Check the specifications for your specific model."
        },
        { 
          id: 4, 
          question: "What is the expected battery life?", 
          answer: "Battery life typically ranges from 6-12 hours depending on usage. Light tasks like browsing extend battery life, while intensive tasks like gaming or video editing reduce it significantly."
        },
        { 
          id: 5, 
          question: "Does it have a webcam and microphone?", 
          answer: "Yes, most laptops include an HD webcam (720p or 1080p) with built-in microphone, suitable for video calls and online meetings."
        },
        { 
          id: 6, 
          question: "Is it good for gaming or heavy tasks?", 
          answer: "Gaming performance depends on the GPU. Integrated graphics handle light games, while dedicated GPUs (GTX/RTX series) are needed for modern AAA titles at higher settings."
        }
      ];
    } else if (category.includes('gpu') || category.includes('graphics')) {
      return [
        { 
          id: 1, 
          question: "What is the VRAM capacity?", 
          answer: "VRAM capacity varies by model, typically ranging from 6GB to 24GB. More VRAM is beneficial for higher resolutions, ray tracing, and content creation workloads. Check the product specifications for exact details."
        },
        { 
          id: 2, 
          question: "Does it support ray tracing?", 
          answer: "Modern GPUs from RTX 20 series and newer support hardware-accelerated ray tracing through dedicated RT cores, providing realistic lighting and reflections in supported games."
        },
        { 
          id: 3, 
          question: "What power supply wattage is needed?", 
          answer: "Power requirements vary by GPU model. Mid-range cards need 550-650W PSUs, while high-end cards may require 750-850W or more. Always check the manufacturer's specifications."
        },
        { 
          id: 4, 
          question: "What ports does it have?", 
          answer: "Modern GPUs typically include DisplayPort 1.4a, HDMI 2.1, and sometimes USB-C outputs. Number and type vary by model and manufacturer."
        },
        { 
          id: 5, 
          question: "Is it good for 4K gaming?", 
          answer: "4K gaming capability depends on the GPU tier. High-end models handle 4K smoothly, while mid-range cards may need settings adjusted for optimal performance."
        },
        { 
          id: 6, 
          question: "What is the cooling solution?", 
          answer: "Most GPUs use dual or triple-fan cooling systems. Higher-end models may feature advanced cooling with vapor chambers, heat pipes, and RGB lighting."
        }
      ];
    } else if (category.includes('cpu') || category.includes('processor')) {
      return [
        { 
          id: 1, 
          question: "How many cores and threads?", 
          answer: "Core counts range from 4 to 32+ cores depending on the model. Modern CPUs often support SMT/Hyper-Threading, doubling the thread count for better multitasking. Check specifications for exact details."
        },
        { 
          id: 2, 
          question: "What is the base and boost clock speed?", 
          answer: "Boost clock speeds vary by model but typically range from 4.0GHz to 5.8GHz for single-core boost on modern processors, with lower all-core boost speeds."
        },
        { 
          id: 3, 
          question: "Is a cooler included?", 
          answer: "Stock coolers are included with some CPUs (often AMD Ryzen), while higher-end models require separate purchase. Intel K-series processors don't include coolers."
        },
        { 
          id: 4, 
          question: "What socket type does it use?", 
          answer: "Socket type depends on manufacturer and generation. Intel uses LGA1700 for recent generations, while AMD uses AM4/AM5. Check motherboard compatibility."
        },
        { 
          id: 5, 
          question: "What is the TDP?", 
          answer: "TDP (Thermal Design Power) indicates heat output and power consumption, typically ranging from 65W for efficient models to 125W-250W for high-performance processors."
        },
        { 
          id: 6, 
          question: "Does it have integrated graphics?", 
          answer: "Some CPUs include integrated graphics (Intel UHD, AMD Radeon Graphics), suitable for basic tasks. Models ending in 'F' (Intel) or 'X' (AMD Ryzen) typically lack iGPU."
        }
      ];
    } else if (category.includes('ram') || category.includes('memory')) {
      return [
        { 
          id: 1, 
          question: "What is the speed in MHz?", 
          answer: "RAM speed ranges from 2400MHz to 6000MHz+ for DDR4 and DDR5. Higher speeds improve performance, especially in gaming and content creation workloads."
        },
        { 
          id: 2, 
          question: "Is it compatible with my motherboard?", 
          answer: "Check motherboard specifications for DDR type (DDR4/DDR5), maximum speed support, and capacity limits. Also verify physical clearance for tall heat spreaders."
        },
        { 
          id: 3, 
          question: "Can I mix with existing RAM?", 
          answer: "Mixing RAM is possible but not recommended. Best results come from using identical kits. Mixed RAM will run at the speed of the slowest module and may cause instability."
        },
        { 
          id: 4, 
          question: "What capacity do I need?", 
          answer: "8GB is minimum for basic use, 16GB recommended for gaming and multitasking, 32GB+ for content creation and professional workloads."
        },
        { 
          id: 5, 
          question: "Does it have RGB lighting?", 
          answer: "Many modern RAM kits include customizable RGB lighting. Check product specifications to confirm if this model includes RGB features."
        },
        { 
          id: 6, 
          question: "What's the warranty?", 
          answer: "Most RAM comes with lifetime limited warranty from the manufacturer. Check specific warranty terms for this product."
        }
      ];
    } else if (category.includes('ssd') || category.includes('storage')) {
      return [
        { 
          id: 1, 
          question: "What are the read/write speeds?", 
          answer: "NVMe SSDs offer sequential reads up to 7000MB/s, while SATA SSDs max at 550MB/s. Real-world performance also depends on random I/O and sustained write speeds."
        },
        { 
          id: 2, 
          question: "What is the lifespan/endurance?", 
          answer: "SSD endurance is measured in TBW (Terabytes Written). Consumer drives typically offer 200-600 TBW, translating to many years of normal use with warranty periods of 3-5 years."
        },
        { 
          id: 3, 
          question: "Is it NVMe or SATA?", 
          answer: "NVMe SSDs use M.2 PCIe interface for faster speeds, while SATA SSDs use traditional 2.5\" form factor with lower speeds but broader compatibility."
        },
        { 
          id: 4, 
          question: "What capacity should I get?", 
          answer: "256GB minimum for OS only, 512GB recommended for general use, 1TB+ for gaming and content storage, 2TB+ for extensive media libraries."
        },
        { 
          id: 5, 
          question: "Does it come with cloning software?", 
          answer: "Many SSDs include free cloning software to help migrate your existing drive. Check product details or manufacturer website."
        },
        { 
          id: 6, 
          question: "Will it fit my system?", 
          answer: "Check if your system has M.2 slots (for NVMe) or 2.5\" bays (for SATA). Also verify PCIe generation compatibility (Gen 3/4/5)."
        }
      ];
    } else {
      return [
        { 
          id: 1, 
          question: "What are the key features?", 
          answer: "Key features vary by product category. Check the detailed product description above for complete specifications and features."
        },
        { 
          id: 2, 
          question: "Is this compatible with my system?", 
          answer: "Compatibility depends on your specific system configuration. Review the product specifications and compare with your system requirements. Contact support if unsure."
        },
        { 
          id: 3, 
          question: "What's included in the box?", 
          answer: "Package contents typically include the main product, required cables, documentation, and sometimes software. Check the product description for specific package contents."
        },
        { 
          id: 4, 
          question: "How does it compare to alternatives?", 
          answer: "This product offers competitive features for its price point. Compare specifications, reviews, and prices across similar products to find the best fit for your needs."
        },
        { 
          id: 5, 
          question: "What is the warranty?", 
          answer: "Warranty terms vary by manufacturer and product. Most electronics come with 1-3 year limited warranty. Check product specifications for exact warranty information."
        },
        { 
          id: 6, 
          question: "Is this good value for the price?", 
          answer: "Value depends on your specific needs and budget. Consider the features, specifications, brand reputation, and warranty when evaluating overall value."
        }
      ];
    }
  };

  const handleQuestionClick = (questionObj) => {
    if (selectedQuestion === questionObj.id && answer) {
      // Toggle collapse if same question clicked
      setSelectedQuestion(null);
      setAnswer('');
      return;
    }

    setSelectedQuestion(questionObj.id);
    
    // Check if answer is already available from RAG
    if (questionObj.answer && questionObj.answer.trim()) {
      setAnswer(questionObj.answer);
    } else {
      // Fallback: answer not pre-generated, show message
      setAnswer('This question requires specific product details. Please check the product description or contact support for more information.');
    }
  };

  return (
    <div className="product-qna-sidebar">
      <div className="qna-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="header-content">
          <FaRobot className="robot-icon" />
          <h3> FAQ </h3>
        </div>
        {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
      </div>

      {isExpanded && (
        <div className="qna-content">
          <p className="qna-description">
            Click on any question below to get instant answers about this product.
          </p>

          {loadingQuestions ? (
            <div className="loading-questions">
              <div className="spinner"></div>
              <span>Loading questions...</span>
            </div>
          ) : (
            <div className="questions-list">
              {questions.map((q) => (
                <div key={q.id} className="question-item">
                  <button
                    onClick={() => handleQuestionClick(q)}
                    className={`question-btn ${selectedQuestion === q.id ? 'active' : ''}`}
                  >
                    <FaQuestionCircle className="question-icon" />
                    <span>{q.question}</span>
                  </button>

                  {selectedQuestion === q.id && (
                    <div className="answer-container">
                      <div className="answer">
                        <div className="answer-label">
                          <FaRobot size={14} /> Answer:
                        </div>
                        <p>{answer}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .product-qna-sidebar {
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 8px;
          margin: 20px 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .qna-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 8px 8px 0 0;
          cursor: pointer;
          user-select: none;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .robot-icon {
          font-size: 20px;
        }

        .qna-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }

        .qna-content {
          padding: 20px;
        }

        .qna-description {
          font-size: 13px;
          color: #565959;
          margin-bottom: 15px;
          line-height: 1.5;
        }

        .loading-questions {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          gap: 15px;
          color: #667eea;
        }

        .loading-questions .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #667eea;
        }

        .questions-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .question-item {
          border-bottom: 1px solid #f0f0f0;
          padding-bottom: 10px;
        }

        .question-item:last-child {
          border-bottom: none;
        }

        .question-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          background: #f7f7f7;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 13px;
          color: #0F1111;
        }

        .question-btn:hover {
          background: #e8e8e8;
          border-color: #667eea;
        }

        .question-btn.active {
          background: #f0f4ff;
          border-color: #667eea;
          color: #667eea;
        }

        .question-btn:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .question-icon {
          color: #667eea;
          flex-shrink: 0;
        }

        .answer-container {
          margin-top: 10px;
          padding: 15px;
          background: #f9fafb;
          border-left: 3px solid #667eea;
          border-radius: 4px;
        }

        .loading {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #667eea;
          font-size: 13px;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #f3f3f3;
          border-top: 2px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .answer {
          font-size: 13px;
          line-height: 1.6;
        }

        .answer-label {
          display: flex;
          align-items: center;
          gap: 5px;
          font-weight: 600;
          color: #667eea;
          margin-bottom: 8px;
        }

        .answer p {
          margin: 0;
          color: #0F1111;
        }

        @media (max-width: 768px) {
          .product-qna-sidebar {
            margin: 10px 0;
          }

          .qna-content {
            padding: 15px;
          }

          .question-btn {
            font-size: 12px;
            padding: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default ProductQnA;
