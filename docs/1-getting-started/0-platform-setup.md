# Platform Setup

To develop agentic software with the Xians platform, you'll need to set up the platform locally on your development machine. This local setup provides all the necessary infrastructure components required for agent development and testing.

## Quick Setup with Docker Compose

The fastest and most reliable way to get started is using the Docker Compose setup from the Xians community edition. This setup includes all the essential components:

- **Xians Server** - Core platform API and orchestration
- **Xians UI** - Web-based management interface
- **Temporal** - Workflow orchestration engine
- **Keycloak** - Authentication and authorization
- **Database components** - Data persistence layer

## Getting Started

For complete setup instructions, system requirements, and configuration options, visit the official community edition repository:

**[XiansAi Platform - Community Edition](https://github.com/XiansAiPlatform/community-edition?tab=readme-ov-file#xiansai-platform---community-edition)**

The repository provides:

- One-command setup scripts
- Environment configuration options
- Access URLs for all platform components
- Troubleshooting guidance

## Important Notes

- The community edition is designed for **development and testing only**
- Requires Docker and Docker Compose
- Minimum 4GB RAM recommended
- Ensure you have an OpenAI API key for LLM capabilities

Once your platform is running locally, you can proceed to create your first agent and begin developing agentic workflows.
