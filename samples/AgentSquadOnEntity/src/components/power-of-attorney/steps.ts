import type { StepDefinition } from './types';

// Step definitions with simplified theme names
export const steps: StepDefinition[] = [
  {
    title: "Scope",
    theme: "purple",
    componentLoader: () => import('./documentScope').then(m => m.default)
  },
  {
    title: "Representatives",
    theme: "warm",
    bot: {
      title: "Representatives Agent",
      agent: "Representative Bot",
      description: "Assist with managing the representatives",
      workflowType: "Power of Attorney Agent v2:Representative Bot",
      workflowId: "99x.io:Power of Attorney Agent v2:Representative Bot"
    },
    componentLoader: () => import('./representatives').then(m => m.default)
  },
  {
    title: "Conditions",
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
    theme: "green",
    componentLoader:  () => import('./submitDocument').then(m => m.default)
  }
];

export default steps; 