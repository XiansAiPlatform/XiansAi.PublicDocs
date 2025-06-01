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
    theme: {
      bg: "bg-blue-600",
      bgLight: "bg-blue-100",
      bgDark: "bg-blue-800",
      text: "text-blue-800",
      border: "border-blue-300"
    },
    entityUi: "loanDetails.tsx",
    componentLoader: loanComponentRegistry['loanDetails.tsx']
  },
  {
    title: "Borrower Information",
    theme: {
      bg: "bg-green-600",
      bgLight: "bg-green-100", 
      bgDark: "bg-green-800",
      text: "text-green-800",
      border: "border-green-300"
    },
    bot: {
      title: "Borrower Assistant",
      description: "Help gather borrower information and documentation"
    },
    entityUi: "borrowerInfo.tsx",
    componentLoader: loanComponentRegistry['borrowerInfo.tsx']
  },
  {
    title: "Lender Information",
    theme: {
      bg: "bg-purple-600",
      bgLight: "bg-purple-100",
      bgDark: "bg-purple-800", 
      text: "text-purple-800",
      border: "border-purple-300"
    },
    entityUi: "lenderInfo.tsx",
    componentLoader: loanComponentRegistry['lenderInfo.tsx']
  },
  {
    title: "Repayment Terms",
    theme: {
      bg: "bg-orange-600",
      bgLight: "bg-orange-100",
      bgDark: "bg-orange-800",
      text: "text-orange-800", 
      border: "border-orange-300"
    },
    bot: {
      title: "Terms Calculator",
      description: "Calculate and optimize repayment schedules"
    },
    entityUi: "repaymentTerms.tsx",
    componentLoader: loanComponentRegistry['repaymentTerms.tsx']
  },
  {
    title: "Collateral",
    theme: {
      bg: "bg-red-600",
      bgLight: "bg-red-100",
      bgDark: "bg-red-800",
      text: "text-red-800",
      border: "border-red-300"
    },
    entityUi: "collateral.tsx",
    componentLoader: loanComponentRegistry['collateral.tsx']
  },
  {
    title: "Submit Agreement",
    theme: {
      bg: "bg-gray-600",
      bgLight: "bg-gray-100",
      bgDark: "bg-gray-800",
      text: "text-gray-800",
      border: "border-gray-300"
    },
    entityUi: "submitLoan.tsx", 
    componentLoader: loanComponentRegistry['submitLoan.tsx']
  }
];

export default loanAgreementSteps; 