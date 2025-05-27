let connection = null;

const secretInput = document.getElementById("secret");
const threadInput = document.getElementById("threadId");
const tenantInput = document.getElementById("tenantId");
const chatBox = document.getElementById("chat");
const messageInput = document.getElementById("messageInput");
const connectBtn = document.getElementById("connectBtn");
const sendBtn = document.getElementById("sendBtn");
const disconnectBtn = document.getElementById("disconnectBtn");
const url = document.getElementById("url");
let currentThreadId = null; // Initialize as null

connectBtn.onclick = async () => {
  const token = secretInput.value.trim();
  const initialThreadId = threadInput.value.trim();
  const tenantId = tenantInput.value.trim();

  if (!token || !tenantId) {
    alert("Please enter both Secret Key and Tenant ID");
    return;
  }

  currentThreadId = initialThreadId || null; // Assign null if initialThreadId is empty

  connection = new signalR.HubConnectionBuilder()
    .withUrl(`http://localhost:5000/ws/chat?tenantId=${encodeURIComponent(tenantInput.value.trim())}`, {
      Headers: "",  
      accessTokenFactory: () => token
    })
    .configureLogging(signalR.LogLevel.Information)
    .build();

  connection.on("ReceiveMessage", (message) => {
    const div = document.createElement("div");
    div.classList.add("message", "received");
    div.textContent = "Agent: " + message;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
  });

  connection.on("InboundProcessed", (message) => {
    const div = document.createElement("div");
    div.classList.add("message");
    div.textContent = "Inbound acknowledged";
    chatBox.appendChild(div);
    console.log('ThreadId:', message);
    currentThreadId = message || null; // Assign null if message is empty
    threadInput.value = message || ''; // Update the UI with empty string if null
  });

  try {
    await connection.start();
    // await connection.invoke("RegisterThread", currentThreadId);
    alert("Connected!");
    connectBtn.disabled = true;
    disconnectBtn.disabled = false;
  } catch (err) {
    console.error(err);
    alert("Failed to connect.");
  }
};

disconnectBtn.onclick = async () => {
  if (!connection || connection.state !== "Connected") {
    alert("Not connected.");
    return;
  }

  try {
    await connection.stop();
    connection = null;
    connectBtn.disabled = false;
    disconnectBtn.disabled = true;
    alert("Disconnected!");
  } catch (err) {
    console.error("Failed to disconnect:", err);
    alert("Failed to disconnect.");
  }
};

sendBtn.onclick = async () => {
  const text = messageInput.value.trim();
  if (!text || !connection || connection.state !== "Connected") {
    alert("You must connect and enter a message.");
    return;
  }

  const message = {
    threadId: currentThreadId,
    text
  };

  const div = document.createElement("div");
  div.classList.add("message", "sent");
  div.textContent = "You: " + text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;

  const request = {
    threadId: currentThreadId || null,
    agent: document.getElementById("agent").value,
    workflowType: document.getElementById("workflowType").value,
    workflowId: document.getElementById("workflowId").value,
    participantId: document.getElementById("participantId").value,
    content: text,
    metadata: null
  };
  messageInput.value = "";

  try {
    await connection.invoke("SendInboundMessage", request);
  } catch (err) {
    console.error("Failed to send message:", err);
  }
};