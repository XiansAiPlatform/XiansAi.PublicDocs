# Agent Deployment Settings

## Option 1: Azure Container Apps

1. **Dockerize the agent**
2. **Upload via ACR service** (Azure Container Registry)
3. **Configure Container App settings**


### Ingress Configuration

- **Disable Ingress** - Agents don't need external HTTP access
- Set `"ingress": { "external": false }` in configuration

### Scaling Settings

- **Min replicas**: Set to 1 or more to ensure availability
- **Max replicas**: Configure based on expected load
- **Scale rules**: Consider CPU/memory-based scaling

### Environment Variables

```bash
# Essential environment variables
APP_SERVER_URL=https://your-platform-url
APP_SERVER_API_KEY=your-api-key
...
```

### Resource Allocation

- **CPU**: 1 cores for basic agents
- **Memory**: 1.0 GB for basic agents
- Adjust based on agent complexity and workload

### Networking

- no public endpoint needed
- Ensure connectivity to Xians platform
- Configure any required service connections
