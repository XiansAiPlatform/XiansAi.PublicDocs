/**
 * Bot Color System
 * 
 * This file defines a consistent color system used across all bot-related components
 * in the application. The colors are defined in Tailwind config and mapped here
 * for easy reuse and maintenance.
 * 
 * Color Mapping:
 * - Requirements Bot: Blue (#3B82F6) - Used for suggestions and requirement gathering
 * - Draft Bot: Green (#10B981) - Used for drafting and content creation
 * - Review Bot: Amber (#F59E0B) - Used for warnings and review feedback  
 * - Finalize Bot: Purple (#8B5CF6) - Used for finalization steps
 * - Error: Red (#EF4444) - Used for critical errors and conflicts
 * 
 * Usage:
 * - ChatPane: Uses STEP_BOTS for bot avatars and info
 * - StepsBar: Uses STEP_BOT_COLORS for active step highlighting
 * - FindingsPane: Uses FINDING_TYPE_COLORS for consistent finding categorization
 */

// Bot color constants for consistent usage across components
export const BOT_COLORS = {
  requirements: {
    bg: 'bg-bot-requirements',
    bgLight: 'bg-bot-requirements-light',
    text: 'text-bot-requirements-text',
    border: 'border-bot-requirements-border',
  },
  draft: {
    bg: 'bg-bot-draft',
    bgLight: 'bg-bot-draft-light',
    text: 'text-bot-draft-text',
    border: 'border-bot-draft-border',
  },
  review: {
    bg: 'bg-bot-review',
    bgLight: 'bg-bot-review-light',
    text: 'text-bot-review-text',
    border: 'border-bot-review-border',
  },
  finalize: {
    bg: 'bg-bot-finalize',
    bgLight: 'bg-bot-finalize-light',
    text: 'text-bot-finalize-text',
    border: 'border-bot-finalize-border',
  },
  error: {
    bg: 'bg-bot-error',
    bgLight: 'bg-bot-error-light',
    text: 'text-bot-error-text',
    border: 'border-bot-error-border',
  },
} as const;

// Step to bot color mapping
export const STEP_BOT_COLORS = [
  BOT_COLORS.requirements.bg,  // Step 0: Requirements
  BOT_COLORS.draft.bg,        // Step 1: Draft
  BOT_COLORS.review.bg,       // Step 2: Review
  BOT_COLORS.finalize.bg,     // Step 3: Finalize
] as const;

// Finding type to bot color mapping
export const FINDING_TYPE_COLORS = {
  suggestion: BOT_COLORS.requirements,  // Suggestions are like requirements gathering
  warning: BOT_COLORS.review,          // Warnings are like review feedback
  error: BOT_COLORS.error,             // Errors need special attention
} as const;

// Bot information for each step
export const STEP_BOTS = [
  {
    name: 'Requirements Bot',
    description: 'Helps gather and clarify requirements',
    colors: BOT_COLORS.requirements,
    initialMessage: 'Hello! I\'m here to help you gather and clarify the requirements for your document. What do you need help with?'
  },
  {
    name: 'Draft Bot',
    description: 'Assists with drafting content',
    colors: BOT_COLORS.draft,
    initialMessage: 'Hi! I\'m your drafting assistant. I can help you create and structure the content for your document. What would you like to work on?'
  },
  {
    name: 'Review Bot',
    description: 'Reviews and suggests improvements',
    colors: BOT_COLORS.review,
    initialMessage: 'Hello! I\'m here to help review your document and suggest improvements. Let\'s make sure everything looks good!'
  },
  {
    name: 'Finalize Bot',
    description: 'Helps finalize and polish the document',
    colors: BOT_COLORS.finalize,
    initialMessage: 'Hi! I\'m here to help you finalize and polish your document. Let\'s get it ready for completion!'
  }
] as const; 