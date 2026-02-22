const mongoose = require('mongoose');

const emailTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  emailBackground: {
    type: String,
    default: '#f4f4f4'
  },
  styles: {
    fontSize: { type: String, default: '16px' },
    fontFamily: { type: String, default: 'Arial, sans-serif' },
    color: { type: String, default: '#333333' },
    backgroundColor: { type: String, default: '#ffffff' },
    textAlign: { type: String, default: 'left' }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('EmailTemplate', emailTemplateSchema);
