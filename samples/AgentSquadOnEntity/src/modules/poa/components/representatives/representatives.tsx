import React from 'react';
import { useRepresentativesData } from './hooks/useRepresentativesData';
import { shouldDisplayRepresentative } from './utils/representative.utils';
import RepresentativesHeader from './components/RepresentativesHeader';
import RepresentativeCard from './components/RepresentativeCard';
import AddRepresentativeCard from './components/AddRepresentativeCard';
import { getThemeColors } from '../../../../components/theme';

const Representatives: React.FC = () => {
  const {
    representatives,
    latestActivity,
    editingIndex,
    setEditingIndex,
    addRepresentative,
    updateRepresentative,
    removeRepresentative,
    toggleEditMode,
    clearAllRepresentatives,
    saveRepresentatives,
    document,
    documentLoading,
    documentError,
    documentConnectionStatus
  } = useRepresentativesData();

  // Get theme colors using the custom color palette
  const theme = getThemeColors('warm');  // Primary blue theme
  const errorTheme = getThemeColors('error');  // Semantic error theme
  const warningTheme = getThemeColors('warning');  // Semantic warning theme

  // Filter representatives to only show those with data or currently being edited
  const displayedRepresentatives = representatives.filter((rep, index) => 
    shouldDisplayRepresentative(rep, index, editingIndex)
  );

  const handleExitEdit = () => {
    setEditingIndex(null);
  };

  // Helper functions for loading messages
  const getLoadingMessage = () => {
    switch (documentConnectionStatus) {
      case 'initializing':
        return 'Initializing document service...';
      case 'waiting_for_connection':
        return 'Establishing connection to document service...';
      case 'ready':
        return 'Loading document...';
      default:
        return 'Loading document...';
    }
  };

  const getLoadingDetail = () => {
    switch (documentConnectionStatus) {
      case 'waiting_for_connection':
        return 'This may take a few seconds while connections are established.';
      case 'ready':
        return 'Fetching document data from server...';
      default:
        return 'Setting up document service...';
    }
  };

  // Show enhanced loading state while fetching document
  if (documentLoading) {
    return (
      <div className="h-full flex flex-col bg-white">
        <RepresentativesHeader
          representatives={[]}
          latestActivity={null}
          onClearAll={clearAllRepresentatives}
          onSave={saveRepresentatives}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className={`animate-spin w-12 h-12 border-4 ${theme.bg} border-t-transparent rounded-full mx-auto mb-4`}></div>
            <h3 className={`text-lg font-medium ${theme.text} mb-2`}>{getLoadingMessage()}</h3>
            <p className="text-gray-600 text-sm">{getLoadingDetail()}</p>
            {documentConnectionStatus === 'waiting_for_connection' && (
              <div className={`mt-4 px-4 py-2 ${theme.bgLight} ${theme.border} border rounded-lg max-w-md mx-auto`}>
                <p className={`text-xs ${theme.text}`}>
                  Connecting to document service... This usually completes within 5-10 seconds.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show enhanced error state if document failed to load
  if (documentError) {
    return (
      <div className="h-full flex flex-col bg-white">
        <RepresentativesHeader
          representatives={representatives}
          latestActivity={latestActivity}
          onClearAll={clearAllRepresentatives}
          onSave={saveRepresentatives}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className={`w-16 h-16 ${errorTheme.bgLight} rounded-full flex items-center justify-center mx-auto mb-4`}>
              <svg className={`w-8 h-8 ${errorTheme.bg.replace('bg-', 'text-')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className={`text-lg font-semibold ${theme.text} mb-2`}>Error Loading Document</h3>
            <p className="text-gray-600 mb-4">
              {documentError.includes('Connection timeout') || documentError.includes('No connection available') 
                ? 'Unable to connect to document service. Please check your internet connection and try again.'
                : documentError.includes('timeout')
                ? 'Document loading timed out. Please check your connection and try again.'
                : documentError
              }
            </p>
            <div className="space-y-2">
              <button 
                onClick={() => window.location.reload()}
                className={`w-full px-4 py-2 ${errorTheme.buttonPrimary} text-white rounded-md ${errorTheme.buttonPrimaryHover} transition-colors`}
              >
                Retry Loading Document
              </button>
              {(documentError.includes('Connection timeout') || documentError.includes('No connection available')) && (
                <p className={`text-xs ${errorTheme.bg.replace('bg-', 'text-')} mt-2`}>
                  This usually resolves automatically within a few seconds as connections establish.
                </p>
              )}
              {documentConnectionStatus === 'failed' && (
                <div className={`mt-3 p-3 ${warningTheme.bgLight} ${warningTheme.border} border rounded-lg`}>
                  <p className={`text-xs ${warningTheme.text}`}>
                    If the problem persists, please refresh the page or check your internet connection.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <RepresentativesHeader
        representatives={representatives}
        latestActivity={latestActivity}
        onClearAll={clearAllRepresentatives}
        onSave={saveRepresentatives}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="max-w-6xl mx-auto space-y-4">
            
            
            {/* Representatives Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto pr-2">
              {displayedRepresentatives.map((rep, displayIndex) => {
                // Find the original index in the full representatives array
                const originalIndex = representatives.findIndex(r => r === rep);
                const isEditing = editingIndex === originalIndex;
                const canRemove = representatives.length > 1;
                
                return (
                  <RepresentativeCard
                    key={originalIndex}
                    representative={rep}
                    index={originalIndex}
                    isEditing={isEditing}
                    canRemove={canRemove}
                    onToggleEdit={toggleEditMode}
                    onUpdate={updateRepresentative}
                    onRemove={removeRepresentative}
                    onExitEdit={handleExitEdit}
                  />
                );
              })}
              
              {/* Add Representative Card */}
              <AddRepresentativeCard onAdd={addRepresentative} />
            </div>
            
            {/* Add bottom padding to ensure content is not hidden by footer */}
            <div className="pb-20"></div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default Representatives; 