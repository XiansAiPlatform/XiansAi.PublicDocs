// Bot/Agent configuration from steps
export interface BotAgent {
  id?: string;
  title: string;
  agent?: string;
  description?: string;
  workflowType?: string;
  workflowId?: string;
}

// Message types
export interface ChatMessage {
  id: string;
  content: string;
  direction: 'Incoming' | 'Outgoing' | 'Handover';
  stepIndex: number;
  threadId?: string;
  timestamp: Date;
  metadata?: any;
}

export interface SystemMessage {
  type: 'UI_UPDATE' | 'STATE_CHANGE' | 'DATA' | 'ERROR' | 'INFO' | 'METADATA';
  stepIndex: number;
  payload: any;
  timestamp: Date;
}

export type Message = ChatMessage | SystemMessage;

// Connection state
export interface ConnectionState {
  stepIndex: number;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastError?: string;
  lastActivity?: Date;
}

// WebSocket message formats for the backend
export interface InboundMessage {
  threadId?: string;
  agent: string;
  workflowType: string;
  workflowId: string;
  participantId: string;
  content: string;
  metadata?: any;
}

export interface OutboundMessage {
  workflowId?: string;
  content: string;
  direction?: string;
  type?: 'chat' | 'system';
  payload?: any;
}

// Hub events
export type HubEventType = 'message' | 'connection_change' | 'error' | 'system_message' | 'thread_history';

export interface HubEvent {
  type: HubEventType;
  stepIndex: number;
  data: any;
}

// Configuration
export interface AppConfig {
  websocketUrl: string;
  secretKey: string;
  tenantId: string;
  participantId: string;
  metadata?: any;
} 