const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const orderSchema = new Schema({
    user: { type: String, ref: 'User' },
    cart: { type: mongoose.Schema.Types.ObjectId, ref: "Cart" },
    shipping: { type: mongoose.Schema.Types.ObjectId, ref: "Shipping" },
    status: {
        type: String,
        enum: ['Processing', 'Confirmed', 'Shipped', 'Delivered', 'Cancel', 'Delayed'],
        default: 'Processing'
    },
    isGuest: {
        type: Boolean,
        default: false,
    },
    totalAmount: Number,
    trackingNumber: { type: String, unique: true },
    orderNumber: { type: String, unique: true },

    // ✅ NEW FIELD: Store the unique coupon code used (optional)
    couponCode: { type: String, default: null }, 
    // ✅ NEW FIELD: The monetary value of the cashback earned on this order (for aggregation)
    cashbackAmount: { 
        type: Number, 
        default: 0 
    },
    // ✅ NEW FIELD: The number of unique coupons applied to this order (for aggregation)
    couponUsed: { 
        type: Number, 
        default: 0 
    },

    orderItems: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
            name: String,
            image: String,
            price: Number,
            quantity: Number
        }
    ]

}, { timestamps: true });


module.exports = mongoose.model('Order', orderSchema)