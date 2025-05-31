/**
 * Bot Color System
 * 
 * This file defines a consistent color system used across all bot-related components
 * in the application. The colors are defined in Tailwind config and mapped here
 * for easy reuse and maintenance.
 * 
 * Color Mapping:
 * - Requirements Bot: Primary (#2C1D26) - Used for suggestions and requirement gathering
 * - Draft Bot: Accent Green (#10B981) - Used for drafting and content creation
 * - Review Bot: Amber (#F59E0B) - Used for warnings and review feedback  
 * - Finalize Bot: Purple (#8B5CF6) - Used for finalization steps
 * - Error: Red (#E53E3E) - Used for critical errors and conflicts
 * - Warning: Yellow (#FFC107) - Used for warnings and cautions
 * - Info: Blue (#1A8EFF) - Used for suggestions and informational content
 * 
 * Usage:
 * - ChatPane: Uses STEP_BOTS for bot avatars and info
 * - StepsBar: Uses STEP_BOT_COLORS for active step highlighting
 * - FindingsPane: Uses FINDING_TYPE_COLORS for consistent finding categorization
 */

// Bot color constants for consistent usage across components
// These exactly match the theme colors defined in tailwind.config.cjs
export const BOT_COLORS = {
  requirements: {
    bg: 'bg-bot-requirements',
    bgLight: 'bg-bot-requirements-light',
    bgDark: 'bg-bot-requirements-dark',
    text: 'text-bot-requirements-text',
    border: 'border-bot-requirements-border',
  },
  draft: {
    bg: 'bg-bot-draft',
    bgLight: 'bg-bot-draft-light',
    bgDark: 'bg-bot-draft-dark',
    text: 'text-bot-draft-text',
    border: 'border-bot-draft-border',
  },
  review: {
    bg: 'bg-bot-review',
    bgLight: 'bg-bot-review-light',
    bgDark: 'bg-bot-review-dark',
    text: 'text-bot-review-text',
    border: 'border-bot-review-border',
  },
  finalize: {
    bg: 'bg-bot-finalize',
    bgLight: 'bg-bot-finalize-light',
    bgDark: 'bg-bot-finalize-dark',
    text: 'text-bot-finalize-text',
    border: 'border-bot-finalize-border',
  },
  error: {
    bg: 'bg-bot-error',
    bgLight: 'bg-bot-error-light',
    bgDark: 'bg-bot-error-dark',
    text: 'text-bot-error-text',
    border: 'border-bot-error-border',
  },
  warning: {
    bg: 'bg-bot-warning',
    bgLight: 'bg-bot-warning-light',
    bgDark: 'bg-bot-warning-dark',
    text: 'text-bot-warning-text',
    border: 'border-bot-warning-border',
  },
  info: {
    bg: 'bg-bot-info',
    bgLight: 'bg-bot-info-light',
    bgDark: 'bg-bot-info-dark',
    text: 'text-bot-info-text',
    border: 'border-bot-info-border',
  },
} as const;

// Step to bot color mapping
export const STEP_BOT_COLORS = [
  BOT_COLORS.requirements.bg,  // Step 0: Requirements
  BOT_COLORS.draft.bg,        // Step 1: Draft
  BOT_COLORS.review.bg,       // Step 2: Review
  BOT_COLORS.finalize.bg,     // Step 3: Finalize
] as const;

// Finding type to bot color mapping - now using semantic colors
export const FINDING_TYPE_COLORS = {
  suggestion: BOT_COLORS.info,     // Suggestions use blue (info colors)
  warning: BOT_COLORS.warning,     // Warnings use yellow (warning colors)
  error: BOT_COLORS.error,         // Errors use red (error colors)
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