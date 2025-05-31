# Xians AI WebSocket Chat Client

This is a WebSocket client implementation for the Xians AI chat system using SignalR.

## Server Setup

1. Clone and setup the Xians AI server locally
2. Configure the server settings in `appsettings.json`:

```json
{
  "WebSocket": {
    "Enabled": true,
    "Secrets": {
      "TenantId": "your-secret-key-here"
    },
    "UserId": "userID"
  },
  "Cors": {
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://127.0.0.1:5500"
    ]
  }
}
```

## Client Setup

1. Open `index.html` in your browser
2. Configure the connection parameters:
   - **Websocket URL**: Your server's WebSocket endpoint (e.g., `http://localhost:5000/ws/chat`)
   - **Secret Key**: The secret key configured in server's `appsettings.json`
   - **Tenant ID**: Your tenant identifier
   - **Agent**: (Required) Agent identifier
   - **Workflow Type**: Type of workflow
   - **Workflow ID**: (Required) Workflow identifier
   - **Participant ID**: (Required) Participant identifier
   - **Metadata**:(optional)

## Connection Flow

1. The client connects to the server using the configured parameters
2. The server validates the connection using the Secret Key and Tenant ID
3. The Thread ID is automatically set when the server sends an `InboundProcessed` message
4. Once connected, you can:
   - Send messages to the server
   - Receive responses from the agent
   - Disconnect from the server

## Important Notes

- The Thread ID is managed automatically by the server and client
- You don't need to manually set the Thread ID - it will be assigned during the first `InboundProcessed` message
- Make sure the CORS settings in the server's `appsettings.json` include your client's URL to prevent CORS issues
- The connection requires both a valid Secret Key and Tenant ID to establish

## Troubleshooting

If you encounter connection issues:
1. Verify the server is running
2. Check that the Secret Key and Tenant ID match the server configuration
3. Ensure the WebSocket URL is correct
4. Verify CORS settings if you see cross-origin errors
5. Check the browser console for any error messages
