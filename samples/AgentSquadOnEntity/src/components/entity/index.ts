// Entity UI Components Registry
export { default as documentScope } from './documentScope';
export { default as representatives } from './representatives';
export { default as conditions } from './conditions';
export { default as witnesses } from './witnesses';
export { default as submitDocument } from './submitDocument';

// Type for component map
export type EntityComponentMap = {
  'documentScope.tsx': typeof import('./documentScope').default;
  'representatives.tsx': typeof import('./representatives').default;
  'conditions.tsx': typeof import('./conditions').default;
  'witnesses.tsx': typeof import('./witnesses').default;
  'submitDocument.tsx': typeof import('./submitDocument').default;
};

// Component registry for dynamic loading
export const entityComponents: Partial<EntityComponentMap> = {
  'documentScope.tsx': () => import('./documentScope').then(m => m.default),
  'representatives.tsx': () => import('./representatives').then(m => m.default),
  'conditions.tsx': () => import('./conditions').then(m => m.default),
  'witnesses.tsx': () => import('./witnesses').then(m => m.default),
  'submitDocument.tsx': () => import('./submitDocument').then(m => m.default),
} as any; 