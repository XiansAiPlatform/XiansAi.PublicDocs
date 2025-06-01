import React from 'react';
import { StepDefinition, createComponentRegistry, ComponentLoader } from '../steps';

// Example: Component registry for loan agreement specific components
// Note: These components don't exist yet - this is a template showing how to structure different document types
const loanComponentRegistry = createComponentRegistry({
  // Commented out until components are created:
  // 'loanDetails.tsx': () => import('../components/entity/loanDetails').then(m => m.default),
  // 'borrowerInfo.tsx': () => import('../components/entity/borrowerInfo').then(m => m.default),
  // 'lenderInfo.tsx': () => import('../components/entity/lenderInfo').then(m => m.default),
  // 'repaymentTerms.tsx': () => import('../components/entity/repaymentTerms').then(m => m.default),
  // 'collateral.tsx': () => import('../components/entity/collateral').then(m => m.default),
  // 'submitLoan.tsx': () => import('../components/entity/submitLoan').then(m => m.default),
  
  // For now, fallback to existing components as placeholders:
  'loanDetails.tsx': () => import('../components/entity/documentScope').then(m => m.default),
  'borrowerInfo.tsx': () => import('../components/entity/representatives').then(m => m.default),
  'lenderInfo.tsx': () => import('../components/entity/representatives').then(m => m.default),
  'repaymentTerms.tsx': () => import('../components/entity/conditions').then(m => m.default),
  'collateral.tsx': () => import('../components/entity/conditions').then(m => m.default),
  'submitLoan.tsx': () => import('../components/entity/submitDocument').then(m => m.default),
});

// Example: Loan Agreement specific steps configuration
export const loanAgreementSteps: StepDefinition[] = [
  {
    title: "Loan Details",
    theme: "info",
    entityUi: "loanDetails.tsx",
    componentLoader: loanComponentRegistry['loanDetails.tsx']
  },
  {
    title: "Borrower Information",
    theme: "lavender",
    bot: {
      title: "Borrower Assistant",
      description: "Help gather borrower information and documentation"
    },
    entityUi: "borrowerInfo.tsx",
    componentLoader: loanComponentRegistry['borrowerInfo.tsx']
  },
  {
    title: "Lender Information",
    theme: "purple",
    entityUi: "lenderInfo.tsx",
    componentLoader: loanComponentRegistry['lenderInfo.tsx']
  },
  {
    title: "Repayment Terms",
    theme: "warm",
    bot: {
      title: "Terms Calculator",
      description: "Calculate and optimize repayment schedules"
    },
    entityUi: "repaymentTerms.tsx",
    componentLoader: loanComponentRegistry['repaymentTerms.tsx']
  },
  {
    title: "Collateral",
    theme: "warning",
    entityUi: "collateral.tsx",
    componentLoader: loanComponentRegistry['collateral.tsx']
  },
  {
    title: "Submit Agreement",
    theme: "cream",
    entityUi: "submitLoan.tsx", 
    componentLoader: loanComponentRegistry['submitLoan.tsx']
  }
];

export default loanAgreementSteps; 