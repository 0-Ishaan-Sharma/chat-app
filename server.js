//Database initialization
console.log("MONGO_URL =", process.env.MONGO_URL);

mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => {
    console.error("MongoDB error:", err);
    process.exit(1);
  });


//Server initialization
const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  transports: ["websocket", "polling"],
  cors: {
    origin: "*"
  }
});

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Store connected users
const users = new Map();
const MAX_USERS = 6;

// Socket.IO connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Reject if room is full
  if (users.size >= MAX_USERS) {
    socket.emit("room_full", "Chat room is full (max 6 users)");
    socket.disconnect();
    return;
  }

  // When user joins with a name
  socket.on("join", async (username) => {
  users.set(socket.id, username);

  socket.broadcast.emit("user_joined", username);

  io.emit("users_list", Array.from(users.values()));

  // 🔥 Load last 50 messages for new user
  const history = await Message
    .find()
    .sort({ time: 1 })
    .limit(50);

  socket.emit("message_history", history);
});

  // Handle incoming messages
  socket.on("message", async (msg) => {
  const username = users.get(socket.id);
  if (!username) return;

  const message = new Message({
    user: username,
    text: msg
  });

  await message.save();

  io.emit("message", {
    user: username,
    text: msg,
    time: message.time
  });
});


  // Handle disconnect
  socket.on("disconnect", () => {
    const username = users.get(socket.id);
    if (!username) return;

    users.delete(socket.id);
    socket.broadcast.emit("user_left", username);
    io.emit("users_list", Array.from(users.values()));

    console.log("User disconnected:", socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
