import React from 'react';
import { useEntitiesByType } from '../context/EntityContext';
import { AuditResultEntity, AuditFinding } from '../types/entities';

interface AuditResultsDisplayProps {
  documentId?: string;
  stepIndex?: number;
  className?: string;
  showEmpty?: boolean;
}

const AuditResultsDisplay: React.FC<AuditResultsDisplayProps> = ({ 
  documentId, 
  stepIndex, 
  className = '',
  showEmpty = false 
}) => {
  const auditResults = useEntitiesByType<AuditResultEntity>('audit_result');

  // Filter audit results based on props
  const filteredResults = auditResults.filter(audit => {
    if (documentId && audit.documentId !== documentId) return false;
    if (stepIndex !== undefined && audit.stepIndex !== stepIndex) return false;
    return true;
  });

  const renderFindings = (findings: AuditFinding[], type: 'error' | 'warning' | 'recommendation' | 'information') => {
    if (findings.length === 0) return null;

    const getStyles = () => {
      switch (type) {
        case 'error':
          return 'border-red-400 bg-red-50';
        case 'warning':
          return 'border-yellow-400 bg-yellow-50';
        case 'recommendation':
          return 'border-blue-400 bg-blue-50';
        case 'information':
          return 'border-green-400 bg-green-50';
        default:
          return 'border-gray-400 bg-gray-50';
      }
    };

    const getIconColor = () => {
      switch (type) {
        case 'error':
          return 'text-red-600';
        case 'warning':
          return 'text-yellow-600';
        case 'recommendation':
          return 'text-blue-600';
        case 'information':
          return 'text-green-600';
        default:
          return 'text-gray-600';
      }
    };

    const getIcon = () => {
      switch (type) {
        case 'error':
          return (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          );
        case 'warning':
          return (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          );
        case 'recommendation':
          return (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          );
        case 'information':
          return (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          );
        default:
          return null;
      }
    };

    return (
      <div className="space-y-2">
        <h4 className={`font-medium text-sm capitalize ${getIconColor()} flex items-center gap-2`}>
          {getIcon()}
          {type}s ({findings.length})
        </h4>
        {findings.map((finding, index) => (
          <div key={index} className={`p-3 rounded border-l-4 ${getStyles()}`}>
            <p className="font-medium text-sm text-gray-900">{finding.message}</p>
            {finding.description && (
              <p className="text-xs text-gray-600 mt-1">{finding.description}</p>
            )}
            {finding.link && (
              <a 
                href={finding.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-xs mt-1 inline-block"
              >
                Learn more →
              </a>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (filteredResults.length === 0) {
    if (!showEmpty) return null;
    
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p>No audit results available</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {filteredResults.map((auditResult) => (
        <div key={auditResult.id} className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Audit Results</h3>
            <span className={`px-2 py-1 text-xs font-medium rounded ${
              auditResult.isSuccess 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {auditResult.isSuccess ? 'Success' : 'Failed'}
            </span>
          </div>
          
          {/* Status indicators */}
          <div className="flex flex-wrap gap-2 mb-4">
            {auditResult.hasErrors && (
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                {auditResult.errors.length} Errors
              </span>
            )}
            {auditResult.hasWarnings && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                {auditResult.warnings.length} Warnings
              </span>
            )}
            {auditResult.hasRecommendations && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                {auditResult.recommendations.length} Recommendations
              </span>
            )}
            {auditResult.hasInformation && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                {auditResult.information.length} Information
              </span>
            )}
          </div>

          {/* Findings by category */}
          <div className="space-y-4">
            {renderFindings(auditResult.errors, 'error')}
            {renderFindings(auditResult.warnings, 'warning')}
            {renderFindings(auditResult.recommendations, 'recommendation')}
            {renderFindings(auditResult.information, 'information')}
          </div>

          {/* Document metadata */}
          {auditResult.data && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="font-medium text-sm text-gray-900 mb-2">Document Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {auditResult.data.principal && (
                  <div>
                    <p className="font-medium text-gray-700">Principal</p>
                    <p className="text-gray-600">{auditResult.data.principal.fullName}</p>
                  </div>
                )}
                {auditResult.data.scope && (
                  <div>
                    <p className="font-medium text-gray-700">Scope</p>
                    <p className="text-gray-600">{auditResult.data.scope}</p>
                  </div>
                )}
                {auditResult.data.representatives && auditResult.data.representatives.length > 0 && (
                  <div>
                    <p className="font-medium text-gray-700">Representatives</p>
                    <p className="text-gray-600">{auditResult.data.representatives.length} assigned</p>
                  </div>
                )}
                {auditResult.data.conditions && auditResult.data.conditions.length > 0 && (
                  <div>
                    <p className="font-medium text-gray-700">Conditions</p>
                    <p className="text-gray-600">{auditResult.data.conditions.length} defined</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Audit timestamp */}
          <div className="mt-4 text-xs text-gray-500 flex items-center justify-between">
            <span>Last updated: {auditResult.updatedAt.toLocaleString()}</span>
            <span className="font-mono">ID: {auditResult.documentId}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AuditResultsDisplay; 