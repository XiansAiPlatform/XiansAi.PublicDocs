import React, { useState } from 'react';
import { FiInfo, FiAlertTriangle, FiXCircle, FiChevronDown } from 'react-icons/fi';
import { FINDING_TYPE_COLORS } from '../utils/botColors';

export type FindingType = 'suggestion' | 'warning' | 'error';

export interface Finding {
  id: number;
  type: FindingType;
  title: string;
  description: string;
  link?: string;
  actionLabel?: string;
  actionMessage?: string;
}

const initialFindings: Finding[] = [
  {
    id: 1,
    type: 'suggestion',
    title: 'Consider defining the interest rate explicitly',
    description:
      'Specify whether the interest rate is fixed or variable to avoid ambiguity for the borrower.',
    link: 'https://example.com/interest-rate-definition',
    actionLabel: 'Ask agent to clarify',
    actionMessage: 'Can you clarify whether the interest rate is fixed or variable?'
  },
  {
    id: 2,
    type: 'warning',
    title: 'Missing repayment schedule section',
    description:
      'The document references a repayment schedule, but the detailed schedule is not included.',
    link: 'https://example.com/repayment-schedule',
    actionLabel: 'Request repayment schedule',
    actionMessage: 'Please provide the detailed repayment schedule.'
  },
  {
    id: 3,
    type: 'error',
    title: 'Conflicting loan amount values',
    description:
      'The loan amount is listed as $100,000 in section 1 but $90,000 in section 3. This must be resolved.',
    link: 'https://example.com/loan-amount-conflict',
    actionLabel: 'Highlight conflict',
    actionMessage: 'There is a conflict in the loan amount values. Please resolve.'
  }
];

const severityRank: Record<FindingType, number> = { error: 0, warning: 1, suggestion: 2 };

const typeStyles: Record<FindingType, { 
  icon: React.ReactNode; 
  pillBg: string; 
  textColor: string; 
  borderColor: string; 
  cardBg: string 
}> = {
  suggestion: { 
    icon: <FiInfo />, 
    pillBg: FINDING_TYPE_COLORS.suggestion.bgLight, 
    textColor: FINDING_TYPE_COLORS.suggestion.text, 
    borderColor: FINDING_TYPE_COLORS.suggestion.border, 
    cardBg: FINDING_TYPE_COLORS.suggestion.bgLight 
  },
  warning: { 
    icon: <FiAlertTriangle />, 
    pillBg: FINDING_TYPE_COLORS.warning.bgLight, 
    textColor: FINDING_TYPE_COLORS.warning.text, 
    borderColor: FINDING_TYPE_COLORS.warning.border, 
    cardBg: FINDING_TYPE_COLORS.warning.bgLight 
  },
  error: { 
    icon: <FiXCircle />, 
    pillBg: FINDING_TYPE_COLORS.error.bgLight, 
    textColor: FINDING_TYPE_COLORS.error.text, 
    borderColor: FINDING_TYPE_COLORS.error.border, 
    cardBg: FINDING_TYPE_COLORS.error.bgLight 
  },
};

const FindingsPane: React.FC = () => {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const handleAction = (message: string | undefined) => {
    if (!message) return;
    window.dispatchEvent(
      new CustomEvent('externalChatMessage', { detail: { content: message } })
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <header className="px-4 py-2 border-b border-gray-200">
        <div className="flex items-center justify-between w-full max-w-sm mr-auto">
          <h2 className="text-lg font-medium text-gray-800">Findings</h2>
          <span className="text-sm text-gray-500">
            {initialFindings.length} items
          </span>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto space-y-3 p-3">
        {[...initialFindings].sort((a,b) => severityRank[a.type] - severityRank[b.type]).map((finding) => {
          const isExpanded = expandedId === finding.id;
          const { icon, pillBg, textColor, borderColor, cardBg } = typeStyles[finding.type];
          return (
            <div key={finding.id}>
              {/* Collapsed pill */}
              {!isExpanded && (
                <button
                  onClick={() => setExpandedId(finding.id)}
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm shadow-sm transition-transform hover:scale-105 focus:outline-none ${pillBg} ${textColor}`}
                >
                  {icon}
                  <span className="truncate max-w-xs">{finding.title}</span>
                </button>
              )}

              {/* Expanded card */}
              {isExpanded && (
                <div 
                  className={`rounded-lg shadow-sm border-l-4 p-4 space-y-3 cursor-pointer ${borderColor} ${cardBg}`}
                  onClick={() => setExpandedId(null)}
                >
                  <div className="flex items-start gap-3">
                    <span className={`text-xl ${textColor}`}>{icon}</span>
                    <h3 className={`font-semibold text-sm flex-1 ${textColor}`}>{finding.title}</h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedId(null);
                      }}
                      aria-label="Collapse"
                      className="text-gray-500 hover:text-gray-700 text-lg"
                    >
                      <FiChevronDown className="transform rotate-180" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-700">{finding.description}</p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {finding.actionLabel && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction(finding.actionMessage);
                        }}
                        className="inline-flex items-center px-4 py-2 bg-primary-light text-white rounded-md text-sm font-medium hover:bg-primary focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-offset-2 transition-colors"
                      >
                        {finding.actionLabel}
                      </button>
                    )}
                    {finding.link && (
                      <a
                        href={finding.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary-light underline hover:text-primary"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Learn more
                      </a>
                    )}                    
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FindingsPane; 