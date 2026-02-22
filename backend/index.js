
const express = require("express")
const dotenv = require("dotenv")
const connectDb = require("./config/db")
const cors = require("cors")

const { createServer } = require("http");
const { Server } = require("socket.io");


dotenv.config({
    path: "./config/.env"
})

const app = express()
connectDb()

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173", 
    credentials: true,
  },
});

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}))

app.use(express.json())
app.use(express.urlencoded ({ extended: true }))

app.use("/user", require("./routes/userRoutes"))
app.use("/product", require("./routes/productRoutes"))
app.use("/cart", require("./routes/cartRoute"))
app.use("/shipping", require("./routes/shippingRoute"))
app.use("/order", require("./routes/orderRoute"))
app.use("/message", require("./routes/messageRoute")); 
app.use("/comment", require("./routes/commentRoute"))
app.use("/custom-pc", require("./routes/customPCRoute"))

app.use("/prediction", require("./routes/MLServiceRoute"))
app.use("/customer", require("./routes/customerProfileRoute"))
app.use('/prediction', require('./routes/customerMetricsRoute'));

app.use('/complain', require('./routes/complainRoute'));

app.use("/coupon", require("./routes/couponRoute"));

app.use("/mail", require("./routes/mailRoute"));

// app.use('/api/payments', require('./routes/paymentRoute'));

const uidToSocket = new Map();

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("register_uid", (uid) => {
    uidToSocket.set(uid, socket.id);
    console.log(`User ${uid} registered with socket ${socket.id}`);
  });

  socket.on("join_room", (data) => {
    const { currentUserId, targetUserId } = data;
    const roomName = [currentUserId, targetUserId].sort().join('_');
    socket.join(roomName);
    console.log(`User ${currentUserId} joined room: ${roomName}`);
  });

  socket.on("send_message", (data) => {
    const { message, room, uid, senderName, targetUserId } = data;
    
    console.log("Message received:", data);
    
    // Create consistent room name (should match the room from frontend)
    const roomName = [uid, targetUserId].sort().join('_');
    
    // Emit to everyone in this specific room (both sender and receiver)
    io.to(roomName).emit("receive_message", { 
      message, 
      uid, 
      senderName,
      roomName,
      targetUserId,
      timestamp: new Date()
    });
    
    console.log(`Message sent to room: ${roomName}`);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
    for (let [uid, sid] of uidToSocket.entries()) {
      if (sid === socket.id) {
        uidToSocket.delete(uid);
        console.log(`User ${uid} disconnected`);
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3000

// Initialize email workers
const initializeWorkers = () => {
  console.log("\n🚀 Starting email workers...");
  require("./queue/worker/emailWorker");
  require("./queue/worker/emailRetryWorker");
  console.log("✅ Email workers started\n");
};

httpServer.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  initializeWorkers();
});
