let connection = null;
let currentPage = 1;
let isLoading = false;
let hasMoreMessages = true;

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
    .withUrl(`${url.value.trim()}?tenantId=${encodeURIComponent(tenantInput.value.trim())}`, {
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
    // div.textContent = "Inbound acknowledged";
    chatBox.appendChild(div);
    console.log('ThreadId:', message);
    currentThreadId = message || null; // Assign null if message is empty
    threadInput.value = message || ''; // Update the UI with empty string if null
  });

  connection.on("ThreadHistory", (history) => {
    console.log('Thread history:', history);
    
    // If it's the first page, clear the chat
    if (currentPage === 1) {
      chatBox.innerHTML = '';
    }
    
    // Check if we've reached the end of messages
    if (history.length < 20) {
      hasMoreMessages = false;
    }
    
    // Sort messages by creation time
    const sortedHistory = history.sort((a, b) => 
      new Date(a.createdAt) - new Date(b.createdAt)
    );
    
    // Create a temporary container for new messages
    const tempContainer = document.createElement('div');
    
    // Display each message
    sortedHistory.forEach(message => {
      const div = document.createElement("div");
      div.classList.add("message");
      
      // Add appropriate class based on message direction
      if (message.direction === "Outgoing") {
        div.classList.add("received"); // AI messages
        div.textContent = "AI: " + message.content;
      } else {
        div.classList.add("sent"); // User messages
        div.textContent = "You: " + message.content;
      }
      
      tempContainer.appendChild(div);
    });
    
    // If it's the first page, append to chat box
    // If it's a subsequent page, prepend to chat box
    if (currentPage === 1) {
      chatBox.appendChild(tempContainer);
      chatBox.scrollTop = chatBox.scrollHeight;
    } else {
      // Store current scroll height
      const scrollHeight = chatBox.scrollHeight;
      chatBox.insertBefore(tempContainer, chatBox.firstChild);
      // Maintain scroll position
      chatBox.scrollTop = chatBox.scrollHeight - scrollHeight;
    }
    
    // Increment page number for next load
    currentPage++;
  });

  try {
    currentPage = 1;
    hasMoreMessages = true;
    const agent = document.getElementById("agent").value;
    const participantId = document.getElementById("participantId").value;
    await connection.start();
    await loadMoreMessages();
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
    currentPage = 1;
    hasMoreMessages = true;
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

// Add scroll event listener to chat box
chatBox.addEventListener('scroll', async () => {
  if (chatBox.scrollTop === 0 && !isLoading && hasMoreMessages) {
    await loadMoreMessages();
  }
});

async function loadMoreMessages() {
  if (!connection || connection.state !== "Connected") return;
  
  isLoading = true;
  const agent = document.getElementById("agent").value;
  const participantId = document.getElementById("participantId").value;
  
  try {
    await connection.invoke("GetThreadHistory", agent, participantId, currentPage, 20);
  } catch (err) {
    console.error("Failed to load more messages:", err);
  } finally {
    isLoading = false;
  }
}