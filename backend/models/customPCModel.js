const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const customPCSchema = new Schema(
  {
    user: { type: String, ref: 'User', required: true },
    sessionId: { type: String, required: true },
    currentStep: { 
      type: String, 
      enum: ['ram', 'ssd', 'cpu', 'gpu', 'psu', 'motherboard', 'aircooler', 'case', 'complete'],
      default: 'ram'
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'cancelled'],
      default: 'in_progress'
    },
    components: {
      ram: {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: String,
        price: Number,
        specifications: Object
      },
      ssd: {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: String,
        price: Number,
        specifications: Object
      },
      cpu: {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: String,
        price: Number,
        specifications: Object
      },
      gpu: {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: String,
        price: Number,
        specifications: Object
      },
      psu: {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: String,
        price: Number,
        specifications: Object
      },
      motherboard: {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: String,
        price: Number,
        specifications: Object
      },
      aircooler: {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: String,
        price: Number,
        specifications: Object
      },
      case: {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: String,
        price: Number,
        specifications: Object
      }
    },
    totalPrice: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("CustomPC", customPCSchema);

