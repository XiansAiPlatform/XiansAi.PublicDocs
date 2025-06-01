# Step Configuration System

This directory contains examples of how to create different step configurations for different document types.

## How to Create New Document Types

### 1. Create a New Steps File

Create a new file like `your-document-steps.ts` with the following structure:

```typescript
import React from 'react';
import { StepDefinition, createComponentRegistry } from '../steps';

// Component registry for your document type
const yourDocumentRegistry = createComponentRegistry({
  'component1.tsx': () => import('../components/entity/component1').then(m => m.default),
  'component2.tsx': () => import('../components/entity/component2').then(m => m.default),
  // ... more components
});

// Step definitions
export const yourDocumentSteps: StepDefinition[] = [
  {
    title: "Step 1 Title",
    theme: {
      bg: "bg-blue-600",
      bgLight: "bg-blue-100",
      bgDark: "bg-blue-800",
      text: "text-blue-800",
      border: "border-blue-300"
    },
    entityUi: "component1.tsx",
    componentLoader: yourDocumentRegistry['component1.tsx'],
    bot: { // Optional chatbot configuration
      title: "Assistant Name",
      description: "What this assistant helps with"
    }
  },
  // ... more steps
];

export default yourDocumentSteps;
```

### 2. Create Entity Components

Create React components in `src/components/entity/` for each step:

```typescript
import React from 'react';

const YourComponent: React.FC = () => {
  return (
    <div className="h-full flex flex-col bg-white">
      <header className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Step Title</h2>
        <p className="text-sm text-gray-600 mt-1">Step description</p>
      </header>
      
      <div className="flex-1 overflow-y-auto p-6">
        {/* Your step content here */}
      </div>
    </div>
  );
};

export default YourComponent;
```

### 3. Update the Main Application

To use a different step configuration, update `src/steps.ts` to import your steps:

```typescript
// Replace the default import
import yourDocumentSteps from './steps-examples/your-document-steps';

export const steps = yourDocumentSteps;
```

Or create a dynamic system to switch between different document types based on URL, user selection, etc.

## Features of Each Step

### Required Properties
- `title`: Display name for the step
- `theme`: Color scheme (bg, bgLight, bgDark, text, border)
- `componentLoader`: Function that dynamically imports the React component

### Optional Properties
- `entityUi`: Component identifier (for reference)
- `bot`: Chatbot configuration with title and description

### Theme Colors
Use Tailwind CSS classes for consistent styling:
- `bg`: Background color for active step indicators
- `bgLight`: Light background for UI elements
- `bgDark`: Dark background for hover states
- `text`: Text color for themed elements
- `border`: Border color for themed elements

## Examples

- `loan-agreement-steps.ts`: Example configuration for loan documents
- More examples can be added for different document types

## Benefits

1. **Modular**: Each document type has its own configuration
2. **Reusable**: Components can be shared between document types
3. **Dynamic**: Easy to switch between configurations
4. **Type-Safe**: Full TypeScript support
5. **Performance**: Components are lazy-loaded as needed 