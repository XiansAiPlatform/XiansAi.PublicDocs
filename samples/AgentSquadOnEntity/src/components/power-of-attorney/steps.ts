import type { StepDefinition } from './types';

// Base URL configuration for Power of Attorney workflow
export const POA_BASE_URL = '/poa/step';
export const POA_ROUTE_PATTERN = `${POA_BASE_URL}/:stepSlug`;

// Step definitions with simplified theme names
export const steps: StepDefinition[] = [
  {
    title: "Scope",
    slug: "scope",
    theme: "purple",
    componentLoader: () => import('./documentScope').then(m => m.default)
  },
  {
    title: "Representatives",
    slug: "representatives",
    theme: "warm",
    bot: {
      title: "Representatives Agent",
      agent: "Representative Bot",
      description: "Assist with managing the representatives",
      workflowType: "Power of Attorney Agent v2:Representative Bot",
      workflowId: "99x.io:Power of Attorney Agent v2:Representative Bot"
    },
    componentLoader: () => import('./representatives/representatives').then(m => m.default)
  },
  {
    title: "Conditions",
    slug: "conditions",
    theme: "lavender",
    bot: {
      title: "Conditions Agent",
      agent: "Condition Bot",
      id: "99x.io:Power of Attorney Agent v2:Condition Bot",
      description: "Assist people with Caring",
      workflowType: "Power of Attorney Agent v2:Condition Bot",
      workflowId: "99x.io:Power of Attorney Agent v2:Condition Bot"
    },
    componentLoader: () => import('./conditions').then(m => m.default)
  },
  {
    title: "Witnesses",
    slug: "witnesses",
    theme: "blue",
    bot: {
      title: "Witnesses Agent",
      agent: "Witness Bot",
      id: "99x.io:Power of Attorney Agent v2:Witness Bot",
      description: "Assist people with Payments",
      workflowType: "Power of Attorney Agent v2:Witness Bot",
      workflowId: "99x.io:Power of Attorney Agent v2:Witness Bot"
    },
    componentLoader: () => import('./witnesses').then(m => m.default)
  },
  {
    title: "Submit",
    slug: "submit",
    theme: "green",
    componentLoader:  () => import('./submitDocument').then(m => m.default)
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

export const getStepUrl = (step: StepDefinition): string => {
  return `${POA_BASE_URL}/${step.slug}`;
};

export const getStepUrlBySlug = (slug: string): string => {
  return `${POA_BASE_URL}/${slug}`;
};

export const getFirstStepUrl = (): string => {
  return steps.length > 0 ? getStepUrl(steps[0]) : POA_BASE_URL;
};

export const getAllStepSlugs = (): string[] => {
  return steps.map(step => step.slug);
}; 