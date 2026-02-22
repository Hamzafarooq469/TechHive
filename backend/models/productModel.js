
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = new Schema({
  user: { type: String, ref: 'User' },
  createdBy: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, min: 0 },
  imageUrl: { type: String, required: true },

  // New Fields 👇
  averageRating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 }

}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);
