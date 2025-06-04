# Agent Squad Entity UI - Multi-Agent WebSocket Communication Platform

A modern React TypeScript application for document workflow management featuring a multi-step process with real-time WebSocket communication to AI agents.

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**

### Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd AgentSquadOnEntity
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start the development server:**

   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:5173` (or the port shown in your terminal)

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## 📋 Project Overview

Agent Squad Entity UI is a document workflow management system that guides users through a structured multi-step process. Each step can have an associated AI agent bot that provides real-time assistance through WebSocket connections.

### Key Features

- **Multi-Step Workflow**: Navigate through different document creation steps
- **Real-time AI Chat**: Each step can have a dedicated AI agent for assistance
- **WebSocket Communication**: Asynchronous, real-time messaging with backend agents
- **System Messages**: Agents can send UI update commands and data
- **Auto-reconnect**: Automatic WebSocket reconnection with exponential backoff
- **Connection Status**: Visual indicators for agent connection states

## 🏗️ Architecture

### Technology Stack

- **Frontend Framework:** React 18 with TypeScript
- **Build Tool:** Vite 5.x
- **Styling:** Tailwind CSS 3.x
- **WebSocket:** Native WebSocket API with custom hub middleware
- **Icons:** React Icons
- **Development:** Hot Module Replacement (HMR) via Vite

### WebSocket Architecture

The application uses a hub-based architecture for managing multiple WebSocket connections:

1. **WebSocket Hub** (`src/middleware/WebSocketHub.ts`)
   - Manages multiple concurrent WebSocket connections
   - One connection per step that has a bot configured
   - Handles automatic reconnection with exponential backoff
   - Routes messages to appropriate handlers
   - Provides event-based communication

2. **WebSocket Steps Context** (`src/context/WebSocketStepsContext.tsx`)
   - React context for WebSocket state management
   - Manages chat and system messages directly in React state
   - Bridges WebSocket Hub with React components
   - Handles UI state updates from system messages
   - Auto-connects when settings are available

### Project Structure

``` text
src/
├── components/          # React components
│   ├── App.tsx         # Main application component
│   ├── NavBar.tsx      # Top navigation bar
│   ├── StepsBar.tsx    # Step indicator/navigation
│   ├── ChatPane.tsx    # WebSocket-enabled chat interface
│   ├── EntityPane.tsx  # Center pane for document display
│   ├── FindingsPane.tsx # Right sidebar for findings/notes
│   └── power-of-attorney/
│       └── steps.ts    # Step definitions with bot configurations
├── context/            # React contexts
│   ├── StepsContext.tsx # Step management
│   ├── SettingsContext.tsx # App settings (WebSocket URL, API key, etc.)
│   └── WebSocketStepsContext.tsx # WebSocket integration & message management
├── middleware/         # WebSocket infrastructure
│   └── WebSocketHub.ts # WebSocket connection manager
├── types/              # TypeScript definitions
│   └── index.ts       # Shared type definitions
├── utils/              # Utility functions
│   └── botColors.ts    # Color utilities for bot/agent theming
├── main.tsx           # Application entry point
└── index.css          # Global styles and Tailwind imports
```

## 🔧 Configuration

### Step Bot Configuration

Bots are configured in `src/components/power-of-attorney/steps.ts`:

```typescript
{
  title: "Representatives",
  theme: "warm",
  bot: {
    title: "Representatives Agent",
    id: "unique-bot-id",          // Optional: specific bot instance
    agent: "HR Agent v3",         // Agent name
    description: "Assist with employee Hiring",
    workflowType: "HR Agent v3:Hire Bot v3",
    workflowId: "99x.io:HR Agent v3:Hire Bot v3"  // Required for WebSocket
  },
  entityUi: "representatives.tsx",
  componentLoader: componentRegistry['representatives.tsx']
}
```

### Settings Configuration

The application requires these settings (configured via UI or localStorage):

- **agentWebsocketUrl**: WebSocket endpoint URL
- **agentApiKey**: Authentication token
- **userId**: User identifier
- **documentId**: Document identifier

## 📡 WebSocket Protocol

### Connection

The app establishes WebSocket connections for each step that has a bot with a `workflowId`. Connection URL format:

```
wss://api.example.com/hub?userId=xxx&documentId=xxx&workflowId=xxx&workflowType=xxx
```

### Authentication

On connection, the client sends:
```json
{
  "type": "auth",
  "token": "your-api-key"
}
```

### Message Flow

#### Sending Messages
```json
{
  "threadId": "optional-thread-id",
  "agent": "AgentName",
  "workflowType": "workflow_type",
  "workflowId": "workflow_id",
  "participantId": "user_id",
  "content": "message content",
  "metadata": {}
}
```

#### Receiving Messages

1. **Chat Messages**:
```json
{
  "content": "message content",
  "direction": "Outgoing",
  "type": "chat"
}
```

2. **System Messages**:
```json
{
  "type": "system",
  "payload": {
    "action": "updateUI",
    "data": {}
  }
}
```

## 🎨 UI Features

### Chat Pane

The chat pane (`ChatPane.tsx`) now includes:
- Real-time message display
- Connection status indicator
- Typing indicators
- Message direction support (Incoming/Outgoing/Handover)
- Auto-scroll to latest messages
- Disabled state when not connected

### Connection States

Each step shows its connection status:
- 🟢 Green: Connected
- 🟡 Yellow (pulsing): Connecting
- 🔴 Red: Disconnected/Error

## 🔐 Security Considerations

- Use WSS (WebSocket Secure) in production
- Store API keys securely
- Validate all incoming messages
- Implement proper authentication
- Use environment variables for sensitive configuration

## 🚨 Troubleshooting

### WebSocket Connection Issues

1. **Check Settings**: Ensure all required settings are configured
2. **Check Console**: Look for WebSocket error messages
3. **Verify URL**: Ensure WebSocket URL is correct and accessible
4. **Check Network**: Verify firewall/proxy settings allow WebSocket connections

### Common Issues

1. **Port already in use:**
   ```bash
   npx kill-port 5173
   npm run dev
   ```

2. **WebSocket fails to connect:**
   - Check if the WebSocket URL is correct
   - Verify API key is valid
   - Ensure backend is running and accessible

## 🤝 Contributing

1. Create feature branch from main
2. Follow existing code patterns
3. Ensure TypeScript compliance
4. Test WebSocket functionality
5. Test on both desktop and mobile
6. Submit pull request with clear description

## 📄 License

[Add your license information here]

## 🔗 Additional Resources

- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) 