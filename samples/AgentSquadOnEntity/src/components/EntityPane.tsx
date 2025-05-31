import React from 'react';

interface EntityPaneProps {
  activeStep: number;
}

// Define step-specific document content
const stepContent = [
  {
    title: 'Requirements Gathering',
    content: `# Document Requirements\n\n## Project Overview\n- **Document Type:** Loan Agreement\n- **Parties:** Lender and Borrower\n- **Purpose:** Establish terms for financial loan\n\n## Key Requirements\n- [ ] Loan amount and terms\n- [ ] Interest rate structure\n- [ ] Repayment schedule\n- [ ] Default conditions\n- [ ] Collateral requirements\n- [ ] Legal jurisdiction\n\n## Stakeholder Input\n- Legal team review needed\n- Financial terms approval required\n- Compliance check pending\n\n*Status: Gathering initial requirements...*`
  },
  {
    title: 'Document Draft',
    content: `# Loan Agreement - DRAFT\n\n**DRAFT VERSION 1.0**\n\nThis Loan Agreement is made on this 30th day of May, 2025, between:\n\n**LENDER:** [Company Name]\n**BORROWER:** [Individual/Company Name]\n\n## 1. Loan Amount\nThe Lender agrees to lend the Borrower the principal amount of $[AMOUNT] (the "Loan").\n\n## 2. Interest Rate\nThe interest rate applicable to this Loan shall be [RATE]% per annum, calculated on a [CALCULATION_METHOD] basis.\n\n## 3. Repayment Schedule\nThe Borrower shall repay the principal and interest as follows:\n- **Payment Amount:** $[MONTHLY_PAYMENT]\n- **Due Date:** [DAY] of each month\n- **First Payment:** [DATE]\n- **Final Payment:** [DATE]\n\n## 4. Default Provisions\n[TO BE COMPLETED]\n\n*Status: Initial draft in progress...*`
  },
  {
    title: 'Document Review',
    content: `# Loan Agreement - Under Review\n\n**REVIEW VERSION 2.1**\n\n## Review Comments & Suggestions\n\n### Legal Team Feedback:\n- ✅ Jurisdiction clause added\n- ⚠️ Default provisions need refinement\n- ⚠️ Collateral terms require clarification\n\n### Financial Team Feedback:\n- ✅ Interest calculation method approved\n- ⚠️ Payment schedule needs adjustment\n- ⚠️ Early payment terms missing\n\n---\n\nThis Loan Agreement is made on this 30th day of May, 2025, between:\n\n**LENDER:** ABC Financial Corp.\n**BORROWER:** John Doe\n\n## 1. Loan Amount\nThe Lender agrees to lend the Borrower the principal amount of $50,000 (the "Loan").\n\n## 2. Interest Rate\nThe interest rate applicable to this Loan shall be 5.25% per annum, calculated on a simple interest basis.\n\n## 3. Repayment Schedule\nThe Borrower shall repay the principal and interest as follows:\n- **Payment Amount:** $1,125.50\n- **Due Date:** 15th of each month\n- **First Payment:** June 15, 2025\n- **Final Payment:** May 15, 2029\n\n*Status: Under review by stakeholders...*`
  },
  {
    title: 'Final Document',
    content: `# Loan Agreement - FINAL\n\n**FINAL APPROVED VERSION**\n\n✅ **All reviews completed**\n✅ **Legal approval received**\n✅ **Financial terms confirmed**\n✅ **Ready for execution**\n\n---\n\n**LOAN AGREEMENT**\n\nThis Loan Agreement is made on this 30th day of May, 2025, between ABC Financial Corp., a corporation organized under the laws of Delaware ("Lender"), and John Doe, an individual ("Borrower").\n\n## 1. Loan Amount and Purpose\nThe Lender agrees to lend the Borrower the principal amount of Fifty Thousand Dollars ($50,000) for the purpose of business expansion.\n\n## 2. Interest Rate\nThe interest rate applicable to this Loan shall be 5.25% per annum, calculated on a simple interest basis.\n\n## 3. Repayment Terms\n- **Monthly Payment:** $1,125.50\n- **Payment Due:** 15th of each month\n- **Term:** 48 months\n- **First Payment:** June 15, 2025\n- **Final Payment:** May 15, 2029\n\n## 4. Default and Remedies\nIn the event of default, the Lender may accelerate the entire unpaid balance and pursue all available legal remedies.\n\n## 5. Governing Law\nThis Agreement shall be governed by the laws of the State of Delaware.\n\n*Status: Ready for signature*`
  }
];

const EntityPane: React.FC<EntityPaneProps> = ({ activeStep }) => {
  const currentContent = stepContent[activeStep];

  return (
    <div className="h-full flex flex-col bg-white">
      <header className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 tracking-tight text-balance">{currentContent.title}</h2>
          <p className="text-sm text-gray-500 font-normal">Step {activeStep + 1} of 4</p>
        </div>
        <button className="text-sm text-primary-light hover:underline font-medium transition-colors">
          {activeStep === 3 ? 'Download Final' : 'Export Draft'}
        </button>
      </header>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="prose max-w-4xl mx-auto">
          {currentContent.content.split('\n').map((line, idx) => {
            if (line.startsWith('# ')) {
              return <h1 key={idx} className="text-2xl font-bold mb-6 text-primary tracking-tight text-balance">{line.slice(2)}</h1>;
            } else if (line.startsWith('## ')) {
              return <h2 key={idx} className="text-xl font-semibold mb-4 text-primary tracking-tight text-balance">{line.slice(3)}</h2>;
            } else if (line.startsWith('### ')) {
              return <h3 key={idx} className="text-lg font-medium mb-3 text-primary-light tracking-tight text-balance">{line.slice(4)}</h3>;
            } else if (line.startsWith('- ✅')) {
              return <p key={idx} className="text-accent mb-2 font-normal">{line}</p>;
            } else if (line.startsWith('- ⚠️')) {
              return <p key={idx} className="text-amber-600 mb-2 font-normal">{line}</p>;
            } else if (line.startsWith('- [ ]')) {
              return <p key={idx} className="text-neutral-600 mb-2 font-normal">{line}</p>;
            } else if (line.startsWith('*') && line.endsWith('*')) {
              return <p key={idx} className="text-sm text-neutral-500 italic mt-6 font-normal">{line.slice(1, -1)}</p>;
            } else if (line.startsWith('**') && line.endsWith('**')) {
              return <p key={idx} className="font-semibold text-primary mb-3 tracking-tight text-balance">{line.slice(2, -2)}</p>;
            } else if (line.trim() === '---') {
              return <hr key={idx} className="my-8 border-neutral-300" />;
            } else if (line.trim() === '') {
              return <br key={idx} />;
            } else {
              return <p key={idx} className="mb-3 text-neutral-700 font-normal leading-relaxed text-balance">{line}</p>;
            }
          })}
        </div>
      </div>
    </div>
  );
};

export default EntityPane; 