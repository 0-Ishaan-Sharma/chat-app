const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Store connected users
const users = new Map();
const MAX_USERS = 6;

// Basic route (optional)
app.get("/", (req, res) => {
  res.send("Chat server is running");
});

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
  socket.on("join", (username) => {
    users.set(socket.id, username);

    // Notify others
    socket.broadcast.emit("user_joined", username);

    // Send current users list
    io.emit("users_list", Array.from(users.values()));
  });

  // Handle incoming messages
  socket.on("message", (msg) => {
    const username = users.get(socket.id);
    if (!username) return;

    io.emit("message", {
      user: username,
      text: msg,
      time: new Date().toISOString()
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
