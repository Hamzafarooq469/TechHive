
import React, { useState } from 'react';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add form submission logic here
    console.log('Form submitted:', formData);
    alert('Thank you for your message! We will contact you soon.');
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    });
  };

  return (
    <div className="contact-page">
      {/* Hero Section */}
      <div className="hero-section">
        <h1>Contact TechHive Pakistan</h1>
        <p>We're here to help! Reach out for inquiries, support, or feedback</p>
      </div>

      {/* Contact Methods Section */}
      <div className="content-section">
        <h2 className="section-title">How to Reach Us</h2>
        <div className="contact-methods">
          <div className="contact-card">
            <div className="contact-icon">📍</div>
            <h3>Visit Us</h3>
            <p>Commercial Market, Saddar<br />Rawalpindi, Punjab<br />Pakistan</p>
            <a 
              href="https://maps.google.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="map-link"
            >
              View on Map →
            </a>
          </div>
          
          <div className="contact-card">
            <div className="contact-icon">📞</div>
            <h3>Call Us</h3>
            <p>+92-51-XXXXXXX (Sales)<br />+92-51-XXXXXXX (Support)<br />Mon-Sat: 9AM - 9PM</p>
            <a href="tel:+9251XXXXXXX" className="call-link">
              Call Now
            </a>
          </div>
          
          <div className="contact-card">
            <div className="contact-icon">✉️</div>
            <h3>Email Us</h3>
            <p>sales@TechHivepk.com<br />support@TechHivepk.com<br />info@TechHivepk.com</p>
            <a href="mailto:support@TechHivepk.com" className="email-link">
              Send Email
            </a>
          </div>
        </div>
      </div>

      {/* Contact Form Section */}
      <div className="form-section">
        <h2 className="section-title">Send Us a Message</h2>
        <form onSubmit={handleSubmit} className="contact-form">
          <div className="form-group">
            <label htmlFor="name">Full Name*</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email*</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="subject">Subject*</label>
            <select
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
            >
              <option value="">Select a subject</option>
              <option value="sales">Sales Inquiry</option>
              <option value="support">Technical Support</option>
              <option value="returns">Returns & Refunds</option>
              <option value="feedback">Feedback/Suggestions</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="message">Message*</label>
            <textarea
              id="message"
              name="message"
              rows="5"
              value={formData.message}
              onChange={handleChange}
              required
            ></textarea>
          </div>
          
          <button type="submit" className="submit-btn">
            Send Message
          </button>
        </form>
      </div>

      {/* FAQ Section */}
      <div className="faq-section">
        <h2 className="section-title">Contact FAQs</h2>
        <div className="faq-content">
          <div className="faq-item">
            <h3>What are your customer service hours?</h3>
            <p>Our customer support team is available Monday to Saturday from 9AM to 9PM. For urgent technical support, we offer 24/7 assistance via our emergency hotline.</p>
          </div>
          <div className="faq-item">
            <h3>How quickly can I expect a response?</h3>
            <p>We typically respond to emails within 24 hours. Phone inquiries are handled immediately during business hours. Social media messages receive responses within 12 hours.</p>
          </div>
          <div className="faq-item">
            <h3>Do you have a physical store I can visit?</h3>
            <p>Yes! Our flagship store is located in Commercial Market, Rawalpindi. We also have authorized dealers in Lahore, Karachi, and Islamabad.</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .contact-page {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding-bottom: 40px;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .hero-section {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          margin: 40px auto;
          padding: 60px 40px;
          text-align: center;
          box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
          border: 1px solid rgba(255, 255, 255, 0.18);
        }

        .hero-section h1 {
          font-size: 3.5rem;
          font-weight: 700;
          color: white;
          margin-bottom: 20px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .hero-section p {
          font-size: 1.3rem;
          color: rgba(255, 255, 255, 0.9);
          max-width: 600px;
          margin: 0 auto;
        }

        .content-section, .form-section, .faq-section {
          background: white;
          border-radius: 20px;
          margin: 40px auto;
          padding: 50px 40px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }

        .section-title {
          font-size: 2.5rem;
          color: #2c3e50;
          margin-bottom: 30px;
          text-align: center;
          position: relative;
        }

        .section-title::after {
          content: '';
          width: 80px;
          height: 4px;
          background: linear-gradient(45deg, #667eea, #764ba2);
          display: block;
          margin: 15px auto;
          border-radius: 2px;
        }

        .contact-methods {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 30px;
          margin: 50px 0;
        }

        .contact-card {
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          padding: 30px;
          border-radius: 15px;
          text-align: center;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          border: 2px solid transparent;
        }

        .contact-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
          border-color: #667eea;
        }

        .contact-icon {
          width: 60px;
          height: 60px;
          background: linear-gradient(45deg, #667eea, #764ba2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          font-size: 24px;
          color: white;
        }

        .contact-card h3 {
          font-size: 1.5rem;
          color: #2c3e50;
          margin-bottom: 15px;
        }

        .contact-card p {
          margin-bottom: 20px;
          color: #555;
        }

        .map-link, .call-link, .email-link {
          display: inline-block;
          padding: 8px 20px;
          border-radius: 50px;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .map-link {
          background: #2ecc71;
          color: white;
        }

        .call-link {
          background: #3498db;
          color: white;
        }

        .email-link {
          background: #9b59b6;
          color: white;
        }

        .map-link:hover, .call-link:hover, .email-link:hover {
          transform: translateY(-3px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }

        .contact-form {
          max-width: 800px;
          margin: 0 auto;
        }

        .form-group {
          margin-bottom: 25px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #2c3e50;
        }

        input, select, textarea {
          width: 100%;
          padding: 12px 15px;
          border: 2px solid #ddd;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.3s ease;
        }

        input:focus, select:focus, textarea:focus {
          border-color: #667eea;
          outline: none;
        }

        textarea {
          resize: vertical;
        }

        .submit-btn {
          display: block;
          width: 100%;
          background: linear-gradient(45deg, #667eea, #764ba2);
          color: white;
          padding: 15px;
          border: none;
          border-radius: 50px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .submit-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
        }

        .faq-content {
          max-width: 800px;
          margin: 0 auto;
        }

        .faq-item {
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid #eee;
        }

        .faq-item h3 {
          color: #2c3e50;
          margin-bottom: 15px;
          font-size: 1.3rem;
        }

        .faq-item p {
          color: #555;
          line-height: 1.7;
        }

        @media (max-width: 768px) {
          .hero-section h1 {
            font-size: 2.5rem;
          }
          
          .hero-section p {
            font-size: 1.1rem;
          }
          
          .section-title {
            font-size: 2rem;
          }
          
          .hero-section, .content-section, .form-section, .faq-section {
            padding: 30px 20px;
            margin: 20px auto;
          }
          
          .form-row {
            grid-template-columns: 1fr;
            gap: 0;
          }
          
          .contact-methods {
            grid-template-columns: 1fr;
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ContactUs;