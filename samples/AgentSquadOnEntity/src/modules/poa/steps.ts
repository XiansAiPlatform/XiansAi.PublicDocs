import type { StepDefinition, Agent } from '../../components/types';
import { useParams, matchPath } from 'react-router-dom';

// Base URL configuration for Power of Attorney workflow
export const POA_BASE_URL = '/poa';
export const POA_ROUTE_PATTERN = `${POA_BASE_URL}/:documentId/:stepSlug`;


// Agents collection - separated from steps for better management and websocket connections
export const Agents: Agent[] = [
  {
    id: "representative_bot",
    workflowId: "99x.io:Power of Attorney Agent v2:Representative Bot",
    title: "Representatives Agent",
    agent: "Power of Attorney Agent v2",
    description: "Assist with managing the representatives",
    workflowType: "Power of Attorney Agent v2:Representative Bot"
  },
  {
    id: "condition_bot",
    workflowId: "99x.io:Power of Attorney Agent v2:Condition Bot",
    title: "Conditions Agent",
    agent: "Power of Attorney Agent v2",
    description: "Assist people with Caring",
    workflowType: "Power of Attorney Agent v2:Condition Bot"
  },
  {
    id: "witness_bot",
    workflowId: "99x.io:Power of Attorney Agent v2:Witness Bot",
    title: "Witnesses Agent",
    agent: "Power of Attorney Agent v2",
    description: "Assist people with Payments",
    workflowType: "Power of Attorney Agent v2:Witness Bot"
  },
  {
    id: "document_data_flow",
    workflowId: "99x.io:Power of Attorney Agent v2:Document Data Flow",
    title: "Document Data Flow Agent",
    agent: "Power of Attorney Agent v2",
    description: "Manage document data flow and processing",
    workflowType: "Power of Attorney Agent v2:Document Data Flow",
  }
];

// Step definitions with simplified theme names
export const steps: StepDefinition[] = [
  {
    title: "Scope",
    slug: "scope",
    theme: "purple",
    componentLoader: () => import('./components/documentScope').then(m => m.default)
  },
  {
    title: "Representatives",
    slug: "representatives",
    theme: "warm",
    botId: "representative_bot",
    componentLoader: () => import('./components/representatives/representatives').then(m => m.default)
  },
  {
    title: "Conditions",
    slug: "conditions",
    theme: "lavender",
    botId: "condition_bot",
    componentLoader: () => import('./components/conditions').then(m => m.default)
  },
  {
    title: "Witnesses",
    slug: "witnesses",
    theme: "blue",
    botId: "witness_bot",
    componentLoader: () => import('./components/witnesses').then(m => m.default)
  },
  {
    title: "Submit",
    slug: "submit",
    theme: "green",
    componentLoader:  () => import('./components/submitDocument').then(m => m.default)
  }
];

export default steps;

// Utility functions for working with steps
export const getStepBySlug = (slug: string): StepDefinition | undefined => {
  return steps.find(step => step.slug === slug);
};

export const getStepIndexBySlug = (slug: string): number => {
  return steps.findIndex(step => step.slug === slug);
};

export const getStepUrl = (step: StepDefinition, documentId?: string): string => {
  if (documentId) {
    return `${POA_BASE_URL}/${documentId}/${step.slug}`;
  }
  // Fallback for backward compatibility
  return `${POA_BASE_URL}/new/${step.slug}`;
};

export const getStepUrlBySlug = (slug: string, documentId?: string): string => {
  if (documentId) {
    return `${POA_BASE_URL}/${documentId}/${slug}`;
  }
  // Fallback for backward compatibility
  return `${POA_BASE_URL}/new/${slug}`;
};

export const getFirstStepUrl = (documentId?: string): string => {
  return steps.length > 0 ? getStepUrl(steps[0], documentId) : POA_BASE_URL;
};

export const getAllStepSlugs = (): string[] => {
  return steps.map(step => step.slug);
};

// Utility functions for working with agents
export const getAgentByWorkflowId = (workflowId: string): Agent | undefined => {
  return Agents.find(agent => agent.workflowId === workflowId);
};

export const getAgentById = (id: string): Agent | undefined => {
  return Agents.find(agent => agent.id === id);
};

export const getAgentForStep = (step: StepDefinition): Agent | undefined => {
  return step.botId ? getAgentById(step.botId) : undefined;
};

export const getAllAgentWorkflowIds = (): string[] => {
  return Agents.map(agent => agent.workflowId);
};

// Function to initialize websocket connections for all agents
export const initializeAgentWebsockets = () => {
  return Agents.map(agent => {
    // Return agent info for websocket initialization
    return {
      workflowId: agent.workflowId,
      title: agent.title,
      agent: agent.agent,
      workflowType: agent.workflowType
    };
  });
};

// Function to generate default metadata for POA workflow
export const generateDefaultMetadata = () => {
  // Use React Router's matchPath to extract documentId from current URL
  const match = matchPath(
    POA_ROUTE_PATTERN,
    window.location.pathname
  );
  
  if (match?.params?.documentId && match.params.documentId !== 'new') {
    return {
      documentId: match.params.documentId,
      requestId: Date.now().toString() //generate unique id for the request
    };
  }
  
  return {};
}; 