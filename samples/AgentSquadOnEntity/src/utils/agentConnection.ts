// Example utility demonstrating how to use the settings context for backend connections
import { SettingsData } from '../context/SettingsContext';

export class AgentConnection {
  private websocket: WebSocket | null = null;
  private settings: SettingsData;

  constructor(settings: SettingsData) {
    this.settings = settings;
  }

  // Example websocket connection using the configured settings
  async connectWebSocket(): Promise<WebSocket> {
    if (!this.settings.agentWebsocketUrl) {
      throw new Error('Agent WebSocket URL not configured in settings');
    }

    return new Promise((resolve, reject) => {
      try {
        this.websocket = new WebSocket(this.settings.agentWebsocketUrl);
        
        this.websocket.onopen = () => {
          console.log('Connected to agent websocket');
          // Send authentication if needed
          if (this.settings.agentApiKey) {
            this.websocket?.send(JSON.stringify({
              type: 'auth',
              apiKey: this.settings.agentApiKey,
              userId: this.settings.userId,
              documentId: this.settings.documentId
            }));
          }
          resolve(this.websocket!);
        };

        this.websocket.onerror = (error) => {
          console.error('WebSocket connection error:', error);
          reject(error);
        };

        this.websocket.onclose = () => {
          console.log('WebSocket connection closed');
          this.websocket = null;
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  // Example API call using the configured settings
  async makeApiCall(endpoint: string, data: any = {}): Promise<Response> {
    if (!this.settings.agentApiKey) {
      throw new Error('Agent API Key not configured in settings');
    }

    const url = this.settings.agentWebsocketUrl.replace('ws://', 'http://').replace('wss://', 'https://') + endpoint;

    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.settings.agentApiKey}`,
        'X-User-ID': this.settings.userId,
        'X-Document-ID': this.settings.documentId,
      },
      body: JSON.stringify(data),
    });
  }

  // Send a message through the websocket
  sendMessage(message: any): void {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    this.websocket.send(JSON.stringify({
      ...message,
      userId: this.settings.userId,
      documentId: this.settings.documentId,
      timestamp: new Date().toISOString(),
    }));
  }

  // Close the websocket connection
  disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }

  // Check if all required settings are configured
  isConfigured(): boolean {
    return !!(
      this.settings.agentWebsocketUrl &&
      this.settings.agentApiKey &&
      this.settings.userId &&
      this.settings.documentId
    );
  }
}

// Example hook for using the agent connection with settings context
// This would be used in React components like this:
/*
import { useSettings } from '../context/SettingsContext';
import { AgentConnection } from '../utils/agentConnection';

export const useAgentConnection = () => {
  const { settings } = useSettings();
  const connection = useMemo(() => new AgentConnection(settings), [settings]);
  
  return {
    connection,
    isConfigured: connection.isConfigured(),
    connectWebSocket: connection.connectWebSocket.bind(connection),
    makeApiCall: connection.makeApiCall.bind(connection),
    sendMessage: connection.sendMessage.bind(connection),
    disconnect: connection.disconnect.bind(connection),
  };
};
*/ 