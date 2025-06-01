// Global variables for managing chat state and connection
let connection = null;                    // SignalR connection instance
let currentPage = 1;                     // Current page number for pagination
let isLoading = false;                   // Flag to prevent multiple simultaneous loads
let hasMoreMessages = true;              // Flag to indicate if more messages are available
let selectedAgent = null;                // Currently selected agent
let currentThreadId = null;              // Current conversation thread ID
let agents = [];                         // List of available agents
let agentChatHistories = {};             // Store chat histories for each agent
let agentUnreadCounts = {};              // Track unread messages for each agent
let agentPages = {};                     // Track current page for each agent
let agentHasMore = {};                   // Track if more messages are available for each agent

// DOM element references
const secretInput = document.getElementById("secret");
const tenantInput = document.getElementById("tenantId");
const chatBox = document.getElementById("chat");
const messageInput = document.getElementById("messageInput");
const connectBtn = document.getElementById("connectBtn");
const sendBtn = document.getElementById("sendBtn");
const disconnectBtn = document.getElementById("disconnectBtn");
const url = document.getElementById("url");
const metadataInput = document.getElementById("metadata");
const toggleSettingsBtn = document.getElementById("toggleSettings");
const settingsContent = document.getElementById("settingsContent");
const agentsContainer = document.getElementById("agentsContainer");
const agentNameDisplay = document.getElementById("agentName");
const agentIcon = document.getElementById("agentIcon");

// Toggle settings panel visibility
toggleSettingsBtn.onclick = () => {
  settingsContent.classList.toggle("active");
  toggleSettingsBtn.textContent = settingsContent.classList.contains("active") ? "▼" : "▶";
};

// Load agents from JSON configuration file
async function loadAgents() {
  try {
    const response = await fetch('agents.json');
    agents = await response.json();
    displayAgents(agents);
  } catch (error) {
    console.error('Error loading agents:', error);
  }
}

// Display agents in the sidebar
function displayAgents(agents) {
  agentsContainer.innerHTML = '';
  agents.forEach(agent => {
    const agentCard = document.createElement('div');
    agentCard.className = 'agent-card';
    agentCard.setAttribute('data-agent-id', agent.id);
    agentCard.innerHTML = `
      <img src="public/images/agent.svg" alt="${agent.name}" class="agent-icon" style="background-color: ${agent.avatarColor}">
      <div class="agent-info">
        <div class="agent-name">${agent.name}</div>
        <div class="agent-description">${agent.description}</div>
      </div>
    `;
    
    agentCard.onclick = () => selectAgent(agent);
    agentsContainer.appendChild(agentCard);
  });
}

// Handle agent selection and update UI accordingly
function selectAgent(agent) {
  selectedAgent = agent;
  
  // Update UI to show selected agent
  document.querySelectorAll('.agent-card').forEach(card => {
    card.classList.remove('active');
  });
  event.currentTarget.classList.add('active');
  
  // Update header with selected agent info
  agentNameDisplay.textContent = agent.name;
  agentIcon.style.backgroundColor = agent.avatarColor;
  
  // Clear unread count for selected agent
  agentUnreadCounts[agent.id] = 0;
  updateAgentNotification(agent.id);
  
  // Display chat history for selected agent
  displayChatHistory(agent.id);
}

