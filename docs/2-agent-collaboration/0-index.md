# Agents Collaboration

The message communication structure between users, agents, and workflows in the XiansAI platform is designed to support seamless collaboration. Various message types are exchanged and subscribed to using Web Sockets or Web Hooks, enabling real-time and event-driven interactions across workflows and participants.

Collaboration in XiansAI happens in following scenarios:

## Inter-flow Communication

- Agents communicate with other agents via their respective workflows.
- One agent sends a message using `SendFlowMessage`, while the receiving agent subscribes to that message using either: `SubscribeAsyncFlowMessageHandler` or `SubscribeFlowMessageHandler`
- This mechanism enables workflow-to-workflow communication across agents, facilitated by the MessageHub.

## Agent Initiated Message

- Interaction between a user and an agent within a `MessageThread`.
- Messages are received through either a WebSocket or a WebHook, based on the system’s configuration.
- This collaboration can be as, 
    - `SendChat` - Sends plain text messages.
    - `SendData` - Sends a structured data object.

## Agent Handoff

- Handoffs allow one agent to transfer a conversation to another agent that is better suited to handle the user's request.
- The handoff is initiated using the `SendHandoff` message type via the MessageHub.
- This ensures continuity in the user experience while enabling agents with the appropriate capabilities to take over.
- Handoff messages are typically managed in the same way as other message types and can be received via WebSocket or WebHooks.