
const Message = require("../models/messageModel");
const User = require("../models/userModel")

const sendMessage = async (req, res) => {
  try {
    const { room, message, uid, senderName } = req.body;

    const newMessage = {
      uid,
      senderName,
      message,
      timestamp: new Date(),
      status: "sent",
    };

    const updatedRoom = await Message.findOneAndUpdate(
      { roomId: room },
      { $push: { messages: newMessage } },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: "Message sent successfully",
      data: updatedRoom
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
};

const getMessagesByRoom = async (req, res) => {
  try {
    const roomId = req.params.roomId;
    console.log("Fetching messages for room:", roomId);
    
    const room = await Message.findOne({ roomId });
    
    if (!room) {
      return res.status(200).json([]);
    }
    
    const sortedMessages = room.messages.sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    res.status(200).json(sortedMessages);
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

const getContactsForSupport = async (req, res) => {
  try {
    const supportUid = req.params.uid;

    // Find all messages where the room includes this support user
    const rooms = await Message.find({
      roomId: { $regex: supportUid } 
    });

    // Extract customer UIDs from roomId
    const customerUids = rooms
      .map(room => {
        const parts = room.roomId.split('_');
        // return the UID that is NOT the support UID
        return parts.find(uid => uid !== supportUid);
      })
      .filter(Boolean); // remove undefined

    const uniqueCustomerUids = [...new Set(customerUids)];

    const customers = await User.find({ uid: { $in: uniqueCustomerUids } });

    res.status(200).json(customers);
  } catch (error) {
    console.error("Failed to fetch contacts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};




module.exports = { 
  sendMessage, 
  getMessagesByRoom,
  getContactsForSupport
 };