// Display chat history for a specific agent
function displayChatHistory(agentId) {
  chatBox.innerHTML = '';
  const history = agentChatHistories[agentId] || [];
  
  history.forEach(message => {
    const div = document.createElement("div");
    
    // Handle different message types (regular messages and handovers)
    if (message.direction === "Handover") {
      div.classList.add("handover-label");
      div.textContent = message.content;
    } else {
      div.classList.add("message");
      if (message.direction === "Outgoing") {
        div.classList.add("received");
        div.textContent = "AI: " + message.content;
      } else {
        div.classList.add("sent");
        div.textContent = "You: " + message.content;
      }
    }
    
    chatBox.appendChild(div);
  });
  
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Update notification badge for an agent
function updateAgentNotification(agentId) {
  const agentCard = document.querySelector(`.agent-card[data-agent-id="${agentId}"]`);
  if (!agentCard) return;
  
  const unreadCount = agentUnreadCounts[agentId] || 0;
  let notificationBadge = agentCard.querySelector('.notification-badge');
  
  if (unreadCount > 0) {
    if (!notificationBadge) {
      notificationBadge = document.createElement('div');
      notificationBadge.className = 'notification-badge';
      agentCard.appendChild(notificationBadge);
    }
    notificationBadge.textContent = unreadCount;
    notificationBadge.style.display = 'block';
  } else if (notificationBadge) {
    notificationBadge.style.display = 'none';
  }
}

// Parse metadata JSON string
function parseMetadata(metadataString) {
  if (!metadataString.trim()) return null;
  try {
    return JSON.parse(metadataString);
  } catch (e) {
    console.error("Invalid JSON in metadata:", e);
    return null;
  }
}

// Show thinking indicator while waiting for AI response
function showThinkingIndicator() {
  const thinkingDiv = document.createElement("div");
  thinkingDiv.className = "message thinking";
  thinkingDiv.innerHTML = `
    AI is thinking
    <div class="thinking-dots">
      <span></span>
      <span></span>
      <span></span>
    </div>
  `;
  chatBox.appendChild(thinkingDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
  return thinkingDiv;
}

// Remove thinking indicator
function removeThinkingIndicator() {
  const thinkingIndicator = chatBox.querySelector('.thinking');
  if (thinkingIndicator) {
    thinkingIndicator.remove();
  }
}

// Show popup notification for new messages
function showPopupNotification(agent, message) {
  const popup = document.createElement('div');
  popup.className = 'popup-notification';
  popup.innerHTML = `
    <img src="public/images/agent.svg" alt="${agent.name}" class="agent-icon" style="background-color: ${agent.avatarColor}">
    <div class="notification-content">
      <div class="notification-title">New message from ${agent.name}</div>
      <div class="notification-message">${message.content}</div>
    </div>
  `;
  
  document.body.appendChild(popup);
  
  // Remove popup after animation completes
  setTimeout(() => {
    popup.remove();
  }, 5000);
}

// Handle scroll events for pagination
chatBox.addEventListener('scroll', async () => {
  if (chatBox.scrollTop === 0 && !isLoading && selectedAgent && agentHasMore[selectedAgent.id]) {
    await loadMoreMessages(selectedAgent);
  }
});

// Load more messages for pagination
async function loadMoreMessages(agent) {
  if (!connection || connection.state !== "Connected") return;
  
  isLoading = true;
  const participantId = document.getElementById("participantId").value;
  const currentPage = agentPages[agent.id] || 1;
  
  try {
    await connection.invoke("GetThreadHistory", agent.agent, agent.workflowType, participantId, currentPage, 20);
  } catch (err) {
    console.error(`Failed to load more messages for agent ${agent.name}:`, err);
  } finally {
    isLoading = false;
  }
}

// Connect to SignalR hub
connectBtn.onclick = async () => {
  if (!selectedAgent) {
    alert("Please select an agent first");
    return;
  }

  const token = secretInput.value.trim();
  const tenantId = tenantInput.value.trim();

  if (!token || !tenantId) {
    alert("Please enter both Secret Key and Tenant ID");
    return;
  }

  // Initialize SignalR connection
  connection = new signalR.HubConnectionBuilder()
    .withUrl(`${url.value.trim()}?tenantId=${encodeURIComponent(tenantId)}`, {
      Headers: "",  
      accessTokenFactory: () => token
    })
    .configureLogging(signalR.LogLevel.Information)
    .build();

  // Handle incoming messages
  connection.on("ReceiveMessage", (message) => {
    console.log(message);
    const agentId = message.workflowId;
    const agent = agents.find(a => a.id === agentId);
    
    // Remove thinking indicator when message is received
    removeThinkingIndicator();
    
    // Initialize chat history for this agent if it doesn't exist
    if (!agentChatHistories[agentId]) {
      agentChatHistories[agentId] = [];
    }
    
    // Add message to agent's chat history
    agentChatHistories[agentId].push({
      content: message.content,
      direction: message.direction || "Outgoing",
      createdAt: new Date().toISOString()
    });
    
    // If this is the currently selected agent, display the message
    if (selectedAgent && selectedAgent.id === agentId) {
      const div = document.createElement("div");
      
      if (message.direction === "Handover") {
        div.classList.add("handover-label");
        div.textContent = message.content;
      } else {
        div.classList.add("message", "received");
        div.textContent = "AI: " + message.content;
      }
      
      chatBox.appendChild(div);
      chatBox.scrollTop = chatBox.scrollHeight;
    } else {
      // Increment unread count for this agent
      agentUnreadCounts[agentId] = (agentUnreadCounts[agentId] || 0) + 1;
      updateAgentNotification(agentId);
      
      // Show popup notification
      if (agent) {
        showPopupNotification(agent, message);
      }
    }
  });

  // Handle thread ID updates
  connection.on("InboundProcessed", (message) => {
    const div = document.createElement("div");
    div.classList.add("message");
    chatBox.appendChild(div);
    console.log('ThreadId:', message);
    currentThreadId = message || null;
  });

  // Handle chat history updates
  connection.on("ThreadHistory", (history) => {
    console.log('Thread history:', history);
    
    if (!history || !history.length) return;
    
    const agentId = history[0].workflowId;
    
    // Initialize chat history for this agent if it doesn't exist
    if (!agentChatHistories[agentId]) {
      agentChatHistories[agentId] = [];
    }
    
    // Check if we've reached the end of messages
    if (history.length < 20) {
      agentHasMore[agentId] = false;
    } else {
      agentHasMore[agentId] = true;
    }
    
    // Sort messages by creation date and map to consistent format
    const sortedHistory = history.sort((a, b) => 
      new Date(a.createdAt) - new Date(b.createdAt)
    ).map(msg => ({
      content: msg.content,
      direction: msg.direction || (msg.isFromUser ? "Incoming" : "Outgoing"),
      createdAt: msg.createdAt
    }));
    
    // Handle pagination
    if (agentPages[agentId] === 1) {
      agentChatHistories[agentId] = sortedHistory;
    } else {
      agentChatHistories[agentId] = [...sortedHistory, ...agentChatHistories[agentId]];
    }
    
    // Increment page number for next load
    agentPages[agentId] = (agentPages[agentId] || 1) + 1;
    
    // Display history if this is the selected agent
    if (selectedAgent && selectedAgent.id === agentId) {
      displayChatHistory(agentId);
    }
  });

  try {
    const participantId = document.getElementById("participantId").value;
    const tenantId = document.getElementById("tenantId").value;
    
    // Start connection and subscribe to agents
    await connection.start().then(() => {
      agents.forEach(agent => {
        console.log(agent.id + participantId);
        connection.invoke("SubscribeToAgent", agent.id, participantId, tenantId)
          .catch(err => console.error(`Subscription error for ${agent.id + participantId + tenantId}:`, err));
      });     
    }).catch(err => console.error("SignalR connection error:", err));
    
    // Reset pagination state for all agents
    agents.forEach(agent => {
      agentPages[agent.id] = 1;
      agentHasMore[agent.id] = true;
    });
    
    // Load initial chat history for all agents
    for (const agent of agents) {
      try {
        await connection.invoke("GetThreadHistory", agent.agent, agent.workflowType, participantId, 1, 20);
      } catch (err) {
        console.error(`Failed to load history for agent ${agent.name}:`, err);
      }
    }
    
    alert("Connected!");
    connectBtn.disabled = true;
    disconnectBtn.disabled = false;
  } catch (err) {
    console.error(err);
    alert("Failed to connect.");
  }
};

// Handle disconnection
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
    currentPage = 1;
    hasMoreMessages = true;
    alert("Disconnected!");
  } catch (err) {
    console.error("Failed to disconnect:", err);
    alert("Failed to disconnect.");
  }
};

// Handle sending messages
sendBtn.onclick = async () => {
  const text = messageInput.value.trim();
  if (!text || !connection || connection.state !== "Connected") {
    alert("You must connect and enter a message.");
    return;
  }

  // Display sent message
  const div = document.createElement("div");
  div.classList.add("message", "sent");
  div.textContent = "You: " + text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;

  // Show thinking indicator
  const thinkingIndicator = showThinkingIndicator();

  // Prepare message request
  const request = {
    threadId: currentThreadId || null,
    agent: selectedAgent.agent,
    workflowType: selectedAgent.workflowType,
    workflowId: selectedAgent.id,
    participantId: document.getElementById("participantId").value,
    content: text,
    metadata: parseMetadata(metadataInput.value) || null
  };
  messageInput.value = "";
  console.log("Request:",request);
  try {
    await connection.invoke("SendInboundMessage", request);
  } catch (err) {
    console.error("Failed to send message:", err);
    removeThinkingIndicator();
  }
};

// Load agents when the page loads
loadAgents();