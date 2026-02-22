const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const customerMetricsSchema = new Schema({
    user: { 
        type: String, 
        ref: "User", 
        required: true, 
        unique: true 
    },
    
    // 2. Financial Metrics (Aggregates from Order Schema)
    totalAmountSpent: { 
        type: Number, 
        default: 0 
    },
    cashbackAmountAvg: { 
        type: Number, 
        default: 0 
    },
    orderCount: { 
        type: Number, 
        default: 0 
    },
    orderAmountHikeFromLastYear: { 
        type: Number, 
        default: 0 
    },
    couponUsed: { 
        type: Number, 
        default: 0 
    },

    // 3. Behavioral Metrics (Aggregates from Comment/Message Schemas)
    totalCommentsMade: { 
        type: Number, 
        default: 0 
    },
    avgProductScore: { 
        type: Number, 
        default: 0 
    },
    avgProductPrice: {
        type: Number,
        default: 0
     },
    complain: { 
        type: Number, 
        enum: [0, 1],
        default: 0
    },
    
    // 4. Calculated Location Data (Derived from Shipping Schema)
    warehouseToHome: { 
        type: Number, 
        default: 0 
    },
    
    //  NEW FIELD: Tenure (in months)
    tenure: {
        type: Number,
        default: 0
    },
    daysSinceLastOrder: {
        type: Number,
        default: 0
    },
    
    // 5. System Fields (For Hybrid Architecture)
    calculated_at: {
        type: Date,
        default: Date.now
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("CustomerMetrics", customerMetricsSchema);