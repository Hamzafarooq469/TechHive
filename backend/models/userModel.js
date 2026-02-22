
const mongoose = require("mongoose")
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    uid: {
        type: String,
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'customer_support', 'moderator', 'seller'], 
        default: 'user',
    }
}, {
    timestamps: true
})

module.exports = mongoose.model("User", userSchema)