export { default } from './representatives';

/**
 * Representatives Module Structure:
 * 
 * ├── representatives.tsx                    - Main orchestrator component
 * ├── types/
 * │   └── representative.types.ts           - TypeScript interfaces and types
 * ├── hooks/
 * │   └── useRepresentativesData.ts         - Custom hook for data management and business logic
 * ├── components/
 * │   ├── RepresentativeCard.tsx            - Individual representative card (view/edit modes)
 * │   ├── AddRepresentativeCard.tsx         - Add new representative card
 * │   ├── ActivityLogBanner.tsx             - Activity log display component
 * │   └── RepresentativesHeader.tsx         - Header with title, stats, and actions
 * └── utils/
 *     └── representative.utils.ts           - Helper functions and validation logic
 * 
 * This modular structure provides:
 * - Better separation of concerns
 * - Enhanced reusability of components
 * - Easier testing and maintenance
 * - Improved code organization and readability
 */ 