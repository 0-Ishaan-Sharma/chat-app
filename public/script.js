const socket = io({
  transports: ["websocket"]
});


const joinContainer = document.getElementById("join-container");
const chatContainer = document.getElementById("chat-container");
const joinBtn = document.getElementById("join-btn");
const sendBtn = document.getElementById("send-btn");

const usernameInput = document.getElementById("username");
const messageInput = document.getElementById("message-input");
const messagesDiv = document.getElementById("messages");
const usersDiv = document.getElementById("users");
const joinError = document.getElementById("join-error");

// Join chat
joinBtn.onclick = () => {
  const username = usernameInput.value.trim();
  if (!username) return;

  socket.emit("join", username);
  joinContainer.classList.add("hidden");
  chatContainer.classList.remove("hidden");
};

// Send message
sendBtn.onclick = sendMessage;
messageInput.addEventListener("keypress", e => {
  if (e.key === "Enter") sendMessage();
});

function sendMessage() {
  const msg = messageInput.value.trim();
  if (!msg) return;

  socket.emit("message", msg);
  messageInput.value = "";
}

// Receive messages
socket.on("message", data => {
  addMessage(`${data.user}: ${data.text}`);
});

// User joined
socket.on("user_joined", username => {
  addSystemMessage(`${username} joined`);
});

// User left
socket.on("user_left", username => {
  addSystemMessage(`${username} left`);
});

// Update user list
socket.on("users_list", users => {
  usersDiv.textContent = `Users (${users.length}/6): ${users.join(", ")}`;
});

// Room full
socket.on("room_full", msg => {
  joinError.textContent = msg;
});

// Helpers
function addMessage(text) {
  const div = document.createElement("div");
  div.className = "message";
  div.textContent = text;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function addSystemMessage(text) {
  const div = document.createElement("div");
  div.className = "message system";
  div.textContent = text;
  messagesDiv.appendChild(div);
}
