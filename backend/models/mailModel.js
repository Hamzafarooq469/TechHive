
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const mailSchema = new Schema({
    senderMail: {
        type: String,
        required: true,
    },
    receiverMail: {
        type: String,
        required: true,
    },
    subject: {
        type: String,
    },
    message: {
        type: String,
    }
}, {
    timestamps: true

})

module.exports = mongoose.model("Mail", mailSchema)