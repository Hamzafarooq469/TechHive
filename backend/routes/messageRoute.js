

const express = require("express");
const router = express.Router();
const { sendMessage, getMessagesByRoom, getContactsForSupport } = require("../controller/messageController");

router.post("/send", sendMessage);
router.get("/:roomId", getMessagesByRoom);
router.get('/contacts/:uid', getContactsForSupport);

module.exports = router;
