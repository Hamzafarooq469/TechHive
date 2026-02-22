
const mongoose = require("mongoose")
const Schema = mongoose.Schema;

const shippingSchema = new Schema({
    user: { type: String, ref: "User" },
    fullName: String,
    address: String,
    city: String,
    postalCode: String,
    country: String,
    // phoneNumber: String,
}, {
    timestamps: true,
})

module.exports = mongoose.model("Shipping", shippingSchema)